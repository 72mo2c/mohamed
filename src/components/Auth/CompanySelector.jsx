// ======================================
// CompanySelector - مكون إدخال معرف الشركة
// ======================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaSearch, FaCheck, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import Button from '../Common/Button';
import Input from '../Common/Input';
import tenantManager from '../../saas/TenantManager';

const CompanySelector = ({ onCompanySelect, onBack }) => {
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [error, setError] = useState('');
  const [availableCompanies] = useState([
    { id: 'demo', name: 'شركة المثال', description: 'شركة تجريبية للمعاينة' },
    { id: 'alpha', name: 'شركة ألفا', description: 'شركة تجارة عامة' },
    { id: 'beta', name: 'شركة بيتا', description: 'شركة صناعات' }
  ]);

  // التحقق من صحة معرف الشركة
  const validateCompanyId = async (id) => {
    if (!id || id.length < 2) {
      setError('يرجى إدخال معرف صحيح');
      setCompanyData(null);
      return false;
    }

    setValidating(true);
    setError('');

    try {
      // البحث عن الشركة
      const company = tenantManager.findTenant(id);
      
      if (!company) {
        setError('معرف الشركة غير صحيح. تحقق من البيانات المدخلة');
        setCompanyData(null);
        return false;
      }

      // التحقق من صحة بيانات الشركة
      const isValid = tenantManager.validateTenant(company);
      
      if (!isValid) {
        if (company.status === 'expired') {
          setError('انتهت صلاحية اشتراك هذه الشركة');
        } else if (company.status === 'inactive') {
          setError('هذه الشركة غير نشطة حالياً');
        } else {
          setError('هذه الشركة غير متاحة');
        }
        setCompanyData(null);
        return false;
      }

      setCompanyData(company);
      setError('');
      return true;

    } catch (error) {
      console.error('خطأ في التحقق من الشركة:', error);
      setError('حدث خطأ في التحقق من الشركة');
      setCompanyData(null);
      return false;
    } finally {
      setValidating(false);
    }
  };

  // التحكم في الإدخال
  const handleCompanyIdChange = (e) => {
    const value = e.target.value.toLowerCase().trim();
    setCompanyId(value);
    
    // مسح الأخطاء السابقة
    if (error) setError('');
    if (companyData) setCompanyData(null);
  };

  // التحقق عند الانتهاء من الكتابة
  const handleCompanyIdBlur = () => {
    if (companyId) {
      validateCompanyId(companyId);
    }
  };

  // تحديد الشركة من القائمة السريعة
  const handleQuickSelect = (selectedCompany) => {
    setCompanyId(selectedCompany.id);
    validateCompanyId(selectedCompany.id);
  };

  // المتابعة للدخول بكلمة المرور
  const handleContinue = () => {
    if (companyData) {
      if (onCompanySelect) {
        onCompanySelect(companyData);
      } else {
        // الانتقال لصفحة تسجيل الدخول
        navigate('/login', { state: { selectedCompany: companyData } });
      }
    }
  };

  // التأثيرات الجانبية
  useEffect(() => {
    // التحقق التلقائي بعد توقف الكتابة
    if (companyId && companyId.length >= 2) {
      const timeoutId = setTimeout(() => {
        validateCompanyId(companyId);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [companyId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full -top-48 -right-48 opacity-20 animate-pulse"></div>
        <div className="absolute w-80 h-80 bg-gradient-to-br from-blue-300 to-blue-400 rounded-full -bottom-40 -left-40 opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-20 left-20 w-16 h-16 bg-blue-200 rounded-lg opacity-20 transform rotate-45 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-32 right-32 w-20 h-20 bg-blue-300 rounded-full opacity-15 animate-bounce" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* كارت رئيسي */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm border border-blue-100">
          {/* رأس الصفحة */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <FaBuilding className="text-4xl" />
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                Bero SaaS
              </span>
            </h1>
            <p className="text-gray-600 font-medium text-lg">اختر مؤسسة للوصول للنظام</p>
          </div>

          {/* إدخال معرف الشركة */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                معرف المؤسسة
              </label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {validating ? <FaSpinner className="animate-spin" /> : <FaSearch />}
                </div>
                <input
                  type="text"
                  value={companyId}
                  onChange={handleCompanyIdChange}
                  onBlur={handleCompanyIdBlur}
                  placeholder="أدخل معرف المؤسسة (مثال: demo)"
                  className={`w-full pr-12 pl-4 py-3.5 border-2 rounded-xl transition-all outline-none bg-gray-50 hover:bg-white ${
                    error 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : companyData 
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                  }`}
                  disabled={loading}
                />
                {companyData && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500">
                    <FaCheck />
                  </div>
                )}
              </div>
              
              {/* رسائل الخطأ والنجاح */}
              {error && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <FaExclamationTriangle />
                  <span>{error}</span>
                </div>
              )}
              
              {companyData && (
                <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                  <FaCheck />
                  <span>تم العثور على المؤسسة</span>
                </div>
              )}
            </div>

            {/* عرض بيانات الشركة المحددة */}
            {companyData && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  {companyData.logo && (
                    <img 
                      src={companyData.logo} 
                      alt={companyData.name}
                      className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-md"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{companyData.displayName}</h3>
                    <p className="text-sm text-gray-600">{companyData.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        companyData.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {companyData.status === 'active' ? 'نشطة' : 'غير نشطة'}
                      </span>
                      {companyData.expiryDate && (
                        <span className="text-xs text-gray-500">
                          تنتهي: {new Date(companyData.expiryDate).toLocaleDateString('ar-SA')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* الشركات المقترحة */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                أو اختر من المؤسسات المتاحة:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {availableCompanies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleQuickSelect(company)}
                    className={`text-right p-3 rounded-xl border-2 transition-all hover:shadow-md ${
                      companyId === company.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    disabled={loading}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaBuilding className="text-blue-500" />
                        <span className="font-medium text-gray-800">{company.name}</span>
                      </div>
                      <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                        {company.id}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{company.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="flex gap-3 mt-6">
              {onBack && (
                <Button
                  type="button"
                  onClick={onBack}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  رجوع
                </Button>
              )}
              
              <Button
                type="button"
                onClick={handleContinue}
                disabled={!companyData || loading || validating}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin h-4 w-4" />
                    جاري التحميل...
                  </span>
                ) : (
                  'متابعة للدخول'
                )}
              </Button>
            </div>
          </div>

          {/* معلومات إضافية */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-center text-sm text-gray-500">
              <p className="flex items-center justify-center gap-2">
                <FaBuilding />
                أدخل معرف المؤسسة المرسل إليك من الإدارة
              </p>
              <p className="mt-2">
                هل تحتاج مساعدة؟ 
                <a href="mailto:support@bero.com" className="text-blue-600 hover:text-blue-800 font-medium mr-1">
                  تواصل معنا
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* تذييل */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2025 Bero SaaS - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
};

export default CompanySelector;