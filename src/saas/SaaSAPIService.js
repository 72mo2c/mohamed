// ======================================
// SaaS API Service - خدمة API الديناميكية
// ======================================

import tenantManager from './TenantManager';

class SaaSAPIService {
  constructor() {
    this.tenantManager = tenantManager;
    this.defaultTimeout = 10000; // 10 ثواني
    this.maxRetries = 3;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.listeners = new Map();
    
    this.setupNetworkListeners();
  }

  // ==================== إعداد مراقبة الشبكة ====================

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners('network', { status: 'online' });
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners('network', { status: 'offline' });
    });
  }

  // ==================== إعداد الاتصال ====================

  /**
   * إنشاء تكوين الطلب
   */
  createRequestConfig(endpoint, options = {}) {
    const tenant = this.tenantManager.getCurrentTenant();
    const baseURL = tenant?.backendUrl || this.tenantManager.config.defaultBackend;
    
    const config = {
      baseURL: baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL,
      timeout: options.timeout || this.defaultTimeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenant?.id || 'default',
        ...options.headers
      },
      ...options
    };

    // إضافة معلومات الجلسة إذا كانت متوفرة
    if (tenant && tenant.sessionToken) {
      config.headers['Authorization'] = `Bearer ${tenant.sessionToken}`;
    }

    return config;
  }

  /**
   * تنفيذ طلب HTTP
   */
  async request(endpoint, options = {}) {
    const config = this.createRequestConfig(endpoint, options);
    const fullUrl = `${config.baseURL}${endpoint}`;
    
    // التحقق من الاتصال
    if (!this.isOnline && !endpoint.includes('/offline/')) {
      throw new Error('غير متصل بالإنترنت');
    }

    const requestData = {
      url: fullUrl,
      method: options.method || 'GET',
      headers: config.headers,
      body: options.body
    };

    try {
      const response = await this.executeRequest(requestData, config);
      return response;
    } catch (error) {
      // في حالة فشل الطلب، جرب الطلب المحلي (offline)
      if (this.isOnlineError(error) && !endpoint.includes('/offline/')) {
        console.warn('فشل الطلب عبر الإنترنت، جاري المحاولة محلياً...');
        return await this.executeLocalRequest(endpoint, options);
      }
      throw error;
    }
  }

  /**
   * تنفيذ طلب HTTP مع إعادة المحاولة
   */
  async executeRequest(requestData, config) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const fetchOptions = {
          method: requestData.method,
          headers: requestData.headers,
          signal: controller.signal
        };

        if (requestData.body && (requestData.method === 'POST' || requestData.method === 'PUT' || requestData.method === 'PATCH')) {
          fetchOptions.body = requestData.body;
        }

        const response = await fetch(requestData.url, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text();
        }

      } catch (error) {
        lastError = error;
        console.warn(`محاولة ${attempt} فشلت:`, error.message);
        
        if (attempt < this.maxRetries) {
          await this.delay(1000 * attempt); // تأخير متزايد
        }
      }
    }
    
    throw lastError;
  }

  /**
   * تنفيذ طلب محلي (offline)
   */
  async executeLocalRequest(endpoint, options = {}) {
    const tenant = this.tenantManager.getCurrentTenant();
    if (!tenant) {
      throw new Error('لا توجد مؤسسة مسجلة دخول');
    }

    // تحويل الطلب إلى عمليات LocalStorage
    const localEndpoint = endpoint.replace(/^\//, '').replace(/\//g, '_');
    const storageKey = `${tenant.id}_${localEndpoint}`;
    
    const operation = {
      endpoint: endpoint,
      method: options.method || 'GET',
      data: options.body ? JSON.parse(options.body) : null,
      timestamp: Date.now()
    };

    switch (operation.method) {
      case 'GET':
        return this.getFromLocalStorage(storageKey);
      
      case 'POST':
        this.addToSyncQueue({ ...operation, action: 'create' });
        return this.postToLocalStorage(storageKey, operation.data);
      
      case 'PUT':
        this.addToSyncQueue({ ...operation, action: 'update' });
        return this.putToLocalStorage(storageKey, operation.data);
      
      case 'DELETE':
        this.addToSyncQueue({ ...operation, action: 'delete' });
        return this.deleteFromLocalStorage(storageKey);
      
      default:
        throw new Error(`العملية ${operation.method} غير مدعومة في الوضع المحلي`);
    }
  }

  // ==================== إدارة LocalStorage ====================

  getFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : { data: [], message: 'لا توجد بيانات' };
    } catch (error) {
      console.error('خطأ في قراءة البيانات المحلية:', error);
      return { data: [], error: error.message };
    }
  }

  postToLocalStorage(key, data) {
    try {
      const existing = this.getFromLocalStorage(key);
      const newItem = {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        synced: false
      };
      
      const updated = Array.isArray(existing.data) 
        ? [...existing.data, newItem]
        : [newItem];

      localStorage.setItem(key, JSON.stringify({ data: updated }));
      return newItem;
    } catch (error) {
      console.error('خطأ في حفظ البيانات محلياً:', error);
      throw error;
    }
  }

  putToLocalStorage(key, data) {
    try {
      const existing = this.getFromLocalStorage(key);
      const updated = existing.data.map(item => 
        item.id === data.id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item
      );
      
      localStorage.setItem(key, JSON.stringify({ data: updated }));
      return data;
    } catch (error) {
      console.error('خطأ في تحديث البيانات محلياً:', error);
      throw error;
    }
  }

  deleteFromLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return { success: true, message: 'تم الحذف محلياً' };
    } catch (error) {
      console.error('خطأ في حذف البيانات محلياً:', error);
      throw error;
    }
  }

  // ==================== إدارة طابور المزامنة ====================

  addToSyncQueue(operation) {
    this.syncQueue.push({
      ...operation,
      addedAt: new Date().toISOString(),
      id: Date.now()
    });
    
    // حفظ في localStorage
    try {
      localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('خطأ في حفظ طابور المزامنة:', error);
    }
  }

  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    console.log(`جاري مزامنة ${this.syncQueue.length} عملية...`);

    const processedQueue = [...this.syncQueue];
    this.syncQueue = [];

    for (const operation of processedQueue) {
      try {
        await this.syncOperation(operation);
        console.log('تمت مزامنة العملية:', operation.endpoint);
      } catch (error) {
        console.error('فشل في مزامنة العملية:', operation.endpoint, error);
        // إعادة العملية للطابور إذا فشلت
        this.syncQueue.push(operation);
      }
    }

    // حفظ الطابور المحدث
    localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
  }

  async syncOperation(operation) {
    const { endpoint, method, data, action } = operation;
    
    const syncData = {
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (data) {
      syncData.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.tenantManager.getCurrentTenant().backendUrl}${endpoint}`, syncData);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    // تحديث حالة المزامنة في localStorage
    await this.updateSyncStatus(operation, 'synced');
  }

  async updateSyncStatus(operation, status) {
    // تنفيذ تحديث حالة المزامنة حسب نوع العملية
    console.log(`تحديث حالة المزامنة للعمليات ${operation.endpoint}: ${status}`);
  }

  // ==================== العمليات الأساسية ====================

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return await this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    const requestOptions = {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    };
    return await this.request(endpoint, requestOptions);
  }

  /**
   * PUT request
   */
  async put(endpoint, data, options = {}) {
    const requestOptions = {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    };
    return await this.request(endpoint, requestOptions);
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return await this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data, options = {}) {
    const requestOptions = {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    };
    return await this.request(endpoint, requestOptions);
  }

  // ==================== عمليات خاصة بـ Bero System ====================

  /**
   * التحقق من صحة بيانات تسجيل الدخول
   */
  async validateCredentials(username, password) {
    try {
      return await this.post('/auth/validate', { username, password });
    } catch (error) {
      console.warn('فشل التحقق عبر الخادم، جاري المحاولة محلياً...');
      
      // التحقق محلياً
      const tenant = this.tenantManager.getCurrentTenant();
      const usersData = localStorage.getItem(`${tenant.id}_users`);
      
      if (usersData) {
        const users = JSON.parse(usersData);
        const user = users.find(u => u.username === username);
        
        if (user) {
          // استيراد دالة التحقق من كلمة المرور
          const { verifyPassword } = await import('../utils/security.js');
          const isValid = verifyPassword(password, user.password) || password === user.password;
          
          return {
            success: isValid,
            user: isValid ? {
              id: user.id,
              username: user.username,
              name: user.name,
              role: user.role,
              email: user.email
            } : null,
            message: isValid ? 'تم التحقق بنجاح' : 'بيانات خاطئة'
          };
        }
      }
      
      return { success: false, message: 'بيانات خاطئة' };
    }
  }

  /**
   * تحميل بيانات النظام
   */
  async loadSystemData() {
    const tenant = this.tenantManager.getCurrentTenant();
    if (!tenant) {
      throw new Error('لا توجد مؤسسة مسجلة دخول');
    }

    try {
      const response = await this.get('/data/load');
      return response;
    } catch (error) {
      console.warn('فشل تحميل البيانات من الخادم، جاري تحميل البيانات المحلية...');
      
      // تحميل البيانات المحلية
      const localData = {};
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(`${tenant.id}_`) || key.startsWith('bero_')) {
          try {
            localData[key] = JSON.parse(localStorage.getItem(key));
          } catch (e) {
            localData[key] = localStorage.getItem(key);
          }
        }
      });
      
      return { data: localData, source: 'local' };
    }
  }

  /**
   * حفظ بيانات النظام
   */
  async saveSystemData(data, sync = true) {
    try {
      const response = await this.post('/data/save', data);
      return response;
    } catch (error) {
      if (sync && !this.isOnline) {
        // حفظ محلي مع المزامنة لاحقاً
        const tenant = this.tenantManager.getCurrentTenant();
        const dataKey = `${tenant.id}_pending_sync`;
        const existing = localStorage.getItem(dataKey) || '[]';
        const pending = JSON.parse(existing);
        
        pending.push({
          data: data,
          timestamp: Date.now()
        });
        
        localStorage.setItem(dataKey, JSON.stringify(pending));
        return { saved: true, synced: false, message: 'تم الحفظ محلياً وسيتم مزامنته لاحقاً' };
      }
      throw error;
    }
  }

  // ==================== إدارة الأحداث ====================

  /**
   * إضافة مستمع للأحداث
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * إزالة مستمع الأحداث
   */
  removeEventListener(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /**
   * إشعار المستمعين
   */
  notifyListeners(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('خطأ في مستمع الأحداث:', error);
        }
      });
    }
  }

  // ==================== أدوات مساعدة ====================

  /**
   * التحقق من نوع خطأ الشبكة
   */
  isOnlineError(error) {
    return error.name === 'TypeError' && 
           (error.message.includes('fetch') || 
            error.message.includes('network') ||
            error.message.includes('NetworkError'));
  }

  /**
   * تأخير زمني
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * الحصول على حالة الخدمة
   */
  getServiceStatus() {
    return {
      isOnline: this.isOnline,
      queueSize: this.syncQueue.length,
      currentTenant: this.tenantManager.getCurrentTenant()
    };
  }

  /**
   * مسح طابور المزامنة
   */
  clearSyncQueue() {
    this.syncQueue = [];
    localStorage.removeItem('sync_queue');
    return { cleared: true };
  }
}

// إنشاء مثيل عام
const saasAPI = new SaaSAPIService();

export default saasAPI;
export { SaaSAPIService };