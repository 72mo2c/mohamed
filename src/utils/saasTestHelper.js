// ======================================
// SaaS Test Helper - مساعد اختبار النظام
// ======================================

// استيراد دالة إنشاء المستخدمين الافتراضيين
import { setupTestUsers } from './createDefaultUsers';

// دوال مساعدة لاختبار النظام في Console
window.saasTest = {
  
  // تهيئة النظام وإنشاء المستخدمين الافتراضيين
  init: () => {
    console.log('🔧 تهيئة نظام Bero SaaS...');
    setupTestUsers();
    window.saasTest.clearAuth();
    console.log('✅ النظام جاهز للاختبار!');
    return true;
  },
  
  // اختبار المؤسسات المتاحة
  testCompanies: () => {
    const companies = {
      'alpha': {
        name: 'شركة ألفا للتجارة',
        username: 'alpha_admin',
        password: 'admin123',
        color: '#3B82F6'
      },
      'beta': {
        name: 'شركة بيتا للصناعة', 
        username: 'beta_admin',
        password: 'admin123',
        color: '#10B981'
      },
      'gamma': {
        name: 'شركة جاما للخدمات',
        username: 'gamma_admin', 
        password: 'admin123',
        color: '#8B5CF6'
      }
    };
    
    console.log('🏢 المؤسسات المتاحة للاختبار:');
    Object.entries(companies).forEach(([id, info]) => {
      console.log(`${id}: ${info.name} (${info.username} / ${info.password})`);
    });
    
    return companies;
  },
  
  // مسح حالة المصادقة
  clearAuth: () => {
    localStorage.removeItem('saas_auth_state');
    localStorage.removeItem('bero_user');
    localStorage.removeItem('bero_system_users');
    localStorage.removeItem('current_company');
    console.log('🧹 تم مسح جميع بيانات المصادقة');
  },
  
  // إعادة تعيين المستخدمين
  resetUsers: () => {
    if (typeof window.resetSystemUsers === 'function') {
      window.resetSystemUsers();
      console.log('🔄 تم إعادة تعيين المستخدمين');
    } else {
      console.error('❌ دالة resetSystemUsers غير متاحة');
    }
  },
  
  // عرض حالة النظام
  showStatus: () => {
    const saasState = JSON.parse(localStorage.getItem('saas_auth_state') || '{}');
    const user = JSON.parse(localStorage.getItem('bero_user') || 'null');
    const company = JSON.parse(localStorage.getItem('current_company') || 'null');
    
    console.log('📊 حالة النظام:');
    console.log('SaaS State:', saasState);
    console.log('Current User:', user);
    console.log('Current Company:', company);
  },
  
  // اختبار تسجيل الدخول التلقائي
  autoLogin: (companyId = 'alpha') => {
    const result = window.saasTest.testCompanies();
    const company = result[companyId];
    
    if (!company) {
      console.error(`❌ الشركة ${companyId} غير موجودة`);
      return;
    }
    
    // إعادة تعيين الحالة
    window.saasTest.clearAuth();
    
    // الانتقال لصفحة تسجيل الدخول
    if (window.location.pathname !== '/saas-login') {
      window.location.href = '/saas-login';
      setTimeout(() => {
        window.saasTest.autoLogin(companyId);
      }, 1000);
      return;
    }
    
    console.log(`🔄 تسجيل دخول تلقائي للشركة: ${company.name}`);
    
    // استخدام React DevTools للتفاعل مع المكونات
    console.log('💡 استخدم React DevTools للتواصل مع المكونات');
  },
  
  // اختبار جميع المؤسسات
  testAllCompanies: () => {
    const companies = ['alpha', 'beta', 'gamma'];
    console.log('🧪 اختبار جميع المؤسسات...');
    
    companies.forEach((companyId, index) => {
      setTimeout(() => {
        console.log(`\n--- اختبار ${companyId.toUpperCase()} ---`);
        window.saasTest.autoLogin(companyId);
      }, index * 5000); // تأخير 5 ثواني بين كل اختبار
    });
  }
};

// إضافة رسالة ترحيبية مع التهيئة التلقائية
console.log(`
🚀 Bero System SaaS - مساعد الاختبار جاهز!

📋 الأوامر المتاحة:
• saasTest.init() - تهيئة النظام وإنشاء المستخدمين
• saasTest.testCompanies() - عرض المؤسسات المتاحة
• saasTest.clearAuth() - مسح بيانات المصادقة
• saasTest.autoLogin('alpha') - تسجيل دخول تلقائي
• saasTest.testAllCompanies() - اختبار جميع المؤسسات
• saasTest.showStatus() - عرض حالة النظام

🎯 للاختبار السريع:
1. افتح React DevTools
2. اكتب: saasTest.init()
3. اكتب: saasTest.autoLogin('alpha')
4. أدخل كلمة المرور: admin123
5. استكشف النظام!

💡 المؤسسات المتاحة: alpha, beta, gamma
كل اسم مستخدم: alpha_admin, beta_admin, gamma_admin
كل كلمة المرور: admin123

🔧 ملاحظة: احرص على تشغيل saasTest.init() أولاً!
`);

// تشغيل التهيئة التلقائية
setTimeout(() => {
  console.log('🔄 تشغيل التهيئة التلقائية...');
  window.saasTest.init();
}, 2000);

export default window.saasTest;