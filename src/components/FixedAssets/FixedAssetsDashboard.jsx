// ======================================
// لوحة تحكم شاملة للأصول الثابتة
// ======================================

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../Common/Card';
import Button from '../Common/Button';
import Table from '../Common/Table';

const FixedAssetsDashboard = () => {
  const {
    fixedAssets,
    assetCategories,
    assetLocations,
    depreciationEntries,
    assetMaintenance,
    assetInventory,
    assetDisposals,
    calculateDepreciation,
    getAssetReport,
    getAssetValuation,
    getDepreciationSummary,
    getUpcomingMaintenance,
    getInventoryStatus,
    addMaintenanceSchedule,
    performAssetInventory
  } = useData();

  const [dashboardData, setDashboardData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [refreshing, setRefreshing] = useState(false);

  // تحديث بيانات اللوحة
  const refreshDashboard = () => {
    setRefreshing(true);
    try {
      const data = getDepreciationSummary();
      const maintenanceData = getUpcomingMaintenance(30);
      const inventoryData = getInventoryStatus();
      
      setDashboardData({
        depreciation: data,
        maintenance: maintenanceData,
        inventory: inventoryData,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('خطأ في تحديث لوحة الأصول الثابتة:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshDashboard();
  }, [selectedPeriod, fixedAssets, depreciationEntries]);

  // حساب إحصائيات شاملة
  const calculateAdvancedStats = () => {
    const currentDate = new Date();
    
    // إحصائيات الأصول
    const totalAssets = fixedAssets.length;
    const activeAssets = fixedAssets.filter(asset => asset.status === 'Active').length;
    const underMaintenanceAssets = fixedAssets.filter(asset => 
      assetMaintenance.some(m => m.assetId === asset.id && m.status === 'Scheduled')
    ).length;
    
    // إحصائيات القيمة
    const totalOriginalValue = fixedAssets.reduce((sum, asset) => sum + (asset.originalValue || 0), 0);
    const totalCurrentValue = fixedAssets.reduce((sum, asset) => {
      const depreciation = calculateDepreciation(asset.id, asset.depreciationMethod || 'straight-line');
      return sum + ((asset.originalValue || 0) - (depreciation?.totalDepreciation || 0));
    }, 0);
    
    // إحصائيات الإهلاك
    const totalDepreciationValue = depreciationEntries.reduce((sum, dep) => sum + (dep.depreciationAmount || 0), 0);
    
    // إحصائيات الصيانة
    const upcomingMaintenance = assetMaintenance.filter(m => 
      m.nextDate && new Date(m.nextDate) <= new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    ).length;
    
    const overdueMaintenance = assetMaintenance.filter(m => 
      m.nextDate && new Date(m.nextDate) < currentDate && m.status === 'Scheduled'
    ).length;
    
    // معدل الاستخدام
    const utilizationRate = totalAssets > 0 ? ((activeAssets / totalAssets) * 100).toFixed(1) : 0;
    
    // معدل الهبوط في القيمة
    const valueDropRate = totalOriginalValue > 0 
      ? (((totalOriginalValue - totalCurrentValue) / totalOriginalValue) * 100).toFixed(1) 
      : 0;

    return {
      totalAssets,
      activeAssets,
      underMaintenanceAssets,
      totalOriginalValue,
      totalCurrentValue,
      totalDepreciationValue,
      upcomingMaintenance,
      overdueMaintenance,
      utilizationRate,
      valueDropRate
    };
  };

  // إحصائيات حسب الفئة
  const getCategoryStats = () => {
    return assetCategories.map(category => {
      const categoryAssets = fixedAssets.filter(asset => asset.categoryId === category.id);
      const totalValue = categoryAssets.reduce((sum, asset) => sum + (asset.originalValue || 0), 0);
      const currentValue = categoryAssets.reduce((sum, asset) => {
        const depreciation = calculateDepreciation(asset.id, asset.depreciationMethod || 'straight-line');
        return sum + ((asset.originalValue || 0) - (depreciation?.totalDepreciation || 0));
      }, 0);
      
      return {
        ...category,
        assetCount: categoryAssets.length,
        totalValue,
        currentValue,
        depreciationValue: totalValue - currentValue
      };
    }).sort((a, b) => b.totalValue - a.totalValue);
  };

  // الأصول ذات الأهمية القصوى
  const getCriticalAssets = () => {
    const now = new Date();
    return fixedAssets
      .filter(asset => {
        const isHighValue = (asset.originalValue || 0) > 100000;
        const hasOverdueMaintenance = assetMaintenance.some(m => 
          m.assetId === asset.id && 
          m.nextDate && 
          new Date(m.nextDate) < now && 
          m.status === 'Scheduled'
        );
        return isHighValue || hasOverdueMaintenance;
      })
      .slice(0, 5);
  };

  const stats = calculateAdvancedStats();
  const categoryStats = getCategoryStats();
  const criticalAssets = getCriticalAssets();

  // أعمدة جدول الأصول الحرجة
  const criticalAssetsColumns = [
    {
      header: 'اسم الأصل',
      accessor: 'name',
      render: (value) => (
        <div className="font-medium">{value}</div>
      )
    },
    {
      header: 'القيمة الحالية',
      accessor: 'originalValue',
      render: (value, row) => {
        const depreciation = calculateDepreciation(row.id, row.depreciationMethod || 'straight-line');
        const currentValue = (value || 0) - (depreciation?.totalDepreciation || 0);
        return (
          <div className="text-green-600 font-medium">
            {currentValue.toLocaleString()} ريال
          </div>
        );
      }
    },
    {
      header: 'التصنيف',
      accessor: 'categoryId',
      render: (value) => {
        const category = assetCategories.find(c => c.id === value);
        return (
          <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
            {category?.name || 'غير محدد'}
          </div>
        );
      }
    },
    {
      header: 'الحالة',
      accessor: 'status',
      render: (value) => {
        const statusColors = {
          'Active': 'bg-green-100 text-green-800',
          'Under Maintenance': 'bg-yellow-100 text-yellow-800',
          'Disposed': 'bg-red-100 text-red-800'
        };
        return (
          <div className={`px-2 py-1 rounded text-sm ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {value === 'Active' ? 'نشط' : 
             value === 'Under Maintenance' ? 'تحت الصيانة' : 
             value === 'Disposed' ? 'تم التصرف' : value}
          </div>
        );
      }
    }
  ];

  // أعمدة جدول الفئات
  const categoryColumns = [
    {
      header: 'اسم الفئة',
      accessor: 'name',
      render: (value) => (
        <div className="font-medium">{value}</div>
      )
    },
    {
      header: 'عدد الأصول',
      accessor: 'assetCount',
      render: (value) => (
        <div className="text-blue-600 font-medium">{value}</div>
      )
    },
    {
      header: 'القيمة الأصلية',
      accessor: 'totalValue',
      render: (value) => (
        <div className="text-green-600 font-medium">
          {value.toLocaleString()} ريال
        </div>
      )
    },
    {
      header: 'القيمة الحالية',
      accessor: 'currentValue',
      render: (value) => (
        <div className="text-green-600 font-medium">
          {value.toLocaleString()} ريال
        </div>
      )
    },
    {
      header: 'قيمة الإهلاك',
      accessor: 'depreciationValue',
      render: (value) => (
        <div className="text-red-600 font-medium">
          {value.toLocaleString()} ريال
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم الأصول الثابتة</h1>
          <p className="mt-1 text-sm text-gray-500">
            إدارة شاملة لجميع الأصول الثابتة والإهلاك والصيانة
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="month">شهري</option>
            <option value="quarter">ربع سنوي</option>
            <option value="year">سنوي</option>
          </select>
          <Button
            onClick={refreshDashboard}
            disabled={refreshing}
            variant="outline"
          >
            {refreshing ? 'جاري التحديث...' : 'تحديث'}
          </Button>
        </div>
      </div>

      {/* مؤشرات الأداء الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                نشط: <span className="font-medium text-green-600">{stats.activeAssets}</span>
              </p>
              <p className="text-sm text-gray-600">
                تحت الصيانة: <span className="font-medium text-yellow-600">{stats.underMaintenanceAssets}</span>
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">القيمة الحالية</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalCurrentValue.toLocaleString()} ريال
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                القيمة الأصلية: <span className="font-medium">{stats.totalOriginalValue.toLocaleString()} ريال</span>
              </p>
              <p className="text-sm text-gray-600">
                معدل الهبوط: <span className="font-medium text-red-600">{stats.valueDropRate}%</span>
              </p>
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
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                معدل الاستخدام: <span className="font-medium text-green-600">{stats.utilizationRate}%</span>
              </p>
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
                <p className="text-sm font-medium text-gray-500">الصيانة القادمة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingMaintenance}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                متأخرة: <span className="font-medium text-red-600">{stats.overdueMaintenance}</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* جداول التحليل */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الأصول الحرجة */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">الأصول الحرجة</h3>
            {criticalAssets.length > 0 ? (
              <Table
                columns={criticalAssetsColumns}
                data={criticalAssets}
                maxHeight="300px"
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد أصول حرجة
              </div>
            )}
          </div>
        </Card>

        {/* إحصائيات الفئات */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">إحصائيات حسب الفئة</h3>
            {categoryStats.length > 0 ? (
              <Table
                columns={categoryColumns}
                data={categoryStats}
                maxHeight="300px"
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد فئات مسجلة
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FixedAssetsDashboard;