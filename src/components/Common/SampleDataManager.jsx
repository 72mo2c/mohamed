import React, { useState } from 'react';
import { FaDatabase, FaTrash, FaRefresh } from 'react-icons/fa';
import { sampleCompanies, initializeSampleData, clearSampleData, hasSampleData, getSampleDataStats } from '../utils/sampleData';

// مكون تهيئة البيانات التجريبية
const SampleDataManager = ({ className = "" }) => {
    const [isInitialized, setIsInitialized] = useState(hasSampleData());
    const [stats, setStats] = useState(getSampleDataStats());
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    // تهيئة البيانات التجريبية
    const handleInitialize = async () => {
        setIsLoading(true);
        try {
            const success = initializeSampleData();
            if (success) {
                setIsInitialized(true);
                setStats(getSampleDataStats());
                setMessage('تم تهيئة البيانات التجريبية بنجاح!');
            } else {
                setMessage('فشل في تهيئة البيانات التجريبية');
            }
        } catch (error) {
            setMessage(`خطأ: ${error.message}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // إزالة البيانات التجريبية
    const handleClear = async () => {
        if (!confirm('هل أنت متأكد من إزالة جميع البيانات التجريبية؟')) {
            return;
        }

        setIsLoading(true);
        try {
            const success = clearSampleData();
            if (success) {
                setIsInitialized(false);
                setStats(getSampleDataStats());
                setMessage('تم إزالة البيانات التجريبية بنجاح!');
            } else {
                setMessage('فشل في إزالة البيانات التجريبية');
            }
        } catch (error) {
            setMessage(`خطأ: ${error.message}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // تحديث الإحصائيات
    const handleRefresh = () => {
        setStats(getSampleDataStats());
        setIsInitialized(hasSampleData());
        setMessage('تم تحديث الإحصائيات');
        setTimeout(() => setMessage(''), 2000);
    };

    return (
        <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <FaDatabase className="ml-2 text-blue-600" />
                إدارة البيانات التجريبية
            </h3>

            {/* حالة البيانات */}
            <div className="mb-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">حالة البيانات:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                        isInitialized 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {isInitialized ? 'مهيأة' : 'غير مهيأة'}
                    </span>
                </div>
            </div>

            {/* الإحصائيات */}
            {isInitialized && (
                <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">الإحصائيات:</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-blue-50 p-2 rounded text-center">
                            <div className="font-semibold text-blue-600">{stats.total}</div>
                            <div className="text-blue-500">إجمالي</div>
                        </div>
                        <div className="bg-green-50 p-2 rounded text-center">
                            <div className="font-semibold text-green-600">{stats.active}</div>
                            <div className="text-green-500">مفعلة</div>
                        </div>
                        <div className="bg-red-50 p-2 rounded text-center">
                            <div className="font-semibold text-red-600">{stats.inactive}</div>
                            <div className="text-red-500">معطلة</div>
                        </div>
                    </div>
                </div>
            )}

            {/* قائمة الشركات */}
            {isInitialized && stats.companies && (
                <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">الشركات المتاحة:</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {stats.companies.map(company => (
                            <div key={company.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                                <span className="truncate">{company.name}</span>
                                <span className={`px-1 rounded ${
                                    company.isActive 
                                        ? 'bg-green-100 text-green-600' 
                                        : 'bg-red-100 text-red-600'
                                }`}>
                                    {company.identifier}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* رسالة الحالة */}
            {message && (
                <div className={`mb-3 p-2 rounded text-xs ${
                    message.includes('بنجاح') 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {message}
                </div>
            )}

            {/* أزرار التحكم */}
            <div className="flex gap-2">
                {!isInitialized ? (
                    <button
                        onClick={handleInitialize}
                        disabled={isLoading}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <FaDatabase className="ml-1" />
                                تهيئة البيانات
                            </>
                        )}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center"
                        >
                            <FaRefresh className="ml-1" />
                            تحديث
                        </button>
                        <button
                            onClick={handleClear}
                            disabled={isLoading}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <FaTrash className="ml-1" />
                                    إزالة البيانات
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>

            {/* معلومات الحسابات التجريبية */}
            {isInitialized && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <h4 className="text-xs font-medium text-gray-700 mb-1">حسابات الاختبار:</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                        <div>• معرف: alfalah - كلمة مرور: 123456</div>
                        <div>• معرف: innovation - كلمة مرور: 123456</div>
                        <div>• معرف: smarttech - كلمة مرور: 123456</div>
                        <div>• معرف: autoworld - كلمة مرور: 123456</div>
                        <div>• معرف: medresearch - كلمة مرور: 123456 (معطلة)</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SampleDataManager;