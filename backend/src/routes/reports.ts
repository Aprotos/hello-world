import { Router } from 'express';
import db from '../db/database';

const router = Router();

// GET /api/reports/sales - sales summary by period
router.get('/sales', (req, res) => {
  const { from = '2026-01-25', to = '2026-02-24', group_by = 'day' } = req.query as Record<string, string>;

  const groupExpr = group_by === 'month'
    ? `strftime('%Y-%m', order_date)`
    : group_by === 'week'
    ? `strftime('%Y-W%W', order_date)`
    : `order_date`;

  const salesByPeriod = db.prepare(`
    SELECT ${groupExpr} as period,
           COUNT(DISTINCT o.id) as order_count,
           COUNT(DISTINCT o.customer_id) as customers_served,
           COALESCE(SUM(o.subtotal), 0) as subtotal,
           COALESCE(SUM(o.deposit_total), 0) as deposits,
           COALESCE(SUM(o.total), 0) as total,
           COALESCE(SUM(o.amount_paid), 0) as collected,
           COALESCE(SUM(o.balance_due), 0) as outstanding
    FROM orders o
    WHERE order_date >= ? AND order_date <= ? AND status != 'Cancelled'
    GROUP BY period
    ORDER BY period
  `).all(from, to);

  const byCategory = db.prepare(`
    SELECT p.category,
           SUM(oi.quantity_cases) as cases,
           SUM(oi.line_total) as revenue,
           COUNT(DISTINCT o.customer_id) as customers
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.order_date >= ? AND o.order_date <= ? AND o.status != 'Cancelled'
    GROUP BY p.category
    ORDER BY revenue DESC
  `).all(from, to);

  const byTradeClass = db.prepare(`
    SELECT c.trade_class,
           COUNT(DISTINCT o.id) as orders,
           COUNT(DISTINCT c.id) as customers,
           SUM(o.total) as revenue
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.order_date >= ? AND o.order_date <= ? AND o.status != 'Cancelled'
    GROUP BY c.trade_class
    ORDER BY revenue DESC
  `).all(from, to);

  const topProducts = db.prepare(`
    SELECT p.sku, p.name, p.brand, p.category,
           SUM(oi.quantity_cases) as cases_sold,
           SUM(oi.line_total) as revenue,
           COUNT(DISTINCT o.customer_id) as customers
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.order_date >= ? AND o.order_date <= ? AND o.status != 'Cancelled'
    GROUP BY p.id
    ORDER BY cases_sold DESC
    LIMIT 10
  `).all(from, to);

  const totals = db.prepare(`
    SELECT
      COUNT(DISTINCT id) as total_orders,
      COUNT(DISTINCT customer_id) as customers_served,
      COALESCE(SUM(total), 0) as total_revenue,
      COALESCE(SUM(amount_paid), 0) as total_collected,
      COALESCE(SUM(balance_due), 0) as outstanding_ar
    FROM orders
    WHERE order_date >= ? AND order_date <= ? AND status != 'Cancelled'
  `).get(from, to);

  res.json({ salesByPeriod, byCategory, byTradeClass, topProducts, totals, from, to });
});

// GET /api/reports/routes - route performance
router.get('/routes', (req, res) => {
  const { from = '2026-01-25', to = '2026-02-24' } = req.query as Record<string, string>;

  const routePerformance = db.prepare(`
    SELECT r.route_number, r.name,
           d.first_name || ' ' || d.last_name as driver_name,
           COUNT(DISTINCT r.id) as days_run,
           COALESCE(SUM(r.total_stops), 0) as total_stops,
           COALESCE(SUM(r.stops_completed), 0) as stops_completed,
           COALESCE(SUM(r.total_cases), 0) as total_cases,
           COALESCE(SUM(r.total_revenue), 0) as total_revenue,
           COALESCE(AVG(CAST(r.stops_completed AS REAL) / NULLIF(r.total_stops, 0) * 100), 0) as completion_pct
    FROM routes r
    LEFT JOIN drivers d ON d.id = r.driver_id
    WHERE r.route_date >= ? AND r.route_date <= ? AND r.status = 'Completed'
    GROUP BY r.name, d.id
    ORDER BY total_revenue DESC
  `).all(from, to);

  const driverPerformance = db.prepare(`
    SELECT d.employee_id, d.first_name || ' ' || d.last_name as driver_name,
           COUNT(DISTINCT r.id) as routes_completed,
           COALESCE(SUM(r.stops_completed), 0) as total_stops,
           COALESCE(SUM(r.total_revenue), 0) as total_revenue,
           COALESCE(SUM(r.total_collected), 0) as total_collected,
           COALESCE(AVG(r.total_revenue), 0) as avg_revenue_per_route
    FROM drivers d
    LEFT JOIN routes r ON r.driver_id = d.id AND r.route_date >= ? AND r.route_date <= ? AND r.status = 'Completed'
    WHERE d.status = 'Active'
    GROUP BY d.id
    ORDER BY total_revenue DESC
  `).all(from, to);

  res.json({ routePerformance, driverPerformance, from, to });
});

// GET /api/reports/ar - accounts receivable aging
router.get('/ar', (_req, res) => {
  const today = '2026-02-24';

  const aging = db.prepare(`
    SELECT c.name, c.account_number, c.trade_class, c.payment_terms,
           o.order_number, o.order_date, o.due_date, o.balance_due,
           CAST((julianday(?) - julianday(o.order_date)) AS INTEGER) as days_outstanding
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.balance_due > 0 AND o.status NOT IN ('Paid', 'Cancelled')
    ORDER BY days_outstanding DESC
  `).all(today) as Array<{ days_outstanding: number; balance_due: number; name: string; account_number: string; trade_class: string; order_number: string }>;

  // Bucket by aging
  const buckets = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
  const byCustomer: Record<string, { name: string; account_number: string; trade_class: string; current: number; days30: number; days60: number; days90: number; over90: number; total: number }> = {};

  for (const row of aging) {
    const amount = row.balance_due;
    const days = row.days_outstanding;

    if (!byCustomer[row.account_number]) {
      byCustomer[row.account_number] = { name: row.name, account_number: row.account_number, trade_class: row.trade_class, current: 0, days30: 0, days60: 0, days90: 0, over90: 0, total: 0 };
    }

    let bucket: keyof typeof buckets;
    if (days <= 30) bucket = 'current';
    else if (days <= 60) bucket = 'days30';
    else if (days <= 90) bucket = 'days60';
    else if (days <= 120) bucket = 'days90';
    else bucket = 'over90';

    buckets[bucket] += amount;
    byCustomer[row.account_number][bucket] += amount;
    byCustomer[row.account_number].total += amount;
  }

  res.json({
    summary: buckets,
    totalAR: Object.values(buckets).reduce((a, b) => a + b, 0),
    byCustomer: Object.values(byCustomer).sort((a, b) => b.total - a.total),
    detail: aging.slice(0, 50),
  });
});

// GET /api/reports/inventory - inventory status
router.get('/inventory', (_req, res) => {
  const inventory = db.prepare(`
    SELECT p.sku, p.name, p.brand, p.category, p.package_type, p.unit_size,
           p.price_per_case, p.status as product_status,
           COALESCE(i.quantity_cases, 0) as stock_cases,
           COALESCE(i.reorder_point, 0) as reorder_point,
           COALESCE(i.quantity_cases * p.price_per_case, 0) as stock_value,
           CASE WHEN i.quantity_cases <= i.reorder_point THEN 1 ELSE 0 END as needs_reorder
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE p.status = 'Active'
    ORDER BY needs_reorder DESC, p.category, p.name
  `).all();

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_skus,
      COALESCE(SUM(i.quantity_cases), 0) as total_cases,
      COALESCE(SUM(i.quantity_cases * p.price_per_case), 0) as total_value,
      SUM(CASE WHEN i.quantity_cases <= i.reorder_point THEN 1 ELSE 0 END) as low_stock_items
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE p.status = 'Active'
  `).get();

  res.json({ inventory, summary });
});

export default router;
