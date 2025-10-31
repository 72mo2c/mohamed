// ======================================
// App.jsx - الملف الرئيسي للتطبيق
// ======================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DataProvider } from './context/DataContext';
import { TabProvider } from './contexts/TabContext';
import Layout from './components/Layout/Layout';
import Loading from './components/Common/Loading';
import Toast from './components/Common/Toast';

// Auth Pages
import Login from './pages/Auth/Login';

// مكون حماية المسارات - يتطلب تسجيل دخول
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen message="جاري التحميل..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
};

// مكون مسار تسجيل الدخول
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen message="جاري التحميل..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <DataProvider>
            <TabProvider>
              {/* Toast Component - عرض الإشعارات المنبثقة */}
              <Toast />
            
            <Routes>
              {/* مسار تسجيل الدخول */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              {/* جميع المسارات المحمية */}
              <Route path="/*" element={<ProtectedRoute />} />
            </Routes>
            </TabProvider>
          </DataProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
