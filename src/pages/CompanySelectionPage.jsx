import React, { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaLock, FaUser, FaEye, FaEyeSlash, FaSignInAlt } from 'react-icons/fa';

// صفحة اختيار الشركة مع تسجيل الدخول على مرحلتين
const CompanySelectionPage = () => {
    // استخدام context الشركات
    const { 
        availableCompanies, 
        selectCompany, 
        isLoading, 
        error, 
        getCompanyByIdentifier,
        loadCompanyConfig 
    } = useCompany();
    
    const navigate = useNavigate();
    
    // حالة اختيار المرحلة
    const [step, setStep] = useState(1); // 1 = اختيار الشركة، 2 = تسجيل الدخول
    
    // بيانات المرحلة الأولى
    const [companyIdentifier, setCompanyIdentifier] = useState('');
    const [foundCompany, setFoundCompany] = useState(null);
    const [identifierError, setIdentifierError] = useState('');
    
    // بيانات المرحلة الثانية
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    
    // إعادة تعيين الصفحة عند كل تحميل
    useEffect(() => {
        setStep(1);
        setCompanyIdentifier('');
        setFoundCompany(null);
        setPassword('');
        setIdentifierError('');
        setLoginError('');
    }, []);
    
    // البحث عن الشركة بالمعرف
    const handleCompanySearch = (e) => {
        e.preventDefault();
        setIdentifierError('');
        
        if (!companyIdentifier.trim()) {
            setIdentifierError('يرجى إدخال معرف الشركة');
            return;
        }
        
        const company = getCompanyByIdentifier(companyIdentifier.trim());
        if (!company) {
            setIdentifierError('معرف الشركة غير صحيح. يرجى المحاولة مرة أخرى');
            return;
        }
        
        if (!company.isActive) {
            setIdentifierError('هذه الشركة غير مفعلة حالياً');
            return;
        }
        
        // تحميل إعدادات الشركة للتأكد من صلاحيتها
        loadCompanyConfig(company.id).then((companyData) => {
            if (companyData) {
                setFoundCompany(companyData);
                setStep(2);
            } else {
                setIdentifierError('فشل في تحميل بيانات الشركة');
            }
        });
    };
    
    // تسجيل الدخول
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        
        if (!password.trim()) {
            setLoginError('يرجى إدخال كلمة المرور');
            return;
        }
        
        setIsLoggingIn(true);
        
        try {
            // التحقق من كلمة المرور
            if (foundCompany.password !== password) {
                setLoginError('كلمة المرور غير صحيحة');
                return;
            }
            
            // اختيار الشركة وتسجيل الدخول
            await selectCompany(foundCompany.id);
            
            // التوجه إلى الصفحة الرئيسية
            navigate('/dashboard');
            
        } catch (err) {
            console.error('خطأ في تسجيل الدخول:', err);
            setLoginError('حدث خطأ أثناء تسجيل الدخول');
        } finally {
            setIsLoggingIn(false);
        }
    };
    
    // العودة إلى الخطوة الأولى
    const handleBackToStep1 = () => {
        setStep(1);
        setCompanyIdentifier('');
        setFoundCompany(null);
        setPassword('');
        setIdentifierError('');
        setLoginError('');
    };
    
    // إذا كان التطبيق في وضع التحميل
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600 text-center">جاري تحميل الشركات المتاحة...</p>
                    </div>
                </div>
            </div>
        );
    }
    
    // عرض الأخطاء
    if (error && availableCompanies.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                    <div className="flex flex-col items-center text-center">
                        <div className="text-red-500 text-4xl mb-4">⚠️</div>
                        <h2 className="text-xl font-bold text-red-700 mb-2">خطأ في التحميل</h2>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            إعادة المحاولة
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
                
                {/* عرض المرحلة الحالية */}
                <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                            1
                        </div>
                        <div className={`h-1 w-16 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                            2
                        </div>
                    </div>
                </div>
                
                {/* عنوان الصفحة */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {step === 1 ? 'اختيار الشركة' : 'تسجيل الدخول'}
                    </h1>
                    <p className="text-gray-600">
                        {step === 1 
                            ? 'يرجى إدخال معرف شركتك للمتابعة' 
                            : `تسجيل الدخول إلى ${foundCompany?.name || 'الشركة'}`
                        }
                    </p>
                </div>
                
                {/* المرحلة الأولى: اختيار الشركة */}
                {step === 1 && (
                    <form onSubmit={handleCompanySearch} className="space-y-4">
                        <div>
                            <label htmlFor="companyIdentifier" className="block text-sm font-medium text-gray-700 mb-2">
                                معرف الشركة
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaBuilding className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    id="companyIdentifier"
                                    value={companyIdentifier}
                                    onChange={(e) => setCompanyIdentifier(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="أدخل معرف شركتك"
                                    dir="ltr"
                                />
                            </div>
                            {identifierError && (
                                <p className="mt-1 text-sm text-red-600">{identifierError}</p>
                            )}
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            <FaSignInAlt className="ml-2" />
                            المتابعة
                        </button>
                    </form>
                )}
                
                {/* المرحلة الثانية: تسجيل الدخول */}
                {step === 2 && foundCompany && (
                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* معلومات الشركة */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FaBuilding className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-800">{foundCompany.name}</h3>
                                    <p className="text-sm text-gray-600">المعرف: {foundCompany.identifier}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* حقل كلمة المرور */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                كلمة المرور
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLock className="text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="أدخل كلمة المرور"
                                    dir="ltr"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <FaEye className="text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                            {loginError && (
                                <p className="mt-1 text-sm text-red-600">{loginError}</p>
                            )}
                        </div>
                        
                        {/* أزرار التنقل */}
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={handleBackToStep1}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                            >
                                العودة
                            </button>
                            <button
                                type="submit"
                                disabled={isLoggingIn}
                                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isLoggingIn ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        جاري الدخول...
                                    </>
                                ) : (
                                    <>
                                        <FaSignInAlt className="ml-2" />
                                        دخول
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
                
                {/* عرض عدد الشركات المتاحة */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        عدد الشركات المتاحة: {availableCompanies.length}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CompanySelectionPage;