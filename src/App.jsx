// ======================================
// App.jsx - الملف الرئيسي للتطبيق (SaaS Version)
// ======================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DataProvider } from './context/DataContext';
import { TabProvider } from './contexts/TabContext';
import { SaaSAuthProvider, useSaaSAuth } from './context/SaaSAuthContext';
import Layout from './components/Layout/Layout';
import Loading from './components/Common/Loading';
import Toast from './components/Common/Toast';

// Legacy Auth Pages
import Login from './pages/Auth/Login';

// SaaS Auth Pages
import CompanySelectStep from './pages/Auth/CompanySelectStep';
import CompanyLoadStep from './pages/Auth/CompanyLoadStep';
import PasswordInputStep from './pages/Auth/PasswordInputStep';

// مكون حماية المسارات - يتطلب تسجيل دخول
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen message="جاري التحميل..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/saas-login" replace />;
  }

  return <Layout />;
};

// مكون مسار تسجيل الدخول العادي
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

// مكون SaaS Routes
const SaaSRoute = () => {
  const { currentStep } = useSaaSAuth();

  switch (currentStep) {
    case 'company-load':
      return <CompanyLoadStep />;
    case 'password-input':
      return <PasswordInputStep />;
    default:
      return <CompanySelectStep />;
  }
};

// مكون حماية مسار SaaS
const SaaSProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen message="جاري التحميل..." />;
  }

  // إذا كان مسجل الدخول، توجيه للداشبورد
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <SaaSAuthProvider>
        <AuthProvider>
        <NotificationProvider>
          <DataProvider>
            <TabProvider>
              {/* Toast Component - عرض الإشعارات المنبثقة */}
              <Toast />
            
            <Routes>
                  {/* المسارات الرئيسية */}
                  <Route path="/" element={<Navigate to="/saas-login" replace />} />
                  
                  {/* مسار تسجيل الدخول العادي (نسخة احتياطية) */}
                  <Route
                    path="/legacy-login"
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    }
                  />

                  {/* مسار تسجيل الدخول SaaS */}
                  <Route
                    path="/saas-login"
                    element={
                      <SaaSProtectedRoute>
                        <SaaSRoute />
                      </SaaSProtectedRoute>
                    }
                  />

              {/* جميع المسارات المحمية */}
              <Route path="/*" element={<ProtectedRoute />} />
            </Routes>
            </TabProvider>
          </DataProvider>
        </NotificationProvider>
        </AuthProvider>
      </SaaSAuthProvider>
    </Router>
  );
}

export default App;
