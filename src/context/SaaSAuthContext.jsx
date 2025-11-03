// ======================================
// SaaS Auth Context - إدارة حالة المصادقة متعددة المؤسسات
// ======================================

import React, { createContext, useContext, useState, useEffect, createContext } from 'react';

const SaaSAuthContext = createContext();

// Hook لاستخدام SaaS Auth Context
export const useSaaSAuth = () => {
  const context = useContext(SaaSAuthContext);
  if (!context) {
    throw new Error('useSaaSAuth must be used within SaaSAuthProvider');
  }
  return context;
};

// بيانات المؤسسات المحاكاة
const MOCK_COMPANIES = {
  'alpha': {
    id: 1,
    identifier: 'alpha',
    name: 'شركة ألفا للتجارة',
    logo: '/imgs/companies/alpha-logo.png',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#DBEAFE',
    displayName: 'Alpha Co.',
    description: 'شركة رائدة في تجارة المواد الغذائية',
    status: 'active',
    plan: 'premium',
    expiryDate: '2025-12-31'
  },
  'beta': {
    id: 2,
    identifier: 'beta',
    name: 'شركة بيتا للصناعة',
    logo: '/imgs/companies/beta-logo.png',
    primaryColor: '#10B981',
    secondaryColor: '#047857',
    accentColor: '#D1FAE5',
    displayName: 'Beta Industries',
    description: 'شركة صناعية متخصصة في المعدات',
    status: 'active',
    plan: 'standard',
    expiryDate: '2025-08-15'
  },
  'gamma': {
    id: 3,
    identifier: 'gamma',
    name: 'شركة جاما للخدمات',
    logo: '/imgs/companies/gamma-logo.png',
    primaryColor: '#8B5CF6',
    secondaryColor: '#5B21B6',
    accentColor: '#EDE9FE',
    displayName: 'Gamma Services',
    description: 'مزود حلول خدمات متكاملة',
    status: 'trial',
    plan: 'trial',
    expiryDate: '2025-02-15'
  }
};

export const SaaSAuthProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState('company-select'); // company-select, company-load, password-input
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState('');

  // حفظ حالة SaaS في localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('saas_auth_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setCurrentStep(state.currentStep || 'company-select');
        setSelectedCompany(state.selectedCompany || null);
        setCompanyId(state.companyId || '');
      } catch (error) {
        console.error('خطأ في قراءة حالة SaaS:', error);
        localStorage.removeItem('saas_auth_state');
      }
    }
  }, []);

  // حفظ الحالة في localStorage
  const saveState = (newState) => {
    const stateToSave = {
      currentStep: newState.currentStep || currentStep,
      selectedCompany: newState.selectedCompany || selectedCompany,
      companyId: newState.companyId || companyId
    };
    localStorage.setItem('saas_auth_state', JSON.stringify(stateToSave));
  };

  // التحقق من معرف الشركة (محاكاة)
  const validateCompanyId = async (companyIdentifier) => {
    setLoading(true);
    
    try {
      // محاكاة تأخير الشبكة
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const company = MOCK_COMPANIES[companyIdentifier.toLowerCase()];
      
      if (!company) {
        return {
          success: false,
          message: 'معرف الشركة غير صحيح. يرجى التحقق من المعرف والمحاولة مرة أخرى'
        };
      }
      
      if (company.status !== 'active' && company.status !== 'trial') {
        return {
          success: false,
          message: 'حساب هذه المؤسسة معطل حالياً. يرجى الاتصال بالدعم الفني'
        };
      }
      
      // التحقق من انتهاء الصلاحية
      const expiryDate = new Date(company.expiryDate);
      const today = new Date();
      if (expiryDate < today && company.status !== 'trial') {
        return {
          success: false,
          message: 'انتهت صلاحية اشتراك هذه المؤسسة. يرجى تجديد الاشتراك'
        };
      }
      
      return {
        success: true,
        company: company,
        message: 'تم العثور على المؤسسة بنجاح'
      };
      
    } catch (error) {
      console.error('خطأ في التحقق من معرف الشركة:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء التحقق من معرف الشركة. يرجى المحاولة مرة أخرى'
      };
    } finally {
      setLoading(false);
    }
  };

  // الانتقال إلى خطوة تحميل إعدادات المؤسسة
  const proceedToCompanyLoad = async (companyIdentifier) => {
    const result = await validateCompanyId(companyIdentifier);
    
    if (result.success) {
      setSelectedCompany(result.company);
      setCompanyId(companyIdentifier);
      setCurrentStep('company-load');
      saveState({ currentStep: 'company-load', selectedCompany: result.company, companyId: companyIdentifier });
      return { success: true, company: result.company };
    } else {
      return result;
    }
  };

  // إعادة تعيين الحالة
  const resetAuth = () => {
    setCurrentStep('company-select');
    setSelectedCompany(null);
    setCompanyId('');
    localStorage.removeItem('saas_auth_state');
  };

  // الانتقال لخطوة إدخال كلمة المرور
  const proceedToPasswordInput = () => {
    setCurrentStep('password-input');
    saveState({ currentStep: 'password-input' });
  };

  const value = {
    // حالة المصادقة
    currentStep,
    selectedCompany,
    loading,
    companyId,
    
    // وظائف
    proceedToCompanyLoad,
    proceedToPasswordInput,
    resetAuth,
    
    // بيانات محاكاة
    mockCompanies: MOCK_COMPANIES
  };

  return (
    <SaaSAuthContext.Provider value={value}>
      {children}
    </SaaSAuthContext.Provider>
  );
};