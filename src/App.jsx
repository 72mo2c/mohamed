// ======================================
// App.jsx - الملف الرئيسي للتطبيق
// ======================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { CompanyProvider, useCompany } from './contexts/CompanyContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DataProvider } from './context/DataContext';
import { TabProvider } from './contexts/TabContext';

// Components
import Layout from './components/Layout/Layout';
import Loading from './components/Common/Loading';
import Toast from './components/Common/Toast';

// Pages
import Login from './pages/Auth/Login';
import CompanySelectionPage from './pages/CompanySelectionPage';

// مكون حماية المسارات - يتطلب اختيار شركة
const CompanyRoute = ({ children }) => {
  const { selectedCompany, isLoading } = useCompany();

  if (isLoading) {
    return <Loading fullScreen message="جاري التحميل..." />;
  }

  if (!selectedCompany) {
    return <Navigate to="/company-select" replace />;
  }

  return children;
};

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

// مكون مسار اختيار الشركة
const CompanySelectionRoute = ({ children }) => {
  const { selectedCompany, isLoading } = useCompany();

  if (isLoading) {
    return <Loading fullScreen message="جاري التحميل..." />;
  }

  if (selectedCompany) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <CompanyProvider>
        <AuthProvider>
          <NotificationProvider>
            <DataProvider>
              <TabProvider>
                {/* Toast Component - عرض الإشعارات المنبثقة */}
                <Toast />
              
                <Routes>
                  {/* مسار اختيار الشركة - العام */}
                  <Route
                    path="/company-select"
                    element={
                      <CompanySelectionRoute>
                        <CompanySelectionPage />
                      </CompanySelectionRoute>
                    }
                  />

                  {/* مسار تسجيل الدخول - يتطلب اختيار شركة */}
                  <Route
                    path="/login"
                    element={
                      <CompanyRoute>
                        <PublicRoute>
                          <Login />
                        </PublicRoute>
                      </CompanyRoute>
                    }
                  />

                  {/* جميع المسارات المحمية - تتطلب اختيار شركة + تسجيل دخول */}
                  <Route
                    path="/*"
                    element={
                      <CompanyRoute>
                        <ProtectedRoute />
                      </CompanyRoute>
                    }
                  />
                </Routes>
              </TabProvider>
            </DataProvider>
          </NotificationProvider>
        </AuthProvider>
      </CompanyProvider>
    </Router>
  );
}

export default App;
