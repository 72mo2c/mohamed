// ======================================
// SaaS Login Page - صفحة الدخول متعددة المؤسسات
// ======================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSaaSAuth } from '../../context/SaaSAuthContext';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import { FaBuilding, FaUser, FaLock, FaShieldAlt, FaEye, FaEyeSlash, FaWarehouse, FaChartLine, FaBox, FaSearch, FaSpinner } from 'react-icons/fa';

const CompanySelectStep = () => {
  const navigate = useNavigate();
  const { proceedToCompanyLoad, loading } = useSaaSAuth();
  const { showError } = useNotification();
  const [companyId, setCompanyId] = useState('');
  const [showHints, setShowHints] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!companyId.trim()) {
      showError('يرجى إدخال معرف الشركة');
      return;
    }

    const result = await proceedToCompanyLoad(companyId.trim());
    
    if (!result.success) {
      showError(result.message);
    }
  };

  const handleDemoLogin = (demoCompanyId) => {
    setCompanyId(demoCompanyId);
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top Right Circle */}
        <div className="absolute w-96 h-96 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full -top-48 -right-48 opacity-20 animate-pulse"></div>
        
        {/* Bottom Left Circle */}
        <div className="absolute w-80 h-80 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full -bottom-40 -left-40 opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Center Floating Elements */}
        <div className="absolute top-20 left-20 w-16 h-16 bg-orange-200 rounded-lg opacity-20 transform rotate-45 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-32 right-32 w-20 h-20 bg-orange-300 rounded-full opacity-15 animate-bounce" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Decorative Icons */}
        <div className="absolute top-1/4 right-1/4 opacity-5">
          <FaWarehouse className="text-orange-600" size={100} />
        </div>
        <div className="absolute bottom-1/4 left-1/4 opacity-5">
          <FaChartLine className="text-orange-600" size={80} />
        </div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 backdrop-blur-sm border border-orange-100">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              {/* Outer Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
              
              {/* Logo Container */}
              <div className="relative w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center text-white shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <FaBox className="text-5xl" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                Bero System
              </span>
            </h1>
            <p className="text-gray-600 font-medium text-lg mb-2">نظام إدارة المخازن المتكامل</p>
            <p className="text-gray-500 text-sm mb-6">الإصدار SaaS - متعدد المؤسسات</p>
            
            {/* Features Icons */}
            <div className="flex justify-center gap-6 mt-6">
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-orange-100 transition-colors">
                  <FaWarehouse className="text-xl" />
                </div>
                <span className="text-xs text-gray-500 mt-1">المخازن</span>
              </div>
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-orange-100 transition-colors">
                  <FaChartLine className="text-xl" />
                </div>
                <span className="text-xs text-gray-500 mt-1">التقارير</span>
              </div>
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-orange-100 transition-colors">
                  <FaShieldAlt className="text-xl" />
                </div>
                <span className="text-xs text-gray-500 mt-1">الأمان</span>
              </div>
            </div>
          </div>

          {/* Company ID Form */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">اختر مؤسستك</h2>
            <p className="text-gray-600">أدخل معرف شركتك للدخول إلى النظام</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                معرف الشركة
              </label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaBuilding />
                </div>
                <input
                  type="text"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value.toLowerCase())}
                  placeholder="مثال: alpha"
                  required
                  disabled={loading}
                  className="w-full pr-12 pl-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none bg-gray-50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-lg font-mono text-center"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                مثال: alpha, beta, gamma
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin h-5 w-5" />
                  جاري التحقق...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FaSearch />
                  البحث عن المؤسسة
                </span>
              )}
            </button>
          </form>

          {/* Demo Companies */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-3">جرب المؤسسات التجريبية:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => handleDemoLogin('alpha')}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Alpha Co.
                </button>
                <button
                  onClick={() => handleDemoLogin('beta')}
                  disabled={loading}
                  className="px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Beta Industries
                </button>
                <button
                  onClick={() => handleDemoLogin('gamma')}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Gamma Services
                </button>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowHints(!showHints)}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showHints ? 'إخفاء المساعدة' : 'تحتاج مساعدة؟'}
            </button>
            
            {showHints && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                <h4 className="font-semibold mb-2">كيفية الحصول على معرف شركتك:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>اتصل بمدير النظام لديك</li>
                  <li>راجع رسالة الترحيب التي استلمتها</li>
                  <li>تحقق من الوثائق المرفقة مع الاشتراك</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="flex items-center justify-center gap-2">
            تم التطوير بواسطة 
            <span className="font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Biruni Soft
            </span>
          </p>
          <p className="mt-2 text-gray-500">&copy; 2025 Biruni Soft - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
};

export default CompanySelectStep;