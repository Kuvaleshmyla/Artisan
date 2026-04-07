import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import Login from './views/auth/Login';
import Register from './views/auth/Register';
import DashboardLayout from './components/layout/DashboardLayout';

import CustomerDashboard from './views/customer/CustomerDashboard';
import ProductCatalog from './views/customer/ProductCatalog';
import ProductDetails from './views/customer/ProductDetails';
import PublicArtisan from './views/customer/PublicArtisan';
import Cart from './views/customer/Cart';
import Checkout from './views/customer/Checkout';
import MyOrders from './views/customer/MyOrders';
import OrderDetail from './views/shared/OrderDetail';
import Wishlist from './views/customer/Wishlist';

import ArtisanDashboard from './views/artisan/ArtisanDashboard';
import ProductsManagement from './views/artisan/ProductsManagement';
import UploadQR from './views/artisan/UploadQR';
import ArtisanProfile from './views/artisan/ArtisanProfile';

import AdminDashboard from './views/admin/AdminDashboard';
import AdminUsers from './views/admin/AdminUsers';
import AdminArtisans from './views/admin/AdminArtisans';
import AdminRequests from './views/admin/AdminRequests';
import AdminOrders from './views/admin/AdminOrders';
import AdminProducts from './views/admin/AdminProducts';
import AdminIssues from './views/admin/AdminIssues';
import AdminContent from './views/admin/AdminContent';
import CraftStoriesPage from './views/shared/CraftStoriesPage';

const MockDashboardHome = () => (
   <div className="bg-white dark:bg-gray-900 p-12 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center h-[60vh] text-center">
       <div className="text-5xl mb-4">🚧</div>
       <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Coming Soon</h2>
       <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">This section is currently under development. Please check back later.</p>
   </div>
);

function App() {
  const { userInfo } = useAuthStore();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={
              userInfo?.role === 'admin' ? <AdminDashboard /> : 
              userInfo?.role === 'artisan' ? <ArtisanDashboard /> : 
              <ProductCatalog />
          } />
          
          <Route path="catalog" element={<Navigate to="/dashboard/products" replace />} />
          <Route path="customer" element={<CustomerDashboard />} />
          <Route path="products" element={
              userInfo?.role === 'artisan' ? <ProductsManagement /> : 
              userInfo?.role === 'admin' ? <AdminProducts /> :
              <ProductCatalog />
          } />
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="artisan/:artisanId" element={<PublicArtisan />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={
              userInfo?.role === 'admin' ? <AdminOrders /> : <MyOrders />
          } />
          <Route path="orders/:orderId" element={<OrderDetail />} />
          <Route path="qrcode" element={<UploadQR />} />
          <Route path="artisan-profile" element={<ArtisanProfile />} />
          
          <Route path="users" element={
              userInfo?.role === 'admin' ? <AdminUsers /> : <MockDashboardHome />
          } />
          <Route path="requests" element={
              userInfo?.role === 'admin' ? <AdminRequests /> : <MockDashboardHome />
          } />
          <Route path="artisans" element={
              userInfo?.role === 'admin' ? <AdminArtisans /> : <MockDashboardHome />
          } />
          <Route path="issues" element={
              userInfo?.role === 'admin' ? <AdminIssues /> : <MockDashboardHome />
          } />
          <Route path="content" element={
              userInfo?.role === 'admin' ? <AdminContent /> : <MockDashboardHome />
          } />
          <Route path="craft-stories" element={<CraftStoriesPage />} />
          <Route path="wishlist" element={<Wishlist />} />
          
          <Route path="*" element={<MockDashboardHome />} />
      </Route>
    </Routes>
  )
}

export default App;
