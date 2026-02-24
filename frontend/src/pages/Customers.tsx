import { useEffect, useState } from 'react';
import { Search, Plus, Users, Phone, Mail, Building2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../components/StatCard';
import api from '../api/client';

interface Customer {
  id: number;
  account_number: string;
  name: string;
  trade_class: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  contact_name: string;
  credit_limit: number;
  current_balance: number;
  payment_terms: string;
  status: string;
}

const TRADE_CLASS_COLORS: Record<string, string> = {
  'On-Premise': 'bg-purple-100 text-purple-700',
  'Chain': 'bg-blue-100 text-blue-700',
  'Retail': 'bg-emerald-100 text-emerald-700',
  'Wholesale': 'bg-amber-100 text-amber-700',
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tradeClass, setTradeClass] = useState('');
  const [status, setStatus] = useState('Active');
  const [total, setTotal] = useState(0);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (tradeClass) params.set('trade_class', tradeClass);
    if (status) params.set('status', status);
    params.set('limit', '100');
    api.get<{ data: Customer[]; total: number }>(`/customers?${params}`)
      .then(r => { setCustomers(r.data); setTotal(r.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, tradeClass, status]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{total} accounts</p>
        </div>
        <button className="btn-primary"><Plus className="w-4 h-4" /> New Customer</button>
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers, accounts, cities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={tradeClass} onChange={e => setTradeClass(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Trade Classes</option>
          <option value="On-Premise">On-Premise</option>
          <option value="Chain">Chain</option>
          <option value="Retail">Retail</option>
          <option value="Wholesale">Wholesale</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Hold">On Hold</option>
        </select>
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Account</th>
                  <th className="table-header">Contact</th>
                  <th className="table-header">Location</th>
                  <th className="table-header">Trade Class</th>
                  <th className="table-header">Terms</th>
                  <th className="table-header text-right">Balance</th>
                  <th className="table-header">Status</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{c.account_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <p className="text-sm text-gray-900">{c.contact_name}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <Phone className="w-3 h-3" />{c.phone}
                      </div>
                    </td>
                    <td className="table-cell text-sm text-gray-600">
                      {c.city}, {c.state} {c.zip}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${TRADE_CLASS_COLORS[c.trade_class] || 'bg-gray-100 text-gray-600'}`}>
                        {c.trade_class}
                      </span>
                    </td>
                    <td className="table-cell text-sm text-gray-600">{c.payment_terms}</td>
                    <td className="table-cell text-right">
                      <span className={`font-semibold text-sm ${c.current_balance > 0 ? 'text-amber-700' : 'text-gray-500'}`}>
                        {formatCurrency(c.current_balance)}
                      </span>
                      <p className="text-xs text-gray-400">/ {formatCurrency(c.credit_limit)}</p>
                    </td>
                    <td className="table-cell"><StatusBadge status={c.status} /></td>
                    <td className="table-cell">
                      <Link to={`/customers/${c.id}`} className="text-blue-500 hover:text-blue-700">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
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
