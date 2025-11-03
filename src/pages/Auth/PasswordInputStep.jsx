// ======================================
// Password Input Step - شاشة إدخال كلمة المرور
// ======================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSaaSAuth } from '../../context/SaaSAuthContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import { FaLock, FaEye, FaEyeSlash, FaBuilding, FaShieldAlt, FaSignInAlt, FaSpinner } from 'react-icons/fa';

const PasswordInputStep = () => {
  const navigate = useNavigate();
  const { selectedCompany, resetAuth } = useSaaSAuth();
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // التحقق من وجود المؤسسة
  useEffect(() => {
    if (!selectedCompany) {
      resetAuth();
      navigate('/saas-login');
    }
  }, [selectedCompany, resetAuth, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      showError('يرجى إدخال كلمة المرور');
      return;
    }

    setLoading(true);

    try {
      // استخدام اسم المستخدم الافتراضي للشركة
      const companyUsername = `${selectedCompany.identifier}_admin`;
      
      console.log(`🔐 محاولة تسجيل الدخول للمؤسسة ${selectedCompany.name}...`);
      
      const result = await login(companyUsername, password);
      
      console.log('📊 نتيجة تسجيل الدخول:', result);
      
      if (result.success) {
        showSuccess(`${result.message} - مرحباً بك في ${selectedCompany.name}`);
        console.log('✅ تسجيل دخول ناجح!');
        
        // حفظ معلومات المؤسسة في localStorage
        localStorage.setItem('current_company', JSON.stringify(selectedCompany));
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        showError(result.message);
        console.log('❌ فشل تسجيل الدخول:', result.message);
      }
    } catch (error) {
      console.error('💥 خطأ في تسجيل الدخول:', error);
      showError('حدث خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/saas-login');
  };

  if (!selectedCompany) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-orange-500 mx-auto mb-4" size={48} />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${selectedCompany.accentColor}20, ${selectedCompany.secondaryColor}15, ${selectedCompany.primaryColor}10)`
      }}
    >
      {/* Background Elements with Company Colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 rounded-full opacity-10 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${selectedCompany.primaryColor}, ${selectedCompany.secondaryColor})`,
            top: '-48px',
            right: '-48px'
          }}
        ></div>
        
        <div 
          className="absolute w-80 h-80 rounded-full opacity-8 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${selectedCompany.secondaryColor}, ${selectedCompany.primaryColor})`,
            bottom: '-40px',
            left: '-40px',
            animationDelay: '1s'
          }}
        ></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Main Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm border-2" 
             style={{ borderColor: `${selectedCompany.primaryColor}30` }}>
          
          {/* Company Header */}
          <div className="text-center mb-8">
            {/* Company Logo */}
            <div 
              className="relative inline-block mb-4 w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${selectedCompany.primaryColor}, ${selectedCompany.secondaryColor})`
              }}
            >
              <FaBuilding className="text-2xl" />
            </div>
            
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ color: selectedCompany.secondaryColor }}
            >
              {selectedCompany.displayName}
            </h1>
            <p className="text-gray-600 text-sm mb-1">{selectedCompany.name}</p>
            <p className="text-gray-500 text-xs mb-4">{selectedCompany.description}</p>
            
            {/* Theme Colors */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div 
                className="w-3 h-3 rounded-full border border-gray-200"
                style={{ backgroundColor: selectedCompany.primaryColor }}
                title="اللون الأساسي"
              ></div>
              <div 
                className="w-3 h-3 rounded-full border border-gray-200"
                style={{ backgroundColor: selectedCompany.secondaryColor }}
                title="اللون الثانوي"
              ></div>
              <div 
                className="w-3 h-3 rounded-full border border-gray-200"
                style={{ backgroundColor: selectedCompany.accentColor }}
                title="لون التمييز"
              ></div>
            </div>
            
            {/* Plan Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-xs font-medium"
                 style={{ backgroundColor: selectedCompany.primaryColor }}>
              <FaShieldAlt size={12} />
              {selectedCompany.plan === 'premium' ? 'خطة متميزة' : 
               selectedCompany.plan === 'standard' ? 'خطة قياسية' : 'نسخة تجريبية'}
            </div>
          </div>

          {/* Login Form */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
              تسجيل الدخول
            </h2>
            <p className="text-gray-600 text-sm text-center mb-6">
              مرحباً بك في نظام إدارة المخازن الخاص بشركتكم
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Display */}
            <div className="text-center">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                اسم المستخدم
              </label>
              <div 
                className="w-full px-4 py-3 border-2 rounded-xl bg-gray-50 text-center font-mono text-lg"
                style={{ borderColor: `${selectedCompany.primaryColor}30`, color: selectedCompany.secondaryColor }}
              >
                {selectedCompany.identifier}_admin
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <div 
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: `${selectedCompany.primaryColor}80` }}
                >
                  <FaLock />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  required
                  disabled={loading}
                  className="w-full pr-12 pl-12 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 transition-all outline-none bg-gray-50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  style={{
                    '--tw-ring-color': selectedCompany.primaryColor,
                    '--tw-border-color': selectedCompany.primaryColor
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${selectedCompany.primaryColor}, ${selectedCompany.secondaryColor})`
              }}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin h-5 w-5" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <FaSignInAlt />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          {/* Demo Password Hint */}
          <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: `${selectedCompany.accentColor}30` }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: selectedCompany.secondaryColor }}>
              كلمة المرور التجريبية:
            </h4>
            <div className="text-center">
              <code 
                className="px-3 py-1 rounded text-sm font-mono bg-white border"
                style={{ borderColor: `${selectedCompany.primaryColor}50`, color: selectedCompany.secondaryColor }}
              >
                admin123
              </code>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">
              يمكنك تجربة الدخول بكلمة المرور هذه
            </p>
          </div>

          {/* Back Button */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBack}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← العودة لاختيار المؤسسة
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>أنت متصل بنظام {selectedCompany.name}</p>
          <p className="mt-1">© 2025 Biruni Soft - نظام إدارة المخازن</p>
        </div>
      </div>
    </div>
  );
};

export default PasswordInputStep;