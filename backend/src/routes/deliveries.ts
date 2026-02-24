import { Router } from 'express';
import db from '../db/database';

const router = Router();

// Today's deliveries overview
router.get('/', (req, res) => {
  const { date = '2026-02-24', route_id } = req.query as Record<string, string>;

  let query = `
    SELECT rs.*,
           c.name as customer_name, c.account_number, c.address, c.city, c.state, c.zip,
           c.phone as customer_phone, c.trade_class,
           r.route_number, r.name as route_name, r.route_date, r.status as route_status,
           d.first_name || ' ' || d.last_name as driver_name,
           o.order_number, o.total, o.status as order_status, o.payment_method, o.amount_paid
    FROM route_stops rs
    JOIN routes r ON r.id = rs.route_id
    JOIN customers c ON c.id = rs.customer_id
    LEFT JOIN drivers d ON d.id = r.driver_id
    LEFT JOIN orders o ON o.route_stop_id = rs.id
    WHERE r.route_date = ?
  `;
  const params: (string | number)[] = [date];

  if (route_id) { query += ` AND rs.route_id = ?`; params.push(route_id); }

  query += ` ORDER BY r.route_number, rs.stop_order`;

  const deliveries = db.prepare(query).all(...params);

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN rs.status = 'Delivered' THEN 1 ELSE 0 END) as delivered,
      SUM(CASE WHEN rs.status = 'Pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN rs.status = 'Skipped' THEN 1 ELSE 0 END) as skipped,
      COALESCE(SUM(o.total), 0) as total_value,
      COALESCE(SUM(CASE WHEN rs.status='Delivered' THEN o.total ELSE 0 END), 0) as delivered_value
    FROM route_stops rs
    JOIN routes r ON r.id = rs.route_id
    LEFT JOIN orders o ON o.route_stop_id = rs.id
    WHERE r.route_date = ?
  `).get(date);

  res.json({ data: deliveries, summary });
});

// GET /api/deliveries/:stopId - delivery details
router.get('/:stopId', (req, res) => {
  const stop = db.prepare(`
    SELECT rs.*,
           c.name as customer_name, c.account_number, c.address, c.city, c.state, c.zip,
           c.phone, c.trade_class, c.contact_name,
           r.route_number, r.route_date, r.name as route_name,
           d.first_name || ' ' || d.last_name as driver_name,
           v.vehicle_number
    FROM route_stops rs
    JOIN routes r ON r.id = rs.route_id
    JOIN customers c ON c.id = rs.customer_id
    LEFT JOIN drivers d ON d.id = r.driver_id
    LEFT JOIN vehicles v ON v.id = r.vehicle_id
    WHERE rs.id = ?
  `).get(req.params.stopId);

  if (!stop) return res.status(404).json({ error: 'Stop not found' });

  const order = db.prepare(`
    SELECT o.*, oi.*, p.name as product_name, p.sku, p.category
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.route_stop_id = ?
  `).all(req.params.stopId);

  const returns = db.prepare(`
    SELECT r.*, p.name as product_name, p.sku
    FROM returns r
    JOIN products p ON p.id = r.product_id
    WHERE r.route_stop_id = ?
  `).all(req.params.stopId);

  res.json({ ...stop as object, orderItems: order, returns });
});

// POST /api/deliveries/:stopId/complete - mark stop as delivered
router.post('/:stopId/complete', (req, res) => {
  const { signature_captured, photo_captured, delivery_notes, actual_arrival, actual_departure } = req.body;

  const stop = db.prepare(`SELECT * FROM route_stops WHERE id = ?`).get(req.params.stopId) as { route_id: number } | undefined;
  if (!stop) return res.status(404).json({ error: 'Stop not found' });

  db.prepare(`
    UPDATE route_stops
    SET status = 'Delivered',
        signature_captured = ?,
        photo_captured = ?,
        delivery_notes = ?,
        actual_arrival = COALESCE(?, actual_arrival),
        actual_departure = COALESCE(?, datetime('now'))
    WHERE id = ?
  `).run(signature_captured ? 1 : 0, photo_captured ? 1 : 0, delivery_notes || null, actual_arrival, actual_departure, req.params.stopId);

  db.prepare(`UPDATE routes SET stops_completed = stops_completed + 1 WHERE id = ?`).run(stop.route_id);

  // Mark associated order as delivered
  db.prepare(`UPDATE orders SET status = 'Invoiced' WHERE route_stop_id = ? AND status = 'Pending'`).run(req.params.stopId);

  res.json(db.prepare(`SELECT * FROM route_stops WHERE id = ?`).get(req.params.stopId));
});

export default router;
