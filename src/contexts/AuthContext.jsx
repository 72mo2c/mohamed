// ======================================
// AuthContext - نظام المصادقة متعدد الشركات
// ======================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useCompany } from './CompanyContext';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// مستخدم تجريبي للاختبار
const SAMPLE_USERS = [
  {
    id: 'user-1',
    username: 'admin',
    password: '123456',
    role: 'admin',
    fullName: 'المدير العام',
    companyId: 'alfalah',
    permissions: ['all']
  },
  {
    id: 'user-2',
    username: 'manager',
    password: '123456',
    role: 'manager',
    fullName: 'مدير المخازن',
    companyId: 'alfalah',
    permissions: ['warehouses', 'purchases', 'sales']
  },
  {
    id: 'user-3',
    username: 'accountant',
    password: '123456',
    role: 'accountant',
    fullName: 'محاسب',
    companyId: 'alfalah',
    permissions: ['purchases', 'sales', 'treasury']
  },
  {
    id: 'user-4',
    username: 'viewer',
    password: '123456',
    role: 'viewer',
    fullName: 'مراقب',
    companyId: 'alfalah',
    permissions: ['reports', 'inventory']
  }
];

export const AuthProvider = ({ children }) => {
  const { currentCompany, selectCompany } = useCompany();
  
  // حالة المصادقة
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // إعدادات المصادقة
  const [authSettings, setAuthSettings] = useState({
    sessionTimeout: 30 * 60 * 1000, // 30 دقيقة
    maxAttempts: 5,
    lockoutDuration: 5 * 60 * 1000, // 5 دقائق
    passwordExpiry: 90 * 24 * 60 * 60 * 1000 // 90 يوم
  });

  // تخزين محاولات الدخول الخاطئة
  const [failedAttempts, setFailedAttempts] = useState({});
  const [lockedAccounts, setLockedAccounts] = useState({});

  // تحميل البيانات من localStorage عند بدء التشغيل
  useEffect(() => {
    loadAuthData();
  }, []);

  // تحديث حالة المصادقة عند تغيير الشركة
  useEffect(() => {
    if (currentCompany) {
      loadCompanyAuthData(currentCompany.id);
    }
  }, [currentCompany]);

  // تحميل بيانات المصادقة من localStorage
  const loadAuthData = useCallback(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      const savedAuth = localStorage.getItem('authData');
      const savedFailedAttempts = localStorage.getItem('failedAttempts');
      const savedLockedAccounts = localStorage.getItem('lockedAccounts');

      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }

      if (savedFailedAttempts) {
        setFailedAttempts(JSON.parse(savedFailedAttempts));
      }

      if (savedLockedAccounts) {
        setLockedAccounts(JSON.parse(savedLockedAccounts));
      }

    } catch (error) {
      console.error('Error loading auth data:', error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // تحميل بيانات مصادقة شركة محددة
  const loadCompanyAuthData = useCallback((companyId) => {
    try {
      const savedCompanyUser = localStorage.getItem(`user_${companyId}`);
      const lastLogin = localStorage.getItem(`lastLogin_${companyId}`);
      const failedAttemptsCompany = localStorage.getItem(`failedAttempts_${companyId}`);
      const lockedAccountsCompany = localStorage.getItem(`lockedAccounts_${companyId}`);

      if (savedCompanyUser) {
        const userData = JSON.parse(savedCompanyUser);
        if (isSessionValid(lastLogin)) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // انتهت صلاحية الجلسة
          localStorage.removeItem(`user_${companyId}`);
          localStorage.removeItem(`lastLogin_${companyId}`);
        }
      }

      if (failedAttemptsCompany) {
        const attempts = JSON.parse(failedAttemptsCompany);
        setFailedAttempts(prev => ({ ...prev, ...attempts }));
      }

      if (lockedAccountsCompany) {
        const locked = JSON.parse(lockedAccountsCompany);
        setLockedAccounts(prev => ({ ...prev, ...locked }));
      }

    } catch (error) {
      console.error('Error loading company auth data:', error);
    }
  }, []);

  // التحقق من صحة الجلسة
  const isSessionValid = (lastLogin) => {
    if (!lastLogin) return false;
    const sessionDuration = Date.now() - parseInt(lastLogin);
    return sessionDuration < authSettings.sessionTimeout;
  };

  // تسجيل الدخول
  const login = useCallback(async (username, password) => {
    if (!currentCompany) {
      throw new Error('يجب اختيار الشركة أولاً');
    }

    setError(null);
    setIsLoading(true);

    try {
      // التحقق من قفل الحساب
      const accountKey = `${username}_${currentCompany.id}`;
      const lockInfo = lockedAccounts[accountKey];
      
      if (lockInfo && Date.now() < lockInfo.lockUntil) {
        throw new Error(`الحساب مقفل لمدة ${Math.ceil((lockInfo.lockUntil - Date.now()) / 60000)} دقيقة`);
      }

      // البحث عن المستخدم
      const userData = SAMPLE_USERS.find(
        u => u.username === username && u.password === password && u.companyId === currentCompany.id
      );

      if (!userData) {
        await handleFailedLogin(accountKey, username);
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }

      // التحقق من حالة المستخدم
      if (!currentCompany.isActive) {
        throw new Error('الشركة غير نشطة');
      }

      // تسجيل دخول ناجح
      await handleSuccessfulLogin(userData);

    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, failedAttempts, lockedAccounts, authSettings]);

  // التعامل مع محاولة فاشلة
  const handleFailedLogin = async (accountKey, username) => {
    const attempts = failedAttempts[accountKey] || { count: 0, lastAttempt: null };
    
    const newAttempts = {
      ...attempts,
      count: attempts.count + 1,
      lastAttempt: Date.now()
    };

    const updatedFailedAttempts = { ...failedAttempts, [accountKey]: newAttempts };
    setFailedAttempts(updatedFailedAttempts);
    localStorage.setItem('failedAttempts', JSON.stringify(updatedFailedAttempts));
    localStorage.setItem(`failedAttempts_${currentCompany.id}`, JSON.stringify({ [accountKey]: newAttempts }));

    // قفل الحساب عند تجاوز الحد الأقصى
    if (newAttempts.count >= authSettings.maxAttempts) {
      const lockInfo = {
        lockUntil: Date.now() + authSettings.lockoutDuration,
        reason: 'محاولات فاشلة متكررة'
      };

      const updatedLockedAccounts = { ...lockedAccounts, [accountKey]: lockInfo };
      setLockedAccounts(updatedLockedAccounts);
      localStorage.setItem('lockedAccounts', JSON.stringify(updatedLockedAccounts));
      localStorage.setItem(`lockedAccounts_${currentCompany.id}`, JSON.stringify({ [accountKey]: lockInfo }));
    }
  };

  // التعامل مع تسجيل دخول ناجح
  const handleSuccessfulLogin = async (userData) => {
    // إزالة سجل المحاولات الفاشلة
    const accountKey = `${userData.username}_${currentCompany.id}`;
    const updatedFailedAttempts = { ...failedAttempts };
    delete updatedFailedAttempts[accountKey];
    setFailedAttempts(updatedFailedAttempts);
    localStorage.setItem('failedAttempts', JSON.stringify(updatedFailedAttempts));
    localStorage.removeItem(`failedAttempts_${currentCompany.id}`);

    // إزالة قفل الحساب
    const updatedLockedAccounts = { ...lockedAccounts };
    delete updatedLockedAccounts[accountKey];
    setLockedAccounts(updatedLockedAccounts);
    localStorage.setItem('lockedAccounts', JSON.stringify(updatedLockedAccounts));
    localStorage.removeItem(`lockedAccounts_${currentCompany.id}`);

    // حفظ بيانات المستخدم
    const authUserData = {
      ...userData,
      loginTime: Date.now(),
      lastActivity: Date.now(),
      sessionId: generateSessionId()
    };

    setUser(authUserData);
    setIsAuthenticated(true);

    // حفظ في localStorage
    localStorage.setItem('currentUser', JSON.stringify(authUserData));
    localStorage.setItem(`user_${currentCompany.id}`, JSON.stringify(authUserData));
    localStorage.setItem(`lastLogin_${currentCompany.id}`, Date.now().toString());

    // تحديث نشاط المستخدم
    updateLastActivity();
  };

  // تسجيل الخروج
  const logout = useCallback(() => {
    // حفظ سجل الخروج
    if (user) {
      const logoutData = {
        userId: user.id,
        companyId: currentCompany?.id,
        logoutTime: Date.now(),
        sessionDuration: Date.now() - (user.loginTime || Date.now())
      };
      
      const logoutHistory = JSON.parse(localStorage.getItem('logoutHistory') || '[]');
      logoutHistory.push(logoutData);
      
      // الاحتفاظ بآخر 100 سجل فقط
      if (logoutHistory.length > 100) {
        logoutHistory.splice(0, logoutHistory.length - 100);
      }
      
      localStorage.setItem('logoutHistory', JSON.stringify(logoutHistory));
    }

    // مسح البيانات
    clearAuthData();

    // إعادة توجيه إلى صفحة اختيار الشركة
    window.location.href = '/company-selection';
  }, [user, currentCompany]);

  // مسح بيانات المصادقة
  const clearAuthData = () => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);

    // مسح localStorage
    localStorage.removeItem('currentUser');
    if (currentCompany?.id) {
      localStorage.removeItem(`user_${currentCompany.id}`);
      localStorage.removeItem(`lastLogin_${currentCompany.id}`);
    }
  };

  // تحديث آخر نشاط للمستخدم
  const updateLastActivity = useCallback(() => {
    if (user) {
      const updatedUser = { ...user, lastActivity: Date.now() };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      if (currentCompany?.id) {
        localStorage.setItem(`user_${currentCompany.id}`, JSON.stringify(updatedUser));
      }
    }
  }, [user, currentCompany]);

  // التحقق من الصلاحيات
  const hasPermission = useCallback((permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes('all') || user.permissions.includes(permission);
  }, [user]);

  // التحقق من الدور
  const hasRole = useCallback((role) => {
    if (!user) return false;
    return user.role === role || user.role === 'admin';
  }, [user]);

  // إنشاء معرف جلسة
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // التحقق من انتهاء الجلسة
  const checkSessionExpiry = useCallback(() => {
    if (user && user.lastActivity) {
      const timeSinceActivity = Date.now() - user.lastActivity;
      if (timeSinceActivity > authSettings.sessionTimeout) {
        logout();
        return true;
      }
    }
    return false;
  }, [user, authSettings, logout]);

  // تتبع النشاط
  useEffect(() => {
    const updateActivity = () => {
      if (isAuthenticated) {
        updateLastActivity();
      }
    };

    // تحديث عند التفاعل مع الصفحة
    document.addEventListener('click', updateActivity);
    document.addEventListener('keypress', updateActivity);
    document.addEventListener('scroll', updateActivity);
    document.addEventListener('mousemove', updateActivity);

    // فحص دوري لانتهاء الجلسة
    const sessionCheckInterval = setInterval(checkSessionExpiry, 60000); // كل دقيقة

    return () => {
      document.removeEventListener('click', updateActivity);
      document.removeEventListener('keypress', updateActivity);
      document.removeEventListener('scroll', updateActivity);
      document.removeEventListener('mousemove', updateActivity);
      clearInterval(sessionCheckInterval);
    };
  }, [isAuthenticated, updateLastActivity, checkSessionExpiry]);

  // تسجيل مستخدم جديد (للإدارة)
  const registerUser = useCallback(async (userData) => {
    try {
      const newUser = {
        id: `user-${Date.now()}`,
        ...userData,
        companyId: currentCompany?.id,
        createdAt: new Date().toISOString()
      };

      // إضافة إلى قائمة المستخدمين (في التطبيق الحقيقي سيكون API call)
      const users = JSON.parse(localStorage.getItem(`users_${currentCompany?.id}`) || '[]');
      users.push(newUser);
      localStorage.setItem(`users_${currentCompany?.id}`, JSON.stringify(users));

      return newUser;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }, [currentCompany]);

  // تحديث بيانات المستخدم
  const updateUser = useCallback(async (userId, updates) => {
    try {
      const users = JSON.parse(localStorage.getItem(`users_${currentCompany?.id}`) || '[]');
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates, updatedAt: new Date().toISOString() };
        localStorage.setItem(`users_${currentCompany?.id}`, JSON.stringify(users));
        
        // تحديث المستخدم الحالي إذا كان نفس المستخدم
        if (user?.id === userId) {
          const updatedUser = { ...user, ...updates };
          setUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          localStorage.setItem(`user_${currentCompany?.id}`, JSON.stringify(updatedUser));
        }
        
        return users[userIndex];
      }
      
      throw new Error('المستخدم غير موجود');
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }, [user, currentCompany]);

  // حذف مستخدم
  const deleteUser = useCallback(async (userId) => {
    try {
      const users = JSON.parse(localStorage.getItem(`users_${currentCompany?.id}`) || '[]');
      const filteredUsers = users.filter(u => u.id !== userId);
      localStorage.setItem(`users_${currentCompany?.id}`, JSON.stringify(filteredUsers));
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }, [currentCompany]);

  // الحصول على جميع المستخدمين للشركة
  const getAllUsers = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(`users_${currentCompany?.id}`) || '[]');
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }, [currentCompany]);

  const value = {
    // حالة المصادقة
    user,
    isAuthenticated,
    isLoading,
    error,
    authSettings,

    // وظائف المصادقة
    login,
    logout,
    updateLastActivity,

    // التحقق من الصلاحيات
    hasPermission,
    hasRole,

    // إدارة المستخدمين
    registerUser,
    updateUser,
    deleteUser,
    getAllUsers,

    // أدوات مساعدة
    checkSessionExpiry,
    clearAuthData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;