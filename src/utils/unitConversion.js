// ======================================
// Unit Conversion Utilities
// أداة التحويل الذكي بين الوحدات الأساسية والفرعية
// ======================================

/**
 * حساب الكمية الإجمالية بالوحدات الفرعية
 * @param {number} mainQuantity - الكمية الأساسية
 * @param {number} subQuantity - الكمية الفرعية
 * @param {number} unitsInMain - العدد في الوحدة الأساسية
 * @returns {number} - الكمية الإجمالية بالوحدات الفرعية
 */
export const calculateTotalSubQuantity = (mainQuantity, subQuantity, unitsInMain) => {
  return (parseInt(mainQuantity) || 0) * (parseInt(unitsInMain) || 0) + (parseInt(subQuantity) || 0);
};

/**
 * تحويل الكمية من وحدات فرعية إلى أساسي + فرعي
 * @param {number} totalSubQuantity - الكمية الإجمالية بالوحدات الفرعية
 * @param {number} unitsInMain - العدد في الوحدة الأساسية
 * @returns {object} - { mainQuantity, subQuantity }
 */
export const convertSubToMain = (totalSubQuantity, unitsInMain) => {
  const totalSub = parseInt(totalSubQuantity) || 0;
  const units = parseInt(unitsInMain) || 0;
  
  if (units === 0) {
    return { mainQuantity: 0, subQuantity: totalSub };
  }
  
  const mainQuantity = Math.floor(totalSub / units);
  const subQuantity = totalSub % units;
  
  return { mainQuantity, subQuantity };
};

/**
 * إضافة كمية (مشتريات)
 * @param {object} currentStock - المخزون الحالي
 * @param {number} addSubQuantity - الكمية المراد إضافتها بالوحدات الفرعية
 * @returns {object} - المخزون الجديد
 */
export const addSubQuantity = (currentStock, addSubQuantity) => {
  const { mainQuantity, subQuantity, unitsInMain } = currentStock;
  const addSub = parseInt(addSubQuantity) || 0;
  
  if (addSub === 0) {
    return currentStock;
  }
  
  const currentTotal = calculateTotalSubQuantity(mainQuantity, subQuantity, unitsInMain);
  const newTotal = currentTotal + addSub;
  
  return convertSubToMain(newTotal, unitsInMain);
};

/**
 * خصم كمية (مبيعات)
 * @param {object} currentStock - المخزون الحالي
 * @param {number} removeSubQuantity - الكمية المراد خصمها بالوحدات الفرعية
 * @returns {object} - المخزون الجديد مع التحقق من عدم السالب
 */
export const removeSubQuantity = (currentStock, removeSubQuantity) => {
  const { mainQuantity, subQuantity, unitsInMain } = currentStock;
  const removeSub = parseInt(removeSubQuantity) || 0;
  
  const currentTotal = calculateTotalSubQuantity(mainQuantity, subQuantity, unitsInMain);
  const newTotal = currentTotal - removeSub;
  
  if (newTotal < 0) {
    throw new Error('الكمية المطلوبة غير متوفرة في المخزون');
  }
  
  return convertSubToMain(newTotal, unitsInMain);
};

/**
 * التحقق من توفر كمية معينة
 * @param {object} currentStock - المخزون الحالي
 * @param {number} requiredSubQuantity - الكمية المطلوبة بالوحدات الفرعية
 * @returns {boolean} - true إذا كانت متوفرة
 */
export const isSubQuantityAvailable = (currentStock, requiredSubQuantity) => {
  const { mainQuantity, subQuantity, unitsInMain } = currentStock;
  const required = parseInt(requiredSubQuantity) || 0;
  
  const currentTotal = calculateTotalSubQuantity(mainQuantity, subQuantity, unitsInMain);
  
  return currentTotal >= required;
};

/**
 * تنسيق عرض الكمية بطريقة ذكية
 * @param {object} stock - المخزون
 * @returns {string} - النص المنسق
 */
export const formatStockDisplay = (stock) => {
  const { mainQuantity, subQuantity, unitsInMain } = stock;
  
  if (!unitsInMain || unitsInMain === 0) {
    return `${mainQuantity || 0} وحدة أساسية`;
  }
  
  if (subQuantity === 0) {
    return `${mainQuantity || 0} كرتونة`;
  }
  
  return `${mainQuantity || 0} كرتونة + ${subQuantity} قطعة`;
};

/**
 * حساب الكمية الإجمالية بصيغة نصية
 * @param {object} stock - المخزون
 * @returns {string} - الكمية الإجمالية
 */
export const formatTotalQuantity = (stock) => {
  const { mainQuantity, subQuantity, unitsInMain } = stock;
  const total = calculateTotalSubQuantity(mainQuantity, subQuantity, unitsInMain);
  
  if (!unitsInMain || unitsInMain === 0) {
    return `${total} وحدة`;
  }
  
  return `${total} قطعة`;
};

/**
 * الحصول على تفصيل الكمية
 * @param {object} stock - المخزون
 * @returns {object} - تفصيل الكمية
 */
export const getStockDetail = (stock) => {
  const { mainQuantity, subQuantity, unitsInMain } = stock;
  const total = calculateTotalSubQuantity(mainQuantity, subQuantity, unitsInMain);
  
  return {
    main: mainQuantity || 0,
    sub: subQuantity || 0,
    total: total,
    unitsInMain: unitsInMain || 0,
    hasConversion: unitsInMain > 0,
    display: formatStockDisplay(stock),
    totalDisplay: formatTotalQuantity(stock)
  };
};

// تصدير الدوال للاستخدام المباشر
export default {
  calculateTotalSubQuantity,
  convertSubToMain,
  addSubQuantity,
  removeSubQuantity,
  isSubQuantityAvailable,
  formatStockDisplay,
  formatTotalQuantity,
  getStockDetail
};
