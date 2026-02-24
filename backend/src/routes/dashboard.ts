import { Router } from 'express';
import db from '../db/database';

const router = Router();

router.get('/', (_req, res) => {
  const today = '2026-02-24';
  const thirtyDaysAgo = '2026-01-25';
  const sevenDaysAgo = '2026-02-17';

  // Today's route stats
  const todayRoutes = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'Planned' THEN 1 ELSE 0 END) as planned,
      COALESCE(SUM(total_revenue), 0) as total_revenue,
      COALESCE(SUM(total_collected), 0) as total_collected,
      COALESCE(SUM(stops_completed), 0) as stops_completed,
      COALESCE(SUM(total_stops), 0) as total_stops
    FROM routes WHERE route_date = ?
  `).get(today) as Record<string, number>;

  // Revenue last 30 days
  const revenueByDay = db.prepare(`
    SELECT route_date as date,
           COALESCE(SUM(total_revenue), 0) as revenue,
           COALESCE(SUM(total_collected), 0) as collected
    FROM routes
    WHERE route_date >= ? AND route_date <= ?
    GROUP BY route_date
    ORDER BY route_date
  `).all(thirtyDaysAgo, today);

  // Orders stats
  const orderStats = db.prepare(`
    SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(total), 0) as total_revenue,
      COALESCE(SUM(balance_due), 0) as outstanding_ar,
      SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paid,
      SUM(CASE WHEN status = 'Invoiced' THEN 1 ELSE 0 END) as invoiced,
      SUM(CASE WHEN order_date >= ? THEN total ELSE 0 END) as revenue_7d
    FROM orders
    WHERE order_date >= ?
  `).get(sevenDaysAgo, thirtyDaysAgo) as Record<string, number>;

  // Top customers by revenue (30d)
  const topCustomers = db.prepare(`
    SELECT c.name, c.account_number, c.trade_class,
           COALESCE(SUM(o.total), 0) as revenue,
           COUNT(o.id) as order_count
    FROM customers c
    JOIN orders o ON o.customer_id = c.id
    WHERE o.order_date >= ?
    GROUP BY c.id
    ORDER BY revenue DESC
    LIMIT 5
  `).all(thirtyDaysAgo);

  // Top products by cases sold (30d)
  const topProducts = db.prepare(`
    SELECT p.name, p.brand, p.category,
           COALESCE(SUM(oi.quantity_cases), 0) as cases_sold,
           COALESCE(SUM(oi.line_total), 0) as revenue
    FROM products p
    JOIN order_items oi ON oi.product_id = p.id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.order_date >= ?
    GROUP BY p.id
    ORDER BY cases_sold DESC
    LIMIT 5
  `).all(thirtyDaysAgo);

  // Revenue by category (30d)
  const revenueByCategory = db.prepare(`
    SELECT p.category,
           COALESCE(SUM(oi.quantity_cases), 0) as cases,
           COALESCE(SUM(oi.line_total), 0) as revenue
    FROM products p
    JOIN order_items oi ON oi.product_id = p.id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.order_date >= ?
    GROUP BY p.category
    ORDER BY revenue DESC
  `).all(thirtyDaysAgo);

  // Active drivers today
  const activeDrivers = db.prepare(`
    SELECT d.first_name, d.last_name, d.employee_id,
           r.route_number, r.name as route_name, r.status,
           r.stops_completed, r.total_stops, r.total_revenue
    FROM drivers d
    JOIN routes r ON r.driver_id = d.id
    WHERE r.route_date = ?
    ORDER BY r.status
  `).all(today);

  // Low inventory alerts
  const lowInventory = db.prepare(`
    SELECT p.name, p.sku, p.category,
           i.quantity_cases, i.reorder_point,
           (i.reorder_point - i.quantity_cases) as shortage
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    WHERE i.quantity_cases <= i.reorder_point
    ORDER BY shortage DESC
    LIMIT 5
  `).all();

  // Outstanding AR by trade class
  const arByClass = db.prepare(`
    SELECT c.trade_class,
           COUNT(DISTINCT c.id) as customer_count,
           COALESCE(SUM(o.balance_due), 0) as outstanding
    FROM customers c
    JOIN orders o ON o.customer_id = c.id
    WHERE o.balance_due > 0 AND o.status != 'Cancelled'
    GROUP BY c.trade_class
    ORDER BY outstanding DESC
  `).all();

  // Payment method breakdown (30d)
  const paymentMethods = db.prepare(`
    SELECT payment_method, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
    FROM payments
    WHERE received_at >= ?
    GROUP BY payment_method
    ORDER BY total DESC
  `).all(thirtyDaysAgo);

  res.json({
    today: {
      date: today,
      routes: todayRoutes,
      activeDrivers,
    },
    kpis: {
      totalRevenue30d: orderStats.total_revenue,
      outstandingAR: orderStats.outstanding_ar,
      totalOrders30d: orderStats.total_orders,
      revenueThisWeek: orderStats.revenue_7d,
      paidOrders: orderStats.paid,
      invoicedOrders: orderStats.invoiced,
    },
    charts: {
      revenueByDay,
      revenueByCategory,
      paymentMethods,
      arByClass,
    },
    tables: {
      topCustomers,
      topProducts,
      lowInventory,
    },
  });
});

export default router;
