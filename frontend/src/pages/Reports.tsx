import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts';
import { BarChart3, DollarSign, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../components/StatCard';
import api from '../api/client';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface SalesReport {
  salesByPeriod: Array<{ period: string; order_count: number; total: number; collected: number; outstanding: number }>;
  byCategory: Array<{ category: string; cases: number; revenue: number }>;
  byTradeClass: Array<{ trade_class: string; orders: number; revenue: number }>;
  topProducts: Array<{ sku: string; name: string; brand: string; category: string; cases_sold: number; revenue: number }>;
  totals: { total_orders: number; customers_served: number; total_revenue: number; total_collected: number; outstanding_ar: number };
}

interface ARReport {
  summary: { current: number; days30: number; days60: number; days90: number; over90: number };
  totalAR: number;
  byCustomer: Array<{ name: string; account_number: string; trade_class: string; current: number; days30: number; days60: number; days90: number; over90: number; total: number }>;
}

interface InventoryReport {
  inventory: Array<{ sku: string; name: string; brand: string; category: string; stock_cases: number; reorder_point: number; stock_value: number; needs_reorder: number }>;
  summary: { total_skus: number; total_cases: number; total_value: number; low_stock_items: number };
}

type Tab = 'sales' | 'ar' | 'inventory' | 'routes';

export default function Reports() {
  const [tab, setTab] = useState<Tab>('sales');
  const [salesData, setSalesData] = useState<SalesReport | null>(null);
  const [arData, setArData] = useState<ARReport | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('2026-01-25');
  const [dateTo, setDateTo] = useState('2026-02-24');

  const loadData = () => {
    setLoading(true);
    if (tab === 'sales') {
      api.get<SalesReport>(`/reports/sales?from=${dateFrom}&to=${dateTo}&group_by=day`)
        .then(setSalesData).finally(() => setLoading(false));
    } else if (tab === 'ar') {
      api.get<ARReport>('/reports/ar').then(setArData).finally(() => setLoading(false));
    } else if (tab === 'inventory') {
      api.get<InventoryReport>('/reports/inventory').then(setInventoryData).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [tab, dateFrom, dateTo]);

  const tabs = [
    { id: 'sales' as Tab, label: 'Sales Report', icon: DollarSign },
    { id: 'ar' as Tab, label: 'A/R Aging', icon: TrendingUp },
    { id: 'inventory' as Tab, label: 'Inventory', icon: Package },
  ];

  const arBuckets = arData ? [
    { label: '0-30 days', value: arData.summary.current, color: '#10b981' },
    { label: '31-60 days', value: arData.summary.days30, color: '#f59e0b' },
    { label: '61-90 days', value: arData.summary.days60, color: '#f97316' },
    { label: '91-120 days', value: arData.summary.days90, color: '#ef4444' },
    { label: '120+ days', value: arData.summary.over90, color: '#7f1d1d' },
  ] : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Business intelligence & analytics</p>
        </div>
        <button className="btn-secondary"><BarChart3 className="w-4 h-4" /> Export CSV</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Date Range (for sales) */}
      {tab === 'sales' && (
        <div className="card p-3 flex items-center gap-3">
          <span className="text-sm text-gray-500 font-medium">Date Range:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <span className="text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      )}

      {loading ? <LoadingSpinner message="Generating report..." /> : (
        <>
          {/* SALES REPORT */}
          {tab === 'sales' && salesData && (
            <div className="space-y-5">
              {/* KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Total Revenue', value: formatCurrency(salesData.totals.total_revenue), color: 'blue' },
                  { label: 'Collected', value: formatCurrency(salesData.totals.total_collected), color: 'emerald' },
                  { label: 'Outstanding', value: formatCurrency(salesData.totals.outstanding_ar), color: 'amber' },
                  { label: 'Orders', value: salesData.totals.total_orders, color: 'purple' },
                  { label: 'Customers Served', value: salesData.totals.customers_served, color: 'gray' },
                ].map(k => (
                  <div key={k.label} className="card p-3">
                    <p className="text-xs text-gray-500">{k.label}</p>
                    <p className={`text-xl font-bold text-${k.color}-700 mt-0.5`}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Revenue Trend */}
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Daily Revenue & Collections</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={salesData.salesByPeriod}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="total" name="Revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="collected" name="Collected" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="outstanding" name="Outstanding" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* By Category */}
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Revenue by Category</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={salesData.byCategory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {salesData.byCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* By Trade Class */}
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Revenue by Trade Class</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={salesData.byTradeClass} dataKey="revenue" nameKey="trade_class" cx="50%" cy="50%" outerRadius={80}
                        label={({ trade_class, percent }) => `${trade_class} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {salesData.byTradeClass.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Products */}
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Top Products by Volume</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-header">Product</th>
                      <th className="table-header">Category</th>
                      <th className="table-header text-right">Cases</th>
                      <th className="table-header text-right">Revenue</th>
                      <th className="table-header">Visual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {salesData.topProducts.map((p, i) => {
                      const maxCases = Math.max(...salesData.topProducts.map(x => x.cases_sold));
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="table-cell">
                            <p className="font-medium text-sm">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.brand} · {p.sku}</p>
                          </td>
                          <td className="table-cell">
                            <span className="badge bg-blue-50 text-blue-700">{p.category}</span>
                          </td>
                          <td className="table-cell text-right font-semibold">{p.cases_sold.toLocaleString()}</td>
                          <td className="table-cell text-right font-semibold text-emerald-700">{formatCurrency(p.revenue)}</td>
                          <td className="table-cell w-32">
                            <div className="bg-gray-100 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(p.cases_sold / maxCases) * 100}%` }}></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* A/R AGING */}
          {tab === 'ar' && arData && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {arBuckets.map(b => (
                  <div key={b.label} className="card p-3">
                    <p className="text-xs text-gray-500">{b.label}</p>
                    <p className="text-xl font-bold mt-0.5" style={{ color: b.color }}>{formatCurrency(b.value)}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Aging Buckets ({formatCurrency(arData.totalAR)} total)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={arBuckets} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="value" name="A/R" radius={[0, 4, 4, 0]}>
                        {arBuckets.map((b, i) => <Cell key={i} fill={b.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Outstanding by Customer</h3>
                  </div>
                  <div className="overflow-y-auto max-h-[280px]">
                    <table className="w-full">
                      <thead className="sticky top-0">
                        <tr>
                          <th className="table-header">Customer</th>
                          <th className="table-header text-right">Current</th>
                          <th className="table-header text-right">30-60d</th>
                          <th className="table-header text-right">60-90d</th>
                          <th className="table-header text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {arData.byCustomer.slice(0, 15).map((c, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="table-cell">
                              <p className="text-sm font-medium">{c.name}</p>
                              <p className="text-xs text-gray-400">{c.trade_class}</p>
                            </td>
                            <td className="table-cell text-right text-sm text-emerald-600">{formatCurrency(c.current)}</td>
                            <td className="table-cell text-right text-sm text-amber-600">{formatCurrency(c.days30 + c.days60)}</td>
                            <td className="table-cell text-right text-sm text-red-500">{formatCurrency(c.days90 + c.over90)}</td>
                            <td className="table-cell text-right font-bold">{formatCurrency(c.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INVENTORY */}
          {tab === 'inventory' && inventoryData && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total SKUs', value: inventoryData.summary.total_skus },
                  { label: 'Total Cases', value: inventoryData.summary.total_cases.toLocaleString() },
                  { label: 'Inventory Value', value: formatCurrency(inventoryData.summary.total_value) },
                  { label: 'Low Stock Items', value: inventoryData.summary.low_stock_items, alert: true },
                ].map(k => (
                  <div key={k.label} className={`card p-3 ${k.alert && k.value > 0 ? 'border-amber-300' : ''}`}>
                    <p className="text-xs text-gray-500">{k.label}</p>
                    <p className={`text-xl font-bold mt-0.5 ${k.alert && Number(k.value) > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{k.value}</p>
                    {k.alert && Number(k.value) > 0 && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                        <AlertTriangle className="w-3 h-3" /> Needs reorder
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Inventory Status</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="table-header">Product</th>
                        <th className="table-header">Category</th>
                        <th className="table-header text-right">In Stock</th>
                        <th className="table-header text-right">Reorder Point</th>
                        <th className="table-header text-right">Stock Value</th>
                        <th className="table-header">Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {inventoryData.inventory.map((item, i) => {
                        const pct = item.reorder_point > 0 ? Math.min(100, (item.stock_cases / (item.reorder_point * 3)) * 100) : 50;
                        return (
                          <tr key={i} className={`hover:bg-gray-50 ${item.needs_reorder ? 'bg-amber-50/40' : ''}`}>
                            <td className="table-cell">
                              <div className="flex items-center gap-2">
                                {item.needs_reorder === 1 && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                                <div>
                                  <p className="font-medium text-sm">{item.name}</p>
                                  <p className="text-xs text-gray-400">{item.brand} · {item.sku}</p>
                                </div>
                              </div>
                            </td>
                            <td className="table-cell">
                              <span className="badge bg-blue-50 text-blue-700">{item.category}</span>
                            </td>
                            <td className={`table-cell text-right font-semibold ${item.needs_reorder ? 'text-amber-600' : 'text-gray-900'}`}>
                              {item.stock_cases} cs
                            </td>
                            <td className="table-cell text-right text-gray-500 text-sm">{item.reorder_point} cs</td>
                            <td className="table-cell text-right text-sm font-medium text-emerald-700">
                              {formatCurrency(item.stock_value)}
                            </td>
                            <td className="table-cell w-28">
                              <div className="bg-gray-100 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${pct < 33 ? 'bg-red-500' : pct < 66 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
