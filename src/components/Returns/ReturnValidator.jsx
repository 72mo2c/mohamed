import React, { useState, useCallback, useMemo } from 'react';

/**
 * نظام مصادقة البيانات المتقدم
 * نظام شامل للتحقق من صحة البيانات في عمليات الإرجاع
 */
class ReturnValidator {
  constructor(options = {}) {
    this.config = {
      strictMode: options.strictMode || false,
      language: options.language || 'ar',
      showDetailedErrors: options.showDetailedErrors || false,
      enableRealTimeValidation: options.enableRealTimeValidation || true,
      ...options
    };

    this.rules = this.initializeRules();
    this.messages = this.initializeMessages();
    this.listeners = new Map();
    
    // إحصائيات التحقق
    this.stats = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      averageTime: 0,
      lastValidation: null
    };

    this.logger = this.createLogger();
    this.logger.info('ReturnValidator initialized', { config: this.config });
  }

  /**
   * إنشاء نظام تسجيل الأحداث
   */
  createLogger() {
    return {
      info: (message, data = {}) => {
        console.info(`[ReturnValidator:INFO] ${message}`, data);
      },
      
      error: (message, data = {}) => {
        console.error(`[ReturnValidator:ERROR] ${message}`, data);
      },
      
      warn: (message, data = {}) => {
        console.warn(`[ReturnValidator:WARN] ${message}`, data);
      },
      
      debug: (message, data = {}) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[ReturnValidator:DEBUG] ${message}`, data);
        }
      }
    };
  }

  /**
   * تهيئة قواعد التحقق
   */
  initializeRules() {
    return {
      // قواعد الفاتورة
      invoice: {
        number: [
          this.requiredRule('رقم الفاتورة مطلوب'),
          this.minLengthRule(3, 'رقم الفاتورة قصير جداً'),
          this.maxLengthRule(20, 'رقم الفاتورة طويل جداً'),
          this.patternRule(/^[A-Z0-9\-_]+$/i, 'رقم الفاتورة يجب أن يحتوي على أحرف وأرقام فقط')
        ],
        date: [
          this.requiredRule('تاريخ الفاتورة مطلوب'),
          this.dateRule('تاريخ الفاتورة غير صحيح')
        ],
        customer: [
          this.requiredRule('بيانات العميل مطلوبة'),
          this.objectRule('بيانات العميل يجب أن تكون كائن')
        ]
      },

      // قواعد المنتجات
      product: {
        id: [
          this.requiredRule('معرف المنتج مطلوب'),
          this.numberRule('معرف المنتج يجب أن يكون رقم صحيح'),
          this.minValueRule(1, 'معرف المنتج يجب أن يكون أكبر من صفر')
        ],
        name: [
          this.requiredRule('اسم المنتج مطلوب'),
          this.minLengthRule(2, 'اسم المنتج قصير جداً'),
          this.maxLengthRule(100, 'اسم المنتج طويل جداً')
        ],
        quantity: [
          this.requiredRule('الكمية مطلوبة'),
          this.numberRule('الكمية يجب أن تكون رقم'),
          this.minValueRule(1, 'الكمية يجب أن تكون أكبر من صفر'),
          this.maxValueRule(999999, 'الكمية كبيرة جداً')
        ],
        price: [
          this.requiredRule('السعر مطلوب'),
          this.numberRule('السعر يجب أن يكون رقم'),
          this.minValueRule(0, 'السعر لا يمكن أن يكون سالب'),
          this.maxValueRule(999999999, 'السعر كبير جداً')
        ],
        returnQuantity: [
          this.numberRule('كمية الإرجاع يجب أن تكون رقم'),
          this.minValueRule(0, 'كمية الإرجاع لا يمكن أن تكون سالبة'),
          this.customRule((value, data) => {
            if (value > data.quantity) {
              return 'كمية الإرجاع أكبر من الكمية الأصلية';
            }
            return null;
          }, 'خطأ في كمية الإرجاع')
        ]
      },

      // قواعد تفاصيل الإرجاع
      returnDetails: {
        type: [
          this.requiredRule('نوع الإرجاع مطلوب'),
          this.enumRule(['full', 'partial'], 'نوع الإرجاع غير صحيح')
        ],
        reason: [
          this.requiredRule('سبب الإرجاع مطلوب'),
          this.minLengthRule(10, 'سبب الإرجاع يجب أن يكون 10 أحرف على الأقل'),
          this.maxLengthRule(500, 'سبب الإرجاع طويل جداً')
        ],
        refundMethod: [
          this.requiredRule('طريقة الاسترداد مطلوبة'),
          this.enumRule(['original', 'store_credit', 'cash'], 'طريقة الاسترداد غير صحيحة')
        ],
        notes: [
          this.maxLengthRule(500, 'الملاحظات طويلة جداً')
        ]
      },

      // قواعد الملفات المرفقة
      attachments: {
        count: [
          this.maxCountRule(5, 'لا يمكن رفع أكثر من 5 ملفات'),
          this.customRule((count) => {
            if (count > 0 && this.getTotalFileSize() > 10 * 1024 * 1024) {
              return 'حجم الملفات كبير جداً (الحد الأقصى 10 ميجابايت)';
            }
            return null;
          }, 'حجم الملفات كبير جداً')
        ],
        types: [
          this.customRule(() => {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
            return this.attachments.every(file => allowedTypes.includes(file.type)) 
              ? null 
              : 'نوع الملف غير مدعوم';
          }, 'نوع الملف غير مدعوم')
        ]
      }
    };
  }

  /**
   * تهيئة رسائل الخطأ
   */
  initializeMessages() {
    return {
      ar: {
        required: 'هذا الحقل مطلوب',
        invalid: 'البيانات المدخلة غير صحيحة',
        tooShort: 'النص قصير جداً',
        tooLong: 'النص طويل جداً',
        invalidNumber: 'يجب أن يكون رقم صحيح',
        invalidEmail: 'البريد الإلكتروني غير صحيح',
        invalidDate: 'التاريخ غير صحيح',
        invalidPhone: 'رقم الهاتف غير صحيح',
        invalidFormat: 'تنسيق البيانات غير صحيح',
        outOfRange: 'القيمة خارج النطاق المسموح',
        fileTooLarge: 'حجم الملف كبير جداً',
        fileTypeNotAllowed: 'نوع الملف غير مدعوم',
        networkError: 'خطأ في الاتصال',
        systemError: 'خطأ في النظام'
      },
      en: {
        required: 'This field is required',
        invalid: 'Invalid data entered',
        tooShort: 'Text is too short',
        tooLong: 'Text is too long',
        invalidNumber: 'Must be a valid number',
        invalidEmail: 'Invalid email address',
        invalidDate: 'Invalid date',
        invalidPhone: 'Invalid phone number',
        invalidFormat: 'Invalid data format',
        outOfRange: 'Value is out of allowed range',
        fileTooLarge: 'File size is too large',
        fileTypeNotAllowed: 'File type not allowed',
        networkError: 'Connection error',
        systemError: 'System error'
      }
    };
  }

  /**
   * قواعد التحقق الأساسية
   */
  requiredRule(message) {
    return {
      validate: (value) => {
        if (value === null || value === undefined || value === '') {
          return message;
        }
        return null;
      }
    };
  }

  minLengthRule(min, message) {
    return {
      validate: (value) => {
        if (value && value.toString().length < min) {
          return message;
        }
        return null;
      }
    };
  }

  maxLengthRule(max, message) {
    return {
      validate: (value) => {
        if (value && value.toString().length > max) {
          return message;
        }
        return null;
      }
    };
  }

  numberRule(message) {
    return {
      validate: (value) => {
        if (value !== null && value !== undefined && value !== '' && isNaN(Number(value))) {
          return message;
        }
        return null;
      }
    };
  }

  minValueRule(min, message) {
    return {
      validate: (value) => {
        if (value !== null && value !== undefined && value !== '' && Number(value) < min) {
          return message;
        }
        return null;
      }
    };
  }

  maxValueRule(max, message) {
    return {
      validate: (value) => {
        if (value !== null && value !== undefined && value !== '' && Number(value) > max) {
          return message;
        }
        return null;
      }
    };
  }

  patternRule(pattern, message) {
    return {
      validate: (value) => {
        if (value && !pattern.test(value)) {
          return message;
        }
        return null;
      }
    };
  }

  enumRule(allowedValues, message) {
    return {
      validate: (value) => {
        if (value !== null && value !== undefined && !allowedValues.includes(value)) {
          return message;
        }
        return null;
      }
    };
  }

  dateRule(message) {
    return {
      validate: (value) => {
        if (value) {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return message;
          }
        }
        return null;
      }
    };
  }

  objectRule(message) {
    return {
      validate: (value) => {
        if (value && (typeof value !== 'object' || Array.isArray(value))) {
          return message;
        }
        return null;
      }
    };
  }

  emailRule(message) {
    return {
      validate: (value) => {
        if (value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return message;
          }
        }
        return null;
      }
    };
  }

  phoneRule(message) {
    return {
      validate: (value) => {
        if (value) {
          const phoneRegex = /^[\+]?[0-9\-\(\)\s]{10,}$/;
          if (!phoneRegex.test(value)) {
            return message;
          }
        }
        return null;
      }
    };
  }

  customRule(validatorFn, message) {
    return {
      validate: (value, data) => {
        const result = validatorFn(value, data);
        return result;
      }
    };
  }

  maxCountRule(max, message) {
    return {
      validate: (count) => {
        if (count > max) {
          return message;
        }
        return null;
      }
    };
  }

  /**
   * التحقق من صحة البيانات
   */
  async validate(data, context = 'general') {
    const startTime = Date.now();
    this.stats.totalValidations++;

    try {
      const result = {
        isValid: true,
        errors: [],
        warnings: [],
        context,
        timestamp: new Date().toISOString(),
        duration: 0
      };

      // تحقق شامل من جميع البيانات
      const invoiceErrors = await this.validateInvoice(data.invoiceData);
      const productErrors = await this.validateProducts(data.selectedProducts);
      const returnDetailsErrors = await this.validateReturnDetails(data.returnDetails);
      const attachmentErrors = await this.validateAttachments(data.returnDetails?.attachments);

      // تجميع الأخطاء
      const allErrors = [
        ...invoiceErrors,
        ...productErrors,
        ...returnDetailsErrors,
        ...attachmentErrors
      ];

      result.errors = allErrors;
      result.isValid = allErrors.length === 0;

      // تحديث الإحصائيات
      const duration = Date.now() - startTime;
      result.duration = duration;
      this.updateStats(result.isValid, duration);

      this.logger.info('Validation completed', {
        context,
        isValid: result.isValid,
        errorCount: allErrors.length,
        duration
      });

      // إشعار المستمعين
      this.notifyListeners('validation', result);

      return result;

    } catch (error) {
      this.logger.error('Validation failed', { error, context });
      
      const result = {
        isValid: false,
        errors: [this.getMessage('systemError')],
        warnings: [],
        context,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: error.message
      };

      this.updateStats(false, Date.now() - startTime);
      return result;
    }
  }

  /**
   * التحقق من صحة الفاتورة
   */
  async validateInvoice(invoice) {
    if (!invoice) {
      return [this.getMessage('required', 'invoiceData')];
    }

    const errors = [];

    // تحقق من رقم الفاتورة
    const numberErrors = this.validateField(invoice.number, this.rules.invoice.number, { invoice });
    errors.push(...numberErrors);

    // تحقق من التاريخ
    const dateErrors = this.validateField(invoice.date, this.rules.invoice.date, { invoice });
    errors.push(...dateErrors);

    // تحقق من بيانات العميل
    const customerErrors = this.validateField(invoice.customer, this.rules.invoice.customer, { invoice });
    errors.push(...customerErrors);

    return errors;
  }

  /**
   * التحقق من صحة المنتجات
   */
  async validateProducts(products) {
    if (!Array.isArray(products)) {
      return [this.getMessage('invalid', 'selectedProducts')];
    }

    const errors = [];

    products.forEach((product, index) => {
      // تحقق من البيانات الأساسية
      const idErrors = this.validateField(product.id, this.rules.product.id, { product, index });
      errors.push(...idErrors.map(err => `[المنتج ${index + 1}] ${err}`));

      const nameErrors = this.validateField(product.name, this.rules.product.name, { product, index });
      errors.push(...nameErrors.map(err => `[المنتج ${index + 1}] ${err}`));

      const quantityErrors = this.validateField(product.quantity, this.rules.product.quantity, { product, index });
      errors.push(...quantityErrors.map(err => `[المنتج ${index + 1}] ${err}`));

      const priceErrors = this.validateField(product.price, this.rules.product.price, { product, index });
      errors.push(...priceErrors.map(err => `[المنتج ${index + 1}] ${err}`));

      const returnQuantityErrors = this.validateField(product.returnQuantity, this.rules.product.returnQuantity, { product, index });
      errors.push(...returnQuantityErrors.map(err => `[المنتج ${index + 1}] ${err}`));
    });

    // تحقق من عدم وجود منتجات مكررة
    const duplicateIds = this.findDuplicateIds(products);
    if (duplicateIds.length > 0) {
      errors.push(`تكرار في المنتجات: ${duplicateIds.join(', ')}`);
    }

    return errors;
  }

  /**
   * التحقق من تفاصيل الإرجاع
   */
  async validateReturnDetails(details) {
    if (!details) {
      return [this.getMessage('required', 'returnDetails')];
    }

    const errors = [];

    const typeErrors = this.validateField(details.type, this.rules.returnDetails.type, { details });
    errors.push(...typeErrors);

    const reasonErrors = this.validateField(details.reason, this.rules.returnDetails.reason, { details });
    errors.push(...reasonErrors);

    const refundMethodErrors = this.validateField(details.refundMethod, this.rules.returnDetails.refundMethod, { details });
    errors.push(...refundMethodErrors);

    const notesErrors = this.validateField(details.notes, this.rules.returnDetails.notes, { details });
    errors.push(...notesErrors);

    return errors;
  }

  /**
   * التحقق من الملفات المرفقة
   */
  async validateAttachments(attachments) {
    if (!attachments || !Array.isArray(attachments)) {
      return [];
    }

    const errors = [];
    const countErrors = this.validateField(attachments.length, this.rules.attachments.count, { attachments });
    errors.push(...countErrors);

    // تحقق من أنواع الملفات
    attachments.forEach((file, index) => {
      const fileName = file.name || `الملف ${index + 1}`;
      
      // تحقق من الحجم
      const maxSize = 5 * 1024 * 1024; // 5 ميجابايت لكل ملف
      if (file.size > maxSize) {
        errors.push(`حجم ${fileName} كبير جداً (الحد الأقصى 5 ميجابايت)`);
      }

      // تحقق من النوع
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`نوع ${fileName} غير مدعوم`);
      }
    });

    return errors;
  }

  /**
   * التحقق من حقل واحد
   */
  validateField(value, rules, context = {}) {
    const errors = [];
    
    rules.forEach(rule => {
      try {
        const error = rule.validate(value, context);
        if (error) {
          errors.push(error);
        }
      } catch (error) {
        errors.push(`خطأ في التحقق: ${error.message}`);
      }
    });

    return errors;
  }

  /**
   * العثور على المعرفات المكررة
   */
  findDuplicateIds(products) {
    const ids = products.map(p => p.id).filter(id => id !== null && id !== undefined);
    const uniqueIds = [...new Set(ids)];
    return ids.filter(id => uniqueIds.indexOf(id) !== ids.indexOf(id));
  }

  /**
   * الحصول على رسالة خطأ
   */
  getMessage(key, field = null) {
    const messages = this.messages[this.config.language] || this.messages.ar;
    let message = messages[key] || key;
    
    if (field) {
      message = `${field}: ${message}`;
    }
    
    return message;
  }

  /**
   * تحديث الإحصائيات
   */
  updateStats(isValid, duration) {
    if (isValid) {
      this.stats.passedValidations++;
    } else {
      this.stats.failedValidations++;
    }

    // حساب متوسط الوقت
    this.stats.averageTime = ((this.stats.averageTime * (this.stats.totalValidations - 1)) + duration) / this.stats.totalValidations;
    this.stats.lastValidation = new Date().toISOString();
  }

  /**
   * نظام المستمعين
   */
  subscribe(listenerId, callback) {
    this.listeners.set(listenerId, callback);
    return () => this.listeners.delete(listenerId);
  }

  notifyListeners(event, data) {
    this.listeners.forEach((callback, id) => {
      try {
        callback(event, data);
      } catch (error) {
        this.logger.error(`Listener error for ${id}`, { error });
      }
    });
  }

  /**
   * التحقق في الوقت الفعلي
   */
  enableRealTimeValidation(targetElement, data, callback) {
    if (!this.config.enableRealTimeValidation) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          // تأخير للتحقق من عدم الضغط على المفاتيح بسرعة
          clearTimeout(this.validationTimeout);
          this.validationTimeout = setTimeout(async () => {
            const result = await this.validate(data);
            if (callback) {
              callback(result);
            }
          }, 500);
        }
      });
    });

    observer.observe(targetElement, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return observer;
  }

  /**
   * الحصول على الإحصائيات
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * إعادة تعيين الإحصائيات
   */
  resetStats() {
    this.stats = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      averageTime: 0,
      lastValidation: null
    };
  }

  /**
   * تصدير تقرير التحقق
   */
  exportReport() {
    return {
      stats: this.getStats(),
      config: this.config,
      timestamp: new Date().toISOString(),
      summary: {
        successRate: this.stats.totalValidations > 0 ? 
          (this.stats.passedValidations / this.stats.totalValidations * 100).toFixed(2) + '%' : '0%'
      }
    };
  }
}

/**
 * React Hook لاستخدام ReturnValidator
 */
export const useReturnValidator = (options = {}) => {
  const [validator] = useState(() => new ReturnValidator(options));
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateData = useCallback(async (data, context = 'general') => {
    setIsValidating(true);
    try {
      const result = await validator.validate(data, context);
      setValidationResult(result);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [validator]);

  const subscribe = useCallback((listenerId, callback) => {
    return validator.subscribe(listenerId, callback);
  }, [validator]);

  return {
    validator,
    validateData,
    validationResult,
    isValidating,
    subscribe,
    getStats: () => validator.getStats(),
    exportReport: () => validator.exportReport()
  };
};

/**
 * مكون React لعرض نتائج التحقق
 */
export const ValidationResults = ({ result, showDetails = true }) => {
  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* ملخص النتيجة */}
      <div className={`p-4 rounded-lg border ${
        result.isValid 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            result.isValid ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {result.isValid ? (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div className="mr-3">
            <h3 className={`font-semibold ${
              result.isValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.isValid ? 'التحقق مكتمل بنجاح' : 'يوجد أخطاء في البيانات'}
            </h3>
            <p className={`text-sm ${
              result.isValid ? 'text-green-600' : 'text-red-600'
            }`}>
              {result.isValid 
                ? `تم التحقق من ${result.context} بنجاح`
                : `عدد الأخطاء: ${result.errors.length}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* تفاصيل الأخطاء */}
      {!result.isValid && showDetails && result.errors.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-800 mb-3">تفاصيل الأخطاء:</h4>
          <ul className="space-y-2">
            {result.errors.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                <span className="text-red-700 text-sm">{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* إحصائيات التحقق */}
      {showDetails && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">إحصائيات التحقق:</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">الوقت المستغرق:</span>
              <span className="mr-2 font-medium">{result.duration}ms</span>
            </div>
            <div>
              <span className="text-gray-600">السياق:</span>
              <span className="mr-2 font-medium">{result.context}</span>
            </div>
            <div>
              <span className="text-gray-600">الوقت:</span>
              <span className="mr-2 font-medium">
                {new Date(result.timestamp).toLocaleTimeString('ar-SA')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnValidator;