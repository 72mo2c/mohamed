// ======================================
// صفحة تتبع المواد
// ======================================

import React from 'react';
import MaterialTracking from '../../components/Production/MaterialTracking';
import PageHeader from '../../components/Common/PageHeader';

const MaterialTrackingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="تتبع المواد الخام والإنتاج"
        subtitle="تتبع استهلاك المواد والهدر في الإنتاج"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MaterialTracking />
      </div>
    </div>
  );
};

export default MaterialTrackingPage;
