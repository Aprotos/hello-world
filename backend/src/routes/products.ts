import { Router } from 'express';
import db from '../db/database';

const router = Router();

router.get('/', (req, res) => {
  const { search, category, status } = req.query as Record<string, string>;

  let query = `
    SELECT p.*, COALESCE(i.quantity_cases, 0) as stock_cases, i.reorder_point
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (search) {
    query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (category) { query += ` AND p.category = ?`; params.push(category); }
  if (status) { query += ` AND p.status = ?`; params.push(status); }

  query += ` ORDER BY p.category, p.brand, p.name`;

  res.json({ data: db.prepare(query).all(...params) });
});

router.get('/:id', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, COALESCE(i.quantity_cases, 0) as stock_cases, i.reorder_point
    FROM products p LEFT JOIN inventory i ON i.product_id = p.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!product) return res.status(404).json({ error: 'Product not found' });

  const salesHistory = db.prepare(`
    SELECT DATE(o.order_date, 'start of month') as month,
           SUM(oi.quantity_cases) as cases,
           SUM(oi.line_total) as revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = ? AND o.order_date >= date('now', '-6 months')
    GROUP BY month
    ORDER BY month
  `).all(req.params.id);

  const topCustomers = db.prepare(`
    SELECT c.name, c.account_number, SUM(oi.quantity_cases) as cases
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN customers c ON c.id = o.customer_id
    WHERE oi.product_id = ?
    GROUP BY c.id
    ORDER BY cases DESC
    LIMIT 5
  `).all(req.params.id);

  res.json({ ...product as object, salesHistory, topCustomers });
});

router.post('/', (req, res) => {
  const { sku, name, brand, category, package_type, unit_size, units_per_case, price_per_case, deposit_per_unit, weight_per_case } = req.body;

  const result = db.prepare(`
    INSERT INTO products (sku, name, brand, category, package_type, unit_size, units_per_case, price_per_case, deposit_per_unit, weight_per_case)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(sku, name, brand, category, package_type, unit_size, units_per_case || 24, price_per_case || 0, deposit_per_unit || 0, weight_per_case || 0) as { lastInsertRowid: number };

  db.prepare(`INSERT INTO inventory (product_id, quantity_cases, reorder_point) VALUES (?, 0, 50)`).run(result.lastInsertRowid);

  res.status(201).json(db.prepare(`SELECT * FROM products WHERE id = ?`).get(result.lastInsertRowid));
});

router.patch('/:id', (req, res) => {
  const allowed = ['name', 'brand', 'category', 'package_type', 'unit_size', 'units_per_case', 'price_per_case', 'deposit_per_unit', 'weight_per_case', 'status'];
  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  for (const key of allowed) {
    if (req.body[key] !== undefined) { updates.push(`${key} = ?`); params.push(req.body[key]); }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  // Update inventory reorder point if provided
  if (req.body.reorder_point !== undefined) {
    db.prepare(`UPDATE inventory SET reorder_point = ? WHERE product_id = ?`).run(req.body.reorder_point, req.params.id);
  }
  if (req.body.stock_adjustment !== undefined) {
    db.prepare(`UPDATE inventory SET quantity_cases = quantity_cases + ?, updated_at = datetime('now') WHERE product_id = ?`)
      .run(req.body.stock_adjustment, req.params.id);
  }

  res.json(db.prepare(`SELECT p.*, COALESCE(i.quantity_cases, 0) as stock_cases, i.reorder_point FROM products p LEFT JOIN inventory i ON i.product_id = p.id WHERE p.id = ?`).get(req.params.id));
});

export default router;
