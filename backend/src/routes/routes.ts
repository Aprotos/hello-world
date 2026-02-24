import { Router } from 'express';
import db from '../db/database';

const router = Router();

// GET /api/routes - list with optional date filter
router.get('/', (req, res) => {
  const { date, status, driver_id, limit = '50', offset = '0' } = req.query as Record<string, string>;

  let query = `
    SELECT r.*,
           d.first_name || ' ' || d.last_name as driver_name,
           d.employee_id,
           v.vehicle_number
    FROM routes r
    LEFT JOIN drivers d ON d.id = r.driver_id
    LEFT JOIN vehicles v ON v.id = r.vehicle_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (date) { query += ` AND r.route_date = ?`; params.push(date); }
  if (status) { query += ` AND r.status = ?`; params.push(status); }
  if (driver_id) { query += ` AND r.driver_id = ?`; params.push(driver_id); }

  query += ` ORDER BY r.route_date DESC, r.route_number LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const routes = db.prepare(query).all(...params);
  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM routes WHERE 1=1${date ? ' AND route_date=?' : ''}${status ? ' AND status=?' : ''}`)
    .get(...params.slice(0, -2)) as { cnt: number }).cnt;

  res.json({ data: routes, total, limit: parseInt(limit), offset: parseInt(offset) });
});

// GET /api/routes/:id - route detail with stops and loads
router.get('/:id', (req, res) => {
  const route = db.prepare(`
    SELECT r.*,
           d.first_name || ' ' || d.last_name as driver_name,
           d.phone as driver_phone,
           d.employee_id,
           v.vehicle_number, v.make, v.model, v.capacity_cases
    FROM routes r
    LEFT JOIN drivers d ON d.id = r.driver_id
    LEFT JOIN vehicles v ON v.id = r.vehicle_id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!route) return res.status(404).json({ error: 'Route not found' });

  const stops = db.prepare(`
    SELECT rs.*,
           c.name as customer_name, c.account_number, c.address, c.city, c.state, c.zip,
           c.phone as customer_phone, c.trade_class,
           o.order_number, o.total, o.status as order_status, o.payment_method
    FROM route_stops rs
    JOIN customers c ON c.id = rs.customer_id
    LEFT JOIN orders o ON o.route_stop_id = rs.id
    WHERE rs.route_id = ?
    ORDER BY rs.stop_order
  `).all(req.params.id);

  const loads = db.prepare(`
    SELECT rl.*,
           p.name as product_name, p.sku, p.category, p.package_type, p.unit_size
    FROM route_loads rl
    JOIN products p ON p.id = rl.product_id
    WHERE rl.route_id = ?
    ORDER BY p.category, p.name
  `).all(req.params.id);

  res.json({ ...route as object, stops, loads });
});

// POST /api/routes - create route
router.post('/', (req, res) => {
  const { name, driver_id, vehicle_id, route_date, notes } = req.body;

  const lastRoute = db.prepare(`SELECT route_number FROM routes ORDER BY id DESC LIMIT 1`).get() as { route_number: string } | undefined;
  const nextNum = lastRoute ? parseInt(lastRoute.route_number.split('-')[1]) + 1 : 101;

  const result = db.prepare(`
    INSERT INTO routes (route_number, name, driver_id, vehicle_id, route_date, status, notes)
    VALUES (?, ?, ?, ?, ?, 'Planned', ?)
  `).run(`RT-${nextNum}`, name, driver_id, vehicle_id, route_date, notes || null) as { lastInsertRowid: number };

  const route = db.prepare(`SELECT * FROM routes WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json(route);
});

// PATCH /api/routes/:id - update route status
router.patch('/:id', (req, res) => {
  const { status, notes, start_time, end_time } = req.body;

  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
  if (start_time !== undefined) { updates.push('start_time = ?'); params.push(start_time); }
  if (end_time !== undefined) { updates.push('end_time = ?'); params.push(end_time); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  db.prepare(`UPDATE routes SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const route = db.prepare(`SELECT * FROM routes WHERE id = ?`).get(req.params.id);
  res.json(route);
});

// POST /api/routes/:id/stops - add stop to route
router.post('/:id/stops', (req, res) => {
  const { customer_id, stop_order, planned_arrival } = req.body;

  const result = db.prepare(`
    INSERT INTO route_stops (route_id, customer_id, stop_order, status, planned_arrival)
    VALUES (?, ?, ?, 'Pending', ?)
  `).run(req.params.id, customer_id, stop_order, planned_arrival || null) as { lastInsertRowid: number };

  db.prepare(`UPDATE routes SET total_stops = total_stops + 1 WHERE id = ?`).run(req.params.id);

  const stop = db.prepare(`
    SELECT rs.*, c.name as customer_name, c.account_number, c.address, c.city
    FROM route_stops rs JOIN customers c ON c.id = rs.customer_id
    WHERE rs.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(stop);
});

// PATCH /api/routes/:routeId/stops/:stopId - update stop status
router.patch('/:routeId/stops/:stopId', (req, res) => {
  const { status, actual_arrival, actual_departure, signature_captured, delivery_notes } = req.body;

  db.prepare(`
    UPDATE route_stops
    SET status = COALESCE(?, status),
        actual_arrival = COALESCE(?, actual_arrival),
        actual_departure = COALESCE(?, actual_departure),
        signature_captured = COALESCE(?, signature_captured),
        delivery_notes = COALESCE(?, delivery_notes)
    WHERE id = ? AND route_id = ?
  `).run(status, actual_arrival, actual_departure, signature_captured, delivery_notes, req.params.stopId, req.params.routeId);

  if (status === 'Delivered') {
    db.prepare(`UPDATE routes SET stops_completed = stops_completed + 1 WHERE id = ?`).run(req.params.routeId);
  }

  const stop = db.prepare(`SELECT * FROM route_stops WHERE id = ?`).get(req.params.stopId);
  res.json(stop);
});

export default router;
