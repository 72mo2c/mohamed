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
 * دالة محدثة لإدارة المخزون مع التحويل الذكي
 * @param {Array} products - قائمة المنتجات
 * @param {number} productId - معرف المنتج
 * @param {Object} quantityChange - تغيير الكمية
 * @returns {Array} - قائمة محدثة
 */
export const updateStockWithConversion = (products, productId, quantityChange) => {
  return products.map(product => {
    if (product.id === productId) {
      // حساب الكمية الجديدة مع التحويل الذكي
      const { mainQuantity = 0, subQuantity = 0, unitsInMain = 0 } = product;
      const { change = 0, type = 'sub' } = quantityChange; // type: 'main' or 'sub'
      
      let newMainQuantity = mainQuantity;
      let newSubQuantity = subQuantity;
      
      if (type === 'main') {
        // تغيير في الكمية الأساسية
        newMainQuantity = Math.max(0, mainQuantity + change);
      } else {
        // تغيير في الكمية الفرعية
        const newTotalSub = mainQuantity * unitsInMain + subQuantity + change;
        
        if (newTotalSub < 0) {
          // لا يمكن أن تكون الكمية سالبة
          return product; // لا تغيير
        }
        
        // تحويل إلى أساسي + فرعي
        if (unitsInMain > 0) {
          newMainQuantity = Math.floor(newTotalSub / unitsInMain);
          newSubQuantity = newTotalSub % unitsInMain;
        } else {
          newSubQuantity = newTotalSub;
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
  calculateProductTotalValue,
  exportProductsWithUnits
};
