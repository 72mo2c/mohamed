// ======================================
// Smart System Integration - التكامل الذكي مع النظام
// ======================================

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Modal from '../../components/Common/Modal';
import { 
  FaCog, 
  FaDatabase,
  FaChartLine,
  FaSync,
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCogs,
  FaNetworkWired,
  FaShieldAlt,
  FaClock,
  FaServer,
  FaCode,
  FaLink,
  FaExchangeAlt,
  FaBell,
  FaDownload,
  FaUpload,
  FaRefresh,
  FaBug,
  FaSave,
  FaUndo,
  FaPlay,
  FaPause,
  FaStop,
  FaTools,
  FaKey,
  FaLock,
  FaUnlock,
  FaGlobe,
  FaCloud,
  FaWifi,
  FaSignal,
  FaTasks,
  FaHistory,
  FaSettings,
  FaDesktop,
  FaMobile,
  FaTablet
} from 'react-icons/fa';

// مكون حالة الاتصال
const ConnectionStatus = ({ status, name, lastSync }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'disconnected': return 'text-red-600 bg-red-100';
      case 'syncing': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <FaCheck className="text-green-500" />;
      case 'disconnected': return <FaExclamationTriangle className="text-red-500" />;
      case 'syncing': return <FaSync className="text-blue-500 animate-spin" />;
      case 'error': return <FaBug className="text-yellow-500" />;
      default: return <FaInfoCircle className="text-gray-500" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${getStatusColor(status).split(' ')[1]}`}>
          <div className="w-full h-full rounded-full flex items-center justify-center">
            {getStatusIcon(status)}
          </div>
        </div>
        <div>
          <h4 className="font-semibold">{name}</h4>
          <p className="text-sm text-gray-600">
            آخر مزامنة: {lastSync ? new Date(lastSync).toLocaleString('ar-EG') : 'لم يتم'}
          </p>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
        {status === 'connected' && 'متصل'}
        {status === 'disconnected' && 'منفصل'}
        {status === 'syncing' && 'يتم المزامنة'}
        {status === 'error' && 'خطأ'}
      </span>
    </div>
  );
};

// مكون إعدادات التكامل
const IntegrationSettings = ({ system, settings, onUpdate }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(localSettings);
    setHasChanges(false);
    showSuccess('تم حفظ الإعدادات بنجاح');
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="إعدادات المزامنة">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">تكرار المزامنة</label>
              <select
                value={localSettings.syncFrequency || 'auto'}
                onChange={(e) => handleChange('syncFrequency', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="realtime">فوري</option>
                <option value="hourly">كل ساعة</option>
                <option value="daily">يومي</option>
                <option value="manual">يدوي</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">حدود البيانات</label>
              <input
                type="number"
                value={localSettings.dataLimit || 1000}
                onChange={(e) => handleChange('dataLimit', parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="عدد السجلات"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoSync"
                checked={localSettings.autoSync || false}
                onChange={(e) => handleChange('autoSync', e.target.checked)}
                className="ml-2"
              />
              <label htmlFor="autoSync" className="text-sm">مزامنة تلقائية</label>
            </div>
          </div>
        </Card>

        <Card title="الأمان والصلاحيات">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">مستوى الأمان</label>
              <select
                value={localSettings.securityLevel || 'medium'}
                onChange={(e) => handleChange('securityLevel', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">منخفض</option>
                <option value="medium">متوسط</option>
                <option value="high">عالي</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="encryptData"
                checked={localSettings.encryptData || false}
                onChange={(e) => handleChange('encryptData', e.target.checked)}
                className="ml-2"
              />
              <label htmlFor="encryptData" className="text-sm">تشفير البيانات</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="auditLog"
                checked={localSettings.auditLog || false}
                onChange={(e) => handleChange('auditLog', e.target.checked)}
                className="ml-2"
              />
              <label htmlFor="auditLog" className="text-sm">سجل المراجعة</label>
            </div>
          </div>
        </Card>
      </div>

      {hasChanges && (
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="primary" onClick={handleSave} icon={<FaSave />}>
            حفظ التغييرات
          </Button>
          <Button variant="secondary" onClick={handleReset} icon={<FaUndo />}>
            إعادة تعيين
          </Button>
        </div>
      )}
    </div>
  );
};

// مكون سجل الأنشطة
const ActivityLog = ({ logs }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesFilter = filter === 'all' || log.type === filter;
      const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [logs, filter, searchTerm]);

  const getLogIcon = (type) => {
    switch (type) {
      case 'sync': return <FaSync className="text-blue-500" />;
      case 'error': return <FaExclamationTriangle className="text-red-500" />;
      case 'success': return <FaCheck className="text-green-500" />;
      case 'info': return <FaInfoCircle className="text-gray-500" />;
      default: return <FaInfoCircle className="text-gray-500" />;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'sync': return 'border-l-blue-500';
      case 'error': return 'border-l-red-500';
      case 'success': return 'border-l-green-500';
      case 'info': return 'border-l-gray-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* أدوات البحث والفلترة */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="بحث في السجل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">جميع الأنشطة</option>
          <option value="sync">مزامنة</option>
          <option value="error">أخطاء</option>
          <option value="success">نجح</option>
          <option value="info">معلومات</option>
        </select>
      </div>

      {/* قائمة السجل */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredLogs.map((log, index) => (
          <div key={index} className={`p-3 border-l-4 bg-gray-50 rounded-r ${getLogColor(log.type)}`}>
            <div className="flex items-start gap-3">
              {getLogIcon(log.type)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{log.system}</h4>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString('ar-EG')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{log.message}</p>
                {log.details && (
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                      عرض التفاصيل
                    </summary>
                    <pre className="text-xs text-gray-500 mt-1 bg-white p-2 rounded border">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SmartSystemIntegration = () => {
  const { 
    customers,
    suppliers,
    products,
    salesInvoices,
    purchaseInvoices,
    cashReceipts,
    cashDisbursements
  } = useData();
  
  const { settings } = useSystemSettings();
  const { hasPermission } = useAuth();
  const { showWarning, showError, showSuccess, showInfo } = useNotification();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [syncStatus, setSyncStatus] = useState({
    inventory: 'connected',
    accounting: 'connected',
    crm: 'syncing',
    reporting: 'error'
  });
  const [integrationSettings, setIntegrationSettings] = useState({
    inventory: {
      syncFrequency: 'realtime',
      autoSync: true,
      dataLimit: 1000,
      securityLevel: 'high',
      encryptData: true,
      auditLog: true
    },
    accounting: {
      syncFrequency: 'hourly',
      autoSync: true,
      dataLimit: 5000,
      securityLevel: 'high',
      encryptData: true,
      auditLog: true
    },
    crm: {
      syncFrequency: 'manual',
      autoSync: false,
      dataLimit: 2000,
      securityLevel: 'medium',
      encryptData: false,
      auditLog: true
    },
    reporting: {
      syncFrequency: 'daily',
      autoSync: true,
      dataLimit: 10000,
      securityLevel: 'low',
      encryptData: false,
      auditLog: false
    }
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [autoSync, setAutoSync] = useState(true);

  // محاكاة سجل الأنشطة
  useEffect(() => {
    const sampleLogs = [
      {
        system: 'المخزون',
        type: 'sync',
        message: 'تمت مزامنة 150 منتج بنجاح',
        timestamp: new Date(),
        details: { synced: 150, failed: 0 }
      },
      {
        system: 'المحاسبة',
        type: 'success',
        message: 'تم تصدير القوائم المالية',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        details: { transactions: 45, amount: 12500 }
      },
      {
        system: 'نظام CRM',
        type: 'error',
        message: 'فشل في مزامنة بيانات العملاء',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        details: { error: 'Connection timeout', retryCount: 3 }
      },
      {
        system: 'التقارير',
        type: 'info',
        message: 'تم إنشاء تقرير شهري تلقائي',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        details: { reportType: 'monthly', generatedAt: new Date() }
      }
    ];
    setActivityLogs(sampleLogs);
  }, []);

  // حساب إحصائيات التكامل
  const integrationStats = useMemo(() => {
    const totalSystems = Object.keys(syncStatus).length;
    const connectedSystems = Object.values(syncStatus).filter(status => status === 'connected').length;
    const syncingSystems = Object.values(syncStatus).filter(status => status === 'syncing').length;
    const errorSystems = Object.values(syncStatus).filter(status => status === 'error').length;
    
    // حساب عدد السجلات المتزامنة
    const syncedRecords = {
      customers: customers.length,
      suppliers: suppliers.length,
      products: products.length,
      sales: salesInvoices.length,
      purchases: purchaseInvoices.length,
      receipts: cashReceipts.length,
      disbursements: cashDisbursements.length
    };
    
    const totalSynced = Object.values(syncedRecords).reduce((sum, count) => sum + count, 0);
    
    return {
      totalSystems,
      connectedSystems,
      syncingSystems,
      errorSystems,
      connectionRate: totalSystems > 0 ? (connectedSystems / totalSystems) * 100 : 0,
      syncedRecords,
      totalSynced
    };
  }, [syncStatus, customers, suppliers, products, salesInvoices, purchaseInvoices, cashReceipts, cashDisbursements]);

  // تنفيذ مزامنة
  const handleSync = (system) => {
    setSyncStatus(prev => ({ ...prev, [system]: 'syncing' }));
    
    // محاكاة المزامنة
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% نجاح
      setSyncStatus(prev => ({ 
        ...prev, 
        [system]: success ? 'connected' : 'error' 
      }));
      
      // إضافة سجل النشاط
      const newLog = {
        system: system === 'inventory' ? 'المخزون' :
                system === 'accounting' ? 'المحاسبة' :
                system === 'crm' ? 'نظام CRM' : 'التقارير',
        type: success ? 'sync' : 'error',
        message: success ? `تمت مزامنة ${system} بنجاح` : `فشل في مزامنة ${system}`,
        timestamp: new Date(),
        details: { system, success }
      };
      setActivityLogs(prev => [newLog, ...prev]);
      
      showInfo(success ? 'تمت المزامنة بنجاح' : 'فشلت المزامنة');
    }, 2000);
  };

  // مزامنة شاملة
  const handleFullSync = () => {
    Object.keys(syncStatus).forEach(system => {
      if (syncStatus[system] !== 'syncing') {
        handleSync(system);
      }
    });
    showInfo('تم بدء المزامنة الشاملة');
  };

  // تحديث إعدادات التكامل
  const handleUpdateSettings = (system, newSettings) => {
    setIntegrationSettings(prev => ({
      ...prev,
      [system]: newSettings
    }));
  };

  // الحصول على اسم النظام بالعربية
  const getSystemName = (system) => {
    const names = {
      inventory: 'نظام المخزون',
      accounting: 'نظام المحاسبة',
      crm: 'نظام إدارة العملاء',
      reporting: 'نظام التقارير'
    };
    return names[system] || system;
  };

  // الحصول على وصف النظام
  const getSystemDescription = (system) => {
    const descriptions = {
      inventory: 'ربط مع نظام إدارة المخزون والمبيعات',
      accounting: 'تكامل مع أنظمة المحاسبة والقوائم المالية',
      crm: 'اتصال مع أنظمة إدارة علاقات العملاء',
      reporting: 'تكامل مع أنظمة التقارير والتحليلات'
    };
    return descriptions[system] || 'وصف غير متوفر';
  };

  // إرسال البيانات إلى نظام خارجي
  const exportToExternalSystem = (system, dataType) => {
    const exportData = {
      system: getSystemName(system),
      dataType,
      timestamp: new Date().toISOString(),
      data: getDataForExport(system, dataType)
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${system}-${dataType}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    showSuccess(`تم تصدير ${dataType} بنجاح`);
  };

  // الحصول على البيانات للتصدير
  const getDataForExport = (system, dataType) => {
    switch (system) {
      case 'inventory':
        return dataType === 'products' ? products : [];
      case 'accounting':
        return dataType === 'transactions' ? 
          [...cashReceipts, ...cashDisbursements] : [];
      case 'crm':
        return dataType === 'contacts' ? 
          [...customers, ...suppliers] : [];
      case 'reporting':
        return dataType === 'financials' ? {
          salesInvoices,
          purchaseInvoices,
          cashReceipts,
          cashDisbursements
        } : {};
      default:
        return {};
    }
  };

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">التكامل الذكي مع النظام</h1>
          <p className="text-gray-600 mt-1">إدارة الاتصالات والتكامل مع الأنظمة المختلفة</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoSyncToggle"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="ml-2"
            />
            <label htmlFor="autoSyncToggle" className="text-sm">مزامنة تلقائية</label>
          </div>
          
          <Button variant="secondary" icon={<FaCog />} onClick={() => setShowSettingsModal(true)}>
            الإعدادات
          </Button>
          
          <Button variant="primary" icon={<FaSync />} onClick={handleFullSync}>
            مزامنة شاملة
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {integrationStats.connectedSystems}/{integrationStats.totalSystems}
            </div>
            <div className="text-gray-600 mt-2">الأنظمة المتصلة</div>
            <div className="text-sm text-green-600 mt-1">
              {integrationStats.connectionRate.toFixed(0)}% معدل الاتصال
            </div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {integrationStats.totalSynced.toLocaleString()}
            </div>
            <div className="text-gray-600 mt-2">سجلات متزامنة</div>
            <div className="text-sm text-blue-600 mt-1">
              عبر جميع الأنظمة
            </div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {activityLogs.filter(log => log.type === 'sync').length}
            </div>
            <div className="text-gray-600 mt-2">مزامنات ناجحة</div>
            <div className="text-sm text-purple-600 mt-1">
              آخر 24 ساعة
            </div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {integrationStats.errorSystems}
            </div>
            <div className="text-gray-600 mt-2">أخطاء في الأنظمة</div>
            <div className="text-sm text-red-600 mt-1">
              تحتاج إصلاح
            </div>
          </div>
        </Card>
      </div>

      {/* حالة الاتصالات */}
      <Card title="حالة الاتصالات">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(syncStatus).map((system) => (
            <ConnectionStatus
              key={system}
              name={getSystemName(system)}
              status={syncStatus[system]}
              lastSync={new Date(Date.now() - Math.random() * 3600000).toISOString()}
            />
          ))}
        </div>
      </Card>

      {/* بطاقات الأنظمة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.keys(syncStatus).map((system) => (
          <Card key={system} title={getSystemName(system)}>
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">{getSystemDescription(system)}</p>
              
              {/* حالة الاتصال */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">حالة الاتصال:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  syncStatus[system] === 'connected' ? 'bg-green-100 text-green-700' :
                  syncStatus[system] === 'syncing' ? 'bg-blue-100 text-blue-700' :
                  syncStatus[system] === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {syncStatus[system] === 'connected' && 'متصل'}
                  {syncStatus[system] === 'syncing' && 'يتم المزامنة'}
                  {syncStatus[system] === 'error' && 'خطأ'}
                  {syncStatus[system] === 'disconnected' && 'منفصل'}
                </span>
              </div>

              {/* إحصائيات البيانات */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium mb-2">البيانات المتزامنة:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {system === 'inventory' && (
                    <>
                      <div>المنتجات: {products.length}</div>
                      <div>المبيعات: {salesInvoices.length}</div>
                    </>
                  )}
                  {system === 'accounting' && (
                    <>
                      <div>الإيرادات: {cashReceipts.length}</div>
                      <div>المصروفات: {cashDisbursements.length}</div>
                    </>
                  )}
                  {system === 'crm' && (
                    <>
                      <div>العملاء: {customers.length}</div>
                      <div>الموردين: {suppliers.length}</div>
                    </>
                  )}
                  {system === 'reporting' && (
                    <>
                      <div>فواتير المبيعات: {salesInvoices.length}</div>
                      <div>فواتير المشتريات: {purchaseInvoices.length}</div>
                    </>
                  )}
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleSync(system)}
                  disabled={syncStatus[system] === 'syncing'}
                  icon={<FaSync className={syncStatus[system] === 'syncing' ? 'animate-spin' : ''} />}
                >
                  مزامنة
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedSystem(system);
                    setShowSettingsModal(true);
                  }}
                  icon={<FaCog />}
                >
                  إعدادات
                </Button>

                {hasPermission('export_data') && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const dataTypes = {
                        inventory: ['products', 'sales'],
                        accounting: ['transactions', 'balances'],
                        crm: ['contacts', 'interactions'],
                        reporting: ['financials', 'summaries']
                      };
                      const type = dataTypes[system]?.[0];
                      if (type) {
                        exportToExternalSystem(system, type);
                      }
                    }}
                    icon={<FaDownload />}
                  >
                    تصدير
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* سجل الأنشطة */}
      <Card title="سجل الأنشطة">
        <ActivityLog logs={activityLogs} />
      </Card>

      {/* Modal الإعدادات */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
          setSelectedSystem(null);
        }}
        title={`إعدادات ${selectedSystem ? getSystemName(selectedSystem) : 'التكامل'}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* علامات التبويب للأنظمة */}
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setSelectedSystem('inventory')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                selectedSystem === 'inventory' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              المخزون
            </button>
            <button
              onClick={() => setSelectedSystem('accounting')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                selectedSystem === 'accounting' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              المحاسبة
            </button>
            <button
              onClick={() => setSelectedSystem('crm')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                selectedSystem === 'crm' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              CRM
            </button>
            <button
              onClick={() => setSelectedSystem('reporting')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                selectedSystem === 'reporting' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              التقارير
            </button>
          </div>

          {/* إعدادات النظام المحدد */}
          {selectedSystem && (
            <IntegrationSettings
              system={selectedSystem}
              settings={integrationSettings[selectedSystem]}
              onUpdate={(newSettings) => handleUpdateSettings(selectedSystem, newSettings)}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SmartSystemIntegration;