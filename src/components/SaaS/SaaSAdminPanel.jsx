// ======================================
// SaaS Admin Panel - لوحة إدارة SaaS
// ======================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSaaS } from '../../context/SaaSContext';
import { useNotification } from '../../context/NotificationContext';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
import Table from '../Common/Table';
import { 
  FaBuilding, FaUsers, FaChartLine, FaCog, FaPlus, 
  FaEdit, FaTrash, FaEye, FaEyeSlash, FaDownload,
  FaExclamationTriangle, FaCheckCircle, FaClock
} from 'react-icons/fa';
import tenantManager from '../../saas/TenantManager';

const SaaSAdminPanel = () => {
  const { isAdmin } = useAuth();
  const { 
    currentTenant, 
    syncData, 
    hasPendingSync,
    syncStatus,
    isOnline,
    dataMode 
  } = useSaaS();
  const { showSuccess, showError } = useNotification();
  
  // حالة اللوحة
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // نماذج
  const [newCompany, setNewCompany] = useState({
    id: '',
    name: '',
    displayName: '',
    backendUrl: '',
    primaryColor: '#f97316',
    secondaryColor: '#ea580c',
    currency: 'SAR',
    status: 'active',
    expiryDate: ''
  });

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!isAdmin()) {
      showError('غير مخول لك الوصول لهذه الصفحة');
      return;
    }
    loadCompanies();
  }, [isAdmin]);

  // تحميل قائمة المؤسسات
  const loadCompanies = () => {
    try {
      const availableCompanies = tenantManager.getAvailableTenants();
      setCompanies(availableCompanies);
    } catch (error) {
      console.error('خطأ في تحميل المؤسسات:', error);
      showError('فشل في تحميل قائمة المؤسسات');
    }
  };

  // إضافة مؤسسة جديدة
  const handleAddCompany = async () => {
    if (!newCompany.id || !newCompany.name || !newCompany.displayName) {
      showError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      const result = tenantManager.addTenant(newCompany.id, newCompany);
      if (result.success) {
        showSuccess('تم إضافة المؤسسة بنجاح');
        setShowAddModal(false);
        setNewCompany({
          id: '',
          name: '',
          displayName: '',
          backendUrl: '',
          primaryColor: '#f97316',
          secondaryColor: '#ea580c',
          currency: 'SAR',
          status: 'active',
          expiryDate: ''
        });
        loadCompanies();
      } else {
        showError(result.error || 'فشل في إضافة المؤسسة');
      }
    } catch (error) {
      console.error('خطأ في إضافة المؤسسة:', error);
      showError('حدث خطأ في إضافة المؤسسة');
    } finally {
      setLoading(false);
    }
  };

  // حذف مؤسسة
  const handleDeleteCompany = async (companyId) => {
    if (!confirm('هل أنت متأكد من حذف هذه المؤسسة؟')) return;

    setLoading(true);
    try {
      const result = tenantManager.deleteTenant(companyId);
      if (result.success) {
        showSuccess('تم حذف المؤسسة بنجاح');
        loadCompanies();
      } else {
        showError(result.error || 'فشل في حذف المؤسسة');
      }
    } catch (error) {
      console.error('خطأ في حذف المؤسسة:', error);
      showError('حدث خطأ في حذف المؤسسة');
    } finally {
      setLoading(false);
    }
  };

  // تبديل حالة المؤسسة
  const toggleCompanyStatus = async (companyId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setLoading(true);
    try {
      const result = tenantManager.updateTenant(companyId, { status: newStatus });
      if (result.success) {
        showSuccess(`تم ${newStatus === 'active' ? 'تفعيل' : 'تعطيل'} المؤسسة`);
        loadCompanies();
      } else {
        showError(result.error || 'فشل في تحديث حالة المؤسسة');
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة المؤسسة:', error);
      showError('حدث خطأ في تحديث حالة المؤسسة');
    } finally {
      setLoading(false);
    }
  };

  // مزامنة البيانات
  const handleSyncData = async () => {
    setLoading(true);
    try {
      const result = await syncData();
      if (result.success) {
        showSuccess('تمت المزامنة بنجاح');
      } else {
        showError(result.message || 'فشلت المزامنة');
      }
    } catch (error) {
      console.error('خطأ في المزامنة:', error);
      showError('حدث خطأ في المزامنة');
    } finally {
      setLoading(false);
    }
  };

  // تصدير البيانات
  const handleExportData = () => {
    try {
      const data = {
        companies: companies,
        exportDate: new Date().toISOString(),
        exportBy: currentTenant?.name || 'Admin'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saas-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess('تم تصدير البيانات بنجاح');
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
      showError('فشل في تصدير البيانات');
    }
  };

  // عرض نظرة عامة
  const renderOverview = () => (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي المؤسسات</p>
              <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
            </div>
            <FaBuilding className="text-3xl text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">المؤسسات النشطة</p>
              <p className="text-2xl font-bold text-green-600">
                {companies.filter(c => c.status === 'active').length}
              </p>
            </div>
            <FaCheckCircle className="text-3xl text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">المؤسسات المنتهية</p>
              <p className="text-2xl font-bold text-red-600">
                {companies.filter(c => new Date(c.expiryDate) < new Date()).length}
              </p>
            </div>
            <FaExclamationTriangle className="text-3xl text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">قيد المزامنة</p>
              <p className="text-2xl font-bold text-orange-600">{syncStatus.pending}</p>
            </div>
            <FaClock className="text-3xl text-orange-500" />
          </div>
        </div>
      </div>

      {/* حالة النظام */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">حالة النظام</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">حالة الاتصال</label>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">{isOnline ? 'متصل' : 'غير متصل'}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">وضع البيانات</label>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                dataMode === 'online' ? 'bg-green-100 text-green-800' :
                dataMode === 'offline' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {dataMode === 'online' ? 'عبر الإنترنت' : 
                 dataMode === 'offline' ? 'بدون اتصال' : 'محلي'}
              </span>
            </div>
          </div>
          
          {syncStatus.lastSync && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">آخر مزامنة</label>
              <span className="text-sm text-gray-600">
                {new Date(syncStatus.lastSync).toLocaleString('ar-SA')}
              </span>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المؤسسة الحالية</label>
            <span className="text-sm text-gray-600">
              {currentTenant?.displayName || 'غير محددة'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // عرض قائمة المؤسسات
  const renderCompaniesList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">إدارة المؤسسات</h3>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <FaPlus className="mr-2" />
          إضافة مؤسسة
        </Button>
      </div>

      <Table
        columns={[
          { key: 'id', title: 'المعرف', width: '100px' },
          { key: 'name', title: 'الاسم' },
          { key: 'displayName', title: 'الاسم المعروض' },
          { key: 'status', title: 'الحالة', render: (value) => (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {value === 'active' ? 'نشطة' : 'غير نشطة'}
            </span>
          )},
          { key: 'expiryDate', title: 'تاريخ الانتهاء', render: (value) => (
            <span className={`text-sm ${
              new Date(value) < new Date() ? 'text-red-600' : 'text-gray-600'
            }`}>
              {value ? new Date(value).toLocaleDateString('ar-SA') : 'غير محدد'}
            </span>
          )},
          { key: 'actions', title: 'الإجراءات', render: (_, company) => (
            <div className="flex gap-2">
              <button
                onClick={() => toggleCompanyStatus(company.id, company.status)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                title={company.status === 'active' ? 'تعطيل' : 'تفعيل'}
              >
                {company.status === 'active' ? <FaEyeSlash /> : <FaEye />}
              </button>
              <button
                onClick={() => handleDeleteCompany(company.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="حذف"
              >
                <FaTrash />
              </button>
            </div>
          )}
        ]}
        data={companies}
        loading={loading}
      />
    </div>
  );

  // عرض الإعدادات
  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">إعدادات النظام</h3>
      
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h4 className="font-medium mb-4">المزامنة</h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>مزامنة البيانات المعلقة</span>
            <Button 
              onClick={handleSyncData}
              disabled={!hasPendingSync || loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <FaDownload className="mr-2" />
              مزامنة الآن
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <span>تصدير البيانات</span>
            <Button onClick={handleExportData} variant="outline">
              <FaDownload className="mr-2" />
              تصدير
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h4 className="font-medium mb-4">إعدادات الاتصال</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Backend URL الرئيسي</label>
            <Input 
              value={tenantManager.config.defaultBackend}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // عرض التبويبات
  const renderTabs = () => {
    const tabs = [
      { id: 'overview', label: 'نظرة عامة', icon: FaChartLine },
      { id: 'companies', label: 'المؤسسات', icon: FaBuilding },
      { id: 'settings', label: 'الإعدادات', icon: FaCog }
    ];

    return (
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    );
  };

  if (!isAdmin()) {
    return (
      <div className="p-8 text-center">
        <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">غير مخول</h2>
        <p className="text-gray-600">ليس لديك صلاحية للوصول لهذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* رأس الصفحة */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة إدارة SaaS</h1>
        <p className="text-gray-600">إدارة النظام والمؤسسات</p>
      </div>

      {/* التبويبات */}
      {renderTabs()}

      {/* محتوى التبويبات */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'companies' && renderCompaniesList()}
      {activeTab === 'settings' && renderSettings()}

      {/* نافذة إضافة مؤسسة */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">إضافة مؤسسة جديدة</h3>
            
            <div className="space-y-4">
              <Input
                label="معرف المؤسسة"
                value={newCompany.id}
                onChange={(e) => setNewCompany({...newCompany, id: e.target.value.toLowerCase()})}
                placeholder="مثال: company1"
              />
              
              <Input
                label="اسم المؤسسة"
                value={newCompany.name}
                onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                placeholder="اسم المؤسسة"
              />
              
              <Input
                label="الاسم المعروض"
                value={newCompany.displayName}
                onChange={(e) => setNewCompany({...newCompany, displayName: e.target.value})}
                placeholder="الاسم المعروض في النظام"
              />
              
              <Input
                label="رابط Backend"
                value={newCompany.backendUrl}
                onChange={(e) => setNewCompany({...newCompany, backendUrl: e.target.value})}
                placeholder="https://api.company.com"
              />
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">اللون الأساسي</label>
                  <input
                    type="color"
                    value={newCompany.primaryColor}
                    onChange={(e) => setNewCompany({...newCompany, primaryColor: e.target.value})}
                    className="w-full h-10 rounded border border-gray-300"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">اللون الثانوي</label>
                  <input
                    type="color"
                    value={newCompany.secondaryColor}
                    onChange={(e) => setNewCompany({...newCompany, secondaryColor: e.target.value})}
                    className="w-full h-10 rounded border border-gray-300"
                  />
                </div>
              </div>
              
              <Input
                label="تاريخ الانتهاء"
                type="date"
                value={newCompany.expiryDate}
                onChange={(e) => setNewCompany({...newCompany, expiryDate: e.target.value})}
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowAddModal(false)}
                variant="outline"
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAddCompany}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'جاري الإضافة...' : 'إضافة'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaaSAdminPanel;