// ======================================
// صفحة مراقبة الجودة
// ======================================

import React from 'react';
import QualityControl from '../../components/Production/QualityControl';
import PageHeader from '../../components/Common/PageHeader';

const QualityControlPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="مراقبة الجودة"
        subtitle="إدارة فحوصات الجودة وعمليات عدم المطابقة"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QualityControl />
      </div>
    </div>
  );
};

export default QualityControlPage;
