// ======================================
// SaaS Context - إدارة حالة نظام SaaS
// ======================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import tenantManager from '../saas/TenantManager';
import saasAPI from '../saas/SaaSAPIService';
import { useAuth } from './AuthContext';

const SaaSContext = createContext();

// Hook لاستخدام SaaS Context
export const useSaaS = () => {
  const context = useContext(SaaSContext);
  if (!context) {
    throw new Error('useSaaS must be used within SaaSProvider');
  }
  return context;
};

export const SaaSProvider = ({ children }) => {
  const { login: authLogin } = useAuth();
  
  // حالة نظام SaaS
  const [currentTenant, setCurrentTenant] = useState(null);
  const [dataMode, setDataMode] = useState('local'); // 'online', 'offline', 'local'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    lastSync: null,
    isSyncing: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ==================== إدارة المؤسسة الحالية ====================

  /**
   * تسجيل دخول مؤسسة جديدة
   */
  const loginTenant = useCallback(async (tenantId, password) => {
    setLoading(true);
    setError('');

    try {
      // تسجيل دخول المؤسسة
      const result = await tenantManager.loginTenant(tenantId, password);
      
      if (!result.success) {
        setError(result.message);
        return { success: false, message: result.message };
      }

      // تحديث الحالة
      setCurrentTenant(result.tenant);
      setDataMode(result.dataMode);

      // تسجيل دخول المستخدم داخل المؤسسة
      const authResult = await authLogin(result.tenant.username || 'admin', password);
      
      if (!authResult.success) {
        // تسجيل الخروج من المؤسسة إذا فشل تسجيل دخول المستخدم
        await logoutTenant();
        setError('فشل في تسجيل دخول المستخدم');
        return { success: false, message: 'فشل في تسجيل دخول المستخدم' };
      }

      // تطبيق إعدادات المؤسسة
      const settings = tenantManager.applyTenantSettings(tenantId);
      
      // بدء مراقبة حالة المزامنة
      startSyncMonitoring();

      return { 
        success: true, 
        message: result.message,
        tenant: result.tenant,
        settings
      };

    } catch (error) {
      console.error('خطأ في تسجيل دخول المؤسسة:', error);
      setError('حدث خطأ في تسجيل الدخول');
      return { success: false, message: 'حدث خطأ في تسجيل الدخول' };
    } finally {
      setLoading(false);
    }
  }, [authLogin]);

  /**
   * تسجيل خروج المؤسسة
   */
  const logoutTenant = useCallback(async () => {
    try {
      // مزامنة البيانات قبل الخروج
      if (syncStatus.pending > 0) {
        await syncAllData();
      }

      // تسجيل خروج المستخدم
      await authLogout();

      // تسجيل خروج المؤسسة
      tenantManager.logoutTenant();
      setCurrentTenant(null);
      setDataMode('local');
      
      // إيقاف مراقبة المزامنة
      stopSyncMonitoring();

      return { success: true };
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      return { success: false, message: 'حدث خطأ في تسجيل الخروج' };
    }
  }, [syncStatus.pending, authLogout]);

  /**
   * تسجيل خروج المستخدم
   */
  const authLogout = useCallback(async () => {
    try {
      // تنفيذ عملية logout من AuthContext
      const { logout } = useAuth();
      logout();
    } catch (error) {
      console.error('خطأ في تسجيل خروج المستخدم:', error);
    }
  }, []);

  /**
   * تحميل المؤسسة من التخزين
   */
  const loadTenant = useCallback(() => {
    const tenant = tenantManager.getCurrentTenant();
    if (tenant && tenantManager.hasActiveSession()) {
      setCurrentTenant(tenant);
      
      // تحديد وضع البيانات
      tenantManager.determineDataMode(tenant.id).then(mode => {
        setDataMode(mode.mode);
      });

      // تطبيق إعدادات المؤسسة
      tenantManager.applyTenantSettings(tenant.id);
      
      return true;
    }
    return false;
  }, []);

  // ==================== إدارة البيانات ====================

  /**
   * تحميل بيانات النظام
   */
  const loadSystemData = useCallback(async () => {
    if (!currentTenant) {
      throw new Error('لا توجد مؤسسة مسجلة دخول');
    }

    try {
      setLoading(true);
      
      let data;
      if (dataMode === 'online') {
        data = await saasAPI.loadSystemData();
      } else {
        // تحميل البيانات المحلية
        const tenantData = {};
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(`${currentTenant.id}_`) || key.startsWith('bero_')) {
            try {
              tenantData[key] = JSON.parse(localStorage.getItem(key));
            } catch (e) {
              tenantData[key] = localStorage.getItem(key);
            }
          }
        });
        data = { data: tenantData, source: 'local' };
      }

      return data;
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      setError('فشل في تحميل البيانات');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentTenant, dataMode]);

  /**
   * حفظ بيانات النظام
   */
  const saveSystemData = useCallback(async (data, sync = true) => {
    if (!currentTenant) {
      throw new Error('لا توجد مؤسسة مسجلة دخول');
    }

    try {
      let result;
      if (dataMode === 'online' && sync) {
        result = await saasAPI.saveSystemData(data, true);
      } else {
        // حفظ محلي
        const dataKey = `${currentTenant.id}_system_data`;
        localStorage.setItem(dataKey, JSON.stringify(data));
        result = { saved: true, synced: false, message: 'تم الحفظ محلياً' };
      }

      // تحديث حالة المزامنة
      updateSyncStatus();
      
      return result;
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
      setError('فشل في حفظ البيانات');
      throw error;
    }
  }, [currentTenant, dataMode]);

  /**
   * مزامنة البيانات المعلقة
   */
  const syncData = useCallback(async () => {
    if (!currentTenant || !isOnline || dataMode !== 'online') {
      return { success: false, message: 'لا يمكن المزامنة الآن' };
    }

    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      
      await saasAPI.processSyncQueue();
      
      const newStatus = saasAPI.getServiceStatus();
      setSyncStatus({
        pending: newStatus.queueSize,
        lastSync: new Date().toISOString(),
        isSyncing: false
      });

      return { success: true, message: 'تمت المزامنة بنجاح' };
    } catch (error) {
      console.error('خطأ في المزامنة:', error);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      return { success: false, message: 'فشلت المزامنة' };
    }
  }, [currentTenant, isOnline, dataMode]);

  /**
   * مزامنة جميع البيانات
   */
  const syncAllData = useCallback(async () => {
    try {
      const result = await syncData();
      return result;
    } catch (error) {
      console.error('خطأ في مزامنة البيانات:', error);
      throw error;
    }
  }, [syncData]);

  /**
   * تحديث حالة المزامنة
   */
  const updateSyncStatus = useCallback(() => {
    const status = saasAPI.getServiceStatus();
    setSyncStatus(prev => ({
      ...prev,
      pending: status.queueSize,
      lastSync: status.lastSync || prev.lastSync
    }));
  }, []);

  // ==================== إدارة الاتصال ====================

  /**
   * التحقق من حالة الاتصال
   */
  const checkConnection = useCallback(async () => {
    if (!currentTenant) return false;

    try {
      const isConnected = await saasAPI.checkConnection(currentTenant.backendUrl);
      return isConnected;
    } catch (error) {
      console.error('خطأ في التحقق من الاتصال:', error);
      return false;
    }
  }, [currentTenant]);

  /**
   * التبديل بين أوضاع البيانات
   */
  const switchDataMode = useCallback(async (mode) => {
    if (!currentTenant) return { success: false, message: 'لا توجد مؤسسة مسجلة دخول' };

    try {
      let targetMode = mode;
      
      // تحديد الوضع الأمثل إذا لم يُحدد
      if (mode === 'auto') {
        if (isOnline) {
          // اختبار الاتصال أولاً
          const isConnected = await checkConnection();
          targetMode = isConnected ? 'online' : 'offline';
        } else {
          targetMode = 'offline';
        }
      }

      setDataMode(targetMode);

      // إذا تم التبديل للوضع الأساسي، جرب مزامنة البيانات
      if (targetMode === 'online' && isOnline) {
        setTimeout(() => syncData(), 1000); // تأخير قصير للسماح للاتصال بالاستقرار
      }

      return { success: true, mode: targetMode };
    } catch (error) {
      console.error('خطأ في التبديل لوضع البيانات:', error);
      return { success: false, message: 'فشل في التبديل لوضع البيانات' };
    }
  }, [currentTenant, isOnline, checkConnection, syncData]);

  // ==================== إدارة المزامنة التلقائية ====================

  let syncInterval = null;

  const startSyncMonitoring = useCallback(() => {
    if (syncInterval) clearInterval(syncInterval);
    
    syncInterval = setInterval(() => {
      if (isOnline && dataMode === 'online' && currentTenant) {
        syncData();
      }
    }, 5 * 60 * 1000); // كل 5 دقائق
  }, [isOnline, dataMode, currentTenant, syncData]);

  const stopSyncMonitoring = useCallback(() => {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  }, []);

  // ==================== تأثيرات ====================

  // مراقبة حالة الاتصال
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (currentTenant && dataMode === 'online') {
        syncData();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentTenant, dataMode, syncData]);

  // تحميل المؤسسة عند بدء التطبيق
  useEffect(() => {
    loadTenant();
  }, [loadTenant]);

  // تنظيف المزامنة عند إلغاء تركيب المكون
  useEffect(() => {
    return () => {
      stopSyncMonitoring();
    };
  }, [stopSyncMonitoring]);

  // ==================== القيم المرجعية ====================

  const value = {
    // حالة المؤسسة
    currentTenant,
    isOnline,
    dataMode,
    syncStatus,
    loading,
    error,
    
    // وظائف المؤسسة
    loginTenant,
    logoutTenant,
    loadTenant,
    
    // وظائف البيانات
    loadSystemData,
    saveSystemData,
    syncData,
    syncAllData,
    
    // وظائف الاتصال
    checkConnection,
    switchDataMode,
    
    // معلومات إضافية
    hasActiveTenant: Boolean(currentTenant),
    canSync: isOnline && dataMode === 'online' && Boolean(currentTenant),
    isDataModeOnline: dataMode === 'online',
    isDataModeOffline: dataMode === 'offline',
    
    // حالة المزامنة
    hasPendingSync: syncStatus.pending > 0,
    isSyncInProgress: syncStatus.isSyncing,
    
    // إعدادات
    getTenantSettings: () => currentTenant?.settings || tenantManager.getDefaultSettings(),
    
    // مسح الأخطاء
    clearError: () => setError(''),
  };

  return (
    <SaaSContext.Provider value={value}>
      {children}
    </SaaSContext.Provider>
  );
};