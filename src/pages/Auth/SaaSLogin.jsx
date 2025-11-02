// ======================================
// SaaS Login Page - صفحة تسجيل الدخول SaaS
// ======================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSaaS } from '../../context/SaaSContext';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import { FaUser, FaLock, FaShieldAlt, FaEye, FaEyeSlash, FaBuilding, FaSpinner, FaBox } from 'react-icons/fa';

const SaaSLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { loginTenant, currentTenant, loading: saasLoading } = useSaaS();
  const { showSuccess, showError } = useNotification();
  
  // حالة تسجيل الدخول
  const [step, setStep] = useState('company-selection'); // 'company-selection', 'password-entry', 'user-login'
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  // التحقق من وجود مؤسسة محددة مسبقاً
  useEffect(() => {
    if (location.state?.selectedCompany) {
      setSelectedCompany(location.state.selectedCompany);
      setStep('password-entry');
    }
    
    // التحقق من وجود مؤسسة مسجلة دخول
    if (currentTenant && step === 'company-selection') {
      setStep('user-login');
    }
  }, [location.state, currentTenant, step]);

  // التحكم في بيانات النموذج
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // تحديد المؤسسة
  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setStep('password-entry');
  };

  // تسجيل دخول المؤسسة
  const handleTenantLogin = async (password) => {
    if (!selectedCompany) return;

    setUserLoading(true);
    try {
      const result = await loginTenant(selectedCompany.id, password);
      
      if (result.success) {
        setStep('user-login');
        showSuccess(`مرحباً بك في ${selectedCompany.displayName}`);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('خطأ في تسجيل دخول المؤسسة:', error);
      showError('حدث خطأ في تسجيل الدخول');
    } finally {
      setUserLoading(false);
    }
  };

  // تسجيل دخول المستخدم
  const handleUserLogin = async (e) => {
    e.preventDefault();
    setUserLoading(true);

    try {
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        showSuccess(result.message);
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('خطأ في تسجيل دخول المستخدم:', error);
      showError('حدث خطأ في تسجيل الدخول');
    } finally {
      setUserLoading(false);
    }
  };

  // الرجوع للخطوة السابقة
  const handleBack = () => {
    if (step === 'password-entry') {
      setStep('company-selection');
      setSelectedCompany(null);
    } else if (step === 'user-login') {
      setStep('password-entry');
    }
  };

  // عرض شاشة اختيار المؤسسة
  const renderCompanySelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">اختر المؤسسة</h2>
        <p className="text-gray-600">أدخل معرف المؤسسة للوصول للنظام</p>
      </div>
      
      {/* محاكاة مكون CompanySelector */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            معرف المؤسسة
          </label>
          <input
            type="text"
            placeholder="أدخل معرف المؤسسة"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none"
            onChange={(e) => {
              // محاكاة البحث عن المؤسسة
              const companies = {
                'demo': { id: 'demo', name: 'شركة المثال', displayName: 'شركة المثال التجارية' },
                'alpha': { id: 'alpha', name: 'شركة ألفا', displayName: 'شركة ألفا للتجارة' },
                'beta': { id: 'beta', name: 'شركة بيتا', displayName: 'شركة بيتا للصناعات' }
              };
              const company = companies[e.target.value.toLowerCase()];
              if (company) {
                handleCompanySelect(company);
              }
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-2">
          {[
            { id: 'demo', name: 'شركة المثال', desc: 'شركة تجريبية للمعاينة' },
            { id: 'alpha', name: 'شركة ألفا', desc: 'شركة تجارة عامة' },
            { id: 'beta', name: 'شركة بيتا', desc: 'شركة صناعات' }
          ].map((company) => (
            <button
              key={company.id}
              onClick={() => handleCompanySelect(company)}
              className="text-right p-3 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all"
            >
              <div className="flex items-center justify-between">
                <FaBuilding className="text-orange-500" />
                <div>
                  <h3 className="font-medium">{company.name}</h3>
                  <p className="text-sm text-gray-600">{company.desc}</p>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{company.id}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // عرض شاشة إدخال كلمة مرور المؤسسة
  const renderPasswordEntry = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaBuilding className="text-2xl text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {selectedCompany?.displayName}
        </h2>
        <p className="text-gray-600">أدخل كلمة مرور المؤسسة للمتابعة</p>
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        handleTenantLogin(formData.password);
      }} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            كلمة مرور المؤسسة
          </label>
          <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <FaLock />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="أدخل كلمة مرور المؤسسة"
              required
              className="w-full pr-12 pl-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none bg-gray-50 hover:bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            onClick={handleBack}
            variant="outline"
            className="flex-1"
            disabled={userLoading}
          >
            رجوع
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            disabled={!formData.password || userLoading}
          >
            {userLoading ? (
              <span className="flex items-center justify-center gap-2">
                <FaSpinner className="animate-spin h-4 w-4" />
                جاري التحقق...
              </span>
            ) : (
              'متابعة'
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  // عرض شاشة تسجيل دخول المستخدم
  const renderUserLogin = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaShieldAlt className="text-2xl text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          تسجيل الدخول
        </h2>
        <p className="text-gray-600">أدخل بيانات المستخدم للوصول للنظام</p>
        {currentTenant && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-800">
              تسجيل الدخول كـ <span className="font-semibold">{currentTenant.displayName}</span>
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleUserLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            اسم المستخدم
          </label>
          <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <FaUser />
            </div>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="أدخل اسم المستخدم"
              required
              className="w-full pr-12 pl-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none bg-gray-50 hover:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            كلمة المرور
          </label>
          <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <FaLock />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="أدخل كلمة المرور"
              required
              className="w-full pr-12 pl-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none bg-gray-50 hover:bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            onClick={handleBack}
            variant="outline"
            className="flex-1"
            disabled={userLoading}
          >
            رجوع
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            disabled={!formData.username || !formData.password || userLoading}
          >
            {userLoading ? (
              <span className="flex items-center justify-center gap-2">
                <FaSpinner className="animate-spin h-4 w-4" />
                جاري تسجيل الدخول...
              </span>
            ) : (
              'تسجيل الدخول'
            )}
          </Button>
        </div>
      </form>

      {/* نصائح للمساعدة */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="text-center text-sm text-gray-500">
          <p className="mb-2">هل تحتاج مساعدة؟</p>
          <div className="space-y-1">
            <p>• المستخدم الافتراضي: <code className="bg-gray-100 px-2 py-1 rounded">admin</code></p>
            <p>• كلمة المرور الافتراضية: <code className="bg-gray-100 px-2 py-1 rounded">admin123</code></p>
          </div>
        </div>
      </div>
    </div>
  );

  // عرض المحتوى حسب الخطوة
  const renderStepContent = () => {
    switch (step) {
      case 'company-selection':
        return renderCompanySelection();
      case 'password-entry':
        return renderPasswordEntry();
      case 'user-login':
        return renderUserLogin();
      default:
        return renderCompanySelection();
    }
  };

  const isLoading = userLoading || saasLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full -top-48 -right-48 opacity-20 animate-pulse"></div>
        <div className="absolute w-80 h-80 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full -bottom-40 -left-40 opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* كارت رئيسي */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm border border-orange-100">
          {/* شعار النظام */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
                <FaBox className="text-5xl" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                Bero SaaS
              </span>
            </h1>
            <p className="text-gray-600 font-medium text-lg">نظام إدارة المخازن المتكامل</p>
          </div>

          {/* مؤشر الخطوة */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${step === 'company-selection' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-0.5 ${step !== 'company-selection' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${step === 'password-entry' ? 'bg-orange-500' : step === 'user-login' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-0.5 ${step === 'user-login' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${step === 'user-login' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
            </div>
          </div>

          {/* محتوى الخطوة */}
          {renderStepContent()}
        </div>

        {/* تذييل */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2025 Biruni Soft - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
};

export default SaaSLogin;