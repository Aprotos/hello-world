import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Plus, Filter, Calendar, ChevronRight } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../components/StatCard';
import api from '../api/client';

interface Route {
  id: number;
  route_number: string;
  name: string;
  driver_name: string;
  vehicle_number: string;
  route_date: string;
  status: string;
  total_stops: number;
  stops_completed: number;
  total_cases: number;
  total_revenue: number;
  total_collected: number;
  start_time: string | null;
  end_time: string | null;
}

export default function Routes() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('2026-02-24');
  const [statusFilter, setStatusFilter] = useState('');

  const loadRoutes = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFilter) params.set('date', dateFilter);
    if (statusFilter) params.set('status', statusFilter);
    params.set('limit', '100');
    api.get<{ data: Route[] }>(`/routes?${params}`).then(r => setRoutes(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { loadRoutes(); }, [dateFilter, statusFilter]);

  const completionPct = (r: Route) => r.total_stops > 0 ? Math.round((r.stops_completed / r.total_stops) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{routes.length} routes found</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" /> New Route
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="Planned">Planned</option>
          <option value="Loaded">Loaded</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        {(dateFilter || statusFilter) && (
          <button onClick={() => { setDateFilter(''); setStatusFilter(''); }} className="text-xs text-blue-600 hover:underline">
            Clear filters
          </button>
        )}

        {/* Summary chips */}
        <div className="ml-auto flex gap-3 text-xs font-medium">
          {['In Progress', 'Planned', 'Completed'].map(s => {
            const count = routes.filter(r => r.status === s).length;
            return count > 0 ? (
              <button key={s} onClick={() => setStatusFilter(s)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">
                <span>{count}</span> <span>{s}</span>
              </button>
            ) : null;
          })}
        </div>
      </div>

      {/* Route Cards */}
      {loading ? (
        <LoadingSpinner message="Loading routes..." />
      ) : routes.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No routes found for the selected filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map(route => (
            <div key={route.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-gray-400">{route.route_number}</span>
                        <StatusBadge status={route.status} />
                      </div>
                      <h3 className="font-semibold text-gray-900 mt-0.5">{route.name}</h3>
                      <p className="text-sm text-gray-500">
                        {route.driver_name || 'Unassigned'} · {route.vehicle_number || 'No vehicle'} · {route.route_date}
                      </p>
                    </div>
                    <Link to={`/routes/${route.id}`} className="text-blue-600 hover:text-blue-800 flex-shrink-0">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-gray-400">Stops</p>
                      <p className="text-sm font-semibold text-gray-900">{route.stops_completed}/{route.total_stops}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Cases</p>
                      <p className="text-sm font-semibold text-gray-900">{route.total_cases.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Revenue</p>
                      <p className="text-sm font-semibold text-emerald-700">{formatCurrency(route.total_revenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Collected</p>
                      <p className="text-sm font-semibold text-blue-700">{formatCurrency(route.total_collected)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Completion</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${completionPct(route) === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${completionPct(route)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600">{completionPct(route)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
