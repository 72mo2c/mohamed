// ======================================
// Smart Sales Invoice - فاتورة مبيعات ذكية مع التحويل التلقائي
// ======================================

import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { FaSave, FaPrint, FaSearch, FaTrash, FaPercent, FaMoneyBillWave, FaExclamationTriangle, FaInfoCircle, FaCalculator, FaCheckCircle } from 'react-icons/fa';
import { 
  calculateTotalSubQuantity, 
  convertSubToMain, 
  isSubQuantityAvailable,
  getStockDetail 
} from '../../utils/unitConversion';
import { checkStockAvailability, updateStockWithConversion } from '../../utils/dataContextUpdates';

const SmartSalesInvoice = () => {
  const { customers, products, warehouses, addSalesInvoice, getCustomerBalance } = useData();
  const { showSuccess, showError, showWarning } = useNotification();
  
  const [formData, setFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    paymentType: 'main',
    notes: '',
    discountType: 'percentage',
    discountValue: 0
  });

  const [items, setItems] = useState([{
    productId: '',
    productName: '',
    mainQuantity: 0,
    subQuantity: 0, // الكمية الإجمالية بالوحدات الفرعية
    price: 0,
    subPrice: 0,
    discount: 0
  }]);

  // التحقق من توفر الكمية
  const [stockWarnings, setStockWarnings] = useState({});

  // البحث في العملاء والمنتجات
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [productSearches, setProductSearches] = useState(['']);
  const [showProductSuggestions, setShowProductSuggestions] = useState([false]);
  
  // حالات الخطأ
  const [validationErrors, setValidationErrors] = useState({});

  // التركيز التلقائي
  const customerInputRef = useRef(null);

  useEffect(() => {
    customerInputRef.current?.focus();
  }, []);

  // عرض رصيد العميل المحدد
  const getSelectedCustomerBalance = () => {
    if (!formData.customerId) return null;
    return getCustomerBalance(parseInt(formData.customerId));
  };

  // الحصول على تفاصيل المنتج المحدد
  const getSelectedProduct = (item) => {
    return products.find(p => p.id === parseInt(item.productId)) || null;
  };

  // التحقق من توفر الكمية عند إدخالها
  const checkStockAvailabilityForItem = (index, item) => {
    const product = getSelectedProduct(item);
    if (!product) return;

    const totalSubQuantity = (item.mainQuantity || 0) * (product.unitsInMain || 0) + (item.subQuantity || 0);
    const currentStock = {
      mainQuantity: product.mainQuantity || 0,
      subQuantity: product.subQuantity || 0,
      unitsInMain: product.unitsInMain || 0
    };

    const isAvailable = checkStockAvailability(currentStock, totalSubQuantity, 'sub');
    
    setStockWarnings(prev => ({
      ...prev,
      [index]: isAvailable ? null : 'الكمية المطلوبة غير متوفرة في المخزون'
    }));
  };

  // حساب إجمالي العنصر
  const calculateItemTotal = (item) => {
    const product = getSelectedProduct(item);
    if (!product) return 0;
    
    // حساب إجمالي الكمية الفعلي
    const totalSubQuantity = (item.mainQuantity || 0) * (product.unitsInMain || 0) + (item.subQuantity || 0);
    
    // حساب القيمة: نستخدم السعر الأساسي للوحدة الفرعية إذا كان موجود
    const unitPrice = product.subPrice || product.mainPrice;
    
    return totalSubQuantity * unitPrice;
  };

  const calculateSubTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateDiscountAmount = () => {
    const subTotal = calculateSubTotal();
    if (formData.discountType === 'percentage') {
      return (subTotal * (formData.discountValue / 100));
    } else {
      return parseFloat(formData.discountValue) || 0;
    }
  };

  const calculateTotal = () => {
    const subTotal = calculateSubTotal();
    const discountAmount = calculateDiscountAmount();
    return Math.max(0, subTotal - discountAmount);
  };

  // إدارة عناصر الفاتورة
  const addItem = () => {
    setItems([...items, {
      productId: '',
      productName: '',
      mainQuantity: 0,
      subQuantity: 0,
      price: 0,
      subPrice: 0,
      discount: 0
    }]);
    setProductSearches([...productSearches, '']);
    setShowProductSuggestions([...showProductSuggestions, false]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    const newProductSearches = productSearches.filter((_, i) => i !== index);
    const newShowProductSuggestions = showProductSuggestions.filter((_, i) => i !== index);
    const newStockWarnings = {...stockWarnings};
    delete newStockWarnings[index];
    
    setItems(newItems);
    setProductSearches(newProductSearches);
    setShowProductSuggestions(newShowProductSuggestions);
    setStockWarnings(newStockWarnings);
  };

  // البحث في المنتجات
  const searchProducts = (query) => {
    if (!query.trim()) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  };

  // تحديد منتج
  const selectProduct = (index, product) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      productName: product.name,
      price: product.mainPrice,
      subPrice: product.subPrice || 0
    };
    setItems(newItems);

    // تحديث البحث
    const newProductSearches = [...productSearches];
    newProductSearches[index] = product.name;
    setProductSearches(newProductSearches);

    // إخفاء الاقتراحات
    const newShowProductSuggestions = [...showProductSuggestions];
    newShowProductSuggestions[index] = false;
    setShowProductSuggestions(newShowProductSuggestions);
  };

  // تحديث عنصر مع فحص المخزون
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setItems(newItems);

    // فحص المخزون إذا تم تحديث الكمية
    if (field === 'mainQuantity' || field === 'subQuantity') {
      setTimeout(() => checkStockAvailabilityForItem(index, newItems[index]), 100);
    }
  };

  // التحقق من صحة البيانات
  const validateForm = () => {
    const errors = {};
    
    if (!formData.customerId) {
      errors.customerId = 'يجب اختيار عميل';
    }
    
    items.forEach((item, index) => {
      if (!item.productId) {
        errors[`item_${index}_productId`] = 'يجب اختيار منتج';
      }
      if ((item.mainQuantity || 0) <= 0 && (item.subQuantity || 0) <= 0) {
        errors[`item_${index}_quantity`] = 'يجب إدخال كمية';
      }
      
      // التحقق من توفر المخزون باستخدام المنطق الذكي
      const product = getSelectedProduct(item);
      if (product) {
        const mainQty = item.mainQuantity || 0;
        const subQty = item.subQuantity || 0;
        const unitsInMain = product.unitsInMain || 0;
        
        // حساب الكمية المطلوبة بالوحدات الفرعية
        const requiredSubQuantity = mainQty * unitsInMain + subQty;
        
        // حساب الكمية المتاحة بالوحدات الفرعية
        const totalAvailableSub = (product.mainQuantity || 0) * unitsInMain + (product.subQuantity || 0);
        
        if (requiredSubQuantity > totalAvailableSub) {
          errors[`item_${index}_stock`] = `الكمية المطلوبة من ${product.name} غير متوفرة.\n` +
            `إجمالي المتوفر: ${totalAvailableSub} قطعة، المطلوب: ${requiredSubQuantity} قطعة`;
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // حفظ الفاتورة
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('يرجى التحقق من البيانات المدخلة');
      return;
    }

    try {
      // تحضير البيانات للحفظ
      const invoiceData = {
        ...formData,
        customerId: parseInt(formData.customerId),
        items: items.map(item => ({
          ...item,
          productId: parseInt(item.productId),
          mainQuantity: parseInt(item.mainQuantity) || 0,
          subQuantity: parseInt(item.subQuantity) || 0,
          price: parseFloat(item.price) || 0,
          subPrice: parseFloat(item.subPrice) || 0,
          discount: parseFloat(item.discount) || 0
        })),
        total: calculateTotal(),
        createdAt: new Date().toISOString()
      };

      const newInvoice = addSalesInvoice(invoiceData);
      showSuccess('تم حفظ الفاتورة بنجاح');
      
      // إعادة تعيين النموذج
      setFormData({
        customerId: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        paymentType: 'main',
        notes: '',
        discountType: 'percentage',
        discountValue: 0
      });
      
      setItems([{
        productId: '',
        productName: '',
        mainQuantity: 0,
        subQuantity: 0,
        price: 0,
        subPrice: 0,
        discount: 0
      }]);
      
    } catch (error) {
      showError('حدث خطأ في حفظ الفاتورة');
      console.error('خطأ حفظ الفاتورة:', error);
    }
  };

  // فلترة العملاء
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* العنوان الرئيسي */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-4 border-b bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FaMoneyBillWave /> فاتورة مبيعات ذكية
          </h1>
          <p className="text-orange-100 text-sm mt-1">
            نظام ذكي للتحقق من توفر المخزون والتحويل التلقائي بين الوحدات
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* معلومات الفاتورة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* العميل */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">العميل *</label>
              <div className="relative">
                <input
                  ref={customerInputRef}
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerSuggestions(true);
                  }}
                  onFocus={() => setShowCustomerSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                  placeholder="البحث عن عميل..."
                />
                {showCustomerSuggestions && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {filteredCustomers.map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => {
                          setFormData({...formData, customerId: customer.id});
                          setCustomerSearch(customer.name);
                          setShowCustomerSuggestions(false);
                        }}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-500">
                          رصيد: {customer.balance || 0} ج.م
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {validationErrors.customerId && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.customerId}</p>
              )}
            </div>

            {/* التاريخ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* وقت */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوقت *</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>

          {/* عرض رصيد العميل */}
          {getSelectedCustomerBalance() !== null && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FaInfoCircle className="text-blue-500" />
                <span className="text-sm font-medium text-blue-800">
                  رصيد العميل: {getSelectedCustomerBalance().toFixed(2)} ج.م
                </span>
              </div>
            </div>
          )}

          {/* عناصر الفاتورة */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">عناصر الفاتورة</h3>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded flex items-center gap-2"
              >
                <FaPlus /> إضافة عنصر
              </button>
            </div>

            {/* جدول العناصر */}
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-right text-sm font-medium text-gray-700">المنتج</th>
                    <th className="p-2 text-right text-sm font-medium text-gray-700">المتاح</th>
                    <th className="p-2 text-right text-sm font-medium text-gray-700">الكمية الأساسية</th>
                    <th className="p-2 text-right text-sm font-medium text-gray-700">الكمية الإجمالية</th>
                    <th className="p-2 text-right text-sm font-medium text-gray-700">السعر</th>
                    <th className="p-2 text-right text-sm font-medium text-gray-700">الإجمالي</th>
                    <th className="p-2 text-right text-sm font-medium text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const product = getSelectedProduct(item);
                    const stockDetail = product ? getStockDetail(product) : null;
                    const warning = stockWarnings[index];
                    
                    return (
                      <tr key={index} className="border-t">
                        {/* المنتج */}
                        <td className="p-2">
                          <div className="relative">
                            <input
                              type="text"
                              value={productSearches[index]}
                              onChange={(e) => {
                                const newProductSearches = [...productSearches];
                                newProductSearches[index] = e.target.value;
                                setProductSearches(newProductSearches);
                                
                                const newShowProductSuggestions = [...showProductSuggestions];
                                newShowProductSuggestions[index] = true;
                                setShowProductSuggestions(newShowProductSuggestions);
                              }}
                              onFocus={() => {
                                const newShowProductSuggestions = [...showProductSuggestions];
                                newShowProductSuggestions[index] = true;
                                setShowProductSuggestions(newShowProductSuggestions);
                              }}
                              onBlur={() => setTimeout(() => {
                                const newShowProductSuggestions = [...showProductSuggestions];
                                newShowProductSuggestions[index] = false;
                                setShowProductSuggestions(newShowProductSuggestions);
                              }, 200)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                              placeholder="البحث عن منتج..."
                            />
                            
                            {showProductSuggestions[index] && productSearches[index] && (
                              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-40 overflow-y-auto">
                                {searchProducts(productSearches[index]).map(p => (
                                  <div
                                    key={p.id}
                                    onClick={() => selectProduct(index, p)}
                                    className="px-2 py-1 hover:bg-gray-50 cursor-pointer text-sm"
                                  >
                                    <div className="font-medium">{p.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {p.unitsInMain > 0 ? `${p.unitsInMain} قطعة/كرتونة` : 'بدون تحويل'}
                                      {p.mainQuantity || 0} كرتونة متاحة
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* المخزون المتاح */}
                        <td className="p-2">
                          {product ? (
                            <div className="text-sm">
                              <div className="font-medium">{stockDetail?.display || 'غير محدد'}</div>
                              <div className="text-xs text-green-600">
                                {stockDetail?.totalDisplay || '0 قطعة'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>

                        {/* الكمية الأساسية */}
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.mainQuantity}
                            onChange={(e) => updateItem(index, 'mainQuantity', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                            min="0"
                            placeholder="0"
                          />
                        </td>

                        {/* الكمية الإجمالية */}
                        <td className="p-2">
                          <div className="space-y-1">
                            <input
                              type="number"
                              value={item.subQuantity}
                              onChange={(e) => updateItem(index, 'subQuantity', parseInt(e.target.value) || 0)}
                              className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 ${
                                warning ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                              }`}
                              min="0"
                              placeholder="0"
                            />
                            {product && product.unitsInMain > 0 && (
                              <div className="text-xs text-blue-600">
                                = {((item.mainQuantity || 0) * (product.unitsInMain || 0) + (item.subQuantity || 0))} قطعة
                              </div>
                            )}
                            {warning && (
                              <div className="text-xs text-red-600 flex items-center gap-1">
                                <FaExclamationTriangle />
                                {warning}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* السعر */}
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            value={item.subPrice || item.price}
                            onChange={(e) => {
                              if (item.subPrice) {
                                updateItem(index, 'subPrice', parseFloat(e.target.value) || 0);
                              } else {
                                updateItem(index, 'price', parseFloat(e.target.value) || 0);
                              }
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                            min="0"
                            placeholder="0.00"
                          />
                        </td>

                        {/* الإجمالي */}
                        <td className="p-2">
                          <div className="text-sm font-medium">
                            {calculateItemTotal(item).toFixed(2)} ج.م
                          </div>
                        </td>

                        {/* الإجراءات */}
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="px-2 py-1 text-red-500 hover:bg-red-50 rounded"
                            disabled={items.length === 1}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ملخص الفاتورة */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">المجموع الفرعي:</span>
              <span className="font-medium">{calculateSubTotal().toFixed(2)} ج.م</span>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">الخصم:</span>
              <span className="font-medium">{calculateDiscountAmount().toFixed(2)} ج.م</span>
            </div>
            
            <div className="flex justify-between items-center text-lg font-bold text-orange-600 pt-2 border-t">
              <span>الإجمالي:</span>
              <span>{calculateTotal().toFixed(2)} ج.م</span>
            </div>
          </div>

          {/* ملاحظات */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
              rows="3"
              placeholder="ملاحظات إضافية..."
            />
          </div>

          {/* أزرار الحفظ */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded flex items-center justify-center gap-2"
              disabled={Object.keys(validationErrors).length > 0}
            >
              <FaSave /> حفظ الفاتورة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SmartSalesInvoice;
