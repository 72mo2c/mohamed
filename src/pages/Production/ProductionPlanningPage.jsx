// ======================================
// صفحة تخطيط الإنتاج
// ======================================

import React from 'react';
import ProductionPlanning from '../../components/Production/ProductionPlanning';
import PageHeader from '../../components/Common/PageHeader';

const ProductionPlanningPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="تخطيط الإنتاج"
        subtitle="تخطيط متطلبات المواد والجدولة الإنتاجية"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductionPlanning />
      </div>
    </div>
  );
};

export default ProductionPlanningPage;
