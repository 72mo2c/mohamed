// ======================================
// App.jsx - الملف الرئيسي للتطبيق (محدث لـ SaaS متعدد الشركات)
// ======================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { CompanyProvider } from './contexts/CompanyContext';
import { AuthProvider } from './contexts/AuthContext';
import { TabProvider } from './contexts/TabContext';

// مكونات الحماية المحدثة
import { 
  CompanyAuthRoute, 
  PublicRoute, 
  ProtectedRoute 
} from './components/Auth/TenantAwareAuth';

// Pages
import CompanySelectionPage from './pages/CompanySelectionPage';
import LoginPage from './pages/LoginPage';

// Layout مؤقت للصفحات المحمية (سيتم استبداله بالـ Layout الحالي)
const TemporaryLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header مؤقت */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                نظام إدارة المخازن
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                مرحباً بك
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <CompanyProvider>
        <AuthProvider>
          <TabProvider>
            <Routes>
              {/* مسار اختيار الشركة - العام */}
              <Route 
                path="/company-selection" 
                element={
                  <PublicRoute>
                    <CompanySelectionPage />
                  </PublicRoute>
                } 
              />

              {/* مسار تسجيل الدخول - يتطلب اختيار شركة */}
              <Route 
                path="/login" 
                element={
                  <CompanyAuthRoute>
                    <LoginPage />
                  </CompanyAuthRoute>
                } 
              />

              {/* جميع المسارات المحمية الأخرى */}
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute fallbackPath="/company-selection">
                    <TemporaryLayout>
                      <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                          🎉 مرحباً بك في نظام إدارة المخازن
                        </h2>
                        <p className="text-gray-600 mb-6">
                          تم تسجيل الدخول بنجاح! النظام يعمل الآن في وضع SaaS متعدد الشركات.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-blue-900 mb-3">
                            المرحلة الثانية مكتملة ✅
                          </h3>
                          <ul className="text-sm text-blue-800 space-y-2 text-right">
                            <li>✅ نظام مصادقة متعدد الشركات</li>
                            <li>✅ جلسات منفصلة لكل شركة</li>
                            <li>✅ حماية متقدمة للمسارات</li>
                            <li>✅ تسجيل دخول على مرحلتين</li>
                            <li>✅ إدارة المستخدمين والأدوار</li>
                            <li>✅ تتبع النشاط والجلسات</li>
                          </ul>
                        </div>
                        <div className="mt-6">
                          <p className="text-sm text-gray-500">
                            يمكنك الآن اختبار النظام والانتقال للمرحلة التالية
                          </p>
                        </div>
                      </div>
                    </TemporaryLayout>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </TabProvider>
        </AuthProvider>
      </CompanyProvider>
    </Router>
  );
}

export default App;
