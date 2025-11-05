// ======================================
// جرد وتقييم الأصول الثابتة
// ======================================

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../Common/Card';
import Button from '../Common/Button';
import Table from '../Common/Table';
import Modal from '../Common/Modal';

const AssetInventory = () => {
  const {
    fixedAssets,
    assetCategories,
    assetLocations,
    assetInventory,
    performAssetInventory,
    calculateDepreciation
  } = useData();

  const [selectedInventory, setSelectedInventory] = useState(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // بيانات الجرد
  const [inventoryData, setInventoryData] = useState({
    assetId: '',
    inventoryDate: new Date().toISOString().split('T')[0],
    physicalCondition: 'good',
    functionalStatus: 'operational',
    locationVerified: true,
    currentValue: '',
    conditionNotes: '',
    discrepancies: '',
    recommendedActions: '',
    inspectedBy: '',
    verifiedBy: ''
  });

  // تصفية الجرد
  const filteredInventory = assetInventory.filter(inventory => {
    const asset = fixedAssets.find(a => a.id === inventory.assetId);
    const matchesSearch = asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inventory.conditionNotes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || asset?.categoryId === filterCategory;
    const matchesLocation = !filterLocation || asset?.locationId === filterLocation;
    const matchesStatus = !filterStatus || inventory.functionalStatus === filterStatus;
    
    return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
  });

  // إحصائيات الجرد
  const getInventoryStats = () => {
    const totalInventories = assetInventory.length;
    const thisMonthInventories = assetInventory.filter(inv => {
      const invDate = new Date(inv.inventoryDate);
      const now = new Date();
      return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
    }).length;

    const conditionDistribution = assetInventory.reduce((acc, inv) => {
      acc[inv.physicalCondition] = (acc[inv.physicalCondition] || 0) + 1;
      return acc;
    }, {});

    const totalValue = assetInventory.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);

    return {
      totalInventories,
      thisMonthInventories,
      conditionDistribution,
      totalValue
    };
  };

  // مقارنة بين القيم المحاسبية والفعلية
  const getValueComparison = () => {
    const comparisons = assetInventory.map(inventory => {
      const asset = fixedAssets.find(a => a.id === inventory.assetId);
      if (!asset) return null;
      
      const depreciation = calculateDepreciation(asset.id, asset.depreciationMethod || 'straight-line');
      const bookValue = (asset.originalValue || 0) - (depreciation?.totalDepreciation || 0);
      const actualValue = inventory.currentValue || bookValue;
      const variance = actualValue - bookValue;
      
      return {
        asset,
        inventory,
        bookValue,
        actualValue,
        variance,
        variancePercentage: bookValue !== 0 ? ((variance / bookValue) * 100) : 0
      };
    }).filter(Boolean);

    return comparisons;
  };

  // الأصول غير المقيدة (لم يتم جردها مؤخراً)
  const getUninventoriedAssets = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return fixedAssets.filter(asset => {
      const lastInventory = assetInventory
        .filter(inv => inv.assetId === asset.id)
        .sort((a, b) => new Date(b.inventoryDate) - new Date(a.inventoryDate))[0];
      
      return !lastInventory || new Date(lastInventory.inventoryDate) < thirtyDaysAgo;
    });
  };

  // أعمدة جدول الجرد
  const inventoryColumns = [
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
      header: 'تصنيف',
      accessor: 'assetId',
      render: (value) => {
        const asset = fixedAssets.find(a => a.id === value);
        const category = assetCategories.find(c => c.id === asset?.categoryId);
        return (
          <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
            {category?.name || 'غير محدد'}
          </div>
        );
      }
    },
    {
      header: 'موقع',
      accessor: 'assetId',
      render: (value) => {
        const asset = fixedAssets.find(a => a.id === value);
        const location = assetLocations.find(l => l.id === asset?.locationId);
        return (
          <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
            {location?.name || 'غير محدد'}
          </div>
        );
      }
    },
    {
      header: 'تاريخ الجرد',
      accessor: 'inventoryDate',
      render: (value) => (
        <div className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString('ar-SA')}
        </div>
      )
    },
    {
      header: 'الحالة المادية',
      accessor: 'physicalCondition',
      render: (value) => {
        const conditionLabels = {
          'excellent': 'ممتاز',
          'good': 'جيد',
          'fair': 'متوسط',
          'poor': 'ضعيف',
          'damaged': 'تالف'
        };
        const conditionColors = {
          'excellent': 'bg-green-100 text-green-800',
          'good': 'bg-blue-100 text-blue-800',
          'fair': 'bg-yellow-100 text-yellow-800',
          'poor': 'bg-orange-100 text-orange-800',
          'damaged': 'bg-red-100 text-red-800'
        };
        return (
          <div className={`px-2 py-1 rounded text-sm ${conditionColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {conditionLabels[value] || value}
          </div>
        );
      }
    },
    {
      header: 'الحالة الوظيفية',
      accessor: 'functionalStatus',
      render: (value) => {
        const statusLabels = {
          'operational': 'يعمل',
          'partial': 'يعمل جزئياً',
          'non-operational': 'لا يعمل',
          'maintenance-required': 'يحتاج صيانة'
        };
        const statusColors = {
          'operational': 'bg-green-100 text-green-800',
          'partial': 'bg-yellow-100 text-yellow-800',
          'non-operational': 'bg-red-100 text-red-800',
          'maintenance-required': 'bg-orange-100 text-orange-800'
        };
        return (
          <div className={`px-2 py-1 rounded text-sm ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {statusLabels[value] || value}
          </div>
        );
      }
    },
    {
      header: 'القيمة الحالية',
      accessor: 'currentValue',
      render: (value, row) => {
        const asset = fixedAssets.find(a => a.id === row.assetId);
        const depreciation = calculateDepreciation(asset.id, asset?.depreciationMethod || 'straight-line');
        const bookValue = (asset?.originalValue || 0) - (depreciation?.totalDepreciation || 0);
        
        return (
          <div>
            <div className="font-medium text-green-600">
              {value ? value.toLocaleString() : bookValue.toLocaleString()} ريال
            </div>
            {value && Math.abs(value - bookValue) > 100 && (
              <div className="text-xs text-red-600">
                تباين: {((value - bookValue) / bookValue * 100).toFixed(1)}%
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: 'تم التحقق',
      accessor: 'locationVerified',
      render: (value) => (
        <div className={`px-2 py-1 rounded text-sm ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'نعم' : 'لا'}
        </div>
      )
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
              setSelectedInventory(row);
              setInventoryData({
                ...inventoryData,
                assetId: row.assetId,
                currentValue: row.currentValue || ''
              });
              setShowComparisonModal(true);
            }}
          >
            مقارنة
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedInventory(row);
              setShowSummaryModal(true);
            }}
          >
            تفاصيل
          </Button>
        </div>
      )
    }
  ];

  // إجراء جرد جديد
  const handlePerformInventory = () => {
    if (!inventoryData.assetId || !inventoryData.inventoryDate) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const inventory = {
      ...inventoryData,
      id: Date.now().toString(),
      currentValue: parseFloat(inventoryData.currentValue) || 0,
      createdAt: new Date().toISOString()
    };

    performAssetInventory(inventory);
    setShowInventoryModal(false);
    setInventoryData({
      assetId: '',
      inventoryDate: new Date().toISOString().split('T')[0],
      physicalCondition: 'good',
      functionalStatus: 'operational',
      locationVerified: true,
      currentValue: '',
      conditionNotes: '',
      discrepancies: '',
      recommendedActions: '',
      inspectedBy: '',
      verifiedBy: ''
    });
  };

  const stats = getInventoryStats();
  const uninventoriedAssets = getUninventoriedAssets();

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">جرد وتقييم الأصول</h1>
          <p className="mt-1 text-sm text-gray-500">
            جرد دوري وتقييم حالة جميع الأصول الثابتة
          </p>
        </div>
        <Button onClick={() => setShowInventoryModal(true)}>
          إجراء جرد جديد
        </Button>
      </div>

      {/* إحصائيات الجرد */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">إجمالي الجرد</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInventories}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12v4m-4 4h.01M16 4h.01M20 8h-6a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2V10a2 2 0 00-2-2z" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">هذا الشهر</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisMonthInventories}</p>
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
                <p className="text-sm font-medium text-gray-500">القيمة الإجمالية</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalValue.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-gray-500">غير مقيدة</p>
                <p className="text-2xl font-bold text-gray-900">{uninventoriedAssets.length}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* توزيع الحالات */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">توزيع الحالات المادية</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.conditionDistribution).map(([condition, count]) => {
              const conditionLabels = {
                'excellent': 'ممتاز',
                'good': 'جيد',
                'fair': 'متوسط',
                'poor': 'ضعيف',
                'damaged': 'تالف'
              };
              const conditionColors = {
                'excellent': 'bg-green-100 text-green-800',
                'good': 'bg-blue-100 text-blue-800',
                'fair': 'bg-yellow-100 text-yellow-800',
                'poor': 'bg-orange-100 text-orange-800',
                'damaged': 'bg-red-100 text-red-800'
              };
              const percentage = stats.totalInventories > 0 ? ((count / stats.totalInventories) * 100).toFixed(1) : 0;
              return (
                <div key={condition} className={`p-4 rounded-lg ${conditionColors[condition] || 'bg-gray-100'}`}>
                  <div className="text-sm font-medium">{conditionLabels[condition] || condition}</div>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* الأصول غير المقيدة */}
      {uninventoriedAssets.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-full mr-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 17.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-600">أصول تحتاج جرد (لم تُقيد منذ 30 يوم)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uninventoriedAssets.slice(0, 6).map(asset => {
                const lastInventory = assetInventory
                  .filter(inv => inv.assetId === asset.id)
                  .sort((a, b) => new Date(b.inventoryDate) - new Date(a.inventoryDate))[0];
                
                return (
                  <div key={asset.id} className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="font-medium text-red-900">{asset.name}</div>
                    <div className="text-sm text-red-700 mt-1">
                      القيمة: {asset.originalValue?.toLocaleString()} ريال
                    </div>
                    {lastInventory && (
                      <div className="text-xs text-red-600 mt-1">
                        آخر جرد: {new Date(lastInventory.inventoryDate).toLocaleDateString('ar-SA')}
                      </div>
                    )}
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
                التصنيف
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">جميع التصنيفات</option>
                {assetCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الموقع
              </label>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">جميع المواقع</option>
                {assetLocations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                  setFilterLocation('');
                  setFilterStatus('');
                }}
              >
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* جدول الجرد */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              سجل الجرد ({filteredInventory.length})
            </h3>
          </div>
          <Table
            columns={inventoryColumns}
            data={filteredInventory}
            searchable={false}
            maxHeight="600px"
          />
        </div>
      </Card>

      {/* نموذج إجراء جرد جديد */}
      <Modal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        title="إجراء جرد جديد"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الأصل *
              </label>
              <select
                value={inventoryData.assetId}
                onChange={(e) => setInventoryData({...inventoryData, assetId: e.target.value})}
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
                تاريخ الجرد *
              </label>
              <input
                type="date"
                value={inventoryData.inventoryDate}
                onChange={(e) => setInventoryData({...inventoryData, inventoryDate: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة المادية *
              </label>
              <select
                value={inventoryData.physicalCondition}
                onChange={(e) => setInventoryData({...inventoryData, physicalCondition: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="excellent">ممتاز</option>
                <option value="good">جيد</option>
                <option value="fair">متوسط</option>
                <option value="poor">ضعيف</option>
                <option value="damaged">تالف</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة الوظيفية *
              </label>
              <select
                value={inventoryData.functionalStatus}
                onChange={(e) => setInventoryData({...inventoryData, functionalStatus: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="operational">يعمل</option>
                <option value="partial">يعمل جزئياً</option>
                <option value="non-operational">لا يعمل</option>
                <option value="maintenance-required">يحتاج صيانة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                القيمة الحالية
              </label>
              <input
                type="number"
                value={inventoryData.currentValue}
                onChange={(e) => setInventoryData({...inventoryData, currentValue: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="ريال"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تم التحقق من الموقع
              </label>
              <select
                value={inventoryData.locationVerified}
                onChange={(e) => setInventoryData({...inventoryData, locationVerified: e.target.value === 'true'})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="true">نعم</option>
                <option value="false">لا</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المفتش
              </label>
              <input
                type="text"
                value={inventoryData.inspectedBy}
                onChange={(e) => setInventoryData({...inventoryData, inspectedBy: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="اسم المفتش..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المراجع
              </label>
              <input
                type="text"
                value={inventoryData.verifiedBy}
                onChange={(e) => setInventoryData({...inventoryData, verifiedBy: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="اسم المراجع..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات الحالة
            </label>
            <textarea
              value={inventoryData.conditionNotes}
              onChange={(e) => setInventoryData({...inventoryData, conditionNotes: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
              placeholder="ملاحظات حول حالة الأصل..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الفروقات الملاحظة
            </label>
            <textarea
              value={inventoryData.discrepancies}
              onChange={(e) => setInventoryData({...inventoryData, discrepancies: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={2}
              placeholder="أي فروقات أو مشاكل ملاحظة..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الإجراءات المقترحة
            </label>
            <textarea
              value={inventoryData.recommendedActions}
              onChange={(e) => setInventoryData({...inventoryData, recommendedActions: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={2}
              placeholder="إجراءات مقترحة للصيانة أو الإصلاح..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowInventoryModal(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handlePerformInventory}>
              حفظ الجرد
            </Button>
          </div>
        </div>
      </Modal>

      {/* نموذج مقارنة القيم */}
      <Modal
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        title="مقارنة القيم"
        size="lg"
      >
        {selectedInventory && (
          <div className="space-y-6">
            <Card>
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">مقارنة القيمة المحاسبية والفعلية</h4>
                {(() => {
                  const asset = fixedAssets.find(a => a.id === selectedInventory.assetId);
                  if (!asset) return null;
                  
                  const depreciation = calculateDepreciation(asset.id, asset.depreciationMethod || 'straight-line');
                  const bookValue = (asset.originalValue || 0) - (depreciation?.totalDepreciation || 0);
                  const actualValue = selectedInventory.currentValue || bookValue;
                  const variance = actualValue - bookValue;
                  
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">القيمة المحاسبية</div>
                          <div className="text-lg font-bold text-gray-900">
                            {bookValue.toLocaleString()} ريال
                          </div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <div className="text-sm text-gray-600">القيمة الفعلية</div>
                          <div className="text-lg font-bold text-blue-600">
                            {actualValue.toLocaleString()} ريال
                          </div>
                        </div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded">
                        <div className="text-sm text-gray-600">التباين</div>
                        <div className={`text-lg font-bold ${
                          variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {variance > 0 ? '+' : ''}{variance.toLocaleString()} ريال
                          <div className="text-xs mt-1">
                            ({variance > 0 ? '+' : ''}{bookValue !== 0 ? ((variance / bookValue) * 100).toFixed(1) : 0}%)
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>تاريخ الجرد: {new Date(selectedInventory.inventoryDate).toLocaleDateString('ar-SA')}</div>
                        <div>الحالة المادية: {
                          selectedInventory.physicalCondition === 'excellent' ? 'ممتاز' :
                          selectedInventory.physicalCondition === 'good' ? 'جيد' :
                          selectedInventory.physicalCondition === 'fair' ? 'متوسط' :
                          selectedInventory.physicalCondition === 'poor' ? 'ضعيف' :
                          selectedInventory.physicalCondition === 'damaged' ? 'تالف' : selectedInventory.physicalCondition
                        }</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Card>
            
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowComparisonModal(false)}>
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* نموذج تفاصيل الجرد */}
      <Modal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        title="تفاصيل الجرد"
        size="lg"
      >
        {selectedInventory && (
          <div className="space-y-6">
            <Card>
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">معلومات الجرد</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">تاريخ الجرد:</span>
                    <span className="mr-2 font-medium">
                      {new Date(selectedInventory.inventoryDate).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">الحالة المادية:</span>
                    <span className="mr-2 font-medium">
                      {selectedInventory.physicalCondition === 'excellent' ? 'ممتاز' :
                       selectedInventory.physicalCondition === 'good' ? 'جيد' :
                       selectedInventory.physicalCondition === 'fair' ? 'متوسط' :
                       selectedInventory.physicalCondition === 'poor' ? 'ضعيف' :
                       selectedInventory.physicalCondition === 'damaged' ? 'تالف' : selectedInventory.physicalCondition}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">الحالة الوظيفية:</span>
                    <span className="mr-2 font-medium">
                      {selectedInventory.functionalStatus === 'operational' ? 'يعمل' :
                       selectedInventory.functionalStatus === 'partial' ? 'يعمل جزئياً' :
                       selectedInventory.functionalStatus === 'non-operational' ? 'لا يعمل' :
                       selectedInventory.functionalStatus === 'maintenance-required' ? 'يحتاج صيانة' : selectedInventory.functionalStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">تم التحقق:</span>
                    <span className="mr-2 font-medium">
                      {selectedInventory.locationVerified ? 'نعم' : 'لا'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">القيمة الحالية:</span>
                    <span className="mr-2 font-medium">
                      {selectedInventory.currentValue?.toLocaleString() || 0} ريال
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">المفتش:</span>
                    <span className="mr-2 font-medium">
                      {selectedInventory.inspectedBy || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {selectedInventory.conditionNotes && (
              <Card>
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">ملاحظات الحالة</h4>
                  <p className="text-sm text-gray-600">{selectedInventory.conditionNotes}</p>
                </div>
              </Card>
            )}

            {selectedInventory.discrepancies && (
              <Card>
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">الفروقات الملاحظة</h4>
                  <p className="text-sm text-gray-600">{selectedInventory.discrepancies}</p>
                </div>
              </Card>
            )}

            {selectedInventory.recommendedActions && (
              <Card>
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">الإجراءات المقترحة</h4>
                  <p className="text-sm text-gray-600">{selectedInventory.recommendedActions}</p>
                </div>
              </Card>
            )}
            
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowSummaryModal(false)}>
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssetInventory;