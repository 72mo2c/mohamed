// ======================================
// إدارة الإهلاك للأصول الثابتة
// ======================================

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../Common/Card';
import Button from '../Common/Button';
import Table from '../Common/Table';
import Modal from '../Common/Modal';

const DepreciationManagement = () => {
  const {
    fixedAssets,
    assetCategories,
    assetDepreciation,
    calculateDepreciation,
    addDepreciationSchedule,
    getDepreciationSummary,
    getAssetReport
  } = useData();

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [period, setPeriod] = useState('monthly');

  // بيانات جدول الإهلاك
  const [scheduleData, setScheduleData] = useState({
    assetId: '',
    method: 'straight-line',
    startDate: '',
    endDate: '',
    depreciationRate: ''
  });

  // تصفية الأصول
  const filteredAssets = fixedAssets.filter(asset => {
    const matchesSearch = asset.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = !filterMethod || asset.depreciationMethod === filterMethod;
    return matchesSearch && matchesMethod;
  });

  // حساب إحصائيات الإهلاك
  const getDepreciationStats = () => {
    const totalAssets = fixedAssets.length;
    const assetsWithDepreciation = fixedAssets.filter(asset => 
      asset.depreciationMethod && asset.usefulLife
    ).length;
    
    const totalDepreciationValue = assetDepreciation.reduce((sum, dep) => 
      sum + (dep.depreciationAmount || 0), 0
    );
    
    const methodDistribution = fixedAssets.reduce((acc, asset) => {
      const method = asset.depreciationMethod || 'Not Set';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    return {
      totalAssets,
      assetsWithDepreciation,
      totalDepreciationValue,
      methodDistribution
    };
  };

  // الأصول الأكثر إهلاكاً
  const getTopDepreciatedAssets = () => {
    return fixedAssets
      .map(asset => {
        const depreciation = calculateDepreciation(asset.id, asset.depreciationMethod || 'straight-line');
        return {
          ...asset,
          depreciationInfo: depreciation,
          currentValue: (asset.originalValue || 0) - (depreciation?.totalDepreciation || 0)
        };
      })
      .filter(asset => asset.depreciationInfo?.totalDepreciation > 0)
      .sort((a, b) => (b.depreciationInfo?.totalDepreciation || 0) - (a.depreciationInfo?.totalDepreciation || 0))
      .slice(0, 10);
  };

  // أعمدة جدول الأصول مع الإهلاك
  const depreciationColumns = [
    {
      header: 'اسم الأصل',
      accessor: 'name',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.serialNumber || '-'}</div>
        </div>
      )
    },
    {
      header: 'القيمة الأصلية',
      accessor: 'originalValue',
      render: (value) => (
        <div className="font-medium text-green-600">
          {value ? value.toLocaleString() : 0} ريال
        </div>
      )
    },
    {
      header: 'القيمة الحالية',
      accessor: 'originalValue',
      render: (value, row) => {
        const depreciation = calculateDepreciation(row.id, row.depreciationMethod || 'straight-line');
        const currentValue = (value || 0) - (depreciation?.totalDepreciation || 0);
        return (
          <div className="font-medium text-blue-600">
            {currentValue.toLocaleString()} ريال
          </div>
        );
      }
    },
    {
      header: 'إجمالي الإهلاك',
      accessor: 'originalValue',
      render: (value, row) => {
        const depreciation = calculateDepreciation(row.id, row.depreciationMethod || 'straight-line');
        const depreciationValue = depreciation?.totalDepreciation || 0;
        return (
          <div className="font-medium text-red-600">
            {depreciationValue.toLocaleString()} ريال
          </div>
        );
      }
    },
    {
      header: 'طريقة الإهلاك',
      accessor: 'depreciationMethod',
      render: (value) => {
        const methodLabels = {
          'straight-line': 'القسط الثابت',
          'declining-balance': 'الرصيد المتناقص',
          'units-of-production': 'وحدات الإنتاج'
        };
        const methodColors = {
          'straight-line': 'bg-blue-100 text-blue-800',
          'declining-balance': 'bg-green-100 text-green-800',
          'units-of-production': 'bg-purple-100 text-purple-800'
        };
        return (
          <div className={`px-2 py-1 rounded text-sm ${methodColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {methodLabels[value] || value || 'غير محدد'}
          </div>
        );
      }
    },
    {
      header: 'معدل الإهلاك',
      accessor: 'usefulLife',
      render: (value, row) => {
        if (!value || !row.originalValue) return '-';
        const rate = ((row.originalValue - (row.salvageValue || 0)) / value / row.originalValue * 100).toFixed(1);
        return (
          <div className="text-sm text-gray-600">
            {rate}% سنوياً
          </div>
        );
      }
    },
    {
      header: 'العمر المتبقي',
      accessor: 'usefulLife',
      render: (value, row) => {
        if (!value || !row.purchaseDate) return '-';
        const purchaseYear = new Date(row.purchaseDate).getFullYear();
        const currentYear = new Date().getFullYear();
        const yearsUsed = currentYear - purchaseYear;
        const remainingYears = value - yearsUsed;
        return (
          <div className={`text-sm font-medium ${
            remainingYears > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {remainingYears > 0 ? `${remainingYears} سنة` : 'منتهي'}
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
              setSelectedAsset(row);
              setShowReportModal(true);
            }}
          >
            تقرير
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedAsset(row);
              setScheduleData({
                ...scheduleData,
                assetId: value,
                method: row.depreciationMethod || 'straight-line',
                startDate: row.purchaseDate || ''
              });
              setShowScheduleModal(true);
            }}
          >
            جدول
          </Button>
        </div>
      )
    }
  ];

  // إنشاء جدول إهلاك جديد
  const handleCreateSchedule = () => {
    if (!scheduleData.assetId || !scheduleData.startDate) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const schedule = {
      ...scheduleData,
      id: Date.now().toString(),
      depreciationRate: parseFloat(scheduleData.depreciationRate) || 0,
      status: 'Active'
    };

    addDepreciationSchedule(schedule);
    setShowScheduleModal(false);
    setScheduleData({
      assetId: '',
      method: 'straight-line',
      startDate: '',
      endDate: '',
      depreciationRate: ''
    });
  };

  const stats = getDepreciationStats();
  const topDepreciatedAssets = getTopDepreciatedAssets();

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الإهلاك</h1>
          <p className="mt-1 text-sm text-gray-500">
            حساب وإدارة إهلاك الأصول الثابتة بطرق مختلفة
          </p>
        </div>
        <Button onClick={() => setShowScheduleModal(true)}>
          إنشاء جدول إهلاك
        </Button>
      </div>

      {/* إحصائيات الإهلاك */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">إجمالي الأصول</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAssets}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">أصول بإهلاك</p>
                <p className="text-2xl font-bold text-gray-900">{stats.assetsWithDepreciation}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">إجمالي الإهلاك</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalDepreciationValue.toLocaleString()} ريال
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">طرق الإهلاك</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(stats.methodDistribution).length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* توزيع طرق الإهلاك */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">توزيع طرق الإهلاك</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.methodDistribution).map(([method, count]) => {
              const methodLabels = {
                'straight-line': 'القسط الثابت',
                'declining-balance': 'الرصيد المتناقص',
                'units-of-production': 'وحدات الإنتاج'
              };
              const percentage = ((count / stats.totalAssets) * 100).toFixed(1);
              return (
                <div key={method} className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">{methodLabels[method] || method}</div>
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-500">{percentage}% من الإجمالي</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* شريط البحث والفلترة */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                طريقة الإهلاك
              </label>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">جميع الطرق</option>
                <option value="straight-line">القسط الثابت</option>
                <option value="declining-balance">الرصيد المتناقص</option>
                <option value="units-of-production">وحدات الإنتاج</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterMethod('');
                }}
              >
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* الأصول الأكثر إهلاكاً */}
      {topDepreciatedAssets.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">الأصول الأكثر إهلاكاً</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topDepreciatedAssets.slice(0, 6).map(asset => (
                <div key={asset.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-medium text-gray-900">{asset.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    إهلاك: {asset.depreciationInfo.totalDepreciation.toLocaleString()} ريال
                  </div>
                  <div className="text-sm text-gray-600">
                    القيمة الحالية: {asset.currentValue.toLocaleString()} ريال
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {asset.depreciationInfo?.method === 'straight-line' ? 'القسط الثابت' :
                     asset.depreciationInfo?.method === 'declining-balance' ? 'الرصيد المتناقص' :
                     asset.depreciationInfo?.method === 'units-of-production' ? 'وحدات الإنتاج' : 'غير محدد'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* جدول الأصول مع الإهلاك */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              جدول الإهلاك ({filteredAssets.length})
            </h3>
          </div>
          <Table
            columns={depreciationColumns}
            data={filteredAssets}
            searchable={false}
            maxHeight="600px"
          />
        </div>
      </Card>

      {/* نموذج إنشاء جدول إهلاك */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="إنشاء جدول إهلاك"
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
                طريقة الإهلاك *
              </label>
              <select
                value={scheduleData.method}
                onChange={(e) => setScheduleData({...scheduleData, method: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="straight-line">القسط الثابت</option>
                <option value="declining-balance">الرصيد المتناقص</option>
                <option value="units-of-production">وحدات الإنتاج</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ البداية *
              </label>
              <input
                type="date"
                value={scheduleData.startDate}
                onChange={(e) => setScheduleData({...scheduleData, startDate: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ النهاية
              </label>
              <input
                type="date"
                value={scheduleData.endDate}
                onChange={(e) => setScheduleData({...scheduleData, endDate: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              معدل الإهلاك (اختياري)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="معدل الإهلاك السنوي"
              value={scheduleData.depreciationRate}
              onChange={(e) => setScheduleData({...scheduleData, depreciationRate: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
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
              إنشاء الجدول
            </Button>
          </div>
        </div>
      </Modal>

      {/* نموذج تقرير الأصل */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title={`تقرير إهلاك الأصل: ${selectedAsset?.name || ''}`}
        size="xl"
      >
        {selectedAsset && (
          <div className="space-y-6">
            {/* معلومات الأصل */}
            <Card>
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">معلومات الأصل</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">اسم الأصل:</span>
                    <span className="mr-2 font-medium">{selectedAsset.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">القيمة الأصلية:</span>
                    <span className="mr-2 font-medium">{selectedAsset.originalValue?.toLocaleString()} ريال</span>
                  </div>
                  <div>
                    <span className="text-gray-600">طريقة الإهلاك:</span>
                    <span className="mr-2 font-medium">
                      {selectedAsset.depreciationMethod === 'straight-line' ? 'القسط الثابت' :
                       selectedAsset.depreciationMethod === 'declining-balance' ? 'الرصيد المتناقص' :
                       selectedAsset.depreciationMethod === 'units-of-production' ? 'وحدات الإنتاج' : 'غير محدد'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">العمر الافتراضي:</span>
                    <span className="mr-2 font-medium">{selectedAsset.usefulLife} سنة</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* تقرير الإهلاك */}
            <Card>
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">تقرير الإهلاك</h4>
                {(() => {
                  const depreciation = calculateDepreciation(selectedAsset.id, selectedAsset.depreciationMethod || 'straight-line');
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">إجمالي الإهلاك:</span>
                        <span className="font-medium text-red-600">
                          {depreciation?.totalDepreciation?.toLocaleString()} ريال
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">القيمة الحالية:</span>
                        <span className="font-medium text-green-600">
                          {((selectedAsset.originalValue || 0) - (depreciation?.totalDepreciation || 0)).toLocaleString()} ريال
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">معدل الإهلاك:</span>
                        <span className="font-medium">
                          {selectedAsset.usefulLife ? 
                            (((selectedAsset.originalValue - (selectedAsset.salvageValue || 0)) / selectedAsset.usefulLife / selectedAsset.originalValue * 100)).toFixed(2)
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">القيمة المتبقية:</span>
                        <span className="font-medium">
                          {selectedAsset.salvageValue?.toLocaleString() || 0} ريال
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Card>
            
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowReportModal(false)}>
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DepreciationManagement;