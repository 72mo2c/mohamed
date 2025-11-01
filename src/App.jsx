// ======================================
// App.jsx - الملف الرئيسي للتطبيق
// ======================================

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DataProvider } from './context/DataContext';
import { TabProvider } from './contexts/TabContext';
import Layout from './components/Layout/Layout';
import Loading from './components/Common/Loading';
import Toast from './components/Common/Toast';
import ReturnConfig from './config/ReturnConfig';
import { FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';

// Auth Pages
import Login from './pages/Auth/Login';

// Dashboard
import Dashboard from './pages/Dashboard';

// Sales Pages
import SalesInvoices from './pages/Sales/SalesInvoices';
import ManageSalesInvoices from './pages/Sales/ManageSalesInvoices';
import NewSalesInvoice from './pages/Sales/NewSalesInvoice';
import SalesReturns from './pages/Sales/SalesReturns';
import NewSalesReturn from './pages/Sales/NewSalesReturn';

// Purchase Pages
import PurchaseInvoices from './pages/Purchases/PurchaseInvoices';
import ManagePurchaseInvoices from './pages/Purchases/ManagePurchaseInvoices';
import NewPurchaseInvoice from './pages/Purchases/NewPurchaseInvoice';
import PurchaseReturns from './pages/Purchases/PurchaseReturns';
import NewPurchaseReturn from './pages/Purchases/NewPurchaseReturn';

// Customers & Suppliers
import Customers from './pages/Customers/Customers';
import Suppliers from './pages/Suppliers/Suppliers';

// Products & Warehouses
import Products from './pages/Warehouses/Products';
import Warehouses from './pages/Warehouses/Warehouses';

// Reports
import Reports from './pages/Reports/Reports';

// Settings
import Settings from './pages/Settings/Settings';

// Treasury
import Treasury from './pages/Treasury/Treasury';

// Notifications
import Notifications from './pages/Notifications';

// مكون حماية المسارات - يتطلب تسجيل دخول
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const [securityCheck, setSecurityCheck] = useState(true);

  useEffect(() => {
    // فحص الأمان والتأكد من صحة الجلسة
    if (isAuthenticated && user) {
      // التحقق من انتهاء صلاحية الجلسة
      const sessionTimeout = localStorage.getItem('sessionTimeout');
      if (sessionTimeout && Date.now() > parseInt(sessionTimeout)) {
        window.location.href = '/login';
        return;
      }
      
      // التحقق من التحديثات الأمنية
      setSecurityCheck(true);
    }
  }, [isAuthenticated, user]);

  if (loading || !securityCheck) {
    return <Loading fullScreen message="جاري التحميل..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // فحص الصلاحيات للوصول للمسارات المحمية
  return <Layout>{children}</Layout>;
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

// مكون حماية متقدم للمسارات
const AdvancedProtectedRoute = ({ children, requiredPermission, department }) => {
  const { hasPermission, user } = useAuth();
  
  if (department && user?.department && user.department !== department) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">غير مسموح بالوصول</h2>
          <p className="text-gray-600">ليس لديك صلاحية للوصول إلى هذا القسم</p>
        </div>
      </div>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">صلاحيات غير كافية</h2>
          <p className="text-gray-600">ليس لديك الصلاحية المطلوبة لتنفيذ هذا الإجراء</p>
        </div>
      </div>
    );
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

              {/* المسار الرئيسي للوحة التحكم */}
              <Route 
                path="/dashboard" 
                element={
                  <AdvancedProtectedRoute requiredPermission="view_dashboard">
                    <Dashboard />
                  </AdvancedProtectedRoute>
                } 
              />

              {/* مسارات المبيعات */}
              <Route 
                path="/sales" 
                element={
                  <AdvancedProtectedRoute department="sales">
                    <SalesInvoices />
                  </AdvancedProtectedRoute>
                } 
              />
              <Route 
                path="/sales/manage" 
                element={
                  <AdvancedProtectedRoute requiredPermission="manage_sales" department="sales">
                    <ManageSalesInvoices />
                  </AdvancedProtectedRoute>
                } 
              />
              <Route 
                path="/sales/new" 
                element={
                  <AdvancedProtectedRoute requiredPermission="create_sales" department="sales">
                    <NewSalesInvoice />
                  </AdvancedProtectedRoute>
                } 
              />
              <Route 
                path="/sales/returns" 
                element={
                  <AdvancedProtectedRoute requiredPermission="view_sales_returns" department="sales">
                    <SalesReturns />
                  </AdvancedProtectedRoute>
                } 
              />
              <Route 
                path="/sales/returns/new" 
                element={
                  <AdvancedProtectedRoute requiredPermission="create_sales_returns" department="sales">
                    <NewSalesReturn />
                  </AdvancedProtectedRoute>
                } 
              />

              {/* مسارات المشتريات */}
              <Route 
                path="/purchases" 
                element={
                  <AdvancedProtectedRoute department="purchases">
                    <PurchaseInvoices />
                  </AdvancedProtectedRoute>
                } 
              />
              <Route 
                path="/purchases/manage" 
                element={
                  <AdvancedProtectedRoute requiredPermission="manage_purchases" department="purchases">
                    <ManagePurchaseInvoices />
                  </AdvancedProtectedRoute>
                } 
              />
              <Route 
                path="/purchases/new" 
                element={
                  <AdvancedProtectedRoute requiredPermission="create_purchases" department="purchases">
                    <NewPurchaseInvoice />
                  </AdvancedProtectedRoute>
                } 
              />
              <Route 
                path="/purchases/returns" 
                element={
                  <AdvancedProtectedRoute requiredPermission="view_purchase_returns" department="purchases">
                    <PurchaseReturns />
                  </AdvancedProtectedRoute>
                } 
              />
              <Route 
                path="/purchases/returns/new" 
                element={
                  <AdvancedProtectedRoute requiredPermission="create_purchase_returns" department="purchases">
                    <NewPurchaseReturn />
                  </AdvancedProtectedRoute>
                } 
              />

              {/* العملاء والموردين */}
              <Route 
                path="/customers" 
                element={
                  <AdvancedProtectedRoute requiredPermission="manage_customers">
                    <Customers />
                  </AdvancedProtectedRoute>
                } 
              />
              <Route 
                path="/suppliers" 
                element={
                  <AdvancedProtectedRoute requiredPermission="manage_suppliers">
                    <Suppliers />
                  </AdvancedProtectedRoute>
                } 
              />

              {/* المنتجات والمخازن */}
              <Route 
                path="/products" 
                element={
                  <AdvancedProtectedRoute requiredPermission="manage_products">
                    <Products />
                  </AdvancedProtectedRoute>
                } 
              />
              <Route 
                path="/warehouses" 
                element={
                  <AdvancedProtectedRoute requiredPermission="manage_warehouses">
                    <Warehouses />
                  </AdvancedProtectedRoute>
                } 
              />

              {/* التقارير */}
              <Route 
                path="/reports" 
                element={
                  <AdvancedProtectedRoute requiredPermission="view_reports">
                    <Reports />
                  </AdvancedProtectedRoute>
                } 
              />

              {/* الإعدادات */}
              <Route 
                path="/settings" 
                element={
                  <AdvancedProtectedRoute requiredPermission="manage_settings">
                    <Settings />
                  </AdvancedProtectedRoute>
                } 
              />

              {/* الخزينة */}
              <Route 
                path="/treasury" 
                element={
                  <AdvancedProtectedRoute requiredPermission="manage_treasury">
                    <Treasury />
                  </AdvancedProtectedRoute>
                } 
              />

              {/* الإشعارات */}
              <Route 
                path="/notifications" 
                element={<Notifications />} 
              />

              {/* إعدادات نظام الإرجاع */}
              <Route 
                path="/return-config" 
                element={
                  <AdvancedProtectedRoute requiredPermission="manage_return_settings">
                    <ReturnConfig />
                  </AdvancedProtectedRoute>
                } 
              />

              {/* المسار الافتراضي - إعادة توجيه إلى لوحة التحكم */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* مسار 404 */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center bg-gray-100">
                  <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <FaShieldAlt className="text-6xl text-blue-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">الصفحة غير موجودة</h2>
                    <p className="text-gray-600">عذراً، الصفحة التي تبحث عنها غير موجودة</p>
                  </div>
                </div>
              } />
            </Routes>
            </TabProvider>
          </DataProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
