// ======================================
// TenantManager - نظام إدارة المؤسسات
// ======================================

import saasConfig from './saas-config.js';

class TenantManager {
  constructor() {
    this.currentTenant = null;
    this.config = saasConfig;
    this.loadTenantFromStorage();
  }

  // ==================== إدارة المؤسسة الحالية ====================
  
  /**
   * تحميل المؤسسة من التخزين المحلي
   */
  loadTenantFromStorage() {
    try {
      const stored = localStorage.getItem('current_tenant');
      if (stored) {
        this.currentTenant = JSON.parse(stored);
      }
    } catch (error) {
      console.error('خطأ في تحميل بيانات المؤسسة:', error);
      this.currentTenant = null;
    }
  }

  /**
   * حفظ المؤسسة الحالية في التخزين المحلي
   */
  saveTenantToStorage(tenant) {
    try {
      localStorage.setItem('current_tenant', JSON.stringify(tenant));
      localStorage.setItem(`${tenant.id}_session`, JSON.stringify({
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 ساعة
      }));
    } catch (error) {
      console.error('خطأ في حفظ بيانات المؤسسة:', error);
    }
  }

  /**
   * مسح المؤسسة الحالية
   */
  clearCurrentTenant() {
    if (this.currentTenant) {
      localStorage.removeItem('current_tenant');
      localStorage.removeItem(`${this.currentTenant.id}_session`);
      localStorage.removeItem(`${this.currentTenant.id}_data`);
    }
    this.currentTenant = null;
  }

  // ==================== البحث والتحقق ====================

  /**
   * البحث عن مؤسسة بواسطة المعرف
   */
  findTenant(tenantId) {
    if (!tenantId) return null;
    
    // البحث في ملف التكوين
    const configTenant = this.config.companies[tenantId.toLowerCase()];
    if (configTenant) {
      return {
        id: tenantId.toLowerCase(),
        ...configTenant
      };
    }

    // البحث في التخزين المحلي
    try {
      const storedTenants = localStorage.getItem('saas_tenants');
      if (storedTenants) {
        const tenants = JSON.parse(storedTenants);
        return tenants[tenantId.toLowerCase()] || null;
      }
    } catch (error) {
      console.error('خطأ في البحث في التخزين المحلي:', error);
    }

    return null;
  }

  /**
   * التحقق من صحة بيانات المؤسسة
   */
  validateTenant(tenant) {
    if (!tenant) return false;
    
    const required = ['id', 'name', 'displayName', 'backendUrl', 'status'];
    for (const field of required) {
      if (!tenant[field]) return false;
    }

    // التحقق من عدم انتهاء صلاحية المؤسسة
    if (tenant.expiryDate) {
      const expiryDate = new Date(tenant.expiryDate);
      const now = new Date();
      if (expiryDate < now) {
        tenant.status = 'expired';
        return false;
      }
    }

    // التحقق من حالة المؤسسة
    if (tenant.status !== 'active') {
      return false;
    }

    return true;
  }

  /**
   * التحقق من جلسة المؤسسة
   */
  checkTenantSession(tenantId) {
    try {
      const sessionData = localStorage.getItem(`${tenantId}_session`);
      if (!sessionData) return false;

      const session = JSON.parse(sessionData);
      const expiresAt = new Date(session.expiresAt);
      const now = new Date();

      return expiresAt > now;
    } catch (error) {
      console.error('خطأ في التحقق من الجلسة:', error);
      return false;
    }
  }

  // ==================== إدارة التكوين الديناميكي ====================

  /**
   * الحصول على عنوان Backend للمؤسسة
   */
  getBackendUrl(tenantId) {
    const tenant = this.findTenant(tenantId);
    return tenant ? tenant.backendUrl : this.config.defaultBackend;
  }

  /**
   * الحصول على إعدادات المؤسسة
   */
  getTenantSettings(tenantId) {
    const tenant = this.findTenant(tenantId);
    return tenant ? {
      ...tenant.settings,
      branding: {
        companyName: tenant.name,
        logo: tenant.logo,
        primaryColor: tenant.primaryColor || '#f97316',
        secondaryColor: tenant.secondaryColor || '#ea580c'
      }
    } : this.getDefaultSettings();
  }

  /**
   * الإعدادات الافتراضية
   */
  getDefaultSettings() {
    return {
      currency: 'SAR',
      language: 'ar',
      timezone: 'Asia/Riyadh',
      dateFormat: 'DD/MM/YYYY',
      decimalSeparator: '.',
      thousandsSeparator: ',',
      branding: {
        companyName: 'Bero System',
        logo: '/imgs/default-logo.png',
        primaryColor: '#f97316',
        secondaryColor: '#ea580c'
      }
    };
  }

  /**
   * تطبيق إعدادات المؤسسة على النظام
   */
  applyTenantSettings(tenantId) {
    const settings = this.getTenantSettings(tenantId);
    
    // تطبيق الألوان
    if (settings.branding?.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', settings.branding.primaryColor);
    }
    if (settings.branding?.secondaryColor) {
      document.documentElement.style.setProperty('--secondary-color', settings.branding.secondaryColor);
    }

    // تطبيق اللغة والاتجاه
    document.documentElement.lang = settings.language || 'ar';
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';

    return settings;
  }

  // ==================== إدارة الاتصال ====================

  /**
   * التحقق من حالة الاتصال بالخادم
   */
  async checkConnection(backendUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 ثواني timeout

      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('فشل في الاتصال بالخادم:', error);
      return false;
    }
  }

  /**
   * تحديد أفضل طريقة للبيانات (online/offline)
   */
  async determineDataMode(tenantId) {
    const backendUrl = this.getBackendUrl(tenantId);
    const isOnline = await this.checkConnection(backendUrl);

    return {
      mode: isOnline ? 'online' : 'offline',
      backendUrl: backendUrl,
      timestamp: new Date().toISOString()
    };
  }

  // ==================== إدارة الجلسة ====================

  /**
   * تسجيل دخول المؤسسة
   */
  async loginTenant(tenantId, password) {
    try {
      // البحث عن المؤسسة
      const tenant = this.findTenant(tenantId);
      if (!tenant) {
        return {
          success: false,
          message: 'معرف المؤسسة غير صحيح',
          code: 'INVALID_TENANT'
        };
      }

      // التحقق من صحة المؤسسة
      if (!this.validateTenant(tenant)) {
        if (tenant.status === 'expired') {
          return {
            success: false,
            message: 'انتهت صلاحية اشتراك المؤسسة',
            code: 'EXPIRED_SUBSCRIPTION'
          };
        }
        return {
          success: false,
          message: 'المؤسسة غير نشطة',
          code: 'INACTIVE_TENANT'
        };
      }

      // التحقق من كلمة المرور
      const storedPassword = localStorage.getItem(`${tenantId}_password`);
      if (storedPassword && storedPassword !== password) {
        return {
          success: false,
          message: 'كلمة المرور غير صحيحة',
          code: 'INVALID_PASSWORD'
        };
      }

      // تحديد وضع البيانات
      const dataMode = await this.determineDataMode(tenantId);
      
      // إنشاء جلسة المؤسسة
      const tenantSession = {
        id: tenant.id,
        name: tenant.name,
        displayName: tenant.displayName,
        logo: tenant.logo,
        backendUrl: tenant.backendUrl,
        dataMode: dataMode.mode,
        loginTime: new Date().toISOString(),
        settings: this.getTenantSettings(tenantId)
      };

      this.currentTenant = tenantSession;
      this.saveTenantToStorage(tenantSession);

      // تطبيق إعدادات المؤسسة
      this.applyTenantSettings(tenantId);

      return {
        success: true,
        tenant: tenantSession,
        message: `مرحباً بك في ${tenant.displayName}`,
        dataMode: dataMode.mode
      };

    } catch (error) {
      console.error('خطأ في تسجيل دخول المؤسسة:', error);
      return {
        success: false,
        message: 'حدث خطأ في تسجيل الدخول',
        code: 'LOGIN_ERROR'
      };
    }
  }

  /**
   * تسجيل خروج المؤسسة
   */
  logoutTenant() {
    const tenantId = this.currentTenant?.id;
    this.clearCurrentTenant();
    
    // مسح أي بيانات خاصة بالمؤسسة
    if (tenantId) {
      // مسح مفاتيح البيانات المتعلقة بالمؤسسة
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`${tenantId}_`) || key.startsWith('bero_') || key.startsWith('saas_')) {
          localStorage.removeItem(key);
        }
      });
    }

    // إعادة تعيين الألوان للوضع الافتراضي
    document.documentElement.style.removeProperty('--primary-color');
    document.documentElement.style.removeProperty('--secondary-color');

    this.currentTenant = null;
    return { success: true };
  }

  // ==================== معلومات الحالة ====================

  /**
   * الحصول على المؤسسة الحالية
   */
  getCurrentTenant() {
    return this.currentTenant;
  }

  /**
   * التحقق من وجود مؤسسة مسجلة دخول
   */
  hasActiveSession() {
    return this.currentTenant !== null && 
           this.checkTenantSession(this.currentTenant.id);
  }

  /**
   * الحصول على معلومات جميع المؤسسات المتاحة
   */
  getAvailableTenants() {
    return Object.entries(this.config.companies).map(([id, config]) => ({
      id,
      name: config.name,
      displayName: config.displayName,
      status: config.status,
      expiryDate: config.expiryDate
    }));
  }

  // ==================== إدارة المطورين ====================

  /**
   * إضافة مؤسسة جديدة (للمطورين)
   */
  addTenant(tenantId, tenantData) {
    try {
      const storedTenants = localStorage.getItem('saas_tenants') || '{}';
      const tenants = JSON.parse(storedTenants);
      
      tenants[tenantId.toLowerCase()] = {
        id: tenantId.toLowerCase(),
        ...tenantData,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('saas_tenants', JSON.stringify(tenants));
      return { success: true };
    } catch (error) {
      console.error('خطأ في إضافة المؤسسة:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * تحديث مؤسسة موجودة
   */
  updateTenant(tenantId, updates) {
    try {
      const tenant = this.findTenant(tenantId);
      if (!tenant) {
        return { success: false, error: 'المؤسسة غير موجودة' };
      }

      const updatedTenant = { ...tenant, ...updates };
      
      if (this.config.companies[tenantId.toLowerCase()]) {
        // تحديث في ملف التكوين
        this.config.companies[tenantId.toLowerCase()] = updatedTenant;
      } else {
        // تحديث في التخزين المحلي
        const storedTenants = localStorage.getItem('saas_tenants') || '{}';
        const tenants = JSON.parse(storedTenants);
        tenants[tenantId.toLowerCase()] = updatedTenant;
        localStorage.setItem('saas_tenants', JSON.stringify(tenants));
      }

      return { success: true, tenant: updatedTenant };
    } catch (error) {
      console.error('خطأ في تحديث المؤسسة:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * حذف مؤسسة
   */
  deleteTenant(tenantId) {
    try {
      if (this.config.companies[tenantId.toLowerCase()]) {
        return { success: false, error: 'لا يمكن حذف مؤسسات افتراضية' };
      }

      const storedTenants = localStorage.getItem('saas_tenants') || '{}';
      const tenants = JSON.parse(storedTenants);
      delete tenants[tenantId.toLowerCase()];
      localStorage.setItem('saas_tenants', JSON.stringify(tenants));

      return { success: true };
    } catch (error) {
      console.error('خطأ في حذف المؤسسة:', error);
      return { success: false, error: error.message };
    }
  }
}

// إنشاء مثيل عام
const tenantManager = new TenantManager();

export default tenantManager;
export { TenantManager };