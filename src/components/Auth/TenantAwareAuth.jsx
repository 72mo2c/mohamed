// ======================================
// TenantAwareAuth - حماية متعددة المستويات
// ======================================

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';

const TenantAwareAuth = ({ 
  children, 
  requiredPermission = null, 
  requiredRole = null,
  requireAllPermissions = false, // true = تحتاج جميع الصلاحيات، false = تحتاج واحدة على الأقل
  fallbackPath = '/dashboard',
  showError = true,
  allowBypass = false // للمديرين فقط
}) => {
  const { isAuthenticated, user, hasPermission, hasRole } = useAuth();
  const { currentCompany, selectedCompanyId } = useCompany();
  const location = useLocation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthentication();
  }, [isAuthenticated, currentCompany, user]);

  const checkAuthentication = () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. التحقق من اختيار الشركة
      if (!selectedCompanyId || !currentCompany) {
        setError('يجب اختيار الشركة أولاً');
        return;
      }

      // 2. التحقق من تسجيل الدخول
      if (!isAuthenticated || !user) {
        setError('يجب تسجيل الدخول أولاً');
        return;
      }

      // 3. التحقق من صحة بيانات المستخدم
      if (!user.id || !user.companyId) {
        setError('بيانات المستخدم غير صحيحة');
        return;
      }

      // 4. التحقق من تطابق الشركة
      if (user.companyId !== currentCompany.id) {
        setError('لا يمكنك الوصول إلى هذه الشركة');
        return;
      }

      // 5. التحقق من حالة الشركة
      if (!currentCompany.isActive) {
        setError('الشركة غير نشطة');
        return;
      }

      // 6. التحقق من الصلاحيات
      if (requiredPermission && !checkPermissions()) {
        setError('ليس لديك صلاحية للوصول إلى هذه الصفحة');
        return;
      }

      // 7. التحقق من الأدوار
      if (requiredRole && !hasRole(requiredRole)) {
        setError('ليس لديك دور مناسب للوصول إلى هذه الصفحة');
        return;
      }

      // 8. التحقق من تجاوز صلاحيات المدير (اختياري)
      if (allowBypass && user.role === 'admin') {
        return; // المدير يمكنه تجاوز جميع القيود
      }

      setError(null);
    } catch (err) {
      setError('حدث خطأ في التحقق من المصادقة');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermissions = () => {
    if (!requiredPermission) return true;

    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

    if (permissions.length === 1) {
      return hasPermission(permissions[0]);
    }

    if (requireAllPermissions) {
      // يحتاج جميع الصلاحيات
      return permissions.every(permission => hasPermission(permission));
    } else {
      // يحتاج واحدة على الأقل
      return permissions.some(permission => hasPermission(permission));
    }
  };

  const renderLoading = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">جاري التحقق من المصادقة...</p>
      </div>
    </div>
  );

  const renderError = () => {
    if (!showError) return null;

    const errorMessages = {
      'يجب اختيار الشركة أولاً': {
        title: 'اختيار الشركة مطلوب',
        description: 'يجب اختيار الشركة قبل الوصول إلى النظام',
        action: 'العودة إلى اختيار الشركة',
        path: '/company-selection'
      },
      'يجب تسجيل الدخول أولاً': {
        title: 'تسجيل الدخول مطلوب',
        description: 'يجب تسجيل الدخول للوصول إلى هذه الصفحة',
        action: 'تسجيل الدخول',
        path: '/login'
      },
      'بيانات المستخدم غير صحيحة': {
        title: 'خطأ في بيانات المستخدم',
        description: 'يرجى تسجيل الدخول مرة أخرى',
        action: 'تسجيل الدخول مرة أخرى',
        path: '/login'
      },
      'لا يمكنك الوصول إلى هذه الشركة': {
        title: 'وصول غير مصرح',
        description: 'ليس لديك صلاحية للوصول إلى هذه الشركة',
        action: 'تغيير الشركة',
        path: '/company-selection'
      },
      'الشركة غير نشطة': {
        title: 'الشركة غير نشطة',
        description: 'هذه الشركة غير نشطة حالياً',
        action: 'العودة',
        path: '/company-selection'
      },
      'ليس لديك صلاحية للوصول إلى هذه الصفحة': {
        title: 'صلاحية غير كافية',
        description: 'ليس لديك الصلاحية المطلوبة للوصول إلى هذه الصفحة',
        action: 'العودة إلى لوحة التحكم',
        path: fallbackPath
      },
      'ليس لديك دور مناسب للوصول إلى هذه الصفحة': {
        title: 'دور غير مناسب',
        description: 'الدور الحالي لا يسمح بالوصول إلى هذه الصفحة',
        action: 'العودة إلى لوحة التحكم',
        path: fallbackPath
      },
      'حدث خطأ في التحقق من المصادقة': {
        title: 'خطأ في النظام',
        description: 'حدث خطأ أثناء التحقق من المصادقة',
        action: 'إعادة المحاولة',
        path: location.pathname
      }
    };

    const errorInfo = errorMessages[error] || {
      title: 'خطأ غير متوقع',
      description: error || 'حدث خطأ غير متوقع',
      action: 'إعادة المحاولة',
      path: location.pathname
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {errorInfo.title}
          </h3>
          
          <p className="text-sm text-gray-500 mb-6">
            {errorInfo.description}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => window.location.href = errorInfo.path}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {errorInfo.action}
            </button>
            
            {errorInfo.path !== fallbackPath && (
              <button
                onClick={() => window.location.href = fallbackPath}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                العودة إلى لوحة التحكم
              </button>
            )}
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-gray-400 cursor-pointer">تفاصيل الخطأ (وضع التطوير)</summary>
              <pre className="text-xs text-gray-500 mt-2 bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify({
                  error,
                  isAuthenticated,
                  user: user ? { id: user.id, role: user.role, companyId: user.companyId } : null,
                  currentCompany: currentCompany ? { id: currentCompany.id, isActive: currentCompany.isActive } : null,
                  selectedCompanyId,
                  requiredPermission,
                  requiredRole
                }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  };

  // حالة التحميل
  if (isLoading) {
    return renderLoading();
  }

  // حالة الخطأ
  if (error) {
    return renderError();
  }

  // تم التحقق بنجاح - عرض المحتوى
  return children;
};

// مكونات مساعدة للتصريح السريع

// حماية عامة - تحتاج تسجيل دخول فقط
export const ProtectedRoute = ({ children, fallbackPath = '/dashboard' }) => (
  <TenantAwareAuth fallbackPath={fallbackPath}>
    {children}
  </TenantAwareAuth>
);

// حماية بصلاحية محددة
export const PermissionRoute = ({ 
  children, 
  permission, 
  requireAll = false, 
  fallbackPath = '/dashboard' 
}) => (
  <TenantAwareAuth 
    requiredPermission={permission}
    requireAllPermissions={requireAll}
    fallbackPath={fallbackPath}
  >
    {children}
  </TenantAwareAuth>
);

// حماية بدور محدد
export const RoleRoute = ({ children, role, fallbackPath = '/dashboard' }) => (
  <TenantAwareAuth 
    requiredRole={role}
    fallbackPath={fallbackPath}
  >
    {children}
  </TenantAwareAuth>
);

// حماية للإدارة فقط
export const AdminRoute = ({ children, fallbackPath = '/dashboard' }) => (
  <TenantAwareAuth 
    requiredRole="admin"
    allowBypass={true}
    fallbackPath={fallbackPath}
  >
    {children}
  </TenantAwareAuth>
);

// حماية للمديرين والإدارة
export const ManagerRoute = ({ children, fallbackPath = '/dashboard' }) => (
  <TenantAwareAuth 
    requiredRole={['admin', 'manager']}
    fallbackPath={fallbackPath}
  >
    {children}
  </TenantAwareAuth>
);

// حماية للصفحات العامة (لا تحتاج تسجيل دخول)
export const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// حماية للصفحات التي تحتاج تسجيل دخول للشركة فقط
export const CompanyAuthRoute = ({ children, fallbackPath = '/company-selection' }) => {
  const { selectedCompanyId } = useCompany();
  
  if (!selectedCompanyId) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  return children;
};

export default TenantAwareAuth;