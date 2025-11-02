// ======================================
// App.jsx - الملف الرئيسي للتطبيق (محدث لـ SaaS)
// ======================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DataProvider } from './context/DataContext';
import { TabProvider } from './contexts/TabContext';
import { SaaSProvider, useSaaS } from './context/SaaSContext';
import Layout from './components/Layout/Layout';
import Loading from './components/Common/Loading';
import Toast from './components/Common/Toast';
import SyncStatusIndicator from './components/Common/SyncStatusIndicator';

// Auth Pages
import Login from './pages/Auth/Login';
import SaaSLogin from './pages/Auth/SaaSLogin';
import CompanySelection from './pages/Auth/CompanySelection';

// SaaS Admin Panel
import SaaSAdminPanel from './components/SaaS/SaaSAdminPanel';

// مكون حماية المسارات - يتطلب تسجيل دخول
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { hasActiveTenant } = useSaaS();

  if (loading) {
    return <Loading fullScreen message="جاري التحميل..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasActiveTenant) {
    return <Navigate to="/company-selection" replace />;
  }

  return (
    <>
      <Layout />
      <SyncStatusIndicator position="top-right" showDetails={false} />
    </>
  );
};

// مكون مسار تسجيل الدخول
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { hasActiveTenant } = useSaaS();

  if (loading) {
    return <Loading fullScreen message="جاري التحميل..." />;
  }

  // إذا كان المستخدم مسجل دخول ولديه مؤسسة نشطة
  if (isAuthenticated && hasActiveTenant) {
    return <Navigate to="/dashboard" replace />;
  }

  // إذا كان المستخدم مسجل دخول ولكن لا توجد مؤسسة
  if (isAuthenticated && !hasActiveTenant) {
    return <Navigate to="/company-selection" replace />;
  }

  return children;
};

// مكون مسار اختيار المؤسسة
const CompanySelectionRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { hasActiveTenant, loading: saasLoading } = useSaaS();

  if (loading || saasLoading) {
    return <Loading fullScreen message="جاري التحميل..." />;
  }

  // إذا كان المستخدم مسجل دخول ولديه مؤسسة نشطة
  if (isAuthenticated && hasActiveTenant) {
    return <Navigate to="/dashboard" replace />;
  }

  // إذا كان المستخدم غير مسجل دخول
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// مكون مسار لوحة إدارة SaaS
const SaaSAdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen message="جاري التحميل..." />;
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {children}
      <SyncStatusIndicator position="top-right" showDetails={true} />
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <DataProvider>
            <TabProvider>
              <SaaSProvider>
                {/* Toast Component - عرض الإشعارات المنبثقة */}
                <Toast />
              
                <Routes>
                  {/* مسارات المصادقة */}
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <SaaSLogin />
                      </PublicRoute>
                    }
                  />
                  
                  <Route
                    path="/company-selection"
                    element={
                      <CompanySelectionRoute>
                        <CompanySelection />
                      </CompanySelectionRoute>
                    }
                  />

                  {/* لوحة إدارة SaaS (للمدراء فقط) */}
                  <Route
                    path="/saas-admin"
                    element={
                      <SaaSAdminRoute>
                        <div className="min-h-screen bg-gray-50">
                          <SaaSAdminPanel />
                        </div>
                      </SaaSAdminRoute>
                    }
                  />

                  {/* جميع المسارات المحمية */}
                  <Route path="/*" element={<ProtectedRoute />} />
                </Routes>
              </SaaSProvider>
            </TabProvider>
          </DataProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;