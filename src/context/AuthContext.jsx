// ======================================
// Auth Context - إدارة حالة المصادقة
// ======================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { verifyPassword } from '../utils/security';

const AuthContext = createContext();

// Hook لاستخدام Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // تحميل بيانات المستخدم من LocalStorage عند بدء التطبيق
  useEffect(() => {
    const storedUser = localStorage.getItem('bero_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('خطأ في قراءة بيانات المستخدم:', error);
        localStorage.removeItem('bero_user');
      }
    }
    setLoading(false);
  }, []);

  // تسجيل الدخول
  const login = async (username, password) => {
    try {
      // التحقق من المدخلات
      if (!username || !password) {
        return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
      }

      // تحميل المستخدمين من localStorage
      const usersData = localStorage.getItem('bero_system_users');
      let users = [];
      
      if (usersData) {
        try {
          users = JSON.parse(usersData);
        } catch (error) {
          console.error('خطأ في قراءة بيانات المستخدمين:', error);
          users = [];
        }
      }
      
      // إنشاء مستخدمين افتراضيين إذا لم يكن هناك مستخدمون
      if (users.length === 0) {
        const { hashPassword } = require('../utils/security');
        
        // إنشاء مستخدمين للمؤسسات المختلفة
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
        
        users = defaultUsers;
        localStorage.setItem('bero_system_users', JSON.stringify(users));
        
        console.log('👥 تم إنشاء المستخدمين الافتراضيين للمؤسسات المختلفة');
      }

      // البحث عن المستخدم
      const user = users.find(u => u.username === username);
      
      if (!user) {
        return { success: false, message: 'اسم المستخدم غير موجود' };
      }

      // التحقق من حالة المستخدم
      if (user.status === 'inactive') {
        return { success: false, message: 'هذا الحساب غير نشط. يرجى الاتصال بالمدير' };
      }

      // التحقق من كلمة المرور (يدعم كلمات المرور القديمة غير المشفرة)
      const { hashPassword } = require('../utils/security');
      let isPasswordValid = false;
      
      // محاولة 1: التحقق من كلمة مرور مشفرة
      isPasswordValid = verifyPassword(password, user.password);
      
      // محاولة 2: إذا فشل، تحقق من كلمة مرور مباشرة (للمستخدمين القدامى)
      if (!isPasswordValid && password === user.password) {
        isPasswordValid = true;
        // تحديث كلمة المرور للتشفير
        user.password = hashPassword(password);
        const updatedUsers = users.map(u => u.id === user.id ? user : u);
        localStorage.setItem('bero_system_users', JSON.stringify(updatedUsers));
        console.log('تم تحديث تشفير كلمة المرور');
      }
      
      if (!isPasswordValid) {
        return { success: false, message: 'كلمة المرور غير صحيحة' };
      }

      // إنشاء بيانات المستخدم للجلسة (بدون كلمة المرور)
      const userData = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        loginAt: new Date().toISOString()
      };

      // حفظ بيانات المستخدم
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('bero_user', JSON.stringify(userData));
      
      // تحديث آخر تسجيل دخول
      const updatedUsers = users.map(u => 
        u.id === user.id 
          ? { ...u, lastLogin: new Date().toISOString() }
          : u
      );
      localStorage.setItem('bero_system_users', JSON.stringify(updatedUsers));
      
      return { success: true, message: `مرحباً ${user.name}` };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' };
    }
  };

  // تسجيل الخروج
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('bero_user');
  };

  // تحديث بيانات المستخدم
  const updateUser = (updatedData) => {
    const newUserData = { ...user, ...updatedData };
    setUser(newUserData);
    localStorage.setItem('bero_user', JSON.stringify(newUserData));
  };

  // ==================== دوال إدارة الصلاحيات ====================
  
  // الحصول على الصلاحيات من إعدادات النظام
  const getPermissionsMatrix = useCallback(() => {
    try {
      const settings = localStorage.getItem('bero_system_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.permissions?.matrix || getDefaultPermissionsMatrix();
      }
    } catch (error) {
      console.error('خطأ في تحميل مصفوفة الصلاحيات:', error);
    }
    return getDefaultPermissionsMatrix();
  }, []);

  // التحقق من صلاحية معينة
  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    
    // المدير له جميع الصلاحيات
    if (user.role === 'admin') return true;
    
    const permissionsMatrix = getPermissionsMatrix();
    const permissionConfig = permissionsMatrix[permission];
    
    if (!permissionConfig) return false;
    
    return permissionConfig.roles && permissionConfig.roles.includes(user.role);
  }, [user, getPermissionsMatrix]);

  // التحقق من الصلاحيات المتعددة
  const hasAnyPermission = useCallback((permissions) => {
    if (!user) return false;
    return permissions.some(permission => hasPermission(permission));
  }, [user, hasPermission]);

  const hasAllPermissions = useCallback((permissions) => {
    if (!user) return false;
    return permissions.every(permission => hasPermission(permission));
  }, [user, hasPermission]);

  // التحقق من صلاحية حسب القسم
  const hasSectionPermission = useCallback((section, action) => {
    if (!user) return false;
    const permission = `${section}.${action}`;
    return hasPermission(permission);
  }, [user, hasPermission]);

  // تحديد ما إذا كان المستخدم يمكنه التحديث
  const canEdit = useCallback(() => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'manager';
  }, [user]);

  // تحديد ما إذا كان المستخدم مدير
  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  // التحقق من صلاحية المدير فقط (للإعدادات الحساسة)
  const hasAdminPermission = useCallback((requiredPermission) => {
    if (!user) return false;
    
    // المدير فقط يمكنه الوصول للإعدادات
    const settingsPermissions = [
      'manage_settings',
      'system_settings',
      'manage_users',
      'edit_user',
      'delete_user',
      'add_user',
      'user_permissions',
      'system_backup',
      'system_integrations'
    ];
    
    if (settingsPermissions.includes(requiredPermission)) {
      return user.role === 'admin';
    }
    
    // باقي الصلاحيات تتبع النظام العادي
    return hasPermission(requiredPermission);
  }, [user, hasPermission]);

  // تحديد ما إذا كان المستخدم مدير
  const isManager = useCallback(() => {
    return user?.role === 'manager';
  }, [user]);

  // الحصول على اسم الدور بالعربية
  const getRoleDisplayName = useCallback((role) => {
    const roleNames = {
      'admin': 'مدير عام',
      'manager': 'مدير',
      'user': 'مستخدم',
      'viewer': 'مراقب'
    };
    return roleNames[role] || role;
  }, []);

  // مصفوفة الصلاحيات الافتراضية
  const getDefaultPermissionsMatrix = useCallback(() => ({
    // إدارة المخزون
    'inventory.view': { 
      roles: ['admin', 'manager', 'user'], 
      description: 'عرض المخزون' 
    },
    'inventory.add': { 
      roles: ['admin', 'manager'], 
      description: 'إضافة منتجات' 
    },
    'inventory.edit': { 
      roles: ['admin', 'manager'], 
      description: 'تعديل المنتجات' 
    },
    'inventory.delete': { 
      roles: ['admin'], 
      description: 'حذف المنتجات' 
    },
    
    // إدارة المعاملات
    'transactions.view': { 
      roles: ['admin', 'manager', 'user'], 
      description: 'عرض المعاملات' 
    },
    'transactions.add': { 
      roles: ['admin', 'manager', 'user'], 
      description: 'إضافة معاملات' 
    },
    'transactions.edit': { 
      roles: ['admin', 'manager'], 
      description: 'تعديل المعاملات' 
    },
    'transactions.delete': { 
      roles: ['admin'], 
      description: 'حذف المعاملات' 
    },
    
    // إدارة جهات الاتصال
    'contacts.view': { 
      roles: ['admin', 'manager', 'user'], 
      description: 'جهات الاتصال' 
    },
    'contacts.add': { 
      roles: ['admin', 'manager'], 
      description: 'إضافة جهات اتصال' 
    },
    'contacts.edit': { 
      roles: ['admin', 'manager'], 
      description: 'تعديل جهات اتصال' 
    },
    'contacts.delete': { 
      roles: ['admin'], 
      description: 'حذف جهات اتصال' 
    },
    
    // التقارير المالية
    'finance.view': { 
      roles: ['admin', 'manager'], 
      description: 'التقارير المالية' 
    },
    'finance.edit': { 
      roles: ['admin'], 
      description: 'تعديل البيانات المالية' 
    },
    
    // التقارير والإحصائيات
    'reports.view': { 
      roles: ['admin', 'manager', 'user', 'viewer'], 
      description: 'عرض التقارير' 
    },
    'reports.export': { 
      roles: ['admin', 'manager'], 
      description: 'تصدير التقارير' 
    },
    
    // إدارة النظام
    'system.settings': { 
      roles: ['admin'], 
      description: 'إعدادات النظام' 
    },
    'system.users': { 
      roles: ['admin'], 
      description: 'إدارة المستخدمين' 
    },
    'system.permissions': { 
      roles: ['admin'], 
      description: 'إدارة الصلاحيات' 
    },
    'system.backup': { 
      roles: ['admin'], 
      description: 'النسخ الاحتياطي' 
    }
  }), []);

  const value = {
    // بيانات المصادقة
    user,
    isAuthenticated,
    loading,
    
    // وظائف المصادقة
    login,
    logout,
    updateUser,
    
    // وظائف الصلاحيات
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasSectionPermission,
    hasAdminPermission,
    canEdit,
    isAdmin,
    isManager,
    getRoleDisplayName,
    getPermissionsMatrix,
    
    // معلومات إضافية
    currentRole: user?.role || 'viewer',
    roleDisplayName: getRoleDisplayName(user?.role || 'viewer'),
    isAuthenticatedUser: Boolean(user),
    isActiveUser: user?.status !== 'inactive'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
