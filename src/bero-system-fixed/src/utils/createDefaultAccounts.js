// ======================================
// ملف إنشاء حسابات افتراضية لنظام المحاسبة
// يستخدم لإضافة بعض الحسابات الأساسية للاختبار
// ======================================

import { useData } from '../context/DataContext';

// دالة لإنشاء حسابات افتراضية
const createDefaultAccounts = (addAccount) => {
  const defaultAccounts = [
    // الأصول
    { code: '1000', name: 'الأصول', type: 'asset', nature: 'debit', parentId: null },
    { code: '1100', name: 'الأصول المتداولة', type: 'asset', nature: 'debit', parentId: null },
    { code: '1110', name: 'النقدية والصناديق', type: 'asset', nature: 'debit', parentId: null },
    { code: '1111', name: 'النقدية في الصندوق', type: 'asset', nature: 'debit', parentId: null },
    { code: '1112', name: 'النقدية في البنك', type: 'asset', nature: 'debit', parentId: null },
    { code: '1120', name: 'الذمم المدينة', type: 'asset', nature: 'debit', parentId: null },
    { code: '1121', name: 'ذمم العملاء', type: 'asset', nature: 'debit', parentId: null },
    { code: '1122', name: 'ذمم أخرى', type: 'asset', nature: 'debit', parentId: null },
    { code: '1130', name: 'المخزون', type: 'asset', nature: 'debit', parentId: null },
    { code: '1131', name: 'مخزون البضائع', type: 'asset', nature: 'debit', parentId: null },
    { code: '1140', name: 'مدفوعات مقدماً', type: 'asset', nature: 'debit', parentId: null },
    { code: '1200', name: 'الأصول الثابتة', type: 'asset', nature: 'debit', parentId: null },
    { code: '1210', name: 'الأصول الثابتة', type: 'asset', nature: 'debit', parentId: null },
    { code: '1211', name: 'الأصول المادية', type: 'asset', nature: 'debit', parentId: null },
    { code: '1212', name: 'الأصول غير المادية', type: 'asset', nature: 'debit', parentId: null },
    { code: '1213', name: 'استهلاك الأصول الثابتة', type: 'asset', nature: 'debit', parentId: null, allowPosting: false },

    // الخصوم
    { code: '2000', name: 'الخصوم', type: 'liability', nature: 'credit', parentId: null },
    { code: '2100', name: 'الخصوم المتداولة', type: 'liability', nature: 'credit', parentId: null },
    { code: '2110', name: 'الذمم الدائنة', type: 'liability', nature: 'credit', parentId: null },
    { code: '2111', name: 'ذمم الموردين', type: 'liability', nature: 'credit', parentId: null },
    { code: '2112', name: 'ذمم أخرى', type: 'liability', nature: 'credit', parentId: null },
    { code: '2120', name: 'مستحقات الدفع', type: 'liability', nature: 'credit', parentId: null },
    { code: '2121', name: 'مستحقات الرواتب', type: 'liability', nature: 'credit', parentId: null },
    { code: '2122', name: 'مستحقات الضرائب', type: 'liability', nature: 'credit', parentId: null },
    { code: '2130', name: 'قروض قصيرة الأجل', type: 'liability', nature: 'credit', parentId: null },
    { code: '2200', name: 'الخصوم طويلة الأجل', type: 'liability', nature: 'credit', parentId: null },
    { code: '2210', name: 'قروض طويلة الأجل', type: 'liability', nature: 'credit', parentId: null },

    // حقوق الملكية
    { code: '3000', name: 'حقوق الملكية', type: 'equity', nature: 'credit', parentId: null },
    { code: '3100', name: 'رأس المال', type: 'equity', nature: 'credit', parentId: null },
    { code: '3101', name: 'رأس المال المدفوع', type: 'equity', nature: 'credit', parentId: null },
    { code: '3200', name: 'الأرباح المحتجزة', type: 'equity', nature: 'credit', parentId: null },
    { code: '3201', name: 'أرباح الفترة الجارية', type: 'equity', nature: 'credit', parentId: null },
    { code: '3202', name: 'أرباح فترات سابقة', type: 'equity', nature: 'credit', parentId: null },

    // الإيرادات
    { code: '4000', name: 'الإيرادات', type: 'revenue', nature: 'credit', parentId: null },
    { code: '4100', name: 'إيرادات العمليات', type: 'revenue', nature: 'credit', parentId: null },
    { code: '4110', name: 'إيرادات المبيعات', type: 'revenue', nature: 'credit', parentId: null },
    { code: '4111', name: 'مبيعات محلية', type: 'revenue', nature: 'credit', parentId: null },
    { code: '4112', name: 'مبيعات تصدير', type: 'revenue', nature: 'credit', parentId: null },
    { code: '4120', name: 'إيرادات الخدمات', type: 'revenue', nature: 'credit', parentId: null },
    { code: '4200', name: 'إيرادات غير تشغيلية', type: 'revenue', nature: 'credit', parentId: null },
    { code: '4210', name: 'إيرادات فوائد', type: 'revenue', nature: 'credit', parentId: null },
    { code: '4220', name: 'إيرادات أخرى', type: 'revenue', nature: 'credit', parentId: null },

    // المصروفات
    { code: '5000', name: 'المصروفات', type: 'expense', nature: 'debit', parentId: null },
    { code: '5100', name: 'تكلفة المبيعات', type: 'expense', nature: 'debit', parentId: null },
    { code: '5110', name: 'تكلفة البضاعة المباعة', type: 'expense', nature: 'debit', parentId: null },
    { code: '5200', name: 'مصروفات التشغيل', type: 'expense', nature: 'debit', parentId: null },
    { code: '5210', name: 'رواتب ومزايا', type: 'expense', nature: 'debit', parentId: null },
    { code: '5211', name: 'رواتب الموظفين', type: 'expense', nature: 'debit', parentId: null },
    { code: '5212', name: 'مزايا الموظفين', type: 'expense', nature: 'debit', parentId: null },
    { code: '5220', name: 'إيجار', type: 'expense', nature: 'debit', parentId: null },
    { code: '5230', name: 'مرافق وخدمات', type: 'expense', nature: 'debit', parentId: null },
    { code: '5240', name: 'اتصالات ومخاطبة', type: 'expense', nature: 'debit', parentId: null },
    { code: '5250', name: 'نقل ومواصلات', type: 'expense', nature: 'debit', parentId: null },
    { code: '5260', name: 'صيانة وإصلاح', type: 'expense', nature: 'debit', parentId: null },
    { code: '5300', name: 'مصروفات إدارية', type: 'expense', nature: 'debit', parentId: null },
    { code: '5310', name: 'مصروفات إدارية عامة', type: 'expense', nature: 'debit', parentId: null },
    { code: '5400', name: 'مصروفات مالية', type: 'expense', nature: 'debit', parentId: null },
    { code: '5410', name: 'فوائد الاقتراض', type: 'expense', nature: 'debit', parentId: null },
    { code: '5500', name: 'مصروفات أخرى', type: 'expense', nature: 'debit', parentId: null },
    { code: '5510', name: 'مصروفات ضرائب', type: 'expense', nature: 'debit', parentId: null },
  ];

  let createdCount = 0;
  let errors = [];

  defaultAccounts.forEach(accountData => {
    try {
      addAccount(accountData);
      createdCount++;
    } catch (error) {
      errors.push({
        account: accountData.code + ' - ' + accountData.name,
        error: error.message
      });
    }
  });

  return { createdCount, total: defaultAccounts.length, errors };
};

// Hook للاستخدام في المكونات
export const useDefaultAccounts = () => {
  const { addAccount } = useData();

  const createAccounts = () => {
    return createDefaultAccounts(addAccount);
  };

  return { createAccounts };
};

export default createDefaultAccounts;

/*
الاستخدام في التطبيق:

import { useDefaultAccounts } from './createDefaultAccounts';

const MyComponent = () => {
  const { createAccounts } = useDefaultAccounts();

  const handleCreateAccounts = () => {
    const result = createAccounts();
    console.log(`تم إنشاء ${result.createdCount} حساب من أصل ${result.total}`);
    if (result.errors.length > 0) {
      console.log('أخطاء:', result.errors);
    }
  };

  return (
    <button onClick={handleCreateAccounts}>
      إنشاء الحسابات الافتراضية
    </button>
  );
};

*/