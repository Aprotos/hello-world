import { Router } from 'express';
import db from '../db/database';

const router = Router();

router.get('/', (req, res) => {
  const { search, trade_class, status, limit = '50', offset = '0' } = req.query as Record<string, string>;

  let query = `SELECT * FROM customers WHERE 1=1`;
  const params: (string | number)[] = [];

  if (search) {
    query += ` AND (name LIKE ? OR account_number LIKE ? OR city LIKE ? OR contact_name LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (trade_class) { query += ` AND trade_class = ?`; params.push(trade_class); }
  if (status) { query += ` AND status = ?`; params.push(status); }

  query += ` ORDER BY name LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const customers = db.prepare(query).all(...params);
  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM customers WHERE 1=1${search ? ' AND (name LIKE ? OR account_number LIKE ? OR city LIKE ? OR contact_name LIKE ?)' : ''}${trade_class ? ' AND trade_class=?' : ''}${status ? ' AND status=?' : ''}`)
    .get(...params.slice(0, -2)) as { cnt: number }).cnt;

  res.json({ data: customers, total });
});

router.get('/:id', (req, res) => {
  const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const orders = db.prepare(`
    SELECT o.*, r.route_number
    FROM orders o
    LEFT JOIN routes r ON r.id = o.route_id
    WHERE o.customer_id = ?
    ORDER BY o.order_date DESC
    LIMIT 20
  `).all(req.params.id);

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(total), 0) as lifetime_revenue,
      COALESCE(SUM(balance_due), 0) as outstanding_balance,
      COALESCE(AVG(total), 0) as avg_order_value,
      MAX(order_date) as last_order_date
    FROM orders
    WHERE customer_id = ? AND status != 'Cancelled'
  `).get(req.params.id);

  const topProducts = db.prepare(`
    SELECT p.name, p.sku, p.category,
           SUM(oi.quantity_cases) as cases_ordered,
           SUM(oi.line_total) as revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.customer_id = ?
    GROUP BY p.id
    ORDER BY cases_ordered DESC
    LIMIT 5
  `).all(req.params.id);

  res.json({ ...customer as object, orders, stats, topProducts });
});

router.post('/', (req, res) => {
  const {
    name, trade_class, address, city, state, zip,
    phone, email, contact_name, credit_limit, payment_terms, notes
  } = req.body;

  const lastAcc = db.prepare(`SELECT account_number FROM customers ORDER BY id DESC LIMIT 1`).get() as { account_number: string } | undefined;
  const nextNum = lastAcc ? parseInt(lastAcc.account_number.split('-')[1]) + 1 : 10001;

  const result = db.prepare(`
    INSERT INTO customers (account_number, name, trade_class, address, city, state, zip, phone, email, contact_name, credit_limit, payment_terms, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(`ACC-${nextNum}`, name, trade_class || 'Retail', address, city, state, zip, phone, email, contact_name, credit_limit || 0, payment_terms || 'Net 30', notes || null) as { lastInsertRowid: number };

  const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json(customer);
});

router.patch('/:id', (req, res) => {
  const allowed = ['name', 'trade_class', 'address', 'city', 'state', 'zip', 'phone', 'email', 'contact_name', 'credit_limit', 'payment_terms', 'status', 'notes'];
  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates.push(`${key} = ?`);
      params.push(req.body[key]);
    }
  }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  updates.push(`updated_at = datetime('now')`);
  params.push(req.params.id);
  db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  res.json(db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id));
});

export default router;
