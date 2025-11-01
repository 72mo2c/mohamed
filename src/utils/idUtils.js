// ======================================
// ID Utils - أدوات مساعدة لمقارنة المعرفات بأمان
// ======================================

/**
 * مقارنة آمنة بين معرفين من أنواع مختلفة
 * @param {*} id1 - المعرف الأول (يمكن أن يكون number أو string)
 * @param {*} id2 - المعرف الثاني (يمكن أن يكون number أو string)
 * @returns {boolean} - true إذا كان المعرفان متساويان
 */
export const safeIdCompare = (id1, id2) => {
  // إذا كان أي من المعرفين undefined أو null
  if (id1 == null || id2 == null) {
    return false;
  }

  // إذا كان كلاهما رقم
  if (typeof id1 === 'number' && typeof id2 === 'number') {
    return id1 === id2;
  }

  // إذا كان أحدهما رقم والأخر نص
  if (typeof id1 === 'number' && typeof id2 === 'string') {
    const parsedId2 = parseInt(id2);
    return !isNaN(parsedId2) && id1 === parsedId2;
  }

  if (typeof id1 === 'string' && typeof id2 === 'number') {
    const parsedId1 = parseInt(id1);
    return !isNaN(parsedId1) && parsedId1 === id2;
  }

  // إذا كان كلاهما نص
  if (typeof id1 === 'string' && typeof id2 === 'string') {
    return id1 === id2;
  }

  // للمعرفات من أنواع أخرى (مثل objects)
  return String(id1) === String(id2);
};

/**
 * البحث الآمن عن عنصر في مصفوفة باستخدام المعرف
 * @param {Array} array - المصفوفة للبحث فيها
 * @param {*} searchId - المعرف للبحث عنه
 * @param {string} idField - اسم حقل المعرف (افتراضي: 'id')
 * @returns {*} - العنصر found أو undefined
 */
export const findBySafeId = (array, searchId, idField = 'id') => {
  if (!Array.isArray(array) || array.length === 0) {
    return undefined;
  }

  return array.find(item => {
    if (!item || typeof item !== 'object') {
      return false;
    }
    return safeIdCompare(item[idField], searchId);
  });
};

/**
 * البحث الآمن عن فهرس عنصر في مصفوفة باستخدام المعرف
 * @param {Array} array - المصفوفة للبحث فيها
 * @param {*} searchId - المعرف للبحث عنه
 * @param {string} idField - اسم حقل المعرف (افتراضي: 'id')
 * @returns {number} - فهرس العنصر أو -1
 */
export const findIndexBySafeId = (array, searchId, idField = 'id') => {
  if (!Array.isArray(array) || array.length === 0) {
    return -1;
  }

  return array.findIndex(item => {
    if (!item || typeof item !== 'object') {
      return false;
    }
    return safeIdCompare(item[idField], searchId);
  });
};

/**
 * تصفية آمنة لمصفوفة باستخدام المعرفات
 * @param {Array} array - المصفوفة للتصفية
 * @param {Array} searchIds - قائمة المعرفات للبحث عنها
 * @param {string} idField - اسم حقل المعرف (افتراضي: 'id')
 * @returns {Array} - المصفوفة المفلترة
 */
export const filterBySafeIds = (array, searchIds, idField = 'id') => {
  if (!Array.isArray(array) || array.length === 0) {
    return [];
  }

  if (!Array.isArray(searchIds) || searchIds.length === 0) {
    return array;
  }

  return array.filter(item => {
    if (!item || typeof item !== 'object') {
      return false;
    }
    return searchIds.some(searchId => safeIdCompare(item[idField], searchId));
  });
};

/**
 * تسجيل معلومات تشخيصية للمعرفات
 * @param {*} id - المعرف للفحص
 * @param {string} context - سياق التشخيص
 */
export const logIdInfo = (id, context = '') => {
  console.log(`${context} فحص المعرف:`, {
    value: id,
    type: typeof id,
    isNaN: typeof id === 'number' ? isNaN(id) : 'N/A',
    stringValue: String(id),
    timestamp: new Date().toISOString()
  });
};

/**
 * تسجيل معلومات تشخيصية لمصفوفة عناصر
 * @param {Array} array - المصفوفة للفحص
 * @param {string} idField - اسم حقل المعرف
 * @param {string} context - سياق التشخيص
 */
export const logArrayIdsInfo = (array, idField = 'id', context = '') => {
  if (!Array.isArray(array)) {
    console.warn(`${context} المصفوفة ليست مصفوفة صحيحة:`, array);
    return;
  }

  console.log(`${context} فحص ${array.length} عنصر:`, 
    array.map((item, index) => ({
      index,
      id: item?.[idField],
      type: typeof item?.[idField],
      valid: item && typeof item === 'object' && idField in item
    }))
  );
};

export default {
  safeIdCompare,
  findBySafeId,
  findIndexBySafeId,
  filterBySafeIds,
  logIdInfo,
  logArrayIdsInfo
};
