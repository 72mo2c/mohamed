// ======================================
// الصفحة الرئيسية لنظام الإنتاج
// ======================================

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import ProductionOrderManagement from '../../components/Production/ProductionOrderManagement';
import ProductionPlanning from '../../components/Production/ProductionPlanning';
import MaterialTracking from '../../components/Production/MaterialTracking';
import QualityControl from '../../components/Production/QualityControl';
import ProductionDashboard from '../../components/Production/ProductionDashboard';
import Card from '../../components/Common/Card';

const ProductionMain = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // الحصول على بيانات الإنتاج من السياق
  const { getProductionDashboardData } = useData();

  // تبويبات نظام الإنتاج
  const tabs = [
    { 
      id: 'dashboard', 
      label: 'لوحة الإنتاجية', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      id: 'orders', 
      label: 'أوامر الإنتاج', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: 'planning', 
      label: 'تخطيط الإنتاج', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12a4 4 0 00-4 4v-1M4 12a8 8 0 0016 0M4 12v1" />
        </svg>
      )
    },
    { 
      id: 'materials', 
      label: 'تتبع المواد', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      id: 'quality', 
      label: 'مراقبة الجودة', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  // عرض محتوى التبويب النشط
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ProductionDashboard />;
      case 'orders':
        return <ProductionOrderManagement />;
      case 'planning':
        return <ProductionPlanning />;
      case 'materials':
        return <MaterialTracking />;
      case 'quality':
        return <QualityControl />;
      default:
        return <ProductionDashboard />;
    }
  };

  // إحصائيات سريعة للعرض في التنقل
  const getQuickStats = () => {
    try {
      const data = getProductionDashboardData();
      return data || { totalOrders: 0, completedOrders: 0, inProgressOrders: 0 };
    } catch (error) {
      return { totalOrders: 0, completedOrders: 0, inProgressOrders: 0 };
    }
  };

  const quickStats = getQuickStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* رأس الصفحة */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">نظام الإنتاج</h1>
                <p className="mt-1 text-gray-600">
                  إدارة شاملة لأوامر الإنتاج والتخطيط والجودة
                </p>
              </div>
              
              {/* إحصائيات سريعة */}
              <div className="hidden lg:flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{quickStats.totalOrders}</div>
                  <div className="text-sm text-gray-600">إجمالي الأوامر</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{quickStats.inProgressOrders}</div>
                  <div className="text-sm text-gray-600">قيد التشغيل</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{quickStats.completedOrders}</div>
                  <div className="text-sm text-gray-600">مكتملة</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* التنقل بين التبويبات */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className={`ml-2 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* محتوى التبويب النشط */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>

      {/* رسائل توجيهية */}
      {activeTab === 'dashboard' && (
        <div className="fixed bottom-4 right-4 max-w-sm">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  لوحة الإنتاجية
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    استخدم اللوحة لمراقبة أداء الإنتاج ومؤشرات الأداء الرئيسية.
                    انتقل إلى تبويبات أخرى لإدارة أوامر الإنتاج وتتبع المواد والجودة.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="fixed bottom-4 right-4 max-w-sm">
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  إدارة أوامر الإنتاج
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    إنشاء أوامر إنتاج جديدة، تحديث حالتها، وتتبع تقدمها. 
                    يمكنك أيضاً حساب متطلبات المواد تلقائياً باستخدام BOM.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'planning' && (
        <div className="fixed bottom-4 right-4 max-w-sm">
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  تخطيط الإنتاج
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    احسب متطلبات المواد باستخدام MRP، وخطط جدولة الإنتاج 
                    على مراكز العمل المختلفة.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProductionMain;
