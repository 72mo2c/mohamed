// ======================================
// إنشاء المستخدمين الافتراضيين
// ======================================

import { hashPassword } from './security';

export const createDefaultUsers = () => {
  console.log('🚀 إنشاء المستخدمين الافتراضيين...');
  
  // التحقق من وجود مستخدمين مسبقا
  const existingUsers = localStorage.getItem('bero_system_users');
  if (existingUsers) {
    console.log('✅ المستخدمون موجودون مسبقاً');
    return JSON.parse(existingUsers);
  }

  // إنشاء المستخدمين الافتراضيين
  const defaultUsers = [
    {
      id: 1,
      username: 'admin',
      password: hashPassword('admin123'),
      name: 'المدير العام - النسخة العادية',
      email: 'admin@berosystem.com',
      phone: '+20 XXX XXX XXXX',
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
      phone: '+20 XXX XXX XXXX',
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
      phone: '+20 XXX XXX XXXX',
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
      phone: '+20 XXX XXX XXXX',
      role: 'admin',
      status: 'active',
      company: 'gamma',
      createdAt: new Date().toISOString()
    }
  ];

  // حفظ المستخدمين في localStorage
  localStorage.setItem('bero_system_users', JSON.stringify(defaultUsers));
  
  console.log('✅ تم إنشاء المستخدمين الافتراضيين:');
  defaultUsers.forEach(user => {
    console.log(`   ${user.username} / admin123`);
  });
  
  return defaultUsers;
};

// إنشاء دالة سريعة للاختبار
export const setupTestUsers = () => {
  // إنشاء المستخدمين
  const users = createDefaultUsers();
  
  // إظهار رسالة ترحيبية
  console.log(`
🎯 النظام جاهز للاختبار!

💡 بيانات الدخول:
• شركة ألفا: alpha_admin / admin123
• شركة بيتا: beta_admin / admin123  
• شركة جاما: gamma_admin / admin123
• النظام العادي: admin / admin123

🧪 لبدء الاختبار:
1. افتح /saas-login في المتصفح
2. أدخل معرف الشركة: alpha (أو beta أو gamma)
3. انتظر التحميل
4. أدخل كلمة المرور: admin123
5. انتقل للنظام الرئيسي!

🚀 للاختبار السريع: saasTest.autoLogin('alpha')
`);
  
  return users;
};