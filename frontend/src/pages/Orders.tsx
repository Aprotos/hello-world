import { useEffect, useState } from 'react';
import { Search, Plus, ShoppingCart, Filter } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../components/StatCard';
import api from '../api/client';

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  account_number: string;
  trade_class: string;
  route_number: string;
  order_date: string;
  status: string;
  order_type: string;
  subtotal: number;
  deposit_total: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  payment_method: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('2026-02-01');
  const [dateTo, setDateTo] = useState('2026-02-24');
  const [total, setTotal] = useState(0);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    params.set('limit', '100');
    api.get<{ data: Order[]; total: number }>(`/orders?${params}`)
      .then(r => {
        let data = r.data;
        if (search) {
          const s = search.toLowerCase();
          data = data.filter(o => o.order_number.toLowerCase().includes(s) || o.customer_name.toLowerCase().includes(s));
        }
        setOrders(data);
        setTotal(r.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status, dateFrom, dateTo, search]);

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalOutstanding = orders.reduce((s, o) => s + o.balance_due, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{total} orders · {formatCurrency(totalRevenue)} total</p>
        </div>
        <button className="btn-primary"><Plus className="w-4 h-4" /> New Order</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', count: orders.length, amount: totalRevenue, color: 'blue' },
          { label: 'Paid', count: orders.filter(o => o.status === 'Paid').length, amount: orders.filter(o => o.status === 'Paid').reduce((s, o) => s + o.total, 0), color: 'emerald' },
          { label: 'Invoiced', count: orders.filter(o => o.status === 'Invoiced').length, amount: orders.filter(o => o.status === 'Invoiced').reduce((s, o) => s + o.balance_due, 0), color: 'amber' },
          { label: 'Outstanding', count: orders.filter(o => o.balance_due > 0).length, amount: totalOutstanding, color: 'red' },
        ].map(item => (
          <div key={item.label} className="card p-3">
            <p className="text-xs text-gray-500 font-medium">{item.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{item.count}</p>
            <p className={`text-xs font-semibold text-${item.color}-600 mt-0.5`}>{formatCurrency(item.amount)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex-1 min-w-[180px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Order # or customer..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Invoiced">Invoiced</option>
          <option value="Paid">Paid</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <span>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Order #</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Route</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Type</th>
                  <th className="table-header text-right">Subtotal</th>
                  <th className="table-header text-right">Total</th>
                  <th className="table-header text-right">Balance</th>
                  <th className="table-header">Payment</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-xs font-semibold text-blue-700">{o.order_number}</td>
                    <td className="table-cell">
                      <p className="font-medium text-gray-900 text-sm">{o.customer_name}</p>
                      <p className="text-xs text-gray-400">{o.account_number}</p>
                    </td>
                    <td className="table-cell text-xs text-gray-500">{o.route_number || '—'}</td>
                    <td className="table-cell text-sm text-gray-600">{o.order_date}</td>
                    <td className="table-cell">
                      <span className="badge bg-gray-100 text-gray-600 text-xs">{o.order_type}</span>
                    </td>
                    <td className="table-cell text-right text-sm">{formatCurrency(o.subtotal)}</td>
                    <td className="table-cell text-right font-semibold">{formatCurrency(o.total)}</td>
                    <td className="table-cell text-right">
                      <span className={`text-sm font-semibold ${o.balance_due > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {o.balance_due > 0 ? formatCurrency(o.balance_due) : '—'}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-500">{o.payment_method || '—'}</td>
                    <td className="table-cell"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
