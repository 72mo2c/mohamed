// ======================================
// ReturnConfig.js - إعدادات نظام الإرجاع
// ======================================

import React, { useState, useEffect } from 'react';
import { FaSave, FaUndo, FaShieldAlt, FaCog, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const ReturnConfig = () => {
  const { settings, updateSettings } = useSystemSettings();
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = useAuth();
  const [formData, setFormData] = useState({
    // إعدادات الأمان
    security: {
      enableSecurityCheck: true,
      requireManagerApproval: true,
      autoAuditLog: true,
      maxReturnAmount: 50000,
      dailyReturnLimit: 100000,
      returnTimeLimit: 30, // بالأيام
      requireReturnReason: true,
      blockHighValueReturns: false,
      securityLevel: 'high' // low, medium, high
    },
    
    // إعدادات الأداء
    performance: {
      enableAutoProcessing: false,
      batchProcessingSize: 50,
      processingTimeout: 300, // بالثواني
      enableCaching: true,
      cacheTimeout: 1800, // بالثواني (30 دقيقة)
      maxConcurrentRequests: 10,
      enableOptimization: true
    },
    
    // إعدادات التخصيص
    customization: {
      enableCustomFields: false,
      customReturnReasons: [
        'منتج تالف',
        'منتج خاطئ',
        'عدم رضا العميل',
        'انتهاء الصلاحية',
        'أخرى'
      ],
      enableCustomNotifications: true,
      customMessageTemplate: '',
      enableAdvancedFiltering: true,
      defaultReturnStatus: 'pending'
    },
    
    // إعدادات النظام
    system: {
      enableLogging: true,
      logLevel: 'info', // debug, info, warn, error
      backupBeforeReturns: true,
      enableVersioning: true,
      maintenanceMode: false,
      systemVersion: '2.1.0',
      lastBackup: null
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // تحميل الإعدادات عند تحميل المكون
  useEffect(() => {
    if (settings?.returnConfig) {
      setFormData({
        ...formData,
        ...settings.returnConfig,
        // دمج الإعدادات مع القيم الافتراضية
        security: { ...formData.security, ...settings.returnConfig?.security },
        performance: { ...formData.performance, ...settings.returnConfig?.performance },
        customization: { ...formData.customization, ...settings.returnConfig?.customization },
        system: { ...formData.system, ...settings.returnConfig?.system }
      });
    }
  }, [settings]);

  // التحقق من صحة البيانات
  const validateForm = () => {
    const errors = {};
    
    if (formData.security.maxReturnAmount < 1) {
      errors.maxReturnAmount = 'الحد الأقصى لقيمة الإرجاع يجب أن يكون أكبر من صفر';
    }
    
    if (formData.security.dailyReturnLimit < formData.security.maxReturnAmount) {
      errors.dailyReturnLimit = 'الحد الأقصى اليومي يجب أن يكون أكبر من الحد الأقصى للمعاملة الواحدة';
    }
    
    if (formData.security.returnTimeLimit < 1 || formData.security.returnTimeLimit > 365) {
      errors.returnTimeLimit = 'مدة الإرجاع يجب أن تكون بين 1 و 365 يوم';
    }
    
    if (formData.performance.processingTimeout < 60) {
      errors.processingTimeout = 'مهلة المعالجة يجب أن تكون على الأقل 60 ثانية';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // حفظ الإعدادات
  const saveSettings = async () => {
    if (!validateForm()) {
      showError('يرجى تصحيح الأخطاء قبل الحفظ');
      return;
    }

    if (!hasPermission('manage_return_settings')) {
      showError('ليس لديك صلاحية لحفظ الإعدادات');
      return;
    }

    setLoading(true);
    try {
      await updateSettings({
        returnConfig: formData
      });
      
      setHasChanges(false);
      setIsEditing(false);
      showSuccess('تم حفظ إعدادات نظام الإرجاع بنجاح');
    } catch (error) {
      showError('حدث خطأ أثناء حفظ الإعدادات');
      console.error('خطأ في حفظ الإعدادات:', error);
    } finally {
      setLoading(false);
    }
  };

  // إعادة تعيين التغييرات
  const resetChanges = () => {
    if (settings?.returnConfig) {
      setFormData({
        ...formData,
        ...settings.returnConfig
      });
      setHasChanges(false);
      setIsEditing(false);
      setValidationErrors({});
    }
  };

  // تحديث قيمة حقل
  const updateField = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
    
    // إزالة خطأ التحقق إذا كان موجود
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // مكون حقل الإدخال
  const InputField = ({ section, field, label, type = 'text', placeholder, icon: Icon }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />}
        <input
          type={type}
          value={formData[section][field]}
          onChange={(e) => updateField(section, field, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            validationErrors[field] ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={placeholder}
          disabled={!isEditing}
        />
      </div>
      {validationErrors[field] && (
        <p className="text-red-500 text-sm mt-1">{validationErrors[field]}</p>
      )}
    </div>
  );

  // مكون التبديل
  const ToggleField = ({ section, field, label, description, icon: Icon }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-3">
      <div className="flex items-center">
        {Icon && <Icon className="text-gray-500 ml-3" />}
        <div>
          <h4 className="text-sm font-medium text-gray-800">{label}</h4>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={formData[section][field]}
          onChange={(e) => updateField(section, field, e.target.checked)}
          className="sr-only peer"
          disabled={!isEditing}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );

  // مكون اختيار
  const SelectField = ({ section, field, label, options, icon: Icon }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />}
        <select
          value={formData[section][field]}
          onChange={(e) => updateField(section, field, e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!isEditing}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  if (!hasPermission('manage_return_settings')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">غير مسموح بالوصول</h2>
          <p className="text-gray-600">ليس لديك صلاحية للوصول إلى إعدادات نظام الإرجاع</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* رأس الصفحة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaCog className="text-blue-600 text-3xl ml-4" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">إعدادات نظام الإرجاع</h1>
                <p className="text-gray-600">إدارة وتخصيص إعدادات نظام المرتجعات والإرجاع</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {hasChanges && (
                <div className="flex items-center text-amber-600">
                  <FaExclamationTriangle className="ml-2" />
                  <span className="text-sm">تغييرات غير محفوظة</span>
                </div>
              )}
              
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  تحرير الإعدادات
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={resetChanges}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <FaUndo className="ml-2" />
                    إلغاء
                  </button>
                  <button
                    onClick={saveSettings}
                    disabled={loading || !hasChanges}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    ) : (
                      <FaSave className="ml-2" />
                    )}
                    حفظ الإعدادات
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* إعدادات الأمان */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaShieldAlt className="text-red-600 text-xl ml-3" />
              <h2 className="text-xl font-bold text-gray-800">إعدادات الأمان</h2>
            </div>
            
            <ToggleField
              section="security"
              field="enableSecurityCheck"
              label="تفعيل فحص الأمان"
              description="فحص الأمان عند كل عملية إرجاع"
            />
            
            <ToggleField
              section="security"
              field="requireManagerApproval"
              label="تتطلب موافقة المدير"
              description="موافقة المدير للإرجاعات ذات القيمة العالية"
            />
            
            <ToggleField
              section="security"
              field="autoAuditLog"
              label="سجل المراجعة التلقائي"
              description="تسجيل تلقائي لجميع العمليات"
            />
            
            <InputField
              section="security"
              field="maxReturnAmount"
              label="الحد الأقصى لقيمة الإرجاع"
              type="number"
              placeholder="50000"
              icon={FaShieldAlt}
            />
            
            <InputField
              section="security"
              field="dailyReturnLimit"
              label="الحد الأقصى اليومي للإرجاعات"
              type="number"
              placeholder="100000"
              icon={FaShieldAlt}
            />
            
            <InputField
              section="security"
              field="returnTimeLimit"
              label="مهلة الإرجاع (بالأيام)"
              type="number"
              placeholder="30"
              icon={FaShieldAlt}
            />
            
            <SelectField
              section="security"
              field="securityLevel"
              label="مستوى الأمان"
              icon={FaShieldAlt}
              options={[
                { value: 'low', label: 'منخفض' },
                { value: 'medium', label: 'متوسط' },
                { value: 'high', label: 'عالي' }
              ]}
            />
          </div>

          {/* إعدادات الأداء */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaCog className="text-green-600 text-xl ml-3" />
              <h2 className="text-xl font-bold text-gray-800">إعدادات الأداء</h2>
            </div>
            
            <ToggleField
              section="performance"
              field="enableAutoProcessing"
              label="تفعيل المعالجة التلقائية"
              description="معالجة تلقائية لطلبات الإرجاع"
            />
            
            <ToggleField
              section="performance"
              field="enableCaching"
              label="تفعيل الذاكرة المؤقتة"
              description="استخدام الذاكرة المؤقتة لتحسين الأداء"
            />
            
            <InputField
              section="performance"
              field="batchProcessingSize"
              label="حجم المعالجة المجمعة"
              type="number"
              placeholder="50"
            />
            
            <InputField
              section="performance"
              field="processingTimeout"
              label="مهلة المعالجة (ثانية)"
              type="number"
              placeholder="300"
            />
            
            <InputField
              section="performance"
              field="maxConcurrentRequests"
              label="الحد الأقصى للطلبات المتزامنة"
              type="number"
              placeholder="10"
            />
          </div>

          {/* إعدادات التخصيص */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaCheckCircle className="text-purple-600 text-xl ml-3" />
              <h2 className="text-xl font-bold text-gray-800">إعدادات التخصيص</h2>
            </div>
            
            <ToggleField
              section="customization"
              field="enableCustomFields"
              label="تفعيل الحقول المخصصة"
              description="إضافة حقول مخصصة لطلبات الإرجاع"
            />
            
            <ToggleField
              section="customization"
              field="enableCustomNotifications"
              label="تفعيل الإشعارات المخصصة"
              description="إشعارات مخصصة لعمليات الإرجاع"
            />
            
            <ToggleField
              section="customization"
              field="enableAdvancedFiltering"
              label="تفعيل التصفية المتقدمة"
              description="تصفية متقدمة للبيانات"
            />
            
            <SelectField
              section="customization"
              field="defaultReturnStatus"
              label="حالة الإرجاع الافتراضية"
              options={[
                { value: 'pending', label: 'في الانتظار' },
                { value: 'approved', label: 'معتمدة' },
                { value: 'rejected', label: 'مرفوضة' },
                { value: 'completed', label: 'مكتملة' }
              ]}
            />
          </div>

          {/* إعدادات النظام */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaCog className="text-blue-600 text-xl ml-3" />
              <h2 className="text-xl font-bold text-gray-800">إعدادات النظام</h2>
            </div>
            
            <ToggleField
              section="system"
              field="enableLogging"
              label="تفعيل السجل"
              description="تسجيل جميع عمليات النظام"
            />
            
            <ToggleField
              section="system"
              field="backupBeforeReturns"
              label="نسخ احتياطي قبل الإرجاع"
              description="إنشاء نسخة احتياطية قبل معالجة الإرجاع"
            />
            
            <ToggleField
              section="system"
              field="enableVersioning"
              label="تفعيل إصدار النسخ"
              description="حفظ إصدارات من البيانات"
            />
            
            <ToggleField
              section="system"
              field="maintenanceMode"
              label="وضع الصيانة"
              description="إيقاف مؤقت للعمليات"
            />
            
            <SelectField
              section="system"
              field="logLevel"
              label="مستوى السجل"
              options={[
                { value: 'debug', label: 'تصحيحي' },
                { value: 'info', label: 'معلوماتي' },
                { value: 'warn', label: 'تحذيري' },
                { value: 'error', label: 'خطأ' }
              ]}
            />
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">معلومات النظام</h4>
              <p className="text-sm text-gray-600">إصدار النظام: {formData.system.systemVersion}</p>
              <p className="text-sm text-gray-600">
                آخر نسخ احتياطي: {formData.system.lastBackup || 'لم يتم إنشاء نسخ احتياطية بعد'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnConfig;