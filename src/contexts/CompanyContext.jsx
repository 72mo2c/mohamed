import React, { createContext, useContext, useState, useEffect } from 'react';

// السياق الأساسي للشركات (Companies Context)
const CompanyContext = createContext();

// Context Provider للشركات
export function CompanyProvider({ children }) {
    // حالة الشركة المختارة حالياً
    const [selectedCompany, setSelectedCompany] = useState(null);
    
    // قائمة جميع الشركات المتاحة
    const [availableCompanies, setAvailableCompanies] = useState([]);
    
    // حالة تحميل البيانات
    const [isLoading, setIsLoading] = useState(true);
    
    // حالة الأخطاء
    const [error, setError] = useState(null);

    // تحميل قائمة الشركات عند بدء التشغيل
    useEffect(() => {
        loadCompanies();
    }, []);

    // تحميل قائمة الشركات من localStorage
    const loadCompanies = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // جلب قائمة الشركات من localStorage
            const companies = JSON.parse(localStorage.getItem('available_companies') || '[]');
            setAvailableCompanies(companies);
            
            // جلب الشركة المختارة حالياً من localStorage
            const savedCompany = localStorage.getItem('selected_company');
            if (savedCompany) {
                const companyData = JSON.parse(savedCompany);
                // التأكد من أن الشركة ما زالت موجودة في القائمة
                const companyExists = companies.find(c => c.id === companyData.id);
                if (companyExists) {
                    setSelectedCompany(companyData);
                } else {
                    // إزالة الشركة المحفوظة إذا لم تعد موجودة
                    localStorage.removeItem('selected_company');
                }
            }
            
        } catch (err) {
            console.error('خطأ في تحميل قائمة الشركات:', err);
            setError('فشل في تحميل قائمة الشركات');
        } finally {
            setIsLoading(false);
        }
    };

    // تحميل إعدادات الشركة (لوجو، ألوان، backend URL)
    const loadCompanyConfig = async (companyId) => {
        try {
            setError(null);
            
            const companies = JSON.parse(localStorage.getItem('available_companies') || '[]');
            const company = companies.find(c => c.id === companyId);
            
            if (!company) {
                throw new Error('الشركة غير موجودة');
            }

            // جلب إعدادات تفصيلية للشركة
            const companySettings = JSON.parse(localStorage.getItem(`company_${companyId}_settings`) || '{}');
            
            // دمج الإعدادات الأساسية مع الإعدادات التفصيلية
            const fullCompanyData = {
                ...company,
                ...companySettings,
                // إعدادات افتراضية إذا لم تكن موجودة
                logo: companySettings.logo || '/default-logo.png',
                primaryColor: companySettings.primaryColor || '#3B82F6',
                secondaryColor: companySettings.secondaryColor || '#64748B',
                theme: companySettings.theme || 'light',
                backendUrl: companySettings.backendUrl || company.backendUrl || '',
            };

            return fullCompanyData;
            
        } catch (err) {
            console.error('خطأ في تحميل إعدادات الشركة:', err);
            setError(`فشل في تحميل إعدادات الشركة: ${err.message}`);
            return null;
        }
    };

    // اختيار شركة جديدة
    const selectCompany = async (companyId) => {
        try {
            setIsLoading(true);
            setError(null);
            
            const companyData = await loadCompanyConfig(companyId);
            
            if (!companyData) {
                throw new Error('فشل في تحميل بيانات الشركة');
            }

            // حفظ الشركة المختارة في localStorage
            localStorage.setItem('selected_company', JSON.stringify(companyData));
            
            // تحديث الحالة
            setSelectedCompany(companyData);
            
            // إعادة تحميل البيانات حسب الشركة الجديدة
            window.location.reload(); // إعادة تحميل التطبيق لتطبيق الإعدادات الجديدة
            
        } catch (err) {
            console.error('خطأ في اختيار الشركة:', err);
            setError(`فشل في اختيار الشركة: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // تسجيل خروج من الشركة الحالية
    const logoutCompany = () => {
        try {
            // إزالة الشركة المختارة من localStorage
            localStorage.removeItem('selected_company');
            
            // إعادة تعيين الحالة
            setSelectedCompany(null);
            
            // إعادة توجيه إلى صفحة اختيار الشركة
            window.location.href = '/company-select';
            
        } catch (err) {
            console.error('خطأ في تسجيل خروج الشركة:', err);
            setError('فشل في تسجيل خروج الشركة');
        }
    };

    // إضافة شركة جديدة
    const addCompany = async (companyData) => {
        try {
            setIsLoading(true);
            setError(null);
            
            // التحقق من وجود الشركة مسبقاً
            const existingCompany = availableCompanies.find(c => 
                c.id === companyData.id || c.identifier === companyData.identifier
            );
            
            if (existingCompany) {
                throw new Error('الشركة موجودة مسبقاً');
            }

            // إنشاء بيانات الشركة الكاملة
            const newCompany = {
                id: companyData.id,
                name: companyData.name,
                identifier: companyData.identifier,
                password: companyData.password, // سيتم تشفيره في المستقبل
                createdAt: new Date().toISOString(),
                isActive: true,
                // إعدادات افتراضية
                logo: '/default-logo.png',
                primaryColor: '#3B82F6',
                secondaryColor: '#64748B',
                theme: 'light',
                backendUrl: companyData.backendUrl || '',
            };

            // إضافة للشركة للقائمة
            const updatedCompanies = [...availableCompanies, newCompany];
            setAvailableCompanies(updatedCompanies);
            
            // حفظ في localStorage
            localStorage.setItem('available_companies', JSON.stringify(updatedCompanies));
            
            return newCompany;
            
        } catch (err) {
            console.error('خطأ في إضافة الشركة:', err);
            setError(`فشل في إضافة الشركة: ${err.message}`);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // تحديث بيانات شركة
    const updateCompany = async (companyId, updates) => {
        try {
            setIsLoading(true);
            setError(null);
            
            const updatedCompanies = availableCompanies.map(company => 
                company.id === companyId 
                    ? { ...company, ...updates, updatedAt: new Date().toISOString() }
                    : company
            );
            
            setAvailableCompanies(updatedCompanies);
            localStorage.setItem('available_companies', JSON.stringify(updatedCompanies));
            
            // تحديث الشركة المختارة حالياً إذا كانت نفسها
            if (selectedCompany && selectedCompany.id === companyId) {
                const updatedCompany = { ...selectedCompany, ...updates };
                setSelectedCompany(updatedCompany);
                localStorage.setItem('selected_company', JSON.stringify(updatedCompany));
            }
            
            return true;
            
        } catch (err) {
            console.error('خطأ في تحديث الشركة:', err);
            setError(`فشل في تحديث الشركة: ${err.message}`);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // حذف شركة
    const deleteCompany = async (companyId) => {
        try {
            setIsLoading(true);
            setError(null);
            
            // التحقق من وجود مستخدمين مرتبطين بالشركة
            // (سيتم إضافة هذه الخطوة عند تطوير قاعدة البيانات)
            
            // إزالة الشركة من القائمة
            const updatedCompanies = availableCompanies.filter(c => c.id !== companyId);
            setAvailableCompanies(updatedCompanies);
            
            // حفظ القائمة المحدثة
            localStorage.setItem('available_companies', JSON.stringify(updatedCompanies));
            
            // إزالة إعدادات الشركة
            localStorage.removeItem(`company_${companyId}_settings`);
            
            // إذا كانت الشركة المختارة هي التي تم حذفها، قم بإزالة الاختيار
            if (selectedCompany && selectedCompany.id === companyId) {
                localStorage.removeItem('selected_company');
                setSelectedCompany(null);
                window.location.href = '/company-select';
            }
            
            return true;
            
        } catch (err) {
            console.error('خطأ في حذف الشركة:', err);
            setError(`فشل في حذف الشركة: ${err.message}`);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // الحصول على معلومات الشركة بالاسم المعرف
    const getCompanyByIdentifier = (identifier) => {
        return availableCompanies.find(company => 
            company.identifier.toLowerCase() === identifier.toLowerCase()
        );
    };

    // تطبيق إعدادات الشركة على الواجهة
    const applyCompanyTheme = (company) => {
        if (!company) return;
        
        const root = document.documentElement;
        
        // تطبيق الألوان
        root.style.setProperty('--primary-color', company.primaryColor || '#3B82F6');
        root.style.setProperty('--secondary-color', company.secondaryColor || '#64748B');
        
        // تطبيق المظهر (فاتح/داكن)
        if (company.theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        
        // تطبيق اللوجو (سيتم تطويره لاحقاً)
        const logoElement = document.querySelector('.company-logo');
        if (logoElement && company.logo) {
            logoElement.src = company.logo;
        }
    };

    // تطبيق إعدادات الشركة عند تغيير الشركة المختارة
    useEffect(() => {
        if (selectedCompany) {
            applyCompanyTheme(selectedCompany);
        }
    }, [selectedCompany]);

    // القيم الممررة للسياق
    const value = {
        // الحالة
        selectedCompany,
        availableCompanies,
        isLoading,
        error,
        
        // Methods
        loadCompanies,
        loadCompanyConfig,
        selectCompany,
        logoutCompany,
        addCompany,
        updateCompany,
        deleteCompany,
        getCompanyByIdentifier,
        applyCompanyTheme,
        refreshCompanies: loadCompanies
    };

    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
}

// Hook لاستخدام السياق
export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (!context) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
};

export default CompanyContext;