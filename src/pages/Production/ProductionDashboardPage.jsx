// ======================================
// صفحة لوحة الإنتاجية
// ======================================

import React from 'react';
import ProductionDashboard from '../../components/Production/ProductionDashboard';
import PageHeader from '../../components/Common/PageHeader';

const ProductionDashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="لوحة الإنتاجية"
        subtitle="نظرة شاملة على أداء الإنتاج والمؤشرات الرئيسية"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductionDashboard />
      </div>
    </div>
  );
};

export default ProductionDashboardPage;
