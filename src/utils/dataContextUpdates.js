// ======================================
// Data Context Updates
// تحديثات Context البيانات لدعم الكمية الذكية
// ======================================

/**
 * دالة تحديث المنتجات لإضافة دعم unitsInMain
 * @param {Array} products - قائمة المنتجات الحالية
 * @returns {Array} - قائمة محدثة مع unitsInMain
 */
export const updateProductsForUnitsInMain = (products) => {
  return products.map(product => {
    // إذا كان المنتج لا يحتوي على unitsInMain، أضفه بقيمة افتراضية
    if (!product.hasOwnProperty('unitsInMain')) {
      return {
        ...product,
        unitsInMain: 0 // 0 يعني أنه لا يوجد تحويل (للموافقية الخلفية)
      };
    }
    return product;
  });
};

/**
 * دالة محدثة لإضافة منتج مع unitsInMain
 * @param {Object} productData - بيانات المنتج
 * @returns {Object} - المنتج المضاف
 */
export const addProductWithUnits = (productData) => {
  const newProduct = {
    id: Date.now(),
    ...productData,
    // التأكد من وجود unitsInMain مع قيمة افتراضية
    unitsInMain: productData.unitsInMain || 0,
    createdAt: new Date().toISOString()
  };
  
  return newProduct;
};

/**
 * دالة محدثة لتحديث منتج مع unitsInMain
 * @param {Array} products - قائمة المنتجات
 * @param {number} id - معرف المنتج
 * @param {Object} updatedData - البيانات المحدثة
 * @returns {Array} - القائمة المحدثة
 */
export const updateProductWithUnits = (products, id, updatedData) => {
  return products.map(product => {
    if (product.id === id) {
      return {
        ...product,
        ...updatedData,
        unitsInMain: updatedData.unitsInMain !== undefined ? updatedData.unitsInMain : (product.unitsInMain || 0),
        updatedAt: new Date().toISOString()
      };
    }
    return product;
  });
};

/**
 * دالة محدثة لحفظ المنتجات مع unitsInMain
 * @param {Array} products - قائمة المنتجات
 * @returns {Array} - قائمة محدثة ومحفوظة
 */
export const saveProductsWithUnits = (products) => {
  // تحديث البيانات أولاً
  const updatedProducts = updateProductsForUnitsInMain(products);
  
  // حفظ في LocalStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('bero_products', JSON.stringify(updatedProducts));
  }
  
  return updatedProducts;
};

/**
 * دالة محدثة لتحميل المنتجات مع unitsInMain
 * @returns {Array} - قائمة المنتجات
 */
export const loadProductsWithUnits = () => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('bero_products');
    if (stored) {
      const products = JSON.parse(stored);
      return updateProductsForUnitsInMain(products);
    }
  } catch (error) {
    console.error('خطأ في تحميل المنتجات:', error);
  }
  
  return [];
};

/**
 * دالة محدثة لإدارة المخزون مع التحويل الذكي - المنطق الذكي للخصم
 * @param {Array} products - قائمة المنتجات
 * @param {number} productId - معرف المنتج
 * @param {Object} saleData - بيانات البيع { mainSale, subSale }
 * @returns {Array} - قائمة محدثة
 */
export const updateStockWithConversion = (products, productId, saleData) => {
  return products.map(product => {
    if (product.id === productId) {
      const { mainQuantity = 0, subQuantity = 0, unitsInMain = 0 } = product;
      const { mainSale = 0, subSale = 0 } = saleData;
      
      let newMainQuantity = mainQuantity;
      let newSubQuantity = subQuantity;
      
      // الخطوة 1: خصم الكمية الأساسية أولاً
      if (mainSale > 0) {
        newMainQuantity = Math.max(0, mainQuantity - mainSale);
        
        // تحويل الكمية المباعة من أساسي إلى فرعي وإضافتها للمطلوب
        const mainToSub = mainSale * unitsInMain;
        const totalSubRequired = subSale + mainToSub;
        
        // الخطوة 2: خصم الكمية الفرعية
        if (subQuantity >= totalSubRequired) {
          // الكمية الفرعية كافية
          newSubQuantity = subQuantity - totalSubRequired;
        } else {
          // الكمية الفرعية غير كافية - خذ من الأساسي
          const subShortage = totalSubRequired - subQuantity;
          const additionalMainNeeded = Math.ceil(subShortage / unitsInMain);
          
          if (newMainQuantity >= additionalMainNeeded) {
            newMainQuantity -= additionalMainNeeded;
            newSubQuantity = subQuantity + (additionalMainNeeded * unitsInMain) - totalSubRequired;
          } else {
            // لا توجد كمية كافية
            return product; // لا تغيير
          }
        }
      } else {
        // لا يوجد خصم في أساسي، فقط فرعي
        if (subQuantity >= subSale) {
          newSubQuantity = subQuantity - subSale;
        } else {
          // كميحة فرعية غير كافية - خذ من الأساسي
          const subShortage = subSale - subQuantity;
          const additionalMainNeeded = Math.ceil(subShortage / unitsInMain);
          
          if (newMainQuantity >= additionalMainNeeded) {
            newMainQuantity -= additionalMainNeeded;
            newSubQuantity = subQuantity + (additionalMainNeeded * unitsInMain) - subSale;
          } else {
            // لا توجد كمية كافية
            return product; // لا تغيير
          }
        }
      }
      
      return {
        ...product,
        mainQuantity: newMainQuantity,
        subQuantity: newSubQuantity,
        updatedAt: new Date().toISOString()
      };
    }
    return product;
  });
};

/**
 * دالة التحقق من توفر كمية مع التحويل الذكي
 * @param {Object} product - المنتج
 * @param {number} requiredQuantity - الكمية المطلوبة
 * @param {string} quantityType - نوع الكمية ('main' or 'sub')
 * @returns {boolean} - true إذا كانت متوفرة
 */
export const checkStockAvailability = (product, requiredQuantity, quantityType = 'sub') => {
  const { mainQuantity = 0, subQuantity = 0, unitsInMain = 0 } = product;
  
  if (quantityType === 'main') {
    // التحقق من الكمية الأساسية
    return mainQuantity >= requiredQuantity;
  } else {
    // التحقق من الكمية الفرعية (الإجمالية)
    const totalSubQuantity = mainQuantity * unitsInMain + subQuantity;
    return totalSubQuantity >= requiredQuantity;
  }
};

/**
 * دالة التحقق الذكي من توفر الكمية مع إمكانية التحويل
 * تستخدم نفس منطق updateStockWithConversion للتحقق من إمكانية الخصم
 * @param {Object} product - المنتج
 * @param {number} mainSale - الكمية الرئيسية المطلوبة
 * @param {number} subSale - الكمية الفرعية المطلوبة
 * @returns {boolean} - true إذا كانت متوفرة
 */
export const isSmartQuantityAvailable = (product, mainSale, subSale) => {
  const { mainQuantity = 0, subQuantity = 0, unitsInMain = 0 } = product;
  
  // إذا لم توجد تحويلات، استخدم المنطق التقليدي
  if (unitsInMain === 0) {
    return mainQuantity >= mainSale && subQuantity >= subSale;
  }
  
  let tempMainQuantity = mainQuantity;
  let tempSubQuantity = subQuantity;
  
  // الخطوة 1: خصم الكمية الأساسية أولاً
  if (mainSale > 0) {
    if (tempMainQuantity < mainSale) {
      return false; // لا توجد كمية أساسية كافية
    }
    
    tempMainQuantity = Math.max(0, mainQuantity - mainSale);
    
    // تحويل الكمية المباعة من أساسي إلى فرعي وإضافتها للمطلوب
    const mainToSub = mainSale * unitsInMain;
    const totalSubRequired = subSale + mainToSub;
    
    // الخطوة 2: التحقق من الكمية الفرعية
    if (subQuantity >= totalSubRequired) {
      return true; // الكمية الفرعية كافية
    } else {
      // الكمية الفرعية غير كافية - خذ من الأساسي
      const subShortage = totalSubRequired - subQuantity;
      const additionalMainNeeded = Math.ceil(subShortage / unitsInMain);
      
      return tempMainQuantity >= additionalMainNeeded;
    }
  } else {
    // لا يوجد خصم في أساسي، فقط فرعي
    if (subQuantity >= subSale) {
      return true; // الكمية الفرعية كافية
    } else {
      // كمية فرعية غير كافية - خذ من الأساسي
      const subShortage = subSale - subQuantity;
      const additionalMainNeeded = Math.ceil(subShortage / unitsInMain);
      
      return tempMainQuantity >= additionalMainNeeded;
    }
  }
};

/**
 * دالة حساب القيمة الإجمالية للمنتج
 * @param {Object} product - المنتج
 * @returns {number} - القيمة الإجمالية
 */
export const calculateProductTotalValue = (product) => {
  const { mainPrice = 0, mainQuantity = 0, subQuantity = 0, unitsInMain = 0 } = product;
  const totalSubQuantity = mainQuantity * unitsInMain + subQuantity;
  return mainPrice * totalSubQuantity;
};

/**
 * دالة تصدير البيانات مع معلومات وحدات التحويل
 * @param {Array} products - قائمة المنتجات
 * @returns {Object} - البيانات المصدرة
 */
export const exportProductsWithUnits = (products) => {
  const updatedProducts = updateProductsForUnitsInMain(products);
  
  return {
    products: updatedProducts,
    exportDate: new Date().toISOString(),
    version: '2.0',
    features: ['unitsInMain', 'smartConversion', 'totalValue']
  };
};

// تصدير الدوال
export default {
  updateProductsForUnitsInMain,
  addProductWithUnits,
  updateProductWithUnits,
  saveProductsWithUnits,
  loadProductsWithUnits,
  updateStockWithConversion,
  checkStockAvailability,
  isSmartQuantityAvailable,
  calculateProductTotalValue,
  exportProductsWithUnits
};
