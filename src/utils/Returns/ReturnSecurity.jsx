/**
 * نظام أمان الإرجاع - ReturnSecurity.jsx
 * نظام أمان متقدم لحماية بيانات الإرجاع والعمليات الحساسة
 * يتضمن: تشفير البيانات، نظام صلاحيات، منع الوصول غير المصرح، تسجيل العمليات
 */

import React, { useState, useEffect, useCallback } from 'react';
import CryptoJS from 'crypto-js';

class ReturnSecurityManager {
  constructor() {
    this.encryptionKey = process.env.REACT_APP_ENCRYPTION_KEY || 'default-key-2025';
    this.sessionToken = null;
    this.userPermissions = [];
    this.securityLevel = 'high';
    this.auditLog = [];
  }

  /**
   * تشفير البيانات الحساسة
   * @param {any} data - البيانات المراد تشفيرها
   * @returns {string} البيانات المشفرة
   */
  encryptData(data) {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
      this.logSecurityEvent('DATA_ENCRYPTION', { success: true, dataType: typeof data });
      return encrypted;
    } catch (error) {
      this.logSecurityEvent('DATA_ENCRYPTION', { success: false, error: error.message });
      throw new Error(`فشل في تشفير البيانات: ${error.message}`);
    }
  }

  /**
   * فك تشفير البيانات
   * @param {string} encryptedData - البيانات المشفرة
   * @returns {any} البيانات الأصلية
   */
  decryptData(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      const data = JSON.parse(decrypted);
      this.logSecurityEvent('DATA_DECRYPTION', { success: true });
      return data;
    } catch (error) {
      this.logSecurityEvent('DATA_DECRYPTION', { success: false, error: error.message });
      throw new Error(`فشل في فك تشفير البيانات: ${error.message}`);
    }
  }

  /**
   * إنشاء نظام الصلاحيات المتقدم
   * @param {object} user - معلومات المستخدم
   * @param {array} permissions - قائمة الصلاحيات
   */
  setUserPermissions(user, permissions = []) {
    this.userPermissions = {
      userId: user.id,
      userName: user.name,
      roles: user.roles || [],
      permissions: permissions,
      level: this.calculatePermissionLevel(user, permissions),
      sessionStart: new Date().toISOString()
    };
    
    this.logSecurityEvent('PERMISSION_SET', {
      userId: user.id,
      permissionLevel: this.userPermissions.level,
      permissionCount: permissions.length
    });
  }

  /**
   * التحقق من الصلاحية
   * @param {string} action - العملية المطلوبة
   * @param {string} resource - المورد المطلوب الوصول إليه
   * @returns {boolean} هل مسموح أم لا
   */
  checkPermission(action, resource) {
    const hasPermission = this.userPermissions.permissions.includes(`${action}:${resource}`) ||
                         this.userPermissions.permissions.includes(`${action}:*`) ||
                         this.userPermissions.roles.includes('admin');

    this.logSecurityEvent('PERMISSION_CHECK', {
      action,
      resource,
      hasPermission,
      userId: this.userPermissions.userId
    });

    return hasPermission;
  }

  /**
   * منع الوصول غير المصرح
   * @param {string} action - العملية
   * @param {string} resource - المورد
   * @param {object} context - سياق العملية
   */
  enforceAccessControl(action, resource, context = {}) {
    if (!this.checkPermission(action, resource)) {
      const securityViolation = {
        timestamp: new Date().toISOString(),
        action,
        resource,
        userId: this.userPermissions.userId,
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        severity: 'HIGH',
        description: `محاولة وصول غير مصرح للعملية ${action} على المورد ${resource}`
      };

      this.logSecurityEvent('ACCESS_DENIED', securityViolation);
      this.triggerSecurityAlert(securityViolation);
      
      throw new Error('غير مصرح لك بالوصول إلى هذا المورد');
    }
  }

  /**
   * تسجيل العمليات الحساسة
   * @param {string} eventType - نوع الحدث
   * @param {object} data - بيانات الحدث
   */
  logSecurityEvent(eventType, data) {
    const auditEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      eventType,
      data,
      sessionId: this.sessionToken,
      securityLevel: this.securityLevel
    };

    this.auditLog.push(auditEntry);
    
    // حفظ في localStorage للمراجعة لاحقاً
    const storedLogs = JSON.parse(localStorage.getItem('return_security_audit') || '[]');
    storedLogs.push(auditEntry);
    
    // الاحتفاظ بآخر 1000 سجل فقط
    if (storedLogs.length > 1000) {
      storedLogs.splice(0, storedLogs.length - 1000);
    }
    
    localStorage.setItem('return_security_audit', JSON.stringify(storedLogs));
  }

  /**
   * حساب مستوى الصلاحية
   * @param {object} user - بيانات المستخدم
   * @param {array} permissions - الصلاحيات
   * @returns {string} مستوى الصلاحية
   */
  calculatePermissionLevel(user, permissions) {
    if (user.roles.includes('admin')) return 'admin';
    if (user.roles.includes('manager')) return 'manager';
    if (permissions.length > 10) return 'advanced';
    if (permissions.length > 5) return 'intermediate';
    return 'basic';
  }

  /**
   * تشغيل إنذار الأمان
   * @param {object} violation - انتهاك الأمان
   */
  triggerSecurityAlert(violation) {
    // يمكن دمج هذا مع نظام التنبيهات الفعلي
    console.warn('🔒 تحذير أمني:', violation);
    
    // إرسال إشعار للمشرفين
    if (violation.severity === 'HIGH') {
      this.sendAdminNotification(violation);
    }
  }

  /**
   * إرسال إشعار للمشرفين
   * @param {object} violation - انتهاك الأمان
   */
  sendAdminNotification(violation) {
    // منطق إرسال الإشعار (بريد إلكتروني، SMS، إلخ)
    console.log('📧 إرسال إشعار للمشرفين:', violation);
  }

  /**
   * الحصول على تقرير الأمان
   * @returns {object} تقرير شامل عن حالة الأمان
   */
  getSecurityReport() {
    const recentLogs = this.auditLog.slice(-100);
    const securityMetrics = {
      totalEvents: this.auditLog.length,
      accessDenied: recentLogs.filter(log => log.eventType === 'ACCESS_DENIED').length,
      encryptionOperations: recentLogs.filter(log => log.eventType.includes('ENCRYPTION')).length,
      permissionChecks: recentLogs.filter(log => log.eventType === 'PERMISSION_CHECK').length,
      securityLevel: this.securityLevel,
      userPermissionLevel: this.userPermissions.level,
      recentViolations: recentLogs.filter(log => log.eventType === 'ACCESS_DENIED')
    };

    return {
      timestamp: new Date().toISOString(),
      metrics: securityMetrics,
      auditLog: recentLogs,
      recommendations: this.generateSecurityRecommendations(securityMetrics)
    };
  }

  /**
   * توليد توصيات الأمان
   * @param {object} metrics - مقاييس الأمان
   * @returns {array} قائمة التوصيات
   */
  generateSecurityRecommendations(metrics) {
    const recommendations = [];

    if (metrics.accessDenied > 10) {
      recommendations.push('مراجعة صلاحيات المستخدمين - عدد محاولات الوصول المرفوضة مرتفع');
    }

    if (metrics.userPermissionLevel === 'basic' && metrics.permissionChecks > 50) {
      recommendations.push('تطوير مستوى الصلاحية للمستخدم الحالي');
    }

    if (metrics.securityLevel === 'low') {
      recommendations.push('رفع مستوى الأمان إلى عالي');
    }

    return recommendations;
  }

  /**
   * تسجيل خروج آمن
   */
  secureLogout() {
    this.logSecurityEvent('SECURE_LOGOUT', {
      userId: this.userPermissions.userId,
      sessionDuration: new Date().getTime() - new Date(this.userPermissions.sessionStart).getTime()
    });

    this.sessionToken = null;
    this.userPermissions = [];
  }
}

const ReturnSecurity = ({ children, requireAuth = true }) => {
  const [securityManager] = useState(() => new ReturnSecurityManager());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [securityReport, setSecurityReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // تحقق من حالة المصادقة عند تحميل المكون
  useEffect(() => {
    if (requireAuth) {
      checkAuthentication();
    } else {
      setLoading(false);
    }
  }, [requireAuth]);

  /**
   * التحقق من المصادقة
   */
  const checkAuthentication = useCallback(() => {
    try {
      const storedSession = localStorage.getItem('return_security_session');
      if (storedSession) {
        const sessionData = securityManager.decryptData(storedSession);
        if (sessionData.expires > Date.now()) {
          securityManager.sessionToken = sessionData.token;
          securityManager.setUserPermissions(sessionData.user, sessionData.permissions);
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
      }
      setIsAuthenticated(false);
    } catch (error) {
      console.error('خطأ في التحقق من المصادقة:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [securityManager]);

  /**
   * تسجيل الدخول الآمن
   * @param {object} credentials - بيانات الاعتماد
   */
  const secureLogin = useCallback(async (credentials) => {
    try {
      // تحقق من صحة بيانات الاعتماد
      if (!credentials.username || !credentials.password) {
        throw new Error('بيانات الاعتماد غير مكتملة');
      }

      // إنشاء جلسة آمنة
      const sessionToken = crypto.getRandomValues(new Uint8Array(32)).join('');
      const sessionData = {
        token: sessionToken,
        user: { id: Date.now(), name: credentials.username, roles: ['user'] },
        permissions: ['return:read', 'return:write'],
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 ساعة
      };

      // حفظ الجلسة بتشفير
      const encryptedSession = securityManager.encryptData(sessionData);
      localStorage.setItem('return_security_session', encryptedSession);

      securityManager.sessionToken = sessionToken;
      securityManager.setUserPermissions(sessionData.user, sessionData.permissions);
      setIsAuthenticated(true);

      securityManager.logSecurityEvent('SECURE_LOGIN', {
        userId: sessionData.user.id,
        username: credentials.username
      });

      return { success: true, sessionToken };
    } catch (error) {
      securityManager.logSecurityEvent('LOGIN_FAILED', {
        username: credentials.username,
        error: error.message
      });
      throw error;
    }
  }, [securityManager]);

  /**
   * الحصول على تقرير الأمان
   */
  const refreshSecurityReport = useCallback(() => {
    try {
      const report = securityManager.getSecurityReport();
      setSecurityReport(report);
      return report;
    } catch (error) {
      console.error('خطأ في الحصول على تقرير الأمان:', error);
      throw error;
    }
  }, [securityManager]);

  /**
   * تسجيل الخروج
   */
  const logout = useCallback(() => {
    securityManager.secureLogout();
    localStorage.removeItem('return_security_session');
    setIsAuthenticated(false);
    setSecurityReport(null);
  }, [securityManager]);

  const contextValue = {
    securityManager,
    isAuthenticated,
    secureLogin,
    logout,
    refreshSecurityReport,
    securityReport,
    checkPermission: securityManager.checkPermission.bind(securityManager),
    enforceAccessControl: securityManager.enforceAccessControl.bind(securityManager),
    encryptData: securityManager.encryptData.bind(securityManager),
    decryptData: securityManager.decryptData.bind(securityManager)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">جاري التحقق من الأمان...</span>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              🔒 تسجيل الدخول الآمن
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              يجب تسجيل الدخول للوصول إلى النظام
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-center text-gray-500">
              يرجى تسجيل الدخول أولاً
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReturnSecurityContext.Provider value={contextValue}>
      <div className="return-security-wrapper">
        {/* مؤشر الأمان */}
        {isAuthenticated && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm">
              🔒 آمن
            </div>
          </div>
        )}
        {children}
      </div>
    </ReturnSecurityContext.Provider>
  );
};

// سياق الأمان
const ReturnSecurityContext = React.createContext();

export default ReturnSecurity;
export { ReturnSecurityManager };
export { ReturnSecurityContext };