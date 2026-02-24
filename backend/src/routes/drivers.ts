import { Router } from 'express';
import db from '../db/database';

const router = Router();

router.get('/', (_req, res) => {
  const drivers = db.prepare(`
    SELECT d.*,
           COUNT(DISTINCT r.id) as total_routes,
           COALESCE(SUM(r.total_revenue), 0) as total_revenue,
           COALESCE(SUM(r.stops_completed), 0) as total_stops
    FROM drivers d
    LEFT JOIN routes r ON r.driver_id = d.id
    GROUP BY d.id
    ORDER BY d.last_name, d.first_name
  `).all();

  res.json({ data: drivers });
});

router.get('/:id', (req, res) => {
  const driver = db.prepare(`SELECT * FROM drivers WHERE id = ?`).get(req.params.id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });

  const recentRoutes = db.prepare(`
    SELECT r.*, v.vehicle_number
    FROM routes r
    LEFT JOIN vehicles v ON v.id = r.vehicle_id
    WHERE r.driver_id = ?
    ORDER BY r.route_date DESC
    LIMIT 10
  `).all(req.params.id);

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_routes,
      SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_routes,
      COALESCE(SUM(total_revenue), 0) as total_revenue,
      COALESCE(SUM(stops_completed), 0) as total_stops,
      COALESCE(AVG(CASE WHEN status='Completed' THEN total_revenue END), 0) as avg_route_revenue
    FROM routes WHERE driver_id = ?
  `).get(req.params.id);

  const performanceByMonth = db.prepare(`
    SELECT strftime('%Y-%m', route_date) as month,
           COUNT(*) as routes,
           COALESCE(SUM(total_revenue), 0) as revenue,
           COALESCE(SUM(stops_completed), 0) as stops
    FROM routes
    WHERE driver_id = ? AND route_date >= date('now', '-6 months')
    GROUP BY month
    ORDER BY month
  `).all(req.params.id);

  res.json({ ...driver as object, recentRoutes, stats, performanceByMonth });
});

router.post('/', (req, res) => {
  const { first_name, last_name, phone, email, license_number, license_class, license_expiry, hire_date } = req.body;

  const lastEmp = db.prepare(`SELECT employee_id FROM drivers ORDER BY id DESC LIMIT 1`).get() as { employee_id: string } | undefined;
  const nextNum = lastEmp ? parseInt(lastEmp.employee_id.split('-')[1]) + 1 : 1;

  const result = db.prepare(`
    INSERT INTO drivers (employee_id, first_name, last_name, phone, email, license_number, license_class, license_expiry, hire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(`EMP-${String(nextNum).padStart(3, '0')}`, first_name, last_name, phone, email, license_number, license_class, license_expiry, hire_date) as { lastInsertRowid: number };

  res.status(201).json(db.prepare(`SELECT * FROM drivers WHERE id = ?`).get(result.lastInsertRowid));
});

router.patch('/:id', (req, res) => {
  const allowed = ['first_name', 'last_name', 'phone', 'email', 'license_number', 'license_class', 'license_expiry', 'status', 'notes'];
  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  for (const key of allowed) {
    if (req.body[key] !== undefined) { updates.push(`${key} = ?`); params.push(req.body[key]); }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  db.prepare(`UPDATE drivers SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json(db.prepare(`SELECT * FROM drivers WHERE id = ?`).get(req.params.id));
});

export default router;
