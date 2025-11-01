import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';

/**
 * محرك إدارة الإرجاع المتقدم
 * نظام شامل لإدارة عمليات إرجاع الفواتير
 */
class InvoiceReturnManager {
  constructor() {
    this.state = {
      currentStep: 1,
      invoiceData: null,
      selectedProducts: [],
      returnDetails: {
        reason: '',
        type: 'partial', // full, partial
        refundMethod: 'original', // original, store_credit, cash
        notes: '',
        attachments: []
      },
      validationErrors: [],
      loading: false,
      autoSaveEnabled: true,
      lastSaved: null
    };

    this.listeners = new Map();
    this.logger = this.createLogger();
    this.validator = this.createValidator();
    this.errorHandler = this.createErrorHandler();
    this.autoSaveTimer = null;
    this.sessionId = this.generateSessionId();
    
    this.logger.info('InvoiceReturnManager initialized', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * إنشاء نظام تسجيل الأحداث المتقدم
   */
  createLogger() {
    const levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };

    return {
      error: (message, data = {}) => {
        console.error(`[InvoiceReturnManager:ERROR] ${message}`, data);
        this.sendToMonitoring('error', message, data);
      },
      
      warn: (message, data = {}) => {
        console.warn(`[InvoiceReturnManager:WARN] ${message}`, data);
        this.sendToMonitoring('warn', message, data);
      },
      
      info: (message, data = {}) => {
        console.info(`[InvoiceReturnManager:INFO] ${message}`, data);
        this.sendToMonitoring('info', message, data);
      },
      
      debug: (message, data = {}) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[InvoiceReturnManager:DEBUG] ${message}`, data);
        }
      },

      logUserAction: (action, data = {}) => {
        this.info(`User action: ${action}`, {
          ...data,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId,
          step: this.state.currentStep
        });
      }
    };
  }

  /**
   * إنشاء نظام المراقبة والإبلاغ
   */
  sendToMonitoring(level, message, data) {
    // يمكن ربطه مع خدمة مراقبة خارجية
    const monitoringData = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // إرسال للخدمة الخارجية أو حفظ محلي
    if (typeof window !== 'undefined') {
      // حفظ في localStorage للمراجعة
      const logs = JSON.parse(localStorage.getItem('returnLogs') || '[]');
      logs.push(monitoringData);
      if (logs.length > 100) logs.shift(); // الاحتفاظ بآخر 100 سجل
      localStorage.setItem('returnLogs', JSON.stringify(logs));
    }
  }

  /**
   * إنشاء نظام التحقق من البيانات
   */
  createValidator() {
    return {
      invoiceNumber: (number) => {
        if (!number || typeof number !== 'string') {
          return 'رقم الفاتورة مطلوب';
        }
        if (number.length < 3 || number.length > 20) {
          return 'رقم الفاتورة يجب أن يكون بين 3 و 20 حرف';
        }
        return null;
      },

      product: (product) => {
        const errors = [];
        if (!product.id) errors.push('معرف المنتج مطلوب');
        if (!product.quantity || product.quantity <= 0) {
          errors.push('الكمية يجب أن تكون أكبر من صفر');
        }
        if (!product.price || product.price < 0) {
          errors.push('السعر يجب أن يكون أكبر من أو يساوي صفر');
        }
        return errors;
      },

      returnDetails: (details) => {
        const errors = [];
        if (!details.type || !['full', 'partial'].includes(details.type)) {
          errors.push('نوع الإرجاع غير صحيح');
        }
        if (!details.reason || details.reason.trim().length < 10) {
          errors.push('سبب الإرجاع يجب أن يكون 10 أحرف على الأقل');
        }
        if (details.notes && details.notes.length > 500) {
          errors.push('الملاحظات يجب أن تكون أقل من 500 حرف');
        }
        return errors;
      },

      stepCompletion: (step, state) => {
        switch (step) {
          case 1: // اختيار الفاتورة
            return state.invoiceData !== null;
          case 2: // اختيار المنتجات
            return state.selectedProducts.length > 0;
          case 3: // تفاصيل الإرجاع
            return this.validateReturnDetails(state.returnDetails).length === 0;
          case 4: // المراجعة والتأكيد
            return true;
          default:
            return false;
        }
      }
    };
  }

  /**
   * إنشاء معالج الأخطاء المتقدم
   */
  createErrorHandler() {
    const errorTypes = {
      NETWORK_ERROR: 'خطأ في الشبكة',
      VALIDATION_ERROR: 'خطأ في التحقق من البيانات',
      SYSTEM_ERROR: 'خطأ في النظام',
      USER_ERROR: 'خطأ في المستخدم'
    };

    return {
      handle: (error, context = '') => {
        const errorInfo = {
          message: error.message || 'خطأ غير معروف',
          type: error.type || 'SYSTEM_ERROR',
          context,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId,
          userAgent: navigator.userAgent
        };

        this.logger.error(`Error in ${context}`, errorInfo);

        // عرض رسالة مناسبة للمستخدم
        this.showUserFriendlyError(error.type, error.message);

        // إرسال للإنتاج إذا كان في البيئة الإنتاجية
        if (process.env.NODE_ENV === 'production') {
          this.reportErrorToService(errorInfo);
        }

        return errorInfo;
      },

      showUserFriendlyError: (type, message) => {
        let userMessage = 'حدث خطأ غير متوقع';
        
        switch (type) {
          case 'NETWORK_ERROR':
            userMessage = 'خطأ في الاتصال. يرجى المحاولة مرة أخرى';
            break;
          case 'VALIDATION_ERROR':
            userMessage = message || 'البيانات المدخلة غير صحيحة';
            break;
          case 'SYSTEM_ERROR':
            userMessage = 'خطأ في النظام. يرجى الاتصال بالدعم الفني';
            break;
          case 'USER_ERROR':
            userMessage = message || 'يرجى التحقق من البيانات المدخلة';
            break;
        }

        toast.error(userMessage);
      },

      reportErrorToService: (errorInfo) => {
        // إرسال للأداء الخارجي (مثل Sentry)
        if (typeof window !== 'undefined' && window.Sentry) {
          window.Sentry.captureException(new Error(errorInfo.message), {
            extra: errorInfo
          });
        }
      }
    };
  }

  /**
   * إدارة الحالة
   */
  setState(newState) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };

    this.notifyListeners(prevState, this.state);
    this.logger.debug('State updated', {
      changes: Object.keys(newState),
      prevStep: prevState.currentStep,
      newStep: this.state.currentStep
    });
  }

  /**
   * نظام المستمعين للتحديثات
   */
  subscribe(listenerId, callback) {
    this.listeners.set(listenerId, callback);
    return () => this.listeners.delete(listenerId);
  }

  notifyListeners(prevState, newState) {
    this.listeners.forEach((callback, id) => {
      try {
        callback(newState, prevState);
      } catch (error) {
        this.errorHandler.handle(error, `Listener notification for ${id}`);
      }
    });
  }

  /**
   * وظائف أساسية
   */
  async loadInvoice(invoiceNumber) {
    this.logger.info('Loading invoice', { invoiceNumber });
    this.setState({ loading: true });

    try {
      // محاكاة طلب API
      const mockInvoice = {
        id: invoiceNumber,
        number: invoiceNumber,
        date: new Date().toISOString().split('T')[0],
        customer: {
          id: 1,
          name: 'أحمد محمد',
          phone: '+966501234567',
          email: 'ahmed@example.com'
        },
        products: [
          {
            id: 1,
            name: 'منتج تجريبي 1',
            quantity: 2,
            price: 100,
            total: 200,
            returnable: true
          },
          {
            id: 2,
            name: 'منتج تجريبي 2',
            quantity: 1,
            price: 150,
            total: 150,
            returnable: true
          }
        ],
        subtotal: 350,
        tax: 52.5,
        total: 402.5,
        paid: true,
        status: 'completed'
      };

      // تحقق من الفاتورة
      const validationError = this.validator.invoiceNumber(invoiceNumber);
      if (validationError) {
        throw new Error(validationError);
      }

      // محاكاة تأخير الشبكة
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.setState({
        invoiceData: mockInvoice,
        loading: false,
        currentStep: 2
      });

      this.logger.info('Invoice loaded successfully', {
        invoiceNumber,
        productsCount: mockInvoice.products.length
      });

      this.triggerAutoSave();
      return mockInvoice;

    } catch (error) {
      this.setState({ loading: false });
      this.errorHandler.handle(error, 'Load invoice');
      throw error;
    }
  }

  /**
   * اختيار المنتجات للإرجاع
   */
  selectProduct(productId, quantity = 1) {
    this.logger.logUserAction('select_product', { productId, quantity });

    const invoice = this.state.invoiceData;
    if (!invoice) {
      this.errorHandler.handle(
        { type: 'USER_ERROR', message: 'يجب تحميل الفاتورة أولاً' },
        'Select product'
      );
      return;
    }

    const product = invoice.products.find(p => p.id === productId);
    if (!product) {
      this.errorHandler.handle(
        { type: 'USER_ERROR', message: 'المنتج غير موجود' },
        'Select product'
      );
      return;
    }

    if (quantity > product.quantity) {
      this.errorHandler.handle(
        { type: 'USER_ERROR', message: 'الكمية أكبر من المتوفر' },
        'Select product'
      );
      return;
    }

    const existingIndex = this.state.selectedProducts.findIndex(p => p.id === productId);
    let updatedProducts;

    if (existingIndex >= 0) {
      updatedProducts = [...this.state.selectedProducts];
      updatedProducts[existingIndex] = {
        ...product,
        returnQuantity: updatedProducts[existingIndex].returnQuantity + quantity
      };
    } else {
      updatedProducts = [...this.state.selectedProducts, {
        ...product,
        returnQuantity: quantity,
        returnTotal: product.price * quantity
      }];
    }

    this.setState({
      selectedProducts: updatedProducts,
      validationErrors: []
    });

    this.triggerAutoSave();
    this.logger.info('Product selected for return', {
      productId,
      quantity,
      totalProducts: updatedProducts.length
    });
  }

  /**
   * إزالة منتج من قائمة الإرجاع
   */
  removeProduct(productId) {
    this.logger.logUserAction('remove_product', { productId });

    const updatedProducts = this.state.selectedProducts.filter(p => p.id !== productId);
    this.setState({ selectedProducts: updatedProducts });

    this.triggerAutoSave();
    this.logger.info('Product removed from return list', { productId });
  }

  /**
   * تحديث تفاصيل الإرجاع
   */
  updateReturnDetails(details) {
    this.logger.logUserAction('update_return_details', details);

    const validationErrors = this.validator.returnDetails(details);
    
    this.setState({
      returnDetails: { ...this.state.returnDetails, ...details },
      validationErrors
    });

    this.triggerAutoSave();
  }

  /**
   * الانتقال للخطوة التالية
   */
  nextStep() {
    const currentStep = this.state.currentStep;
    
    if (!this.validator.stepCompletion(currentStep, this.state)) {
      const errors = this.getStepValidationErrors(currentStep);
      this.setState({ validationErrors: errors });
      this.errorHandler.handle(
        { type: 'VALIDATION_ERROR', message: 'يرجى إكمال الخطوة الحالية' },
        'Next step validation'
      );
      return false;
    }

    const nextStep = currentStep + 1;
    this.setState({ currentStep: nextStep });
    
    this.logger.info('Moved to next step', {
      from: currentStep,
      to: nextStep
    });

    this.triggerAutoSave();
    return true;
  }

  /**
   * العودة للخطوة السابقة
   */
  previousStep() {
    const currentStep = this.state.currentStep;
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      this.setState({ currentStep: prevStep });
      
      this.logger.info('Moved to previous step', {
        from: currentStep,
        to: prevStep
      });

      this.triggerAutoSave();
    }
  }

  /**
   * الذهاب لخطوة محددة
   */
  goToStep(step) {
    if (step >= 1 && step <= 4) {
      // تحقق من إمكانية الوصول للخطوة
      if (step <= this.state.currentStep || this.canSkipToStep(step)) {
        this.setState({ currentStep: step });
        this.logger.info('Jumped to step', { step });
      } else {
        this.errorHandler.handle(
          { type: 'USER_ERROR', message: 'يجب إكمال الخطوات السابقة أولاً' },
          'Jump to step'
        );
      }
    }
  }

  /**
   * التحقق من إمكانية الانتقال لخطوة
   */
  canSkipToStep(targetStep) {
    // منطق خاص للسماح بتجاوز بعض الخطوات
    switch (targetStep) {
      case 1:
        return true; // دائماً مسموح
      case 4:
        return this.state.selectedProducts.length > 0; // للمراجعة فقط
      default:
        return false;
    }
  }

  /**
   * حفظ تلقائي
   */
  triggerAutoSave() {
    if (!this.state.autoSaveEnabled) return;

    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.saveToStorage();
    }, 2000); // حفظ بعد ثانيتين من آخر تعديل
  }

  saveToStorage() {
    try {
      const dataToSave = {
        state: this.state,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId
      };

      localStorage.setItem(`return_session_${this.sessionId}`, JSON.stringify(dataToSave));
      this.setState({ lastSaved: new Date().toISOString() });
      
      this.logger.debug('Auto-saved to storage');
    } catch (error) {
      this.errorHandler.handle(error, 'Auto-save');
    }
  }

  /**
   * استعادة من التخزين المحلي
   */
  restoreFromStorage() {
    try {
      const savedData = localStorage.getItem(`return_session_${this.sessionId}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        this.setState(parsed.state);
        this.logger.info('Restored from storage', { sessionId: this.sessionId });
      }
    } catch (error) {
      this.errorHandler.handle(error, 'Restore from storage');
    }
  }

  /**
   * إكمال عملية الإرجاع
   */
  async completeReturn() {
    this.logger.info('Completing return process');
    this.setState({ loading: true });

    try {
      // تحقق نهائي من البيانات
      const allValidations = [
        this.validator.invoiceNumber(this.state.invoiceData.number),
        ...this.state.selectedProducts.map(p => this.validator.product(p)),
        ...this.validator.returnDetails(this.state.returnDetails)
      ].filter(Boolean);

      if (allValidations.length > 0) {
        throw new Error(`Validation failed: ${allValidations.join(', ')}`);
      }

      // محاكاة طلب API للإرجاع
      const returnRequest = {
        invoiceNumber: this.state.invoiceData.number,
        products: this.state.selectedProducts.map(p => ({
          id: p.id,
          name: p.name,
          quantity: p.returnQuantity,
          price: p.price
        })),
        details: this.state.returnDetails,
        timestamp: new Date().toISOString()
      };

      // محاكاة تأخير الشبكة
      await new Promise(resolve => setTimeout(resolve, 2000));

      // محاكاة استجابة ناجحة
      const result = {
        success: true,
        returnId: `RET-${Date.now()}`,
        message: 'تمت عملية الإرجاع بنجاح'
      };

      this.setState({ loading: false });

      // تنظيف التخزين المحلي
      localStorage.removeItem(`return_session_${this.sessionId}`);
      
      this.logger.info('Return completed successfully', result);
      
      toast.success(result.message);
      return result;

    } catch (error) {
      this.setState({ loading: false });
      this.errorHandler.handle(error, 'Complete return');
      throw error;
    }
  }

  /**
   * وظائف مساعدة
   */
  generateSessionId() {
    return `return_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStepValidationErrors(step) {
    switch (step) {
      case 1:
        return this.state.invoiceData ? [] : ['يجب تحميل الفاتورة أولاً'];
      case 2:
        return this.state.selectedProducts.length > 0 ? [] : ['يجب اختيار منتج واحد على الأقل'];
      case 3:
        return this.validator.returnDetails(this.state.returnDetails);
      case 4:
        return [];
      default:
        return [];
    }
  }

  getReturnSummary() {
    const totalReturnAmount = this.state.selectedProducts.reduce(
      (sum, product) => sum + product.returnTotal, 0
    );

    return {
      productCount: this.state.selectedProducts.length,
      totalQuantity: this.state.selectedProducts.reduce(
        (sum, product) => sum + product.returnQuantity, 0
      ),
      totalAmount: totalReturnAmount,
      returnType: this.state.returnDetails.type,
      refundMethod: this.state.returnDetails.refundMethod
    };
  }

  /**
   * تنظيف الموارد
   */
  cleanup() {
    clearTimeout(this.autoSaveTimer);
    this.listeners.clear();
    this.logger.info('InvoiceReturnManager cleaned up');
  }
}

/**
 * React Hook لاستخدام InvoiceReturnManager
 */
export const useInvoiceReturnManager = () => {
  const [manager] = useState(() => new InvoiceReturnManager());
  const [state, setState] = useState(manager.state);

  useEffect(() => {
    const unsubscribe = manager.subscribe('react_component', (newState) => {
      setState({ ...newState });
    });

    // استعادة البيانات المحفوظة
    manager.restoreFromStorage();

    return unsubscribe;
  }, [manager]);

  return {
    state,
    manager,
    // واجهة مبسطة للوظائف
    loadInvoice: (number) => manager.loadInvoice(number),
    selectProduct: (id, qty) => manager.selectProduct(id, qty),
    removeProduct: (id) => manager.removeProduct(id),
    updateReturnDetails: (details) => manager.updateReturnDetails(details),
    nextStep: () => manager.nextStep(),
    previousStep: () => manager.previousStep(),
    goToStep: (step) => manager.goToStep(step),
    completeReturn: () => manager.completeReturn(),
    getReturnSummary: () => manager.getReturnSummary()
  };
};

export default InvoiceReturnManager;