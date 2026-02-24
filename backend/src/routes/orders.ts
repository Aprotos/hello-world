import { Router } from 'express';
import db from '../db/database';

const router = Router();

router.get('/', (req, res) => {
  const { status, customer_id, route_id, date_from, date_to, limit = '50', offset = '0' } = req.query as Record<string, string>;

  let query = `
    SELECT o.*, c.name as customer_name, c.account_number, c.trade_class,
           r.route_number
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    LEFT JOIN routes r ON r.id = o.route_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (status) { query += ` AND o.status = ?`; params.push(status); }
  if (customer_id) { query += ` AND o.customer_id = ?`; params.push(customer_id); }
  if (route_id) { query += ` AND o.route_id = ?`; params.push(route_id); }
  if (date_from) { query += ` AND o.order_date >= ?`; params.push(date_from); }
  if (date_to) { query += ` AND o.order_date <= ?`; params.push(date_to); }

  const countQuery = query.replace(/SELECT.*FROM orders o/, 'SELECT COUNT(*) as cnt FROM orders o');
  const total = (db.prepare(countQuery).get(...params) as { cnt: number }).cnt;

  query += ` ORDER BY o.order_date DESC, o.id DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const orders = db.prepare(query).all(...params);
  res.json({ data: orders, total });
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*,
           c.name as customer_name, c.account_number, c.address, c.city, c.state,
           c.zip, c.phone, c.trade_class, c.payment_terms,
           r.route_number, r.route_date,
           d.first_name || ' ' || d.last_name as driver_name
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    LEFT JOIN routes r ON r.id = o.route_id
    LEFT JOIN drivers d ON d.id = r.driver_id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = db.prepare(`
    SELECT oi.*, p.name as product_name, p.sku, p.category, p.package_type,
           p.unit_size, p.units_per_case, p.brand
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `).all(req.params.id);

  const payments = db.prepare(`
    SELECT * FROM payments WHERE order_id = ? ORDER BY received_at
  `).all(req.params.id);

  const returns = db.prepare(`
    SELECT r.*, p.name as product_name, p.sku
    FROM returns r
    JOIN products p ON p.id = r.product_id
    WHERE r.order_id = ?
  `).all(req.params.id);

  res.json({ ...order as object, items, payments, returns });
});

router.post('/', (req, res) => {
  const { customer_id, route_id, order_date, order_type, items, notes, payment_method } = req.body;

  if (!items || items.length === 0) return res.status(400).json({ error: 'Order must have at least one item' });

  const lastOrder = db.prepare(`SELECT order_number FROM orders ORDER BY id DESC LIMIT 1`).get() as { order_number: string } | undefined;
  const nextNum = lastOrder ? parseInt(lastOrder.order_number.split('-')[1]) + 1 : 1001;

  let subtotal = 0;
  let depositTotal = 0;

  const enrichedItems = items.map((item: { product_id: number; quantity_cases: number }) => {
    const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(item.product_id) as { price_per_case: number; deposit_per_unit: number; units_per_case: number } | undefined;
    if (!product) throw new Error(`Product ${item.product_id} not found`);
    const lineTotal = item.quantity_cases * product.price_per_case;
    const depositLine = item.quantity_cases * product.deposit_per_unit * product.units_per_case;
    subtotal += lineTotal;
    depositTotal += depositLine;
    return { ...item, unit_price: product.price_per_case, deposit_per_unit: product.deposit_per_unit, line_total: lineTotal, deposit_total: depositLine };
  });

  const taxRate = 0.0;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount + depositTotal;

  const result = db.prepare(`
    INSERT INTO orders (order_number, customer_id, route_id, order_date, status, order_type, subtotal, tax_rate, tax_amount, deposit_total, total, amount_paid, balance_due, payment_method, notes)
    VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
  `).run(`ORD-${nextNum}`, customer_id, route_id || null, order_date, order_type || 'Delivery', subtotal, taxRate, taxAmount, depositTotal, total, total, payment_method || null, notes || null) as { lastInsertRowid: number };

  const orderId = result.lastInsertRowid;

  for (const item of enrichedItems) {
    db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity_cases, unit_price, deposit_per_unit, line_total, deposit_total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, item.product_id, item.quantity_cases, item.unit_price, item.deposit_per_unit, item.line_total, item.deposit_total);
  }

  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  res.status(201).json(order);
});

// POST /api/orders/:id/payment - record payment
router.post('/:id/payment', (req, res) => {
  const { amount, method, reference, notes } = req.body;

  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id) as { customer_id: number; route_id: number; total: number; amount_paid: number } | undefined;
  if (!order) return res.status(404).json({ error: 'Order not found' });

  db.prepare(`INSERT INTO payments (order_id, route_id, customer_id, amount, method, reference, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(req.params.id, order.route_id, order.customer_id, amount, method, reference || null, notes || null);

  const newPaid = order.amount_paid + amount;
  const newBalance = Math.max(0, order.total - newPaid);
  const newStatus = newBalance <= 0 ? 'Paid' : 'Invoiced';

  db.prepare(`UPDATE orders SET amount_paid = ?, balance_due = ?, status = ?, payment_method = ? WHERE id = ?`)
    .run(newPaid, newBalance, newStatus, method, req.params.id);

  res.json(db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id));
});

// PATCH /api/orders/:id - update order status
router.patch('/:id', (req, res) => {
  const { status, notes } = req.body;
  db.prepare(`UPDATE orders SET status = COALESCE(?, status), notes = COALESCE(?, notes), updated_at = datetime('now') WHERE id = ?`)
    .run(status, notes, req.params.id);
  res.json(db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id));
});

export default router;
