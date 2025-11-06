// ======================================
// Dashboard Page - لوحة التحكم
// ======================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { 
  FaWarehouse, 
  FaShoppingCart, 
  FaMoneyBillWave, 
  FaTruck, 
  FaUsers,
  FaBox,
  FaChartLine,
  FaChartBar,
  FaExclamationTriangle,
  FaArrowLeft,
  FaUndo,
  FaWallet,
  FaFileInvoice,
  FaClipboardList,
  FaTools
} from 'react-icons/fa';

const Dashboard = () => {
  const navigate = useNavigate();
  const { warehouses, products, suppliers, customers, purchaseInvoices, salesInvoices, treasuryBalance } = useData();

  // حساب الإحصائيات المحسّنة
  const totalProducts = products.length;
  const totalWarehouses = warehouses.length;
  const totalSuppliers = suppliers.length;
  const totalCustomers = customers.length;
  const totalPurchases = purchaseInvoices.length;
  const totalSales = salesInvoices.length;
  const currentTreasuryBalance = treasuryBalance || 0;
  const lowStockProducts = products.filter(p => (p.mainQuantity || 0) < 10).length;
  const negativeProducts = products.filter(p => (p.mainQuantity || 0) < 0).length;
  const outOfStockProducts = products.filter(p => (p.mainQuantity || 0) === 0).length;
  
  // حساب قيم مالية
  const totalInventoryValue = products.reduce((sum, p) => sum + ((p.mainPrice || 0) * (p.mainQuantity || 0)), 0);
  const totalSalesValue = salesInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalPurchasesValue = purchaseInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  
  const monthlySales = salesInvoices.filter(inv => {
    const invDate = new Date(inv.date);
    return invDate.getMonth() === thisMonth && invDate.getFullYear() === thisYear;
  }).reduce((sum, inv) => sum + (inv.total || 0), 0);
  
  const monthlyPurchases = purchaseInvoices.filter(inv => {
    const invDate = new Date(inv.date);
    return invDate.getMonth() === thisMonth && invDate.getFullYear() === thisYear;
  }).reduce((sum, inv) => sum + (inv.total || 0), 0);

  // بطاقات أقسام النظام
  const systemModules = [
    {
      title: 'المخازن',
      description: 'إدارة شاملة للمخازن والمنتجات والمخزون',
      icon: <FaWarehouse />,
      gradient: 'from-orange-400 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
      stats: {
        label: 'عدد المخازن',
        value: totalWarehouses,
        subLabel: `${totalProducts} منتج`
      },
      tasks: [
        'إدارة المخازن',
        'إضافة وتعديل المنتجات',
        'مراقبة المخزون',
        'تقارير الجرد'
      ],
      path: '/warehouses/manage'
    },
    {
      title: 'العملاء',
      description: 'إدارة بيانات العملاء ومتابعة الحسابات',
      icon: <FaUsers />,
      gradient: 'from-blue-400 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      stats: {
        label: 'عدد العملاء',
        value: totalCustomers,
        subLabel: 'عميل نشط'
      },
      tasks: [
        'إضافة عملاء جدد',
        'تعديل بيانات العملاء',
        'عرض أرصدة العملاء',
        'سجل المعاملات'
      ],
      path: '/customers/manage'
    },
    {
      title: 'الموردين',
      description: 'إدارة بيانات الموردين والمشتريات',
      icon: <FaTruck />,
      gradient: 'from-purple-400 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      stats: {
        label: 'عدد الموردين',
        value: totalSuppliers,
        subLabel: 'مورد نشط'
      },
      tasks: [
        'إضافة موردين جدد',
        'تعديل بيانات الموردين',
        'عرض أرصدة الموردين',
        'متابعة الطلبات'
      ],
      path: '/suppliers/manage'
    },
    {
      title: 'فواتير المبيعات',
      description: 'إنشاء وإدارة فواتير المبيعات والمرتجعات',
      icon: <FaFileInvoice />,
      gradient: 'from-green-400 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      stats: {
        label: 'إجمالي الفواتير',
        value: totalSales,
        subLabel: 'فاتورة مبيعات'
      },
      tasks: [
        'إنشاء فاتورة مبيعات',
        'إدارة الفواتير',
        'مرتجعات المبيعات',
        'التقارير المالية'
      ],
      path: '/sales/invoices'
    },
    {
      title: 'فواتير المشتريات',
      description: 'إنشاء وإدارة فواتير المشتريات والمرتجعات',
      icon: <FaShoppingCart />,
      gradient: 'from-indigo-400 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100',
      stats: {
        label: 'إجمالي الفواتير',
        value: totalPurchases,
        subLabel: 'فاتورة مشتريات'
      },
      tasks: [
        'إنشاء فاتورة مشتريات',
        'إدارة الفواتير',
        'مرتجعات المشتريات',
        'التقارير المالية'
      ],
      path: '/purchases/invoices'
    },
    {
      title: 'المرتجعات',
      description: 'إدارة مرتجعات المبيعات والمشتريات',
      icon: <FaUndo />,
      gradient: 'from-red-400 to-red-600',
      bgGradient: 'from-red-50 to-red-100',
      stats: {
        label: 'المرتجعات',
        value: '0',
        subLabel: 'مرتجع'
      },
      tasks: [
        'مرتجعات المبيعات',
        'مرتجعات المشتريات',
        'إدارة المرتجعات',
        'تقارير المرتجعات'
      ],
      path: '/sales/returns'
    },
    {
      title: 'الخزينة',
      description: 'إدارة الحركات المالية والأرصدة',
      icon: <FaWallet />,
      gradient: 'from-yellow-400 to-yellow-600',
      bgGradient: 'from-yellow-50 to-yellow-100',
      stats: {
        label: 'معلومات محمية',
        value: '••••••',
        subLabel: 'معلومات سرية'
      },
      tasks: [
        'إذن استلام نقدي',
        'إذن صرف نقدية',
        'حركة الخزينة',
        'أرصدة العملاء والموردين'
      ],
      path: '/treasury/movement'
    },
    {
      title: 'التقارير',
      description: 'تقارير شاملة عن جميع عمليات النظام',
      icon: <FaClipboardList />,
      gradient: 'from-teal-400 to-teal-600',
      bgGradient: 'from-teal-50 to-teal-100',
      stats: {
        label: 'التقارير المتاحة',
        value: '11',
        subLabel: 'تقرير'
      },
      tasks: [
        'تقارير المبيعات والمشتريات',
        'تقارير المخزون والحركة',
        'التقارير المالية والخزينة',
        'تقارير العملاء والموردين'
      ],
      path: '/reports/inventory'
    },
  ];

  return (
    <div>
      {/* عنوان الصفحة */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
            نظام Bero لإدارة المخازن
          </h1>
          <p className="text-gray-600 mt-3 text-xl">نظام متكامل لإدارة جميع عمليات المخازن والمبيعات والمشتريات</p>
        </div>

        {/* تنبيهات النظام المحسّنة */}
        
        {/* تنبيه الكميات السالبة */}
        {negativeProducts > 0 && (
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl p-5 mb-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <FaExclamationTriangle className="text-3xl" />
              </div>
              <div>
                <p className="font-bold text-lg">🚨 خطأ حرج: كميـات سالبة</p>
                <p className="text-sm opacity-90">يوجد {negativeProducts} منتج بكميات سالبة - يتطلب إصلاح فوري</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/tools/fix-negative-quantities')}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-all flex items-center gap-2"
              >
                <FaTools />
                <span>أداة الإصلاح</span>
                <FaArrowLeft />
              </button>
            </div>
          </div>
        )}
        
        {/* تنبيه المخزون المنخفض */}
        {lowStockProducts > 0 && (
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl p-5 mb-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <FaBox className="text-3xl" />
              </div>
              <div>
                <p className="font-bold text-lg">⚠️ تنبيه: مخزون منخفض</p>
                <p className="text-sm opacity-90">يوجد {lowStockProducts} منتج يحتاج إعادة توفير</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/reports/low-stock')}
              className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <span>عرض التقرير</span>
              <FaArrowLeft />
            </button>
          </div>
        )}
        
        {/* تنبيه نفاد المخزون */}
        {outOfStockProducts > 0 && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-5 mb-6 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <FaExclamationTriangle className="text-3xl" />
              </div>
              <div>
                <p className="font-bold text-lg">⚡ تنبيه: نفاد مخزون</p>
                <p className="text-sm opacity-90">يوجد {outOfStockProducts} منتج نفد من المخزون</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/warehouses/inventory')}
              className="bg-white text-red-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <span>مراجعة المخزون</span>
              <FaArrowLeft />
            </button>
          </div>
        )}
      </div>

      {/* بطاقات أقسام النظام */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemModules.map((module, index) => (
          <div
            key={index}
            onClick={() => navigate(module.path)}
            className="group cursor-pointer"
          >
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-gray-200 h-full flex flex-col">
              {/* Header with Gradient */}
              <div className={`bg-gradient-to-r ${module.gradient} p-6 text-white relative overflow-hidden`}>
                <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mt-16"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mb-12"></div>
                
                <div className="relative flex items-center justify-between mb-4">
                  <div className="text-5xl opacity-90">
                    {module.icon}
                  </div>
                  <FaArrowLeft className="text-xl opacity-0 group-hover:opacity-100 group-hover:-translate-x-2 transition-all" />
                </div>
                
                <h3 className="text-2xl font-bold mb-2">{module.title}</h3>
                <p className="text-sm opacity-90">{module.description}</p>
              </div>

              {/* Stats Section */}
              <div className={`bg-gradient-to-br ${module.bgGradient} p-4 border-b-2 border-gray-100`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">{module.stats.label}</p>
                    <p className="text-3xl font-bold bg-gradient-to-r ${module.gradient} bg-clip-text text-transparent">
                      {module.stats.value}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">{module.stats.subLabel}</p>
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              <div className="p-5 flex-1 bg-gray-50">
                <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">المهام الرئيسية:</p>
                <ul className="space-y-2">
                  {module.tasks.map((task, taskIndex) => (
                    <li key={taskIndex} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className={`bg-gradient-to-br ${module.gradient} w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0`}></span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div className={`bg-gradient-to-r ${module.gradient} h-1.5`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
