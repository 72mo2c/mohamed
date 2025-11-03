// ======================================
// LoginPage - تسجيل الدخول على مرحلتين
// ======================================

import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import TenantAwareAuth from '../Auth/TenantAwareAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, error: authError, isLoading } = useAuth();
  const { currentCompany } = useCompany();

  // حالة النموذج
  const [step, setStep] = useState(1); // 1: اسم المستخدم، 2: كلمة المرور
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // إعادة تعيين النموذج عند تغيير الشركة
  useEffect(() => {
    resetForm();
  }, [currentCompany]);

  // إعادة تعيين النموذج
  const resetForm = () => {
    setStep(1);
    setUsername('');
    setPassword('');
    setFormError(null);
    setIsSubmitting(false);
  };

  // التحقق من تسجيل الدخول
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // التحقق من اختيار الشركة
  if (!currentCompany) {
    return <Navigate to="/company-selection" replace />;
  }

  // التحقق من الخطوة الأولى
  const handleStep1Submit = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setFormError('يرجى إدخال اسم المستخدم');
      return;
    }

    if (username.length < 3) {
      setFormError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
      return;
    }

    setFormError(null);
    setStep(2);
  };

  // تسجيل الدخول
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setFormError('يرجى إدخال كلمة المرور');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
      // سيتم توجيه المستخدم تلقائياً بواسطة useEffect في AuthContext
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // العودة للخطوة الأولى
  const backToStep1 = () => {
    setStep(1);
    setPassword('');
    setFormError(null);
  };

  // تنسيق عرض اسم الشركة
  const formatCompanyName = (company) => {
    if (!company) return '';
    return company.name || company.identifier || 'الشركة';
  };

  return (
    <TenantAwareAuth showError={false}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* رأس الصفحة */}
          <div className="text-center">
            {/* شعار الشركة */}
            <div className="mx-auto h-20 w-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-6">
              {currentCompany?.logo ? (
                <img 
                  src={currentCompany.logo} 
                  alt={formatCompanyName(currentCompany)}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div 
                  className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: currentCompany?.colors?.primary || '#3B82F6' }}
                >
                  {formatCompanyName(currentCompany).charAt(0)}
                </div>
              )}
            </div>

            {/* اسم الشركة */}
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {formatCompanyName(currentCompany)}
            </h2>
            <p className="text-sm text-gray-600">
              {currentCompany?.description || 'نظام إدارة المخازن'}
            </p>
          </div>

          {/* بطاقة تسجيل الدخول */}
          <div className="bg-white rounded-xl shadow-xl p-8">
            {/* عنوان الخطوة */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {step === 1 ? 'تسجيل الدخول' : 'كلمة المرور'}
              </h3>
              <p className="text-sm text-gray-600">
                {step === 1 
                  ? 'أدخل اسم المستخدم الخاص بك' 
                  : `مرحباً ${username}، أدخل كلمة المرور`
                }
              </p>
            </div>

            {/* مؤشر التقدم */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`w-8 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              </div>
            </div>

            {/* نموذج تسجيل الدخول */}
            <form onSubmit={step === 1 ? handleStep1Submit : handleLoginSubmit} className="space-y-6">
              {/* الخطوة الأولى: اسم المستخدم */}
              {step === 1 && (
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المستخدم
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setFormError(null);
                    }}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="أدخل اسم المستخدم"
                    autoComplete="username"
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    أمثلة: admin, manager, accountant
                  </p>
                </div>
              )}

              {/* الخطوة الثانية: كلمة المرور */}
              {step === 2 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      كلمة المرور
                    </label>
                    <button
                      type="button"
                      onClick={backToStep1}
                      className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none"
                    >
                      تعديل اسم المستخدم
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFormError(null);
                    }}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="أدخل كلمة المرور"
                    autoComplete="current-password"
                    autoFocus
                  />
                </div>
              )}

              {/* عرض الأخطاء */}
              {(formError || authError) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{formError || authError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* أزرار التحكم */}
              <div className="flex space-x-3">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={backToStep1}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                  >
                    رجوع
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      جاري التحقق...
                    </>
                  ) : step === 1 ? (
                    'التالي'
                  ) : (
                    'تسجيل الدخول'
                  )}
                </button>
              </div>
            </form>

            {/* معلومات إضافية */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center text-xs text-gray-500">
                <p className="mb-2">بيانات تجريبية للاختبار:</p>
                <div className="bg-gray-50 rounded p-2 space-y-1">
                  <p><strong>مدير:</strong> admin / 123456</p>
                  <p><strong>مدير مخازن:</strong> manager / 123456</p>
                  <p><strong>محاسب:</strong> accountant / 123456</p>
                  <p><strong>مراقب:</strong> viewer / 123456</p>
                </div>
              </div>
            </div>

            {/* روابط إضافية */}
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/company-selection')}
                className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none"
              >
                ← تغيير الشركة
              </button>
            </div>
          </div>

          {/* معلومات النظام */}
          <div className="text-center text-xs text-gray-500">
            <p>نظام إدارة المخازن المتقدم</p>
            <p>مدعوم بتقنية SaaS متعدد الشركات</p>
          </div>
        </div>
      </div>
    </TenantAwareAuth>
  );
};

export default LoginPage;