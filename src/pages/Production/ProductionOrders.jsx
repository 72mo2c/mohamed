// ======================================
// صفحة إدارة أوامر الإنتاج
// ======================================

import React from 'react';
import ProductionOrderManagement from '../../components/Production/ProductionOrderManagement';
import PageHeader from '../../components/Common/PageHeader';

const ProductionOrders = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="إدارة أوامر الإنتاج"
        subtitle="إنشاء وإدارة أوامر الإنتاج وتتبع حالتها"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductionOrderManagement />
      </div>
    </div>
  );
};

export default ProductionOrders;
