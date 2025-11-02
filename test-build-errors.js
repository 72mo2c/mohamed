// ======================================
// Build Test - اختبار بناء المشروع
// ======================================

// اختبار استيراد الملفات
try {
  console.log('🧪 بدء اختبار الأخطاء...');
  
  // اختبار 1: استيراد SaaS Context
  console.log('🔍 اختبار SaaSContext...');
  const SaaSContext = require('./src/context/SaaSContext.jsx');
  console.log('✅ SaaSContext: نجح الاستيراد');
  
  // اختبار 2: استيراد TenantManager
  console.log('🔍 اختبار TenantManager...');
  const TenantManager = require('./src/saas/TenantManager.js');
  console.log('✅ TenantManager: نجح الاستيراد');
  
  // اختبار 3: استيراد SaaSAPIService
  console.log('🔍 اختبار SaaSAPIService...');
  const SaaSAPIService = require('./src/saas/SaaSAPIService.js');
  console.log('✅ SaaSAPIService: نجح الاستيراد');
  
  // اختبار 4: استيراد App.jsx
  console.log('🔍 اختبار App.jsx...');
  const App = require('./src/App.jsx');
  console.log('✅ App.jsx: نجح الاستيراد');
  
  console.log('🎉 جميع الاختبارات نجحت!');
  
} catch (error) {
  console.error('❌ خطأ في الاستيراد:', error.message);
  console.error('تفاصيل الخطأ:', error);
}