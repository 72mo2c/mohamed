// بيانات تجريبية للشركات للاختبار
export const sampleCompanies = [
    {
        id: 'company-001',
        name: 'شركة النجاح للتجارة',
        identifier: 'alfalah',
        password: '123456',
        createdAt: '2024-01-15T10:30:00.000Z',
        isActive: true,
        // إعدادات الهوية
        logo: '/companies/alfalah-logo.png',
        primaryColor: '#059669', // أخضر
        secondaryColor: '#6B7280', // رمادي
        theme: 'light',
        backendUrl: '',
        // معلومات إضافية
        description: 'شركة متخصصة في تجارة المواد الغذائية',
        contact: {
            phone: '+966501234567',
            email: 'info@alfalah.com',
            address: 'الرياض، المملكة العربية السعودية'
        }
    },
    {
        id: 'company-002', 
        name: 'مؤسسة الابتكار للمقاولات',
        identifier: 'innovation',
        password: '123456',
        createdAt: '2024-02-20T14:15:00.000Z',
        isActive: true,
        // إعدادات الهوية
        logo: '/companies/innovation-logo.png',
        primaryColor: '#DC2626', // أحمر
        secondaryColor: '#374151', // رمادي داكن
        theme: 'light',
        backendUrl: '',
        // معلومات إضافية
        description: 'مؤسسة رائدة في مجال المقاولات والإنشاءات',
        contact: {
            phone: '+966507654321',
            email: 'contact@innovation.com',
            address: 'جدة، المملكة العربية السعودية'
        }
    },
    {
        id: 'company-003',
        name: 'شركة الحلول الذكية للتقنية',
        identifier: 'smarttech',
        password: '123456',
        createdAt: '2024-03-10T09:45:00.000Z',
        isActive: true,
        // إعدادات الهوية
        logo: '/companies/smarttech-logo.png',
        primaryColor: '#7C3AED', // بنفسجي
        secondaryColor: '#1F2937', // رمادي جداً داكن
        theme: 'dark',
        backendUrl: '',
        // معلومات إضافية
        description: 'شركة متخصصة في حلول التقنية والبرمجة',
        contact: {
            phone: '+966512345678',
            email: 'info@smarttech.sa',
            address: 'الدمام، المملكة العربية السعودية'
        }
    },
    {
        id: 'company-004',
        name: 'معرض汽车工业 للسيارات',
        identifier: 'autoworld',
        password: '123456',
        createdAt: '2024-01-05T16:20:00.000Z',
        isActive: true,
        // إعدادات الهوية
        logo: '/companies/autoworld-logo.png',
        primaryColor: '#2563EB', // أزرق
        secondaryColor: '#4B5563', // رمادي متوسط
        theme: 'light',
        backendUrl: '',
        // معلومات إضافية
        description: 'معرض متخصص في بيع وصيانة السيارات',
        contact: {
            phone: '+966598765432',
            email: 'sales@autoworld.com',
            address: 'مكة المكرمة، المملكة العربية السعودية'
        }
    },
    {
        id: 'company-005',
        name: 'شركة البحر المتوسط للبحوث',
        identifier: 'medresearch',
        password: '123456',
        createdAt: '2024-04-01T11:00:00.000Z',
        isActive: false, // شركة غير مفعلة للاختبار
        // إعدادات الهوية
        logo: '/companies/medresearch-logo.png',
        primaryColor: '#0891B2', // سماوي
        secondaryColor: '#52525B', // رمادي محايد
        theme: 'light',
        backendUrl: '',
        // معلومات إضافية
        description: 'مؤسسة بحوث طبية وعلمية',
        contact: {
            phone: '+966503456789',
            email: 'info@medresearch.org',
            address: 'المدينة المنورة، المملكة العربية السعودية'
        }
    }
];

// دالة لإضافة الشركات التجريبية إلى localStorage
export const initializeSampleData = () => {
    try {
        // إضافة الشركات
        localStorage.setItem('available_companies', JSON.stringify(sampleCompanies));
        
        // إضافة إعدادات إضافية لكل شركة
        sampleCompanies.forEach(company => {
            const settings = {
                id: company.id,
                logo: company.logo,
                primaryColor: company.primaryColor,
                secondaryColor: company.secondaryColor,
                theme: company.theme,
                backendUrl: company.backendUrl,
                description: company.description,
                contact: company.contact,
                // إعدادات إضافية
                features: {
                    warehouseManagement: true,
                    inventoryTracking: true,
                    reports: true,
                    userManagement: true,
                    backup: true,
                    sync: true
                },
                // إعدادات النظام
                system: {
                    language: 'ar',
                    currency: 'SAR',
                    timezone: 'Asia/Riyadh',
                    dateFormat: 'DD/MM/YYYY'
                }
            };
            
            localStorage.setItem(`company_${company.id}_settings`, JSON.stringify(settings));
        });
        
        console.log('تم إضافة البيانات التجريبية بنجاح');
        return true;
        
    } catch (error) {
        console.error('خطأ في إضافة البيانات التجريبية:', error);
        return false;
    }
};

// دالة لإزالة البيانات التجريبية
export const clearSampleData = () => {
    try {
        localStorage.removeItem('available_companies');
        
        sampleCompanies.forEach(company => {
            localStorage.removeItem(`company_${company.id}_settings`);
        });
        
        console.log('تم إزالة البيانات التجريبية بنجاح');
        return true;
        
    } catch (error) {
        console.error('خطأ في إزالة البيانات التجريبية:', error);
        return false;
    }
};

// دالة للتحقق من وجود البيانات التجريبية
export const hasSampleData = () => {
    const companies = localStorage.getItem('available_companies');
    return companies && JSON.parse(companies).length > 0;
};

// دالة للحصول على إحصائيات البيانات التجريبية
export const getSampleDataStats = () => {
    const companies = JSON.parse(localStorage.getItem('available_companies') || '[]');
    const activeCompanies = companies.filter(c => c.isActive);
    const inactiveCompanies = companies.filter(c => !c.isActive);
    
    return {
        total: companies.length,
        active: activeCompanies.length,
        inactive: inactiveCompanies.length,
        companies: companies.map(c => ({
            id: c.id,
            name: c.name,
            identifier: c.identifier,
            isActive: c.isActive,
            theme: c.theme || 'light'
        }))
    };
};

export default {
    sampleCompanies,
    initializeSampleData,
    clearSampleData,
    hasSampleData,
    getSampleDataStats
};