import { useEffect, useState } from 'react';
import { Search, Plus, Package, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../components/StatCard';
import api from '../api/client';

interface Product {
  id: number;
  sku: string;
  name: string;
  brand: string;
  category: string;
  package_type: string;
  unit_size: string;
  units_per_case: number;
  price_per_case: number;
  deposit_per_unit: number;
  weight_per_case: number;
  status: string;
  stock_cases: number;
  reorder_point: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Beer: 'bg-amber-100 text-amber-800',
  Wine: 'bg-purple-100 text-purple-800',
  Spirits: 'bg-blue-100 text-blue-800',
  NA: 'bg-emerald-100 text-emerald-800',
  Cider: 'bg-orange-100 text-orange-800',
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    api.get<{ data: Product[] }>(`/products?${params}`)
      .then(r => setProducts(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, category]);

  const displayed = showLowStock ? products.filter(p => p.stock_cases <= p.reorder_point) : products;
  const lowStockCount = products.filter(p => p.stock_cases <= p.reorder_point).length;
  const totalStockValue = products.reduce((s, p) => s + p.stock_cases * p.price_per_case, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{products.length} SKUs · {formatCurrency(totalStockValue)} inventory value</p>
        </div>
        <button className="btn-primary"><Plus className="w-4 h-4" /> Add Product</button>
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search SKU, name, brand..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Categories</option>
          <option value="Beer">Beer</option>
          <option value="Wine">Wine</option>
          <option value="Spirits">Spirits</option>
          <option value="NA">Non-Alcoholic</option>
          <option value="Cider">Cider</option>
        </select>
        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${showLowStock ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <AlertTriangle className="w-4 h-4" />
          Low Stock ({lowStockCount})
        </button>
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">SKU</th>
                  <th className="table-header">Product</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Package</th>
                  <th className="table-header text-right">Price/Case</th>
                  <th className="table-header text-right">Deposit/Unit</th>
                  <th className="table-header text-right">In Stock</th>
                  <th className="table-header text-right">Reorder Pt</th>
                  <th className="table-header text-right">Stock Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map(p => {
                  const isLow = p.stock_cases <= p.reorder_point;
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 ${isLow ? 'bg-amber-50/30' : ''}`}>
                      <td className="table-cell font-mono text-xs text-gray-500">{p.sku}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          {isLow && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${CATEGORY_COLORS[p.category] || 'bg-gray-100 text-gray-600'}`}>{p.category}</span>
                      </td>
                      <td className="table-cell text-sm text-gray-600">
                        {p.package_type} · {p.unit_size} · {p.units_per_case}/cs
                      </td>
                      <td className="table-cell text-right font-semibold text-sm">{formatCurrency(p.price_per_case)}</td>
                      <td className="table-cell text-right text-sm text-gray-500">
                        {p.deposit_per_unit > 0 ? `$${p.deposit_per_unit.toFixed(2)}` : '—'}
                      </td>
                      <td className={`table-cell text-right font-semibold ${isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                        {p.stock_cases} cs
                      </td>
                      <td className="table-cell text-right text-sm text-gray-500">{p.reorder_point} cs</td>
                      <td className="table-cell text-right text-sm font-medium text-emerald-700">
                        {formatCurrency(p.stock_cases * p.price_per_case)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
