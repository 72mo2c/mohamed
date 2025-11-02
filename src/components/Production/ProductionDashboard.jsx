// ======================================
// لوحة إنتاجية شاملة
// ======================================

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../Common/Card';
import Button from '../Common/Button';
import Table from '../Common/Table';

const ProductionDashboard = () => {
  const {
    productionOrders,
    productionKPIs,
    getProductionDashboardData,
    calculateOEE,
    calculateOnTimeDelivery,
    calculateMaterialEfficiency,
    products,
    workCenters,
    materialConsumption,
    productionWaste,
    qualityControls
  } = useData();

  const [dashboardData, setDashboardData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [refreshing, setRefreshing] = useState(false);

  // تحديث بيانات اللوحة
  const refreshDashboard = () => {
    setRefreshing(true);
    try {
      const data = getProductionDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('خطأ في تحديث اللوحة:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshDashboard();
  }, [selectedPeriod]);

  // حساب إحصائيات متقدمة
  const calculateAdvancedStats = () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
    const currentYear = new Date().getFullYear();

    let filteredOrders = productionOrders;
    const now = new Date();

    if (selectedPeriod === 'month') {
      filteredOrders = productionOrders.filter(order => 
        order.createdAt?.startsWith(currentMonth)
      );
    } else if (selectedPeriod === 'quarter') {
      filteredOrders = productionOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const orderQuarter = Math.ceil((orderDate.getMonth() + 1) / 3);
        return orderDate.getFullYear() === currentYear && orderQuarter === currentQuarter;
      });
    } else if (selectedPeriod === 'year') {
      filteredOrders = productionOrders.filter(order => 
        order.createdAt?.startsWith(currentYear.toString())
      );
    }

    // حساب مؤشرات الأداء
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(o => o.status === 'Completed').length;
    const inProgressOrders = filteredOrders.filter(o => o.status === 'In Progress').length;
    const scheduledOrders = filteredOrders.filter(o => o.status === 'Scheduled').length;
    
    // حساب معدل الإنجاز في الوقت
    const onTimeOrders = filteredOrders.filter(order => 
      order.actualEndDate && order.actualEndDate <= order.plannedEndDate
    ).length;
    const onTimeDeliveryRate = totalOrders > 0 ? ((onTimeOrders / totalOrders) * 100).toFixed(1) : 0;

    // حساب معدل الهدر
    const totalConsumption = materialConsumption.length;
    const totalWaste = productionWaste.length;
    const wasteRate = totalConsumption > 0 ? ((totalWaste / totalConsumption) * 100).toFixed(1) : 0;

    // حساب معدل الجودة
    const totalQualityChecks = qualityControls.length;
    const passedQualityChecks = qualityControls.filter(qc => qc.status === 'Passed').length;
    const qualityRate = totalQualityChecks > 0 ? ((passedQualityChecks / totalQualityChecks) * 100).toFixed(1) : 0;

    // حساب متوسط مدة الإنتاج
    const completedOrdersWithDates = filteredOrders.filter(order => 
      order.actualStartDate && order.actualEndDate
    );
    const avgProductionTime = completedOrdersWithDates.length > 0 
      ? completedOrdersWithDates.reduce((sum, order) => {
          const start = new Date(order.actualStartDate);
          const end = new Date(order.actualEndDate);
          return sum + (end - start);
        }, 0) / completedOrdersWithDates.length / (1000 * 60 * 60 * 24) // بالأيام
      : 0;

    return {
      totalOrders,
      completedOrders,
      inProgressOrders,
      scheduledOrders,
      onTimeDeliveryRate,
      wasteRate,
      qualityRate,
      avgProductionTime: avgProductionTime.toFixed(1)
    };
  };

  const stats = calculateAdvancedStats();

  // أفضل المنتجات إنتاجاً
  const getTopProducingProducts = () => {
    const productStats = {};
    
    productionOrders
      .filter(order => order.status === 'Completed')
      .forEach(order => {
        const productId = order.productId;
        if (!productStats[productId]) {
          productStats[productId] = {
            productId,
            name: products.find(p => p.id === productId)?.name || 'منتج غير محدد',
            totalQuantity: 0,
            ordersCount: 0
          };
        }
        productStats[productId].totalQuantity += parseFloat(order.quantity) || 0;
        productStats[productId].ordersCount += 1;
      });

    return Object.values(productStats)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);
  };

  // أداء مراكز العمل
  const getWorkCenterPerformance = () => {
    const centerStats = {};
    
    workCenters.forEach(center => {
      centerStats[center.id] = {
        id: center.id,
        name: center.name,
        totalOrders: 0,
        completedOrders: 0,
        utilization: 0
      };
    });

    productionOrders.forEach(order => {
      if (order.workCenterId && centerStats[order.workCenterId]) {
        centerStats[order.workCenterId].totalOrders += 1;
        if (order.status === 'Completed') {
          centerStats[order.workCenterId].completedOrders += 1;
        }
      }
    });

    return Object.values(centerStats)
      .map(center => ({
        ...center,
        completionRate: center.totalOrders > 0 
          ? ((center.completedOrders / center.totalOrders) * 100).toFixed(1) 
          : 0
      }))
      .sort((a, b) => b.completedOrders - a.completedOrders);
  };

  // أوامر الإنتاج الحرجة
  const getCriticalOrders = () => {
    const now = new Date();
    return productionOrders
      .filter(order => 
        (order.status === 'In Progress' || order.status === 'Scheduled') &&
        order.plannedEndDate &&
        new Date(order.plannedEndDate) <= new Date(now.getTime() + 24 * 60 * 60 * 1000) // خلال 24 ساعة
      )
      .sort((a, b) => new Date(a.plannedEndDate) - new Date(b.plannedEndDate))
      .slice(0, 5);
  };

  // أعمدة جدول الأوامر الحرجة
  const criticalOrdersColumns = [
    {
      header: 'رقم الأمر',
      accessor: 'id',
      render: (value) => (
        <div className="font-medium text-red-600">#{value}</div>
      )
    },
    {
      header: 'المنتج',
      accessor: 'productId',
      render: (value) => {
        const product = products.find(p => p.id === value);
        return <div className="font-medium">{product?.name || 'منتج غير محدد'}</div>;
      }
    },
    {
      header: 'الكمية',
      accessor: 'quantity',
      render: (value) => <div>{value} وحدة</div>
    },
    {
      header: 'الحالة',
      accessor: 'status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'In Progress' ? 'bg-green-100 text-green-800' :
          value === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      header: 'الموعد النهائي',
      accessor: 'plannedEndDate',
      render: (value) => {
        const endDate = new Date(value);
        const now = new Date();
        const hoursLeft = Math.ceil((endDate - now) / (1000 * 60 * 60));
        
        return (
          <div className={`font-medium ${hoursLeft < 0 ? 'text-red-600' : hoursLeft < 8 ? 'text-orange-600' : 'text-gray-900'}`}>
            {endDate.toLocaleDateString('ar')} ({hoursLeft}ساعة)
          </div>
        );
      }
    },
    {
      header: 'الأولوية',
      accessor: 'priority',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Urgent' ? 'bg-red-100 text-red-800' :
          value === 'High' ? 'bg-orange-100 text-orange-800' :
          value === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {value}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة الإنتاجية</h1>
          <p className="text-gray-600">نظرة شاملة على أداء الإنتاج والمؤشرات الرئيسية</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="month">الشهر الحالي</option>
            <option value="quarter">الربع الحالي</option>
            <option value="year">السنة الحالية</option>
            <option value="all">جميع الفترات</option>
          </select>
          <Button
            onClick={refreshDashboard}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {refreshing ? 'جاري التحديث...' : 'تحديث'}
          </Button>
        </div>
      </div>

      {/* مؤشرات الأداء الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">إجمالي الأوامر</div>
              <div className="text-3xl font-bold text-blue-600">{stats.totalOrders}</div>
              <div className="text-sm text-gray-500 mt-1">
                مكتملة: {stats.completedOrders} | قيد التشغيل: {stats.inProgressOrders}
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">الإنجاز في الوقت</div>
              <div className="text-3xl font-bold text-green-600">{stats.onTimeDeliveryRate}%</div>
              <div className="text-sm text-gray-500 mt-1">
                هدف: 95% | الحالي: {stats.onTimeDeliveryRate}%
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">معدل الهدر</div>
              <div className="text-3xl font-bold text-red-600">{stats.wasteRate}%</div>
              <div className="text-sm text-gray-500 mt-1">
                هدف: أقل من 2% | الحالي: {stats.wasteRate}%
              </div>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">معدل الجودة</div>
              <div className="text-3xl font-bold text-purple-600">{stats.qualityRate}%</div>
              <div className="text-sm text-gray-500 mt-1">
                هدف: 99% | الحالي: {stats.qualityRate}%
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* مؤشرات إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">مدة الإنتاج المتوسطة</div>
            <div className="text-4xl font-bold text-blue-600">{stats.avgProductionTime}</div>
            <div className="text-sm text-gray-500">أيام لكل أمر</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">أوامر مجدولة</div>
            <div className="text-4xl font-bold text-yellow-600">{stats.scheduledOrders}</div>
            <div className="text-sm text-gray-500">أمر في الانتظار</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">معدل الإنجاز</div>
            <div className="text-4xl font-bold text-green-600">
              {stats.totalOrders > 0 ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-gray-500">من إجمالي الأوامر</div>
          </div>
        </Card>
      </div>

      {/* صف مزدوج */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الأوامر الحرجة */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-red-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            أوامر حرجة (تنتهي خلال 24 ساعة)
          </h3>
          {getCriticalOrders().length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد أوامر حرجة حالياً</p>
          ) : (
            <Table
              columns={criticalOrdersColumns}
              data={getCriticalOrders()}
              className="min-w-full"
            />
          )}
        </Card>

        {/* أفضل المنتجات إنتاجاً */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            أفضل المنتجات إنتاجاً
          </h3>
          <div className="space-y-4">
            {getTopProducingProducts().map((product, index) => (
              <div key={product.productId} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="mr-3">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.ordersCount} أمر</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{product.totalQuantity.toFixed(0)}</div>
                  <div className="text-sm text-gray-500">وحدة</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* أداء مراكز العمل */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 text-blue-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          أداء مراكز العمل
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getWorkCenterPerformance().map((center) => (
            <div key={center.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{center.name}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  parseFloat(center.completionRate) >= 90 ? 'bg-green-100 text-green-800' :
                  parseFloat(center.completionRate) >= 70 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {center.completionRate}%
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <div>إجمالي الأوامر: {center.totalOrders}</div>
                <div>أوامر مكتملة: {center.completedOrders}</div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      parseFloat(center.completionRate) >= 90 ? 'bg-green-500' :
                      parseFloat(center.completionRate) >= 70 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${center.completionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ProductionDashboard;
