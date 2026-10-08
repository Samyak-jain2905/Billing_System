import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import POS from './pages/POS';
import Products from './pages/Products';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import SalesReturn from './pages/SalesReturn';
import PurchaseReturn from './pages/PurchaseReturn';
import Users from './pages/Users';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole') || 'ADMIN';

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If not authorized, redirect to a page they have access to. 
    // Assuming everyone has access to something:
    if (userRole === 'CASHIER') return <Navigate to="/pos" replace />;
    if (userRole === 'STAFF') return <Navigate to="/products" replace />;
    return <Navigate to="/pos" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/pos" replace />} />
        
        {/* Routes with Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/pos" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'CASHIER']}>
              <POS />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/sales-return" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <SalesReturn />
            </ProtectedRoute>
          } />
          <Route path="/customers" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'CASHIER']}>
              <Customers />
            </ProtectedRoute>
          } />
          <Route path="/suppliers" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <Suppliers />
            </ProtectedRoute>
          } />
          <Route path="/purchases" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
              <Purchases />
            </ProtectedRoute>
          } />
          <Route path="/purchase-return" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <PurchaseReturn />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Users />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
