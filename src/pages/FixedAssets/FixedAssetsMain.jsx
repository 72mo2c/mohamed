// ======================================
// الصفحة الرئيسية للأصول الثابتة
// ======================================

import React from 'react';
import { useTab } from '../../contexts/TabContext';

const FixedAssetsMain = () => {
  const { openTab } = useTab();

  const menuItems = [
    {
      id: 'fixed-assets-dashboard',
      title: 'لوحة التحكم',
      description: 'عرض شامل لحالة الأصول الثابتة والإحصائيات',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      path: '/fixed-assets/dashboard'
    },
    {
      id: 'asset-management',
      title: 'إدارة الأصول',
      description: 'إضافة وتعديل وحذف الأصول الثابتة',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      path: '/fixed-assets/management'
    },
    {
      id: 'depreciation-management',
      title: 'إدارة الإهلاك',
      description: 'حساب وإدارة إهلاك الأصول بطرق مختلفة',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      path: '/fixed-assets/depreciation'
    },
    {
      id: 'maintenance-scheduling',
      title: 'جدولة الصيانة',
      description: 'جدولة وتتبع صيانة الأصول الثابتة',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      path: '/fixed-assets/maintenance'
    },
    {
      id: 'asset-inventory',
      title: 'جرد وتقييم',
      description: 'جرد دوري وتقييم حالة الأصول الثابتة',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      path: '/fixed-assets/inventory'
    },
    {
      id: 'asset-disposal',
      title: 'التصرف في الأصول',
      description: 'بيع أو نقل أو شطب الأصول الثابتة',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      path: '/fixed-assets/disposal'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* رأس الصفحة */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">الأصول الثابتة</h1>
                <p className="mt-1 text-sm text-gray-500">
                  نظام شامل لإدارة جميع الأصول الثابتة في المؤسسة
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* قائمة الوظائف */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => openTab(item.title, item.path)}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-200 transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="mr-3 text-lg font-medium text-gray-900">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                  <span>بدء الاستخدام</span>
                  <svg className="w-4 h-4 mr-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* معلومات إضافية */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <div className="flex items-start">
            <div className="p-2 bg-blue-200 rounded-lg mr-4">
              <svg className="w-6 h-6 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                نظام إدارة الأصول الثابتة
              </h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  يوفر نظام الأصول الثابتة إدارة شاملة لجميع أصول الشركة، بما في ذلك:
                </p>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>تسجيل وتتبع جميع الأصول الثابتة</li>
                  <li>حساب الإهلاك بطرق مختلفة (القسط الثابت، الرصيد المتناقص، وحدات الإنتاج)</li>
                  <li>جدولة وإدارة الصيانة الدورية والطارئة</li>
                  <li>إجراء الجرد الدوري وتقييم الحالة الفعلية للأصول</li>
                  <li>إدارة عملية التصرف في الأصول (بيع، تبرع، نقل، شطب)</li>
                  <li>تقارير شاملة عن حالة وقيمة الأصول</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixedAssetsMain;