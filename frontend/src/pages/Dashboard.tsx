import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { DollarSign, Truck, Users, Package, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import StatCard, { formatCurrency } from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/client';

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface DashboardData {
  today: {
    date: string;
    routes: { total: number; completed: number; in_progress: number; planned: number; total_revenue: number; total_collected: number; stops_completed: number; total_stops: number };
    activeDrivers: Array<{ first_name: string; last_name: string; route_number: string; route_name: string; status: string; stops_completed: number; total_stops: number; total_revenue: number }>;
  };
  kpis: { totalRevenue30d: number; outstandingAR: number; totalOrders30d: number; revenueThisWeek: number; paidOrders: number; invoicedOrders: number };
  charts: {
    revenueByDay: Array<{ date: string; revenue: number; collected: number }>;
    revenueByCategory: Array<{ category: string; revenue: number; cases: number }>;
    paymentMethods: Array<{ payment_method: string; count: number; total: number }>;
    arByClass: Array<{ trade_class: string; outstanding: number }>;
  };
  tables: {
    topCustomers: Array<{ name: string; account_number: string; trade_class: string; revenue: number; order_count: number }>;
    topProducts: Array<{ name: string; brand: string; category: string; cases_sold: number; revenue: number }>;
    lowInventory: Array<{ name: string; sku: string; category: string; quantity_cases: number; reorder_point: number }>;
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>('/dashboard').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (!data) return <div className="text-red-500">Failed to load dashboard</div>;

  const { today, kpis, charts, tables } = data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Operations overview for Feb 24, 2026</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs">Export</button>
          <button className="btn-primary text-xs">New Route</button>
        </div>
      </div>

      {/* Today's Route Status Bar */}
      <div className="card p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-blue-100 text-xs uppercase tracking-wide font-medium">Today's Routes</p>
            <p className="text-3xl font-bold">{today.routes.total}</p>
          </div>
          <div className="flex gap-6 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-bold">{today.routes.in_progress}</p>
              <p className="text-blue-200 text-xs">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{today.routes.completed}</p>
              <p className="text-blue-200 text-xs">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{today.routes.planned}</p>
              <p className="text-blue-200 text-xs">Planned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{today.routes.stops_completed}/{today.routes.total_stops}</p>
              <p className="text-blue-200 text-xs">Stops Done</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(today.routes.total_revenue)}</p>
              <p className="text-blue-200 text-xs">Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(today.routes.total_collected)}</p>
              <p className="text-blue-200 text-xs">Collected</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Revenue (30d)"
          value={formatCurrency(kpis.totalRevenue30d)}
          subtitle="All delivered orders"
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          trend={8.3}
        />
        <StatCard
          label="Outstanding A/R"
          value={formatCurrency(kpis.outstandingAR)}
          subtitle="Unpaid invoices"
          icon={TrendingUp}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Orders (30d)"
          value={kpis.totalOrders30d}
          subtitle={`${kpis.paidOrders} paid · ${kpis.invoicedOrders} invoiced`}
          icon={Truck}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          trend={5.2}
        />
        <StatCard
          label="Week Revenue"
          value={formatCurrency(kpis.revenueThisWeek)}
          subtitle="Last 7 days"
          icon={Package}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          trend={12.1}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend (spans 2 cols) */}
        <div className="card p-4 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue & Collections — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={charts.revenueByDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={l => `Date: ${l}`} />
              <Legend />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="#10b981" fill="url(#colGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Category */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={charts.revenueByCategory}
                dataKey="revenue"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {charts.revenueByCategory.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {charts.revenueByCategory.map((item, i) => (
              <div key={item.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}></div>
                  <span className="text-gray-600">{item.category}</span>
                </div>
                <span className="font-medium">{formatCurrency(item.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Drivers */}
        <div className="card">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Active Drivers Today</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {today.activeDrivers.map((driver, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{driver.first_name} {driver.last_name}</p>
                    <p className="text-xs text-gray-500">{driver.route_number} — {driver.route_name}</p>
                  </div>
                  <StatusBadge status={driver.status} />
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${driver.total_stops > 0 ? (driver.stops_completed / driver.total_stops) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{driver.stops_completed}/{driver.total_stops}</span>
                </div>
                <p className="text-xs font-medium text-emerald-600 mt-0.5">{formatCurrency(driver.total_revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="card">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">Top Customers (30d)</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Customer</th>
                <th className="table-header text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {tables.topCustomers.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <p className="font-medium text-gray-900 truncate max-w-[140px]">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.trade_class} · {c.order_count} orders</p>
                  </td>
                  <td className="table-cell text-right font-semibold text-emerald-700">{formatCurrency(c.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alerts Column */}
        <div className="space-y-4">
          {/* Low Inventory */}
          <div className="card">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-gray-900">Low Inventory Alerts</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {tables.lowInventory.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-3">All inventory levels OK</p>
              ) : (
                tables.lowInventory.map((item, i) => (
                  <div key={i} className="px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{item.name}</p>
                      <span className="text-xs text-amber-600 font-medium">{item.quantity_cases} cs</span>
                    </div>
                    <p className="text-xs text-gray-500">Reorder at {item.reorder_point} cs · {item.category}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Payment Mix (30d)
            </h3>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={charts.paymentMethods} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="payment_method" tick={{ fontSize: 11 }} width={70} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="card">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Top Products by Volume (30d)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Product</th>
                <th className="table-header">Brand</th>
                <th className="table-header">Category</th>
                <th className="table-header text-right">Cases Sold</th>
                <th className="table-header text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {tables.topProducts.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-gray-900">{p.name}</td>
                  <td className="table-cell text-gray-500">{p.brand}</td>
                  <td className="table-cell">
                    <span className="badge bg-blue-50 text-blue-700">{p.category}</span>
                  </td>
                  <td className="table-cell text-right font-semibold">{p.cases_sold.toLocaleString()}</td>
                  <td className="table-cell text-right font-semibold text-emerald-700">{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
