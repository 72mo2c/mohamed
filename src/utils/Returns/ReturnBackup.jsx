/**
 * نظام النسخ الاحتياطي - ReturnBackup.jsx
 * نظام نسخ احتياطي متقدم لحماية البيانات وضمان الاستعادة
 * يتضمن: نسخ احتياطي تلقائي، استعادة البيانات، مراقبة سلامة البيانات، نظام إنذار
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';

class ReturnBackupManager {
  constructor() {
    this.backupSchedule = {
      automatic: true,
      interval: 24 * 60 * 60 * 1000, // 24 ساعة
      retention: 30, // الاحتفاظ بـ 30 نسخة احتياطية
      compressionLevel: 6
    };
    this.backupHistory = [];
    this.integrityChecks = [];
    this.alerts = [];
    this.storageLimit = 500 * 1024 * 1024; // 500 MB
    this.currentBackup = null;
    this.backupLocation = 'localStorage'; // أو 'cloud', 'server'
    this.compressionEnabled = true;
  }

  /**
   * إنشاء نسخة احتياطية تلقائية
   * @param {object} options - خيارات النسخ الاحتياطي
   * @returns {Promise<object>} معلومات النسخة الاحتياطية
   */
  async createAutomaticBackup(options = {}) {
    try {
      this.log('BACKUP_START', 'بدء النسخ الاحتياطي التلقائي');
      
      const backupId = this.generateBackupId();
      const backupData = await this.collectDataForBackup();
      const backupMetadata = {
        id: backupId,
        timestamp: new Date().toISOString(),
        type: 'automatic',
        size: JSON.stringify(backupData).length,
        version: '1.0',
        checksum: await this.calculateChecksum(backupData),
        options: { ...this.backupSchedule, ...options }
      };

      // ضغط البيانات
      let processedData = backupData;
      if (this.compressionEnabled) {
        processedData = await this.compressData(backupData);
      }

      // حفظ النسخة الاحتياطية
      const backupLocation = await this.saveBackup(processedData, backupMetadata);

      // إضافة إلى السجل
      const backupEntry = {
        ...backupMetadata,
        location: backupLocation,
        status: 'completed',
        duration: Date.now() - new Date(backupMetadata.timestamp).getTime(),
        dataSize: processedData.size || JSON.stringify(processedData).length
      };

      this.backupHistory.push(backupEntry);
      this.cleanupOldBackups();
      this.log('BACKUP_COMPLETED', 'تمت عملية النسخ الاحتياطي بنجاح', backupEntry);

      return backupEntry;
    } catch (error) {
      this.log('BACKUP_ERROR', 'فشل في النسخ الاحتياطي', { error: error.message });
      throw new Error(`فشل في إنشاء النسخة الاحتياطية: ${error.message}`);
    }
  }

  /**
   * إنشاء نسخة احتياطية يدوية
   * @param {string} label - تسمية النسخة الاحتياطية
   * @param {object} options - الخيارات
   * @returns {Promise<object>} معلومات النسخة الاحتياطية
   */
  async createManualBackup(label = 'نسخة احتياطية يدوية', options = {}) {
    try {
      this.log('MANUAL_BACKUP_START', `بدء النسخ الاحتياطي اليدوي: ${label}`);
      
      const backupId = this.generateBackupId();
      const backupData = await this.collectDataForBackup();
      const backupMetadata = {
        id: backupId,
        timestamp: new Date().toISOString(),
        type: 'manual',
        label,
        size: JSON.stringify(backupData).length,
        version: '1.0',
        checksum: await this.calculateChecksum(backupData),
        options
      };

      // ضغط البيانات
      let processedData = backupData;
      if (this.compressionEnabled) {
        processedData = await this.compressData(backupData);
      }

      // حفظ النسخة الاحتياطية
      const backupLocation = await this.saveBackup(processedData, backupMetadata);

      const backupEntry = {
        ...backupMetadata,
        location: backupLocation,
        status: 'completed',
        duration: Date.now() - new Date(backupMetadata.timestamp).getTime(),
        dataSize: processedData.size || JSON.stringify(processedData).length
      };

      this.backupHistory.push(backupEntry);
      this.cleanupOldBackups();
      this.log('MANUAL_BACKUP_COMPLETED', 'تمت عملية النسخ الاحتياطي اليدوي بنجاح', backupEntry);

      return backupEntry;
    } catch (error) {
      this.log('MANUAL_BACKUP_ERROR', 'فشل في النسخ الاحتياطي اليدوي', { error: error.message });
      throw new Error(`فشل في إنشاء النسخة الاحتياطية اليدوية: ${error.message}`);
    }
  }

  /**
   * جمع البيانات للنسخ الاحتياطي
   * @returns {Promise<object>} البيانات المجمعة
   */
  async collectDataForBackup() {
    const data = {
      returns: await this.getReturnsData(),
      users: await this.getUsersData(),
      settings: await this.getSettingsData(),
      security: await this.getSecurityData(),
      logs: await this.getLogsData(),
      metadata: {
        collectionTime: new Date().toISOString(),
        version: '1.0',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    this.log('DATA_COLLECTED', 'تم جمع البيانات للنسخ الاحتياطي', {
      returnsCount: data.returns.length,
      usersCount: data.users.length,
      settingsCount: Object.keys(data.settings).length
    });

    return data;
  }

  /**
   * الحصول على بيانات الإرجاع
   * @returns {Promise<array>} بيانات الإرجاع
   */
  async getReturnsData() {
    try {
      const returns = localStorage.getItem('return_data');
      return returns ? JSON.parse(returns) : [];
    } catch (error) {
      this.log('DATA_COLLECTION_ERROR', 'خطأ في جمع بيانات الإرجاع', { error: error.message });
      return [];
    }
  }

  /**
   * الحصول على بيانات المستخدمين
   * @returns {Promise<array>} بيانات المستخدمين
   */
  async getUsersData() {
    try {
      const users = localStorage.getItem('user_data');
      return users ? JSON.parse(users) : [];
    } catch (error) {
      this.log('DATA_COLLECTION_ERROR', 'خطأ في جمع بيانات المستخدمين', { error: error.message });
      return [];
    }
  }

  /**
   * الحصول على الإعدادات
   * @returns {Promise<object>} الإعدادات
   */
  async getSettingsData() {
    try {
      const settings = {};
      
      // جمع الإعدادات المختلفة
      const keys = [
        'app_settings', 'user_preferences', 'security_settings', 
        'backup_settings', 'notification_settings'
      ];
      
      keys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            settings[key] = JSON.parse(data);
          } catch (e) {
            settings[key] = data; // حفظ كسلسلة إذا فشل التحليل
          }
        }
      });

      return settings;
    } catch (error) {
      this.log('DATA_COLLECTION_ERROR', 'خطأ في جمع الإعدادات', { error: error.message });
      return {};
    }
  }

  /**
   * الحصول على بيانات الأمان
   * @returns {Promise<object>} بيانات الأمان
   */
  async getSecurityData() {
    try {
      const security = {
        auditLog: localStorage.getItem('return_security_audit'),
        sessions: localStorage.getItem('return_security_session'),
        permissions: localStorage.getItem('user_permissions')
      };
      
      // تنظيف البيانات الحساسة
      Object.keys(security).forEach(key => {
        if (security[key]) {
          try {
            security[key] = JSON.parse(security[key]);
          } catch (e) {
            security[key] = security[key];
          }
        }
      });

      return security;
    } catch (error) {
      this.log('DATA_COLLECTION_ERROR', 'خطأ في جمع بيانات الأمان', { error: error.message });
      return {};
    }
  }

  /**
   * الحصول على السجلات
   * @returns {Promise<array>} السجلات
   */
  async getLogsData() {
    try {
      const logs = localStorage.getItem('return_logger_data');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      this.log('DATA_COLLECTION_ERROR', 'خطأ في جمع السجلات', { error: error.message });
      return [];
    }
  }

  /**
   * ضغط البيانات
   * @param {object} data - البيانات المراد ضغطها
   * @returns {Promise<object>} البيانات المضغوطة
   */
  async compressData(data) {
    try {
      const zip = new JSZip();
      const jsonString = JSON.stringify(data, null, 2);
      zip.file('backup.json', jsonString);
      
      const compressed = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: this.backupSchedule.compressionLevel }
      });

      return {
        data: compressed,
        size: compressed.size,
        originalSize: jsonString.length,
        compressed: true
      };
    } catch (error) {
      this.log('COMPRESSION_ERROR', 'خطأ في ضغط البيانات', { error: error.message });
      return { data, compressed: false };
    }
  }

  /**
   * حفظ النسخة الاحتياطية
   * @param {object} data - البيانات
   * @param {object} metadata - معلومات النسخة الاحتياطية
   * @returns {Promise<string>} موقع النسخة الاحتياطية
   */
  async saveBackup(data, metadata) {
    try {
      const backupKey = `return_backup_${metadata.id}`;
      
      if (this.backupLocation === 'localStorage') {
        // حفظ في localStorage
        const backupObject = {
          metadata,
          data: data.compressed ? await this.blobToBase64(data.data) : JSON.stringify(data.data)
        };
        localStorage.setItem(backupKey, JSON.stringify(backupObject));
        return `localStorage:${backupKey}`;
      } else {
        // يمكن توسيع هذا لدعم التخزين السحابي
        throw new Error('التخزين السحابي غير مدعوم حالياً');
      }
    } catch (error) {
      this.log('BACKUP_SAVE_ERROR', 'خطأ في حفظ النسخة الاحتياطية', { error: error.message });
      throw error;
    }
  }

  /**
   * استعادة البيانات من النسخة الاحتياطية
   * @param {string} backupId - معرف النسخة الاحتياطية
   * @param {object} options - خيارات الاستعادة
   * @returns {Promise<object>} البيانات المستعادة
   */
  async restoreBackup(backupId, options = {}) {
    try {
      this.log('RESTORE_START', `بدء استعادة النسخة الاحتياطية: ${backupId}`);
      
      // العثور على النسخة الاحتياطية
      const backupEntry = this.backupHistory.find(entry => entry.id === backupId);
      if (!backupEntry) {
        throw new Error('النسخة الاحتياطية غير موجودة');
      }

      // تحميل النسخة الاحتياطية
      const backupData = await this.loadBackup(backupEntry.location);
      
      // فحص سلامة البيانات
      const integrityCheck = await this.verifyBackupIntegrity(backupData, backupEntry);
      if (!integrityCheck.valid) {
        throw new Error(`فشل فحص سلامة البيانات: ${integrityCheck.reason}`);
      }

      // فك ضغط البيانات إذا لزم الأمر
      let restoredData = backupData;
      if (backupEntry.checksum) {
        restoredData = await this.decompressData(backupData);
      }

      // استعادة البيانات
      await this.restoreData(restoredData, options);

      this.log('RESTORE_COMPLETED', 'تمت عملية الاستعادة بنجاح', {
        backupId,
        dataSize: restoredData.dataSize || 'غير محدد'
      });

      return {
        success: true,
        restoredData,
        backupEntry,
        restoreTime: new Date().toISOString()
      };
    } catch (error) {
      this.log('RESTORE_ERROR', 'فشل في استعادة النسخة الاحتياطية', { 
        backupId, 
        error: error.message 
      });
      throw new Error(`فشل في استعادة النسخة الاحتياطية: ${error.message}`);
    }
  }

  /**
   * تحميل النسخة الاحتياطية
   * @param {string} location - موقع النسخة الاحتياطية
   * @returns {Promise<object>} النسخة الاحتياطية
   */
  async loadBackup(location) {
    try {
      if (location.startsWith('localStorage:')) {
        const key = location.replace('localStorage:', '');
        const backupObject = JSON.parse(localStorage.getItem(key) || '{}');
        return backupObject;
      } else {
        throw new Error('موقع النسخ الاحتياطي غير مدعوم');
      }
    } catch (error) {
      this.log('BACKUP_LOAD_ERROR', 'خطأ في تحميل النسخة الاحتياطية', { 
        location, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * فحص سلامة النسخة الاحتياطية
   * @param {object} backupData - بيانات النسخة الاحتياطية
   * @param {object} backupEntry - معلومات النسخة الاحتياطية
   * @returns {Promise<object>} نتيجة فحص السلامة
   */
  async verifyBackupIntegrity(backupData, backupEntry) {
    try {
      // فحص وجود البيانات الأساسية
      if (!backupData.metadata || !backupData.data) {
        return { valid: false, reason: 'بيانات غير مكتملة' };
      }

      // فحص الوقت
      const backupTime = new Date(backupData.metadata.timestamp);
      const now = new Date();
      const ageInDays = (now - backupTime) / (1000 * 60 * 60 * 24);
      
      if (ageInDays > 365) {
        return { valid: false, reason: 'النسخة الاحتياطية قديمة جداً' };
      }

      // فحص حجم البيانات
      if (backupData.metadata.size < 100) {
        return { valid: false, reason: 'حجم البيانات غير طبيعي' };
      }

      // فحص التحقق من التجزئة إذا كان متاحاً
      if (backupEntry.checksum) {
        const currentChecksum = await this.calculateChecksum(backupData);
        if (currentChecksum !== backupEntry.checksum) {
          return { valid: false, reason: 'فشل فحص التحقق من التجزئة' };
        }
      }

      const integrityResult = {
        valid: true,
        backupAge: Math.round(ageInDays),
        fileSize: backupData.metadata.size,
        timestamp: backupData.metadata.timestamp
      };

      this.integrityChecks.push({
        backupId: backupEntry.id,
        timestamp: new Date().toISOString(),
        result: integrityResult
      });

      return integrityResult;
    } catch (error) {
      return { valid: false, reason: `خطأ في فحص السلامة: ${error.message}` };
    }
  }

  /**
   * فك ضغط البيانات
   * @param {object} compressedData - البيانات المضغوطة
   * @returns {Promise<object>} البيانات الأصلية
   */
  async decompressData(compressedData) {
    try {
      if (!compressedData.data) {
        return compressedData.data;
      }

      if (typeof compressedData.data === 'string') {
        // البيانات مخزنة كنص (غير مضغوطة)
        return JSON.parse(compressedData.data);
      } else {
        // البيانات مضغوطة
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(compressedData.data);
        const jsonString = await zipContent.file('backup.json').async('string');
        return JSON.parse(jsonString);
      }
    } catch (error) {
      this.log('DECOMPRESSION_ERROR', 'خطأ في فك ضغط البيانات', { error: error.message });
      throw error;
    }
  }

  /**
   * استعادة البيانات الفعلية
   * @param {object} restoredData - البيانات المراد استعادتها
   * @param {object} options - خيارات الاستعادة
   */
  async restoreData(restoredData, options = {}) {
    try {
      // إنشاء نسخة احتياطية من البيانات الحالية قبل الاستعادة
      if (options.createBackupBeforeRestore) {
        await this.createManualBackup('استعادة النسخة الاحتياطية', { 
          reason: 'قبل الاستعادة' 
        });
      }

      // استعادة البيانات المختلفة
      if (restoredData.returns) {
        localStorage.setItem('return_data', JSON.stringify(restoredData.returns));
      }

      if (restoredData.users) {
        localStorage.setItem('user_data', JSON.stringify(restoredData.users));
      }

      if (restoredData.settings) {
        Object.entries(restoredData.settings).forEach(([key, value]) => {
          localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
        });
      }

      if (restoredData.security) {
        Object.entries(restoredData.security).forEach(([key, value]) => {
          localStorage.setItem(`return_security_${key}`, 
            typeof value === 'object' ? JSON.stringify(value) : value);
        });
      }

      if (restoredData.logs) {
        localStorage.setItem('return_logger_data', JSON.stringify(restoredData.logs));
      }

      this.log('DATA_RESTORED', 'تمت استعادة البيانات بنجاح', {
        returnsCount: restoredData.returns?.length || 0,
        usersCount: restoredData.users?.length || 0
      });
    } catch (error) {
      this.log('DATA_RESTORE_ERROR', 'خطأ في استعادة البيانات', { error: error.message });
      throw error;
    }
  }

  /**
   * مراقبة سلامة البيانات
   * @param {object} options - خيارات المراقبة
   * @returns {Promise<object>} تقرير سلامة البيانات
   */
  async monitorDataIntegrity(options = {}) {
    try {
      this.log('INTEGRITY_CHECK_START', 'بدء فحص سلامة البيانات');
      
      const integrityReport = {
        timestamp: new Date().toISOString(),
        checks: [],
        overallStatus: 'healthy',
        issues: []
      };

      // فحص الإرجاعات
      const returnsCheck = await this.checkReturnsIntegrity();
      integrityReport.checks.push(returnsCheck);

      // فحص المستخدمين
      const usersCheck = await this.checkUsersIntegrity();
      integrityReport.checks.push(usersCheck);

      // فحص الإعدادات
      const settingsCheck = await this.checkSettingsIntegrity();
      integrityReport.checks.push(settingsCheck);

      // فحص النسخ الاحتياطية
      const backupCheck = await this.checkBackupsIntegrity();
      integrityReport.checks.push(backupCheck);

      // تحديد الحالة العامة
      const hasIssues = integrityReport.checks.some(check => !check.healthy);
      integrityReport.overallStatus = hasIssues ? 'issues_found' : 'healthy';
      
      if (hasIssues) {
        integrityReport.issues = integrityReport.checks
          .filter(check => !check.healthy)
          .map(check => check.description);
      }

      this.log('INTEGRITY_CHECK_COMPLETED', 'اكتمل فحص سلامة البيانات', integrityReport);
      return integrityReport;
    } catch (error) {
      this.log('INTEGRITY_CHECK_ERROR', 'خطأ في فحص سلامة البيانات', { error: error.message });
      throw error;
    }
  }

  /**
   * فحص سلامة بيانات الإرجاع
   * @returns {Promise<object>} نتيجة الفحص
   */
  async checkReturnsIntegrity() {
    try {
      const returns = await this.getReturnsData();
      const issues = [];
      
      // فحص البيانات المطلوبة
      if (!Array.isArray(returns)) {
        issues.push('بيانات الإرجاع ليست مصفوفة');
      }

      // فحص السجلات الفارغة
      const emptyReturns = returns.filter(ret => !ret.id || !ret.status);
      if (emptyReturns.length > 0) {
        issues.push(`${emptyReturns.length} سجل إرجاع ناقص البيانات`);
      }

      return {
        type: 'returns',
        healthy: issues.length === 0,
        count: returns.length,
        issues,
        description: `فحص بيانات الإرجاع (${returns.length} سجل)`
      };
    } catch (error) {
      return {
        type: 'returns',
        healthy: false,
        count: 0,
        issues: [error.message],
        description: 'خطأ في فحص بيانات الإرجاع'
      };
    }
  }

  /**
   * فحص سلامة بيانات المستخدمين
   * @returns {Promise<object>} نتيجة الفحص
   */
  async checkUsersIntegrity() {
    try {
      const users = await this.getUsersData();
      const issues = [];
      
      if (!Array.isArray(users)) {
        issues.push('بيانات المستخدمين ليست مصفوفة');
      }

      const usersWithoutId = users.filter(user => !user.id);
      if (usersWithoutId.length > 0) {
        issues.push(`${usersWithoutId.length} مستخدم بدون معرف`);
      }

      return {
        type: 'users',
        healthy: issues.length === 0,
        count: users.length,
        issues,
        description: `فحص بيانات المستخدمين (${users.length} مستخدم)`
      };
    } catch (error) {
      return {
        type: 'users',
        healthy: false,
        count: 0,
        issues: [error.message],
        description: 'خطأ في فحص بيانات المستخدمين'
      };
    }
  }

  /**
   * فحص سلامة الإعدادات
   * @returns {Promise<object>} نتيجة الفحص
   */
  async checkSettingsIntegrity() {
    try {
      const settings = await this.getSettingsData();
      const issues = [];
      
      const requiredSettings = ['app_settings', 'security_settings'];
      const missingSettings = requiredSettings.filter(key => !settings[key]);
      
      if (missingSettings.length > 0) {
        issues.push(`إعدادات مفقودة: ${missingSettings.join(', ')}`);
      }

      return {
        type: 'settings',
        healthy: issues.length === 0,
        count: Object.keys(settings).length,
        issues,
        description: `فحص الإعدادات (${Object.keys(settings).length} مجموعة)`
      };
    } catch (error) {
      return {
        type: 'settings',
        healthy: false,
        count: 0,
        issues: [error.message],
        description: 'خطأ في فحص الإعدادات'
      };
    }
  }

  /**
   * فحص سلامة النسخ الاحتياطية
   * @returns {Promise<object>} نتيجة الفحص
   */
  async checkBackupsIntegrity() {
    try {
      const issues = [];
      
      // فحص عدد النسخ الاحتياطية
      if (this.backupHistory.length === 0) {
        issues.push('لا توجد نسخ احتياطية');
      }

      // فحص عمر آخر نسخة احتياطية
      const lastBackup = this.backupHistory[this.backupHistory.length - 1];
      if (lastBackup) {
        const lastBackupTime = new Date(lastBackup.timestamp);
        const now = new Date();
        const hoursSinceLastBackup = (now - lastBackupTime) / (1000 * 60 * 60);
        
        if (hoursSinceLastBackup > 48) {
          issues.push(`آخر نسخة احتياطية قديمة: ${Math.round(hoursSinceLastBackup)} ساعة`);
        }
      }

      return {
        type: 'backups',
        healthy: issues.length === 0,
        count: this.backupHistory.length,
        issues,
        description: `فحص النسخ الاحتياطية (${this.backupHistory.length} نسخة)`
      };
    } catch (error) {
      return {
        type: 'backups',
        healthy: false,
        count: 0,
        issues: [error.message],
        description: 'خطأ في فحص النسخ الاحتياطية'
      };
    }
  }

  /**
   * نظام إنذار النسخ الاحتياطي
   * @param {string} alertType - نوع الإنذار
   * @param {object} data - بيانات الإنذار
   */
  triggerBackupAlert(alertType, data = {}) {
    const alert = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: alertType,
      data,
      severity: this.getAlertSeverity(alertType),
      message: this.getAlertMessage(alertType, data)
    };

    this.alerts.push(alert);
    this.cleanupOldAlerts();
    this.sendAlert(alert);

    this.log('BACKUP_ALERT', `إنذار نسخ احتياطي: ${alert.message}`, alert);
  }

  /**
   * تحديد شدة الإنذار
   * @param {string} alertType - نوع الإنذار
   * @returns {string} مستوى الشدة
   */
  getAlertSeverity(alertType) {
    const severityMap = {
      'BACKUP_FAILED': 'high',
      'STORAGE_FULL': 'high',
      'INTEGRITY_FAILED': 'medium',
      'BACKUP_OLD': 'medium',
      'RESTORE_SUCCESS': 'low'
    };
    return severityMap[alertType] || 'medium';
  }

  /**
   * الحصول على رسالة الإنذار
   * @param {string} alertType - نوع الإنذار
   * @param {object} data - البيانات
   * @returns {string} الرسالة
   */
  getAlertMessage(alertType, data) {
    const messageMap = {
      'BACKUP_FAILED': `فشل في إنشاء النسخة الاحتياطية: ${data.error}`,
      'STORAGE_FULL': 'مساحة التخزين ممتلئة',
      'INTEGRITY_FAILED': `فشل في فحص سلامة البيانات: ${data.reason}`,
      'BACKUP_OLD': 'النسخة الاحتياطية قديمة',
      'RESTORE_SUCCESS': 'تمت الاستعادة بنجاح'
    };
    return messageMap[alertType] || `إنذار غير محدد: ${alertType}`;
  }

  /**
   * إرسال الإنذار
   * @param {object} alert - الإنذار
   */
  sendAlert(alert) {
    // يمكن توسيع هذا لإرسال إشعارات فعلية
    console.warn(`🔔 إنذار النسخ الاحتياطي:`, alert.message);

    if (alert.severity === 'high') {
      // إرسال إشعار عاجل
      this.sendUrgentNotification(alert);
    }
  }

  /**
   * إرسال إشعار عاجل
   * @param {object} alert - الإنذار
   */
  sendUrgentNotification(alert) {
    // منطق الإشعار العاجل (بريد إلكتروني، SMS، إلخ)
    console.error(`🚨 إشعار عاجل: ${alert.message}`);
  }

  /**
   * تنظيف النسخ القديمة
   */
  cleanupOldBackups() {
    if (this.backupHistory.length > this.backupSchedule.retention) {
      const backupsToDelete = this.backupHistory.length - this.backupSchedule.retention;
      const oldBackups = this.backupHistory.splice(0, backupsToDelete);
      
      // حذف النسخ من localStorage
      oldBackups.forEach(backup => {
        const key = `return_backup_${backup.id}`;
        localStorage.removeItem(key);
      });

      this.log('BACKUP_CLEANUP', `تم حذف ${backupsToDelete} نسخة احتياطية قديمة`);
    }
  }

  /**
   * تنظيف الإنذارات القديمة
   */
  cleanupOldAlerts() {
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * حساب التحقق من التجزئة
   * @param {object} data - البيانات
   * @returns {Promise<string>} التحقق من التجزئة
   */
  async calculateChecksum(data) {
    const str = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * تحويل Blob إلى base64
   * @param {Blob} blob - الملف
   * @returns {Promise<string>} البيانات بـ base64
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * توليد معرف النسخة الاحتياطية
   * @returns {string} المعرف
   */
  generateBackupId() {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * تسجيل الأحداث
   * @param {string} event - الحدث
   * @param {string} message - الرسالة
   * @param {object} data - البيانات
   */
  log(event, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      message,
      data
    };
    
    console.log(`[ReturnBackup] ${message}`, data);
  }

  /**
   * الحصول على تاريخ النسخ الاحتياطي
   * @returns {array} تاريخ النسخ الاحتياطية
   */
  getBackupHistory() {
    return [...this.backupHistory].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  /**
   * الحصول على الإنذارات
   * @returns {array} قائمة الإنذارات
   */
  getAlerts() {
    return [...this.alerts].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  /**
   * إعداد النسخ الاحتياطي التلقائي
   * @param {object} schedule - جدولة النسخ الاحتياطي
   */
  setupAutomaticBackup(schedule = {}) {
    this.backupSchedule = { ...this.backupSchedule, ...schedule };
    this.log('AUTO_BACKUP_SETUP', 'تم إعداد النسخ الاحتياطي التلقائي', this.backupSchedule);
  }
}

const ReturnBackup = ({ children, enableAutoBackup = true, backupInterval = 24 }) => {
  const [backupManager] = useState(() => new ReturnBackupManager());
  const [backupHistory, setBackupHistory] = useState([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupStatus, setLastBackupStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [integrityReport, setIntegrityReport] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (enableAutoBackup) {
      // إعداد النسخ الاحتياطي التلقائي
      backupManager.setupAutomaticBackup({
        interval: backupInterval * 60 * 60 * 1000 // تحويل إلى ميلي ثانية
      });

      // بدء النسخ الاحتياطي التلقائي
      startAutomaticBackup();

      // فحص سلامة البيانات كل ساعة
      intervalRef.current = setInterval(() => {
        checkDataIntegrity();
      }, 60 * 60 * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enableAutoBackup, backupInterval]);

  /**
   * بدء النسخ الاحتياطي التلقائي
   */
  const startAutomaticBackup = useCallback(async () => {
    try {
      const backup = await backupManager.createAutomaticBackup();
      setBackupHistory(backupManager.getBackupHistory());
      setLastBackupStatus({ success: true, timestamp: backup.timestamp });
    } catch (error) {
      setLastBackupStatus({ success: false, error: error.message });
      backupManager.triggerBackupAlert('BACKUP_FAILED', { error: error.message });
    }
  }, [backupManager]);

  /**
   * إنشاء نسخة احتياطية يدوية
   */
  const createManualBackup = useCallback(async (label = 'نسخة احتياطية يدوية') => {
    setIsBackingUp(true);
    try {
      const backup = await backupManager.createManualBackup(label);
      setBackupHistory(backupManager.getBackupHistory());
      setLastBackupStatus({ success: true, timestamp: backup.timestamp });
      return backup;
    } catch (error) {
      setLastBackupStatus({ success: false, error: error.message });
      backupManager.triggerBackupAlert('BACKUP_FAILED', { error: error.message });
      throw error;
    } finally {
      setIsBackingUp(false);
    }
  }, [backupManager]);

  /**
   * استعادة نسخة احتياطية
   */
  const restoreBackup = useCallback(async (backupId, options = {}) => {
    try {
      const result = await backupManager.restoreBackup(backupId, options);
      backupManager.triggerBackupAlert('RESTORE_SUCCESS', { backupId });
      return result;
    } catch (error) {
      backupManager.triggerBackupAlert('RESTORE_FAILED', { backupId, error: error.message });
      throw error;
    }
  }, [backupManager]);

  /**
   * فحص سلامة البيانات
   */
  const checkDataIntegrity = useCallback(async () => {
    try {
      const report = await backupManager.monitorDataIntegrity();
      setIntegrityReport(report);
      
      if (report.overallStatus === 'issues_found') {
        backupManager.triggerBackupAlert('INTEGRITY_FAILED', { 
          issues: report.issues 
        });
      }
      
      return report;
    } catch (error) {
      backupManager.triggerBackupAlert('INTEGRITY_CHECK_ERROR', { error: error.message });
    }
  }, [backupManager]);

  /**
   * تحديث حالة النسخ الاحتياطي
   */
  const refreshBackupStatus = useCallback(() => {
    setBackupHistory(backupManager.getBackupHistory());
    setAlerts(backupManager.getAlerts());
  }, [backupManager]);

  const contextValue = {
    backupManager,
    backupHistory,
    isBackingUp,
    lastBackupStatus,
    alerts,
    integrityReport,
    createManualBackup,
    restoreBackup,
    checkDataIntegrity,
    refreshBackupStatus,
    startAutomaticBackup
  };

  return (
    <ReturnBackupContext.Provider value={contextValue}>
      <div className="return-backup-wrapper">
        {children}
        
        {/* لوحة النسخ الاحتياطي */}
        {isBackingUp && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 max-w-sm">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-700">جاري إنشاء النسخة الاحتياطية...</span>
              </div>
            </div>
          </div>
        )}

        {/* مؤشر حالة النسخ الاحتياطي */}
        <div className="fixed bottom-4 left-4 z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
            <h3 className="text-lg font-semibold mb-2">💾 النسخ الاحتياطي</h3>
            
            {lastBackupStatus && (
              <div className={`text-sm mb-2 ${lastBackupStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                {lastBackupStatus.success ? '✅' : '❌'} 
                {lastBackupStatus.success ? 'آخر نسخة احتياطية ناجحة' : `فشل: ${lastBackupStatus.error}`}
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              {backupHistory.length} نسخة احتياطية محفوظة
            </div>
            
            {alerts.length > 0 && (
              <div className="mt-2 text-xs text-orange-600">
                🔔 {alerts.length} إنذار جديد
              </div>
            )}
          </div>
        </div>
      </div>
    </ReturnBackupContext.Provider>
  );
};

// سياق النسخ الاحتياطي
const ReturnBackupContext = React.createContext();

export default ReturnBackup;
export { ReturnBackupManager };
export { ReturnBackupContext };