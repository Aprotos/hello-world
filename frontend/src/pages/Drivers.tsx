import { useEffect, useState } from 'react';
import { UserCheck, Phone, Mail, Award } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../components/StatCard';
import api from '../api/client';

interface Driver {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  license_number: string;
  license_class: string;
  license_expiry: string;
  hire_date: string;
  status: string;
  total_routes: number;
  total_revenue: number;
  total_stops: number;
}

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Driver[] }>('/drivers').then(r => setDrivers(r.data)).finally(() => setLoading(false));
  }, []);

  const topDriver = [...drivers].sort((a, b) => b.total_revenue - a.total_revenue)[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-sm text-gray-500">{drivers.filter(d => d.status === 'Active').length} active drivers</p>
        </div>
        <button className="btn-primary"><UserCheck className="w-4 h-4" /> Add Driver</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Driver Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map(driver => {
              const isTop = topDriver && driver.id === topDriver.id;
              const licenseExpiry = new Date(driver.license_expiry);
              const daysToExpiry = Math.round((licenseExpiry.getTime() - Date.now()) / 86400000);
              const licenseWarning = daysToExpiry < 90;

              return (
                <div key={driver.id} className={`card p-4 ${isTop ? 'ring-2 ring-amber-300' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-bold text-sm">
                          {driver.first_name[0]}{driver.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-gray-900">{driver.first_name} {driver.last_name}</h3>
                          {isTop && <span title="Top earner"><Award className="w-4 h-4 text-amber-500" /></span>}
                        </div>
                        <p className="text-xs text-gray-400 font-mono">{driver.employee_id}</p>
                      </div>
                    </div>
                    <StatusBadge status={driver.status} />
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />{driver.phone}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />{driver.email}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{driver.total_routes}</p>
                      <p className="text-xs text-gray-400">Routes</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{driver.total_stops.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">Stops</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-700">{formatCurrency(driver.total_revenue)}</p>
                      <p className="text-xs text-gray-400">Revenue</p>
                    </div>
                  </div>

                  <div className={`mt-3 pt-3 border-t border-gray-100 text-xs ${licenseWarning ? 'text-amber-600' : 'text-gray-400'}`}>
                    <p className="font-medium">{driver.license_class}</p>
                    <p>Expires: {driver.license_expiry} {licenseWarning ? `(${daysToExpiry}d)` : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Performance Table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Driver Performance Summary</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Driver</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Routes</th>
                  <th className="table-header text-right">Stops</th>
                  <th className="table-header text-right">Total Revenue</th>
                  <th className="table-header text-right">Avg/Route</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...drivers].sort((a, b) => b.total_revenue - a.total_revenue).map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <p className="font-medium">{d.first_name} {d.last_name}</p>
                      <p className="text-xs text-gray-400">{d.employee_id}</p>
                    </td>
                    <td className="table-cell"><StatusBadge status={d.status} /></td>
                    <td className="table-cell text-right">{d.total_routes}</td>
                    <td className="table-cell text-right">{d.total_stops.toLocaleString()}</td>
                    <td className="table-cell text-right font-semibold text-emerald-700">{formatCurrency(d.total_revenue)}</td>
                    <td className="table-cell text-right text-gray-600">
                      {d.total_routes > 0 ? formatCurrency(d.total_revenue / d.total_routes) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
