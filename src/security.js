// ======================================
// Security Utilities - أدوات الأمان (نسخة مبسطة للبناء)
// ======================================

/**
 * تشفير كلمة المرور باستخدام خوارزمية بسيطة
 * في بيئة إنتاجية، استخدم bcrypt أو argon2
 */
export const hashPassword = (password) => {
  // Simple hash for demo - في الإنتاج استخدم bcrypt
  let hash = 0;
  const str = password + 'BERO_SALT_KEY_2025';
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
};

/**
 * التحقق من كلمة المرور
 */
export const verifyPassword = (password, hashedPassword) => {
  return hashPassword(password) === hashedPassword;
};

/**
 * توليد معرف فريد
 */
export const generateId = () => {
  return Date.now() + Math.random().toString(36).substr(2, 9);
};