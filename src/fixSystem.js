// ======================================
// إصلاح النظام - تشغيل بمجرد واحد
// ======================================

console.log('🔧 بدء إصلاح نظام Bero SaaS...');

// 1. مسح جميع البيانات
localStorage.removeItem('saas_auth_state');
localStorage.removeItem('bero_user');
localStorage.removeItem('bero_system_users');
localStorage.removeItem('current_company');

console.log('🧹 تم مسح جميع البيانات السابقة');

// 2. إنشاء المستخدمين الافتراضيين
import { hashPassword } from './security';

const createDefaultUsers = () => {
  console.log('👥 إنشاء المستخدمين الافتراضيين...');
  
  const defaultUsers = [
    {
      id: 1,
      username: 'admin',
      password: hashPassword('admin123'),
      name: 'المدير العام - النسخة العادية',
      email: 'admin@berosystem.com',
      role: 'admin',
      status: 'active',
      company: 'system',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      username: 'alpha_admin',
      password: hashPassword('admin123'),
      name: 'مدير شركة ألفا',
      email: 'admin@alpha-co.com',
      role: 'admin',
      status: 'active',
      company: 'alpha',
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      username: 'beta_admin',
      password: hashPassword('admin123'),
      name: 'مدير شركة بيتا',
      email: 'admin@beta-industries.com',
      role: 'admin',
      status: 'active',
      company: 'beta',
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      username: 'gamma_admin',
      password: hashPassword('admin123'),
      name: 'مدير شركة جاما',
      email: 'admin@gamma-services.com',
      role: 'admin',
      status: 'active',
      company: 'gamma',
      createdAt: new Date().toISOString()
    }
  ];

  localStorage.setItem('bero_system_users', JSON.stringify(defaultUsers));
  
  console.log('✅ تم إنشاء المستخدمين الافتراضيين:');
  defaultUsers.forEach(user => {
    console.log(`   ${user.username} / admin123`);
  });
  
  return defaultUsers;
};

// 3. تشغيل الإصلاح
const fixSystem = () => {
  try {
    createDefaultUsers();
    
    console.log(`
🎉 تم إصلاح النظام بنجاح!

💡 بيانات الدخول:
• شركة ألفا: alpha_admin / admin123
• شركة بيتا: beta_admin / admin123  
• شركة جاما: gamma_admin / admin123
• النظام العادي: admin / admin123

🧪 للاختبار:
1. اذهب إلى: /saas-login
2. أدخل معرف الشركة: alpha
3. أدخل كلمة المرور: admin123
4. ادخل النظام!

🚀 أو استخدم الاختبار التلقائي:
   saasTest.autoLogin('alpha')
`);
    
    // إعادة توجيه للصفحة الصحيحة
    if (window.location.pathname !== '/saas-login') {
      console.log('📍 إعادة توجيه لصفحة تسجيل الدخول...');
      window.location.href = '/saas-login';
    }
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في الإصلاح:', error);
    return false;
  }
};

// تشغيل الإصلاح
fixSystem();

export default fixSystem;