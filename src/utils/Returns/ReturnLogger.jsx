/**
 * نظام مراقبة الإرجاع - ReturnLogger.jsx
 * نظام مراقبة شامل لتتبع العمليات والأخطاء والأداء
 * يتضمن: تسجيل شامل، مراقبة الأخطاء، تتبع الأداء، تقارير ذكية
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

class ReturnLoggerManager {
  constructor() {
    this.logs = [];
    this.metrics = {
      performance: {},
      errors: {},
      operations: {},
      userActivity: {}
    };
    this.maxLogEntries = 10000;
    this.alertThresholds = {
      errorRate: 5, // نسبة الأخطاء المسموحة %
      responseTime: 3000, // زمن الاستجابة المسموح بالميلي ثانية
      memoryUsage: 80, // نسبة استخدام الذاكرة المسموحة %
      concurrentUsers: 100 // عدد المستخدمين المتزامنين المسموح
    };
    this.reportGenerators = new Map();
    this.initializeReportGenerators();
  }

  /**
   * تسجيل شامل للعمليات
   * @param {string} level - مستوى السجل (debug, info, warn, error, fatal)
   * @param {string} category - فئة العملية
   * @param {string} message - الرسالة
   * @param {object} data - البيانات الإضافية
   */
  log(level, category, message, data = {}) {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      level: level.toLowerCase(),
      category,
      message,
      data,
      stackTrace: level === 'error' ? new Error().stack : null,
      memoryUsage: this.getMemoryUsage(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : null
    };

    this.logs.push(logEntry);
    this.cleanupOldLogs();
    this.updateMetrics(logEntry);
    this.checkAlerts(logEntry);

    // حفظ في localStorage للمراجعة
    this.persistLogs();

    return logEntry.id;
  }

  /**
   * تسجيل معلومات
   * @param {string} category - فئة العملية
   * @param {string} message - الرسالة
   * @param {object} data - البيانات
   */
  info(category, message, data = {}) {
    return this.log('info', category, message, data);
  }

  /**
   * تسجيل تحذير
   * @param {string} category - فئة العملية
   * @param {string} message - الرسالة
   * @param {object} data - البيانات
   */
  warn(category, message, data = {}) {
    return this.log('warn', category, message, data);
  }

  /**
   * تسجيل خطأ
   * @param {string} category - فئة العملية
   * @param {string} message - الرسالة
   * @param {object} data - البيانات
   * @param {Error} error - الخطأ الفعلي
   */
  error(category, message, data = {}, error = null) {
    const errorData = {
      ...data,
      error: error ? error.message : null,
      stack: error ? error.stack : null
    };
    return this.log('error', category, message, errorData);
  }

  /**
   * مراقبة الأخطاء
   * @param {Error} error - الخطأ
   * @param {string} context - السياق
   */
  trackError(error, context = 'unknown') {
    const errorEntry = this.error('ERROR_TRACKING', `خطأ في ${context}`, {
      errorName: error.name,
      errorMessage: error.message,
      context,
      timestamp: new Date().toISOString()
    }, error);

    // تحليل الخطأ
    this.analyzeError(error, context);

    return errorEntry;
  }

  /**
   * تحليل الخطأ وتوليد معلومات مفيدة
   * @param {Error} error - الخطأ
   * @param {string} context - السياق
   */
  analyzeError(error, context) {
    const errorType = this.classifyError(error);
    const severity = this.calculateErrorSeverity(error, context);
    
    this.log('info', 'ERROR_ANALYSIS', `تحليل الخطأ - ${errorType}`, {
      errorType,
      severity,
      suggestions: this.generateErrorSuggestions(error, context)
    });
  }

  /**
   * تصنيف الخطأ
   * @param {Error} error - الخطأ
   * @returns {string} نوع الخطأ
   */
  classifyError(error) {
    if (error.name === 'TypeError') return 'خطأ في نوع البيانات';
    if (error.name === 'ReferenceError') return 'خطأ في المرجع';
    if (error.name === 'SyntaxError') return 'خطأ في بناء الجملة';
    if (error.name === 'NetworkError') return 'خطأ في الشبكة';
    if (error.message.includes('timeout')) return 'انتهت المهلة الزمنية';
    if (error.message.includes('permission')) return 'خطأ في الصلاحيات';
    return 'خطأ عام';
  }

  /**
   * حساب شدة الخطأ
   * @param {Error} error - الخطأ
   * @param {string} context - السياق
   * @returns {string} مستوى الشدة
   */
  calculateErrorSeverity(error, context) {
    if (context === 'authentication' || context === 'payment') return 'عالي';
    if (error.name === 'NetworkError') return 'متوسط';
    if (error.name === 'TypeError') return 'منخفض';
    return 'متوسط';
  }

  /**
   * توليد اقتراحات لحل الخطأ
   * @param {Error} error - الخطأ
   * @param {string} context - السياق
   * @returns {array} قائمة الاقتراحات
   */
  generateErrorSuggestions(error, context) {
    const suggestions = [];

    if (context === 'authentication') {
      suggestions.push('تأكد من صحة بيانات تسجيل الدخول');
      suggestions.push('تحقق من اتصال الإنترنت');
    }

    if (error.name === 'NetworkError') {
      suggestions.push('تحقق من اتصال الشبكة');
      suggestions.push('أعد المحاولة لاحقاً');
    }

    if (error.name === 'TypeError') {
      suggestions.push('تحقق من نوع البيانات');
      suggestions.push('تأكد من تعريف المتغيرات');
    }

    suggestions.push('تحديث الصفحة وإعادة المحاولة');
    suggestions.push('الاتصال بالدعم الفني إذا استمر الخطأ');

    return suggestions;
  }

  /**
   * تتبع الأداء
   * @param {string} operation - العملية
   * @param {number} startTime - وقت البداية
   * @param {object} metadata - البيانات الإضافية
   */
  trackPerformance(operation, startTime, metadata = {}) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const performanceEntry = this.log('info', 'PERFORMANCE', `قياس أداء ${operation}`, {
      operation,
      duration: Math.round(duration),
      metadata,
      timestamp: new Date().toISOString()
    });

    // تحديث المقاييس
    if (!this.metrics.performance[operation]) {
      this.metrics.performance[operation] = [];
    }
    this.metrics.performance[operation].push(duration);

    // فحص الأداء
    if (duration > this.alertThresholds.responseTime) {
      this.warn('PERFORMANCE', `عملية بطيئة: ${operation}`, {
        duration,
        threshold: this.alertThresholds.responseTime
      });
    }

    return performanceEntry;
  }

  /**
   * تحديث المقاييس
   * @param {object} logEntry - إدخال السجل
   */
  updateMetrics(logEntry) {
    // تحديث مقاييس الأخطاء
    if (logEntry.level === 'error') {
      const hour = new Date(logEntry.timestamp).getHours();
      if (!this.metrics.errors[hour]) {
        this.metrics.errors[hour] = 0;
      }
      this.metrics.errors[hour]++;
    }

    // تحديث مقاييس العمليات
    const category = logEntry.category;
    if (!this.metrics.operations[category]) {
      this.metrics.operations[category] = 0;
    }
    this.metrics.operations[category]++;

    // تحديث نشاط المستخدم
    const hour = new Date(logEntry.timestamp).getHours();
    if (!this.metrics.userActivity[hour]) {
      this.metrics.userActivity[hour] = 0;
    }
    this.metrics.userActivity[hour]++;
  }

  /**
   * فحص التنبيهات
   * @param {object} logEntry - إدخال السجل
   */
  checkAlerts(logEntry) {
    const currentHour = new Date().getHours();
    const errorCount = this.metrics.errors[currentHour] || 0;
    const totalLogs = Object.values(this.metrics.operations).reduce((a, b) => a + b, 0);
    
    if (totalLogs > 0) {
      const errorRate = (errorCount / totalLogs) * 100;
      
      if (errorRate > this.alertThresholds.errorRate) {
        this.log('warn', 'ALERT', `معدل أخطاء مرتفع: ${errorRate.toFixed(2)}%`, {
          errorCount,
          totalLogs,
          errorRate,
          threshold: this.alertThresholds.errorRate
        });
      }
    }
  }

  /**
   * توليد تقرير ذكي
   * @param {string} type - نوع التقرير
   * @param {object} options - خيارات التقرير
   * @returns {object} التقرير المولد
   */
  generateSmartReport(type = 'overview', options = {}) {
    const reportGenerators = {
      overview: () => this.generateOverviewReport(),
      performance: () => this.generatePerformanceReport(),
      errors: () => this.generateErrorReport(),
      activity: () => this.generateActivityReport()
    };

    const generator = reportGenerators[type] || reportGenerators.overview;
    return generator();
  }

  /**
   * تقرير عام
   * @returns {object} التقرير العام
   */
  generateOverviewReport() {
    const recentLogs = this.logs.slice(-1000);
    const errorLogs = recentLogs.filter(log => log.level === 'error');
    
    return {
      type: 'overview',
      timestamp: new Date().toISOString(),
      summary: {
        totalLogs: this.logs.length,
        recentLogs: recentLogs.length,
        errorCount: errorLogs.length,
        errorRate: recentLogs.length > 0 ? (errorLogs.length / recentLogs.length * 100).toFixed(2) : 0
      },
      categories: this.getCategoryBreakdown(),
      topErrors: this.getTopErrors(),
      performance: this.getPerformanceSummary()
    };
  }

  /**
   * تقرير الأداء
   * @returns {object} تقرير الأداء
   */
  generatePerformanceReport() {
    return {
      type: 'performance',
      timestamp: new Date().toISOString(),
      operations: Object.entries(this.metrics.performance).map(([operation, times]) => ({
        operation,
        count: times.length,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times)
      })),
      alerts: this.getPerformanceAlerts()
    };
  }

  /**
   * تقرير الأخطاء
   * @returns {object} تقرير الأخطاء
   */
  generateErrorReport() {
    const errorLogs = this.logs.filter(log => log.level === 'error');
    
    return {
      type: 'errors',
      timestamp: new Date().toISOString(),
      totalErrors: errorLogs.length,
      errorsByCategory: this.groupErrorsByCategory(errorLogs),
      recentErrors: errorLogs.slice(-10),
      errorTrends: this.getErrorTrends(),
      recommendations: this.getErrorRecommendations()
    };
  }

  /**
   * تقرير النشاط
   * @returns {object} تقرير النشاط
   */
  generateActivityReport() {
    return {
      type: 'activity',
      timestamp: new Date().toISOString(),
      hourlyActivity: this.metrics.userActivity,
      topCategories: this.getTopCategories(),
      userPatterns: this.analyzeUserPatterns()
    };
  }

  /**
   * الحصول على استخدام الذاكرة
   * @returns {number} نسبة الاستخدام
   */
  getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      const used = performance.memory.usedJSHeapSize;
      const total = performance.memory.totalJSHeapSize;
      return Math.round((used / total) * 100);
    }
    return null;
  }

  /**
   * تنظيف السجلات القديمة
   */
  cleanupOldLogs() {
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }
  }

  /**
   * حفظ السجلات
   */
  persistLogs() {
    try {
      const recentLogs = this.logs.slice(-1000); // حفظ آخر 1000 سجل فقط
      localStorage.setItem('return_logger_data', JSON.stringify(recentLogs));
    } catch (error) {
      console.warn('فشل في حفظ السجلات:', error);
    }
  }

  /**
   * تحميل السجلات
   */
  loadLogs() {
    try {
      const stored = localStorage.getItem('return_logger_data');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('فشل في تحميل السجلات:', error);
    }
  }

  /**
   * إنشاء مولدات التقارير
   */
  initializeReportGenerators() {
    this.reportGenerators.set('overview', this.generateOverviewReport.bind(this));
    this.reportGenerators.set('performance', this.generatePerformanceReport.bind(this));
    this.reportGenerators.set('errors', this.generateErrorReport.bind(this));
    this.reportGenerators.set('activity', this.generateActivityReport.bind(this));
  }

  // دوال مساعدة للتقارير
  getCategoryBreakdown() {
    const categories = {};
    this.logs.forEach(log => {
      categories[log.category] = (categories[log.category] || 0) + 1;
    });
    return categories;
  }

  getTopErrors() {
    const errors = this.logs.filter(log => log.level === 'error');
    return errors.slice(-10).map(error => ({
      message: error.message,
      category: error.category,
      timestamp: error.timestamp
    }));
  }

  getPerformanceSummary() {
    const perfOperations = Object.keys(this.metrics.performance);
    return {
      totalOperations: perfOperations.length,
      averageResponseTime: this.calculateAverageResponseTime()
    };
  }

  calculateAverageResponseTime() {
    const allTimes = Object.values(this.metrics.performance).flat();
    return allTimes.length > 0 ? 
      Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length) : 0;
  }

  getTopCategories() {
    const categories = this.getCategoryBreakdown();
    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
  }

  analyzeUserPatterns() {
    const hourlyActivity = this.metrics.userActivity;
    const peakHour = Object.entries(hourlyActivity).reduce((a, b) => 
      hourlyActivity[a[0]] > hourlyActivity[b[0]] ? a : b, ['0', 0]);
    
    return {
      peakHour: parseInt(peakHour[0]),
      peakActivity: peakHour[1],
      totalActivity: Object.values(hourlyActivity).reduce((a, b) => a + b, 0)
    };
  }
}

const ReturnLogger = ({ children, enableMonitoring = true, autoReport = true }) => {
  const [loggerManager] = useState(() => new ReturnLoggerManager());
  const [currentReport, setCurrentReport] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(enableMonitoring);
  const [reportType, setReportType] = useState('overview');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isMonitoring && autoReport) {
      // إنشاء تقرير تلقائي كل 5 دقائق
      intervalRef.current = setInterval(() => {
        generateReport();
      }, 5 * 60 * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, autoReport]);

  const generateReport = useCallback((type = reportType) => {
    try {
      const report = loggerManager.generateSmartReport(type);
      setCurrentReport(report);
      return report;
    } catch (error) {
      loggerManager.error('REPORT_GENERATION', 'فشل في إنشاء التقرير', { error: error.message });
    }
  }, [loggerManager, reportType]);

  const contextValue = {
    loggerManager,
    isMonitoring,
    setIsMonitoring,
    currentReport,
    generateReport,
    log: loggerManager.log.bind(loggerManager),
    info: loggerManager.info.bind(loggerManager),
    warn: loggerManager.warn.bind(loggerManager),
    error: loggerManager.error.bind(loggerManager),
    trackError: loggerManager.trackError.bind(loggerManager),
    trackPerformance: loggerManager.trackPerformance.bind(loggerManager)
  };

  return (
    <ReturnLoggerContext.Provider value={contextValue}>
      <div className="return-logger-wrapper">
        {children}
        
        {/* لوحة التحكم في السجل */}
        {isMonitoring && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
              <h3 className="text-lg font-semibold mb-2">📊 مراقبة النظام</h3>
              
              <div className="flex space-x-2 mb-3">
                <button
                  onClick={() => generateReport('overview')}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  عام
                </button>
                <button
                  onClick={() => generateReport('performance')}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                >
                  أداء
                </button>
                <button
                  onClick={() => generateReport('errors')}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                >
                  أخطاء
                </button>
              </div>

              {currentReport && (
                <div className="text-sm">
                  <div className="text-gray-600 mb-1">
                    آخر تقرير: {new Date(currentReport.timestamp).toLocaleTimeString('ar-SA')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentReport.type} - {currentReport.summary?.totalLogs || 'غير متوفر'} سجل
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ReturnLoggerContext.Provider>
  );
};

// سياق المراقب
const ReturnLoggerContext = React.createContext();

export default ReturnLogger;
export { ReturnLoggerManager };
export { ReturnLoggerContext };