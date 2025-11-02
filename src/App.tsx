import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, Box } from '@mui/material';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import StoreLogin from './components/auth/StoreLogin';
import StoreRegister from './components/auth/StoreRegister';
import StoreLanding from './pages/StoreLanding';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/admin/AdminRoute';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import AdminProductForm from './pages/AdminProductForm';
import EditProduct from './pages/EditProduct';
import Cart from './components/cart/Cart';
import OrderList from './components/orders/OrderList';
import OrderDetails from './components/orders/OrderDetails';
import Checkout from './pages/Checkout';
import SocialLoginSuccess from './pages/SocialLoginSuccess';
import DebugUser from './components/DebugUser';
import TermsOfService from './pages/TermsOfService';
import ChatbotWidget from './components/ChatbotWidget';
import AdminHome from './pages/AdminHome';
import AdminProductList from './pages/AdminProductList';
import AdminOrderManagement from './pages/AdminOrderManagement';
import RoleBasedRoute from './components/RoleBasedRoute';
import AdminOrderDetails from './pages/AdminOrderDetails';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Settings from './pages/Settings';
import TwoFactor from './pages/TwoFactor';
import StoreSocialLoginSuccess from './pages/StoreSocialLoginSuccess';

const App: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Box>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<RoleBasedRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/store" element={<StoreLanding />} />
            <Route path="/store/login" element={<StoreLogin />} />
            <Route path="/store/register" element={<StoreRegister />} />
            <Route path="/social-login-success" element={<SocialLoginSuccess />} />
            <Route path="/store-social-login-success" element={<StoreSocialLoginSuccess />} />
            <Route path="/debug" element={<DebugUser />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/2fa" element={<TwoFactor />} />
            
            {/* Customer Routes */}
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrderList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminHome />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AdminProductList />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products/new"
              element={
                <AdminRoute>
                  <AdminProductForm />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products/edit/:productId"
              element={
                <ProtectedRoute>
                  <EditProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/:id"
              element={
                <AdminRoute>
                  <AdminProductForm />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <AdminOrderManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders/:id"
              element={
                <AdminRoute>
                  <AdminOrderDetails />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
          </Routes>
        </Box>
      </Container>
      <Footer />
      <ChatbotWidget />
    </Box>
  );
};

export default App; 