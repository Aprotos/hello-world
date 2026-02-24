import { useEffect, useState } from 'react';
import { MapPin, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../components/StatCard';
import api from '../api/client';

interface DeliveryStop {
  id: number;
  stop_order: number;
  status: string;
  customer_name: string;
  account_number: string;
  address: string;
  city: string;
  state: string;
  trade_class: string;
  customer_phone: string;
  route_number: string;
  route_name: string;
  route_date: string;
  route_status: string;
  driver_name: string;
  order_number: string;
  total: number;
  order_status: string;
  payment_method: string;
  amount_paid: number;
  actual_arrival: string | null;
  actual_departure: string | null;
  signature_captured: number;
  delivery_notes: string;
}

interface Summary {
  total: number;
  delivered: number;
  pending: number;
  skipped: number;
  total_value: number;
  delivered_value: number;
}

export default function Deliveries() {
  const [stops, setStops] = useState<DeliveryStop[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('2026-02-24');
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ date: dateFilter });
    api.get<{ data: DeliveryStop[]; summary: Summary }>(`/deliveries?${params}`)
      .then(r => {
        let data = r.data;
        if (statusFilter) data = data.filter(s => s.status === statusFilter);
        setStops(data);
        setSummary(r.summary);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [dateFilter, statusFilter]);

  const groupedByRoute = stops.reduce<Record<string, DeliveryStop[]>>((acc, stop) => {
    const key = `${stop.route_number} — ${stop.route_name}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(stop);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-sm text-gray-500">{stops.length} stops shown</p>
        </div>
      </div>

      {/* Summary Bar */}
      {summary && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: 'Total Stops', value: summary.total, icon: MapPin, color: 'blue' },
            { label: 'Delivered', value: summary.delivered, icon: CheckCircle, color: 'emerald' },
            { label: 'Pending', value: summary.pending, icon: Clock, color: 'amber' },
            { label: 'Skipped', value: summary.skipped, icon: AlertCircle, color: 'red' },
            { label: 'Total Value', value: formatCurrency(summary.total_value), icon: MapPin, color: 'blue' },
            { label: 'Delivered Value', value: formatCurrency(summary.delivered_value), icon: CheckCircle, color: 'emerald' },
          ].map(item => (
            <div key={item.label} className="card p-3">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className={`text-lg font-bold text-${item.color}-600 mt-0.5`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card p-3 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">
          {['', 'Pending', 'Delivered', 'Skipped'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries by Route */}
      {loading ? <LoadingSpinner message="Loading deliveries..." /> : (
        <div className="space-y-4">
          {Object.entries(groupedByRoute).map(([routeKey, routeStops]) => {
            const delivered = routeStops.filter(s => s.status === 'Delivered').length;
            const pct = Math.round((delivered / routeStops.length) * 100);

            return (
              <div key={routeKey} className="card overflow-hidden">
                {/* Route Header */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={routeStops[0].route_status} />
                    <span className="font-semibold text-gray-900">{routeKey}</span>
                    <span className="text-sm text-gray-500">Driver: {routeStops[0].driver_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="text-xs font-medium text-gray-600">{delivered}/{routeStops.length} stops</span>
                    </div>
                  </div>
                </div>

                {/* Stop List */}
                <div className="divide-y divide-gray-50">
                  {routeStops.map(stop => (
                    <div key={stop.id} className={`px-4 py-3 flex items-center gap-4 ${stop.status === 'Delivered' ? '' : 'bg-white'}`}>
                      {/* Stop # */}
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-blue-700">{stop.stop_order}</span>
                      </div>

                      {/* Status icon */}
                      {stop.status === 'Delivered'
                        ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        : stop.status === 'Skipped'
                        ? <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        : <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      }

                      {/* Customer */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm">{stop.customer_name}</p>
                          <span className="text-xs text-gray-400">{stop.account_number}</span>
                        </div>
                        <p className="text-xs text-gray-500">{stop.address}, {stop.city}, {stop.state}</p>
                      </div>

                      {/* Order info */}
                      {stop.order_number && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-400 font-mono">{stop.order_number}</p>
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(stop.total)}</p>
                          {stop.payment_method && (
                            <p className="text-xs text-emerald-600">{stop.payment_method}</p>
                          )}
                        </div>
                      )}

                      {/* Status */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <StatusBadge status={stop.status} />
                        {stop.signature_captured === 1 && (
                          <span className="text-xs text-gray-400">✓ Signed</span>
                        )}
                        {stop.actual_arrival && (
                          <span className="text-xs text-gray-400">{stop.actual_arrival.slice(11, 16)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {stops.length === 0 && (
            <div className="card p-12 text-center text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No deliveries found for the selected date</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
