// ======================================
// جدولة صيانة الأصول الثابتة
// ======================================

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../Common/Card';
import Button from '../Common/Button';
import Table from '../Common/Table';
import Modal from '../Common/Modal';

const MaintenanceScheduling = () => {
  const {
    fixedAssets,
    assetMaintenance,
    addMaintenanceSchedule,
    recordMaintenance,
    getUpcomingMaintenance,
    updateMaintenanceRecord
  } = useData();

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // بيانات جدولة الصيانة
  const [scheduleData, setScheduleData] = useState({
    assetId: '',
    maintenanceType: 'preventive',
    frequency: 'monthly',
    nextDate: '',
    estimatedCost: '',
    description: '',
    assignedTo: '',
    priority: 'medium'
  });

  // بيانات تسجيل الصيانة
  const [recordData, setRecordData] = useState({
    scheduleId: '',
    actualDate: '',
    actualCost: '',
    status: 'completed',
    notes: '',
    technician: ''
  });

  // تصفية جداول الصيانة
  const filteredMaintenance = assetMaintenance.filter(maintenance => {
    const asset = fixedAssets.find(a => a.id === maintenance.assetId);
    const matchesSearch = asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         maintenance.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || maintenance.status === filterStatus;
    const matchesType = !filterType || maintenance.maintenanceType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // إحصائيات الصيانة
  const getMaintenanceStats = () => {
    const now = new Date();
    const upcomingMaintenance = getUpcomingMaintenance(30);
    const overdueMaintenance = assetMaintenance.filter(m => 
      m.nextDate && new Date(m.nextDate) < now && m.status === 'Scheduled'
    );
    const completedMaintenance = assetMaintenance.filter(m => m.status === 'Completed');
    const totalCost = completedMaintenance.reduce((sum, m) => sum + (m.actualCost || 0), 0);

    return {
      totalSchedules: assetMaintenance.length,
      upcomingMaintenance: upcomingMaintenance.length,
      overdueMaintenance: overdueMaintenance.length,
      completedMaintenance: completedMaintenance.length,
      totalCost
    };
  };

  // الصيانة الحرجة (خلال 7 أيام)
  const getCriticalMaintenance = () => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return assetMaintenance
      .filter(m => {
        if (!m.nextDate || m.status !== 'Scheduled') return false;
        const nextDate = new Date(m.nextDate);
        return nextDate <= weekFromNow;
      })
      .sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate))
      .slice(0, 10);
  };

  // أعمدة جدول الصيانة
  const maintenanceColumns = [
    {
      header: 'الأصل',
      accessor: 'assetId',
      render: (value) => {
        const asset = fixedAssets.find(a => a.id === value);
        return (
          <div>
            <div className="font-medium text-gray-900">{asset?.name || 'غير محدد'}</div>
            <div className="text-sm text-gray-500">{asset?.serialNumber || '-'}</div>
          </div>
        );
      }
    },
    {
      header: 'نوع الصيانة',
      accessor: 'maintenanceType',
      render: (value) => {
        const typeLabels = {
          'preventive': 'وقائية',
          'corrective': 'تصحيحية',
          'emergency': 'طارئة',
          'inspection': 'فحص'
        };
        const typeColors = {
          'preventive': 'bg-green-100 text-green-800',
          'corrective': 'bg-yellow-100 text-yellow-800',
          'emergency': 'bg-red-100 text-red-800',
          'inspection': 'bg-blue-100 text-blue-800'
        };
        return (
          <div className={`px-2 py-1 rounded text-sm ${typeColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {typeLabels[value] || value}
          </div>
        );
      }
    },
    {
      header: 'التكرار',
      accessor: 'frequency',
      render: (value) => {
        const frequencyLabels = {
          'daily': 'يومي',
          'weekly': 'أسبوعي',
          'monthly': 'شهري',
          'quarterly': 'ربع سنوي',
          'yearly': 'سنوي',
          'as-needed': 'حسب الحاجة'
        };
        return (
          <div className="text-sm text-gray-600">
            {frequencyLabels[value] || value}
          </div>
        );
      }
    },
    {
      header: 'التاريخ المجدول',
      accessor: 'nextDate',
      render: (value) => {
        if (!value) return '-';
        const date = new Date(value);
        const now = new Date();
        const isOverdue = date < now;
        const isUpcoming = date <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        return (
          <div className={`text-sm font-medium ${
            isOverdue ? 'text-red-600' : 
            isUpcoming ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {date.toLocaleDateString('ar-SA')}
            {isOverdue && <div className="text-xs">(متأخر)</div>}
            {isUpcoming && !isOverdue && <div className="text-xs">(قريب)</div>}
          </div>
        );
      }
    },
    {
      header: 'التكلفة المقدرة',
      accessor: 'estimatedCost',
      render: (value) => (
        <div className="font-medium text-green-600">
          {value ? value.toLocaleString() : 0} ريال
        </div>
      )
    },
    {
      header: 'الأولوية',
      accessor: 'priority',
      render: (value) => {
        const priorityLabels = {
          'low': 'منخفضة',
          'medium': 'متوسطة',
          'high': 'عالية',
          'critical': 'حرجة'
        };
        const priorityColors = {
          'low': 'bg-gray-100 text-gray-800',
          'medium': 'bg-yellow-100 text-yellow-800',
          'high': 'bg-orange-100 text-orange-800',
          'critical': 'bg-red-100 text-red-800'
        };
        return (
          <div className={`px-2 py-1 rounded text-sm ${priorityColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {priorityLabels[value] || value}
          </div>
        );
      }
    },
    {
      header: 'الحالة',
      accessor: 'status',
      render: (value) => {
        const statusLabels = {
          'Scheduled': 'مجدول',
          'In Progress': 'جاري',
          'Completed': 'مكتمل',
          'Cancelled': 'ملغي'
        };
        const statusColors = {
          'Scheduled': 'bg-blue-100 text-blue-800',
          'In Progress': 'bg-yellow-100 text-yellow-800',
          'Completed': 'bg-green-100 text-green-800',
          'Cancelled': 'bg-red-100 text-red-800'
        };
        return (
          <div className={`px-2 py-1 rounded text-sm ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {statusLabels[value] || value}
          </div>
        );
      }
    },
    {
      header: 'الإجراءات',
      accessor: 'id',
      render: (value, row) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedMaintenance(row);
              setRecordData({
                ...recordData,
                scheduleId: value,
                actualDate: new Date().toISOString().split('T')[0]
              });
              setShowRecordModal(true);
            }}
          >
            تسجيل
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedMaintenance(row);
              setShowDetailsModal(true);
            }}
          >
            تفاصيل
          </Button>
        </div>
      )
    }
  ];

  // إنشاء جدولة صيانة جديدة
  const handleCreateSchedule = () => {
    if (!scheduleData.assetId || !scheduleData.maintenanceType || !scheduleData.nextDate) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const schedule = {
      ...scheduleData,
      id: Date.now().toString(),
      estimatedCost: parseFloat(scheduleData.estimatedCost) || 0,
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    };

    addMaintenanceSchedule(schedule);
    setShowScheduleModal(false);
    setScheduleData({
      assetId: '',
      maintenanceType: 'preventive',
      frequency: 'monthly',
      nextDate: '',
      estimatedCost: '',
      description: '',
      assignedTo: '',
      priority: 'medium'
    });
  };

  // تسجيل صيانة
  const handleRecordMaintenance = () => {
    if (!recordData.scheduleId || !recordData.actualDate) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const maintenanceRecord = {
      ...recordData,
      id: Date.now().toString(),
      actualCost: parseFloat(recordData.actualCost) || 0,
      recordedAt: new Date().toISOString()
    };

    recordMaintenance(maintenanceRecord);
    setShowRecordModal(false);
    setRecordData({
      scheduleId: '',
      actualDate: '',
      actualCost: '',
      status: 'completed',
      notes: '',
      technician: ''
    });
  };

  const stats = getMaintenanceStats();
  const criticalMaintenance = getCriticalMaintenance();

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">جدولة الصيانة</h1>
          <p className="mt-1 text-sm text-gray-500">
            إدارة وتنظيم جدولة صيانة جميع الأصول الثابتة
          </p>
        </div>
        <Button onClick={() => setShowScheduleModal(true)}>
          جدولة صيانة جديدة
        </Button>
      </div>

      {/* إحصائيات الصيانة */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12v4m-4 4h.01M16 4h.01M20 8h-6a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2V10a2 2 0 00-2-2z" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">إجمالي الجداول</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSchedules}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">قادمة (30 يوم)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingMaintenance}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 17.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">متأخرة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdueMaintenance}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">مكتملة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedMaintenance}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">إجمالي التكلفة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCost.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* الصيانة الحرجة */}
      {criticalMaintenance.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-full mr-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 17.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-600">الصيانة الحرجة (خلال 7 أيام)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {criticalMaintenance.map(maintenance => {
                const asset = fixedAssets.find(a => a.id === maintenance.assetId);
                return (
                  <div key={maintenance.id} className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="font-medium text-red-900">{asset?.name || 'غير محدد'}</div>
                    <div className="text-sm text-red-700 mt-1">
                      {maintenance.maintenanceType === 'preventive' ? 'وقائية' :
                       maintenance.maintenanceType === 'corrective' ? 'تصحيحية' :
                       maintenance.maintenanceType === 'emergency' ? 'طارئة' :
                       maintenance.maintenanceType === 'inspection' ? 'فحص' : maintenance.maintenanceType}
                    </div>
                    <div className="text-sm text-red-600 mt-1">
                      تاريخ: {new Date(maintenance.nextDate).toLocaleDateString('ar-SA')}
                    </div>
                    <div className="text-xs text-red-500 mt-1">
                      {maintenance.estimatedCost?.toLocaleString()} ريال
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* شريط البحث والفلترة */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البحث
              </label>
              <input
                type="text"
                placeholder="البحث في الأصول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">جميع الحالات</option>
                <option value="Scheduled">مجدول</option>
                <option value="In Progress">جاري</option>
                <option value="Completed">مكتمل</option>
                <option value="Cancelled">ملغي</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                النوع
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">جميع الأنواع</option>
                <option value="preventive">وقائية</option>
                <option value="corrective">تصحيحية</option>
                <option value="emergency">طارئة</option>
                <option value="inspection">فحص</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('');
                  setFilterType('');
                }}
              >
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* جدول جدولة الصيانة */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              جدول الصيانة ({filteredMaintenance.length})
            </h3>
          </div>
          <Table
            columns={maintenanceColumns}
            data={filteredMaintenance}
            searchable={false}
            maxHeight="600px"
          />
        </div>
      </Card>

      {/* نموذج جدولة صيانة جديدة */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="جدولة صيانة جديدة"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الأصل *
              </label>
              <select
                value={scheduleData.assetId}
                onChange={(e) => setScheduleData({...scheduleData, assetId: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">اختر الأصل</option>
                {fixedAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع الصيانة *
              </label>
              <select
                value={scheduleData.maintenanceType}
                onChange={(e) => setScheduleData({...scheduleData, maintenanceType: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="preventive">وقائية</option>
                <option value="corrective">تصحيحية</option>
                <option value="emergency">طارئة</option>
                <option value="inspection">فحص</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                التكرار
              </label>
              <select
                value={scheduleData.frequency}
                onChange={(e) => setScheduleData({...scheduleData, frequency: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="daily">يومي</option>
                <option value="weekly">أسبوعي</option>
                <option value="monthly">شهري</option>
                <option value="quarterly">ربع سنوي</option>
                <option value="yearly">سنوي</option>
                <option value="as-needed">حسب الحاجة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                التاريخ المجدول *
              </label>
              <input
                type="date"
                value={scheduleData.nextDate}
                onChange={(e) => setScheduleData({...scheduleData, nextDate: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                التكلفة المقدرة
              </label>
              <input
                type="number"
                value={scheduleData.estimatedCost}
                onChange={(e) => setScheduleData({...scheduleData, estimatedCost: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="ريال"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الأولوية
              </label>
              <select
                value={scheduleData.priority}
                onChange={(e) => setScheduleData({...scheduleData, priority: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="critical">حرجة</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الوصف
            </label>
            <textarea
              value={scheduleData.description}
              onChange={(e) => setScheduleData({...scheduleData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
              placeholder="وصف تفصيلي لأعمال الصيانة..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              المسؤول عن التنفيذ
            </label>
            <input
              type="text"
              value={scheduleData.assignedTo}
              onChange={(e) => setScheduleData({...scheduleData, assignedTo: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="اسم الفني أو الشركة المسؤولة..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowScheduleModal(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleCreateSchedule}>
              إنشاء الجدولة
            </Button>
          </div>
        </div>
      </Modal>

      {/* نموذج تسجيل الصيانة */}
      <Modal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title="تسجيل صيانة"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ التنفيذ *
              </label>
              <input
                type="date"
                value={recordData.actualDate}
                onChange={(e) => setRecordData({...recordData, actualDate: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                التكلفة الفعلية
              </label>
              <input
                type="number"
                value={recordData.actualCost}
                onChange={(e) => setRecordData({...recordData, actualCost: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="ريال"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة
              </label>
              <select
                value={recordData.status}
                onChange={(e) => setRecordData({...recordData, status: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="completed">مكتمل</option>
                <option value="partially-completed">مكتمل جزئياً</option>
                <option value="failed">فشل</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الفني المنفذ
              </label>
              <input
                type="text"
                value={recordData.technician}
                onChange={(e) => setRecordData({...recordData, technician: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="اسم الفني أو الشركة..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات
            </label>
            <textarea
              value={recordData.notes}
              onChange={(e) => setRecordData({...recordData, notes: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={4}
              placeholder="تفاصيل أعمال الصيانة المنفذة..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowRecordModal(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleRecordMaintenance}>
              تسجيل الصيانة
            </Button>
          </div>
        </div>
      </Modal>

      {/* نموذج تفاصيل الصيانة */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="تفاصيل الصيانة"
        size="lg"
      >
        {selectedMaintenance && (
          <div className="space-y-6">
            <Card>
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">معلومات الجدولة</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">الأصل:</span>
                    <span className="mr-2 font-medium">
                      {fixedAssets.find(a => a.id === selectedMaintenance.assetId)?.name || 'غير محدد'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">نوع الصيانة:</span>
                    <span className="mr-2 font-medium">
                      {selectedMaintenance.maintenanceType === 'preventive' ? 'وقائية' :
                       selectedMaintenance.maintenanceType === 'corrective' ? 'تصحيحية' :
                       selectedMaintenance.maintenanceType === 'emergency' ? 'طارئة' :
                       selectedMaintenance.maintenanceType === 'inspection' ? 'فحص' : selectedMaintenance.maintenanceType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">التكرار:</span>
                    <span className="mr-2 font-medium">
                      {selectedMaintenance.frequency === 'daily' ? 'يومي' :
                       selectedMaintenance.frequency === 'weekly' ? 'أسبوعي' :
                       selectedMaintenance.frequency === 'monthly' ? 'شهري' :
                       selectedMaintenance.frequency === 'quarterly' ? 'ربع سنوي' :
                       selectedMaintenance.frequency === 'yearly' ? 'سنوي' :
                       selectedMaintenance.frequency === 'as-needed' ? 'حسب الحاجة' : selectedMaintenance.frequency}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">التاريخ المجدول:</span>
                    <span className="mr-2 font-medium">
                      {selectedMaintenance.nextDate ? new Date(selectedMaintenance.nextDate).toLocaleDateString('ar-SA') : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">التكلفة المقدرة:</span>
                    <span className="mr-2 font-medium">
                      {selectedMaintenance.estimatedCost?.toLocaleString() || 0} ريال
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">الحالة:</span>
                    <span className="mr-2 font-medium">
                      {selectedMaintenance.status === 'Scheduled' ? 'مجدول' :
                       selectedMaintenance.status === 'In Progress' ? 'جاري' :
                       selectedMaintenance.status === 'Completed' ? 'مكتمل' :
                       selectedMaintenance.status === 'Cancelled' ? 'ملغي' : selectedMaintenance.status}
                    </span>
                  </div>
                </div>
                {selectedMaintenance.description && (
                  <div className="mt-4">
                    <span className="text-gray-600 text-sm">الوصف:</span>
                    <p className="mt-1 text-sm text-gray-900">{selectedMaintenance.description}</p>
                  </div>
                )}
              </div>
            </Card>
            
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowDetailsModal(false)}>
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MaintenanceScheduling;