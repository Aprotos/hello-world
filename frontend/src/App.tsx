import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RoutesPage from './pages/Routes';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Drivers from './pages/Drivers';
import Deliveries from './pages/Deliveries';
import Reports from './pages/Reports';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <div className="text-6xl font-bold mb-4">404</div>
      <p className="text-lg">Page not found</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/routes/:id" element={<RoutesPage />} />
          <Route path="/deliveries" element={<Deliveries />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<Customers />} />
          <Route path="/products" element={<Products />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
