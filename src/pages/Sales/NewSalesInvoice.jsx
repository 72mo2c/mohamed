// ======================================
// New Sales Invoice - فاتورة مبيعات جديدة (مُحدَّث ليشمل الخصم)
// ======================================

import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { FaSave, FaPrint, FaSearch, FaTrash, FaPercent, FaMoneyBillWave, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { printInvoiceDirectly } from '../../utils/printUtils';

const NewSalesInvoice = () => {
  const { customers, products, warehouses, addSalesInvoice, getCustomerBalance } = useData();
  const { showSuccess, showError } = useNotification();
  
  const [formData, setFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    paymentType: 'main',
    agentType: 'main',
    notes: '',
    discountType: 'percentage', // 'percentage' or 'fixed'
    discountValue: 0
  });

  const [items, setItems] = useState([{
    productId: '',
    productName: '',
    quantity: 0,
    subQuantity: 0,
    price: 0,
    subPrice: 0,
    discount: 0
  }]);

  // البحث في العملاء والمنتجات
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [productSearches, setProductSearches] = useState(['']);
  const [showProductSuggestions, setShowProductSuggestions] = useState([false]);
  
  // حالات الخطأ
  const [customerError, setCustomerError] = useState(false);
  const [productErrors, setProductErrors] = useState([false]);
  const [quantityErrors, setQuantityErrors] = useState([false]);
  const [priceErrors, setPriceErrors] = useState([false]);
  const [discountErrors, setDiscountErrors] = useState([false]);
  const [validationErrors, setValidationErrors] = useState({});

  // مراجع للتركيز التلقائي
  const customerInputRef = useRef(null);
  const productInputRefs = useRef([]);
  const quantityInputRefs = useRef([]);

  // الحصول على رصيد العميل المحدد
  const getSelectedCustomerBalance = () => {
    if (!formData.customerId) return null;
    return getCustomerBalance(parseInt(formData.customerId));
  };

  // حساب الإجمالي قبل خصم العنصر
  const calculateItemTotalWithoutDiscount = (item) => {
    const mainTotal = (item.quantity || 0) * (item.price || 0);
    const subTotal = (item.subQuantity || 0) * (item.subPrice || 0);
    return mainTotal + subTotal;
  };

  // حساب إجمالي العنصر بعد الخصم
  const calculateItemTotal = (item) => {
    const totalWithoutDiscount = calculateItemTotalWithoutDiscount(item);
    const itemDiscount = item.discount || 0;
    return Math.max(0, totalWithoutDiscount - itemDiscount);
  };

  const calculateSubTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  // حساب قيمة الخصم
  const calculateDiscountAmount = () => {
    const subTotal = calculateSubTotal();
    if (formData.discountType === 'percentage') {
      return (subTotal * (formData.discountValue / 100));
    } else {
      return parseFloat(formData.discountValue) || 0;
    }
  };

  // حساب الإجمالي بعد الخصم
  const calculateTotal = () => {
    const subTotal = calculateSubTotal();
    const discountAmount = calculateDiscountAmount();
    return Math.max(0, subTotal - discountAmount);
  };

  // الحصول على تحذيرات نوع الدفع
  const getPaymentTypeWarning = () => {
    // تم إخفاء التحذيرات المالية لحماية المعلومات
    return null;
  };

  const paymentWarning = getPaymentTypeWarning();

  // التركيز التلقائي عند التحميل
  useEffect(() => {
    customerInputRef.current?.focus();
  }, []);

  // معالجة اختصارات الكيبورد
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S للحفظ
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSubmit(e);
      }
      // Enter لإضافة صف جديد (عند التركيز في حقل الكمية الأخير)
      if (e.key === 'Enter' && e.target.name?.startsWith('quantity-')) {
        const index = parseInt(e.target.name.split('-')[1]);
        if (index === items.length - 1) {
          e.preventDefault();
          addItem();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // البحث في العملاء
  const handleCustomerSearch = (value) => {
    setCustomerSearch(value);
    // إظهار القائمة فقط عند وجود نص
    setShowCustomerSuggestions(value.trim().length > 0);
  };

  const selectCustomer = (customer) => {
    setFormData({ 
      ...formData, 
      customerId: customer.id,
      agentType: customer.agentType || 'main' // تحديد الوكيل تلقائياً من بيانات العميل
    });
    setCustomerSearch(customer.name);
    setShowCustomerSuggestions(false);
  };
  
  // إخفاء قائمة العملاء عند الخروج من الحقل
  const handleCustomerBlur = () => {
    setTimeout(() => {
      setShowCustomerSuggestions(false);
    }, 200);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // البحث في المنتجات
  const handleProductSearch = (index, value) => {
    const newSearches = [...productSearches];
    newSearches[index] = value;
    setProductSearches(newSearches);

    // إظهار القائمة فقط عند وجود نص
    const newShowSuggestions = [...showProductSuggestions];
    newShowSuggestions[index] = value.trim().length > 0;
    setShowProductSuggestions(newShowSuggestions);
  };

  const selectProduct = (index, product) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      productName: product.name,
      mainPrice: parseFloat(product.price) || 0,
      subPrice: parseFloat(product.subPrice) || 0,
      discount: 0
    };
    setItems(newItems);

    const newSearches = [...productSearches];
    newSearches[index] = product.name;
    setProductSearches(newSearches);

    const newShowSuggestions = [...showProductSuggestions];
    newShowSuggestions[index] = false;
    setShowProductSuggestions(newShowSuggestions);

    // التركيز على حقل الكمية
    setTimeout(() => {
      quantityInputRefs.current[index]?.focus();
    }, 100);
  };
  
  // إخفاء قائمة المنتجات عند الخروج من الحقل
  const handleProductBlur = (index) => {
    setTimeout(() => {
      const newShowSuggestions = [...showProductSuggestions];
      newShowSuggestions[index] = false;
      setShowProductSuggestions(newShowSuggestions);
    }, 200);
  };

  const getFilteredProducts = (index) => {
    const searchTerm = productSearches[index] || '';
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
    
    // التحقق الفوري من الكميات والأسعار والخصم
    if (field === 'quantity' || field === 'subQuantity') {
      const newQuantityErrors = [...quantityErrors];
      if (field === 'quantity') {
        newQuantityErrors[index] = value < 0;
      }
      setQuantityErrors(newQuantityErrors);
    }
    
    if (field === 'price' || field === 'subPrice') {
      const newPriceErrors = [...priceErrors];
      if (field === 'price') {
        newPriceErrors[index] = value < 0;
      }
      setPriceErrors(newPriceErrors);
    }

    if (field === 'discount') {
      const newDiscountErrors = [...discountErrors];
      newDiscountErrors[index] = value < 0;
      setDiscountErrors(newDiscountErrors);
    }
  };

  const addItem = () => {
    setItems([...items, { 
      productId: '', 
      productName: '',
      quantity: 0, 
      subQuantity: 0,
      mainPrice: 0,
      subPrice: 0,
      discount: 0
    }]);
    setProductSearches([...productSearches, '']);
    setShowProductSuggestions([...showProductSuggestions, false]);
    setProductErrors([...productErrors, false]);
    setQuantityErrors([...quantityErrors, false]);
    setPriceErrors([...priceErrors, false]);
    setDiscountErrors([...discountErrors, false]);

    // التركيز على حقل المنتج الجديد
    setTimeout(() => {
      const lastIndex = items.length;
      productInputRefs.current[lastIndex]?.focus();
    }, 100);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
      setProductSearches(productSearches.filter((_, i) => i !== index));
      setShowProductSuggestions(showProductSuggestions.filter((_, i) => i !== index));
      setProductErrors(productErrors.filter((_, i) => i !== index));
      setQuantityErrors(quantityErrors.filter((_, i) => i !== index));
      setPriceErrors(priceErrors.filter((_, i) => i !== index));
      setDiscountErrors(discountErrors.filter((_, i) => i !== index));
    }
  };

  // الحصول على المخزون المتاح للمنتج
  const getAvailableQuantity = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return { mainQuantity: 0, subQuantity: 0, total: 0 };
    
    return {
      mainQuantity: product.mainQuantity || 0,
      subQuantity: product.subQuantity || 0,
      total: (product.mainQuantity || 0) + (product.subQuantity || 0)
    };
  };

  // عرض تحذير عن الكمية المطلوبة
  const getQuantityWarning = (index) => {
    const item = items[index];
    if (!item.productId) return null;
    
    const requestedMainQty = item.quantity || 0;
    const requestedSubQty = item.subQuantity || 0;
    const requestedTotal = requestedMainQty + requestedSubQty;
    
    const availableQuantity = getAvailableQuantity(item.productId);
    const availableMainQty = availableQuantity.mainQuantity;
    const availableSubQty = availableQuantity.subQuantity;
    const availableTotal = availableQuantity.total;
    
    if (requestedTotal > availableTotal) {
      return (
        <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
          ⚠️ الكمية المطلوبة: {requestedMainQty} أساسي + {requestedSubQty} فرعي = {requestedTotal}، المتوفر: {availableMainQty} أساسي + {availableSubQty} فرعي
        </div>
      );
    }
    
    return null;
  };

  // التحقق الشامل من البيانات
  const validateForm = () => {
    const errors = {};
    
    // التحقق من العميل
    if (!formData.customerId) {
      errors.customer = 'يجب اختيار العميل';
    }
    
    // التحقق من التاريخ
    if (!formData.date) {
      errors.date = 'يجب إدخال تاريخ الفاتورة';
    }
    
    // التحقق من الخصم
    if (formData.discountValue < 0) {
      errors.discount = 'قيمة الخصم لا يمكن أن تكون سالبة';
    }
    
    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      errors.discount = 'نسبة الخصم لا يمكن أن تزيد عن 100%';
    }
    
    const discountAmount = calculateDiscountAmount();
    if (discountAmount > calculateSubTotal()) {
      errors.discount = 'قيمة الخصم لا يمكن أن تزيد عن المجموع الكلي';
    }
    
    // التحقق من المنتجات
    const newQuantityErrors = [];
    const newPriceErrors = [];
    const newDiscountErrors = [];
    
    items.forEach((item, index) => {
      // التحقق من اختيار المنتج
      if (!item.productId) {
        errors[`product_${index}`] = 'يجب اختيار المنتج';
      }
      
      // التحقق من الكمية
      if (item.quantity < 0) {
        errors[`quantity_${index}`] = 'الكمية الأساسية لا يمكن أن تكون سالبة';
        newQuantityErrors[index] = true;
      } else if (item.quantity === 0 && item.subQuantity === 0) {
        errors[`quantity_${index}`] = 'يجب إدخال كمية أساسية أو فرعية';
        newQuantityErrors[index] = true;
      } else {
        newQuantityErrors[index] = false;
      }
      
      // التحقق من السعر
      if (item.price < 0) {
        errors[`price_${index}`] = 'السعر الأساسي لا يمكن أن يكون سالباً';
        newPriceErrors[index] = true;
      } else if (item.price === 0 && item.quantity > 0) {
        errors[`price_${index}`] = 'يجب إدخال سعر أساسي للمنتج';
        newPriceErrors[index] = true;
      } else {
        newPriceErrors[index] = false;
      }
      
      // التحقق من السعر الفرعي
      if (item.subPrice < 0) {
        errors[`subPrice_${index}`] = 'السعر الفرعي لا يمكن أن يكون سالباً';
      } else if (item.subPrice === 0 && item.subQuantity > 0) {
        errors[`subPrice_${index}`] = 'يجب إدخال سعر فرعي عند وجود كمية فرعية';
      }

      // التحقق من خصم العنصر
      if (item.discount < 0) {
        errors[`discount_${index}`] = 'خصم العنصر لا يمكن أن يكون سالباً';
        newDiscountErrors[index] = true;
      } else if (item.discount > calculateItemTotalWithoutDiscount(item)) {
        errors[`discount_${index}`] = 'خصم العنصر لا يمكن أن يزيد عن إجماليه';
        newDiscountErrors[index] = true;
      } else {
        newDiscountErrors[index] = false;
      }

      // التحقق من توفر المخزون
      const product = products.find(p => p.id === parseInt(item.productId));
      if (product) {
        const requestedMainQty = item.quantity || 0;
        const requestedSubQty = item.subQuantity || 0;
        const totalRequested = requestedMainQty + requestedSubQty;
        
        const availableMainQty = product.mainQuantity || 0;
        const availableSubQty = product.subQuantity || 0;
        const totalAvailable = availableMainQty + availableSubQty;
        
        if (totalRequested > totalAvailable) {
          errors[`stock_${index}`] = `الكمية المطلوبة غير متوفرة. المتوفر: أساسي ${availableMainQty} + فرعي ${availableSubQty} = ${totalAvailable}`;
        }
      }
    });
    
    setQuantityErrors(newQuantityErrors);
    setPriceErrors(newPriceErrors);
    setDiscountErrors(newDiscountErrors);
    setValidationErrors(errors);
    
    // التحقق من المجموع الكلي
    const total = calculateTotal();
    if (total <= 0) {
      errors.total = 'المجموع الكلي يجب أن يكون أكبر من صفر';
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e, shouldPrint = false) => {
    if (e) e.preventDefault();

    // التحقق الشامل من البيانات
    if (!validateForm()) {
      showError('يرجى تصحيح الأخطاء قبل حفظ الفاتورة');
      
      // عرض أول خطأ
      const firstError = Object.values(validationErrors)[0];
      if (firstError) {
        setTimeout(() => showError(firstError), 500);
      }
      return;
    }

    try {
      // تحويل البيانات للصيغة المتوافقة مع النظام مع الحفاظ على البيانات الفرعية
      const convertedItems = items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity || 0,
        subQuantity: item.subQuantity || 0,
        mainPrice: item.price || 0,
        subPrice: item.subPrice || 0,
        discount: item.discount || 0,
        total: calculateItemTotal(item)
      }));

      const discountAmount = calculateDiscountAmount();
      
      const invoiceData = {
        ...formData,
        date: `${formData.date}T${formData.time}:00`,
        items: convertedItems,
        subtotal: calculateSubTotal(),
        discountAmount: discountAmount,
        total: calculateTotal(),
        status: 'completed'
      };

      const newInvoice = addSalesInvoice(invoiceData);
      showSuccess(`تم حفظ فاتورة المبيعات بنجاح! الإجمالي: ${calculateTotal().toFixed(2)} ج.م`);

      if (shouldPrint) {
        // الطباعة المباشرة
        const customer = customers.find(c => c.id === parseInt(formData.customerId));
        printInvoiceDirectly({
          formData: newInvoice,
          items: newInvoice.items,
          subtotal: newInvoice.subtotal,
          discountAmount: newInvoice.discountAmount,
          total: newInvoice.total,
          customer,
          customers,
          products,
          warehouses
        }, 'sales');
      }
      resetForm();
    } catch (error) {
      // عرض رسالة الخطأ الفعلية للمستخدم
      showError(error.message || 'حدث خطأ في حفظ الفاتورة');
    }
  };
  
  const resetForm = () => {
    setFormData({
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      paymentType: 'main',
      agentType: 'main',
      notes: '',
      discountType: 'percentage',
      discountValue: 0
    });
    setItems([{ 
      productId: '', 
      productName: '',
      quantity: 0, 
      subQuantity: 0,
      mainPrice: 0,
      subPrice: 0,
      discount: 0
    }]);
    setCustomerSearch('');
    setProductSearches(['']);
    setShowCustomerSuggestions(false);
    setShowProductSuggestions([false]);
    setCustomerError(false);
    setProductErrors([false]);
    setQuantityErrors([false]);
    setPriceErrors([false]);
    setDiscountErrors([false]);
    setValidationErrors({});
    customerInputRef.current?.focus();
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* البطاقة الرئيسية */}
      <div className="bg-white rounded-lg shadow-md p-4">
        {/* الصف العلوي: معلومات الفاتورة */}
        <div className="grid grid-cols-4 gap-3 mb-4 pb-4 border-b">
          {/* العميل */}
          <div className="relative">
            <div className="relative">
              <input
                ref={customerInputRef}
                type="text"
                value={customerSearch}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                onBlur={handleCustomerBlur}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ابحث عن العميل..."
              />
              <FaSearch className="absolute left-2 top-2.5 text-gray-400 text-xs" />
            </div>
            {showCustomerSuggestions && customerSearch.trim().length > 0 && filteredCustomers.length > 0 && (
              <div className="absolute z-[9999] w-full mt-1 bg-white border-2 border-blue-400 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="px-4 py-2.5 hover:bg-blue-100 cursor-pointer border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-gray-800">{customer.name}</span>
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{customer.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* نوع الفاتورة */}
          <div>
            <select
              name="paymentType"
              value={formData.paymentType}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="main">اختر نوع الفاتورة</option>
              <option value="cash">نقدي</option>
              <option value="deferred">آجل</option>
              <option value="partial">جزئي</option>
            </select>
          </div>



          {/* تحذيرات نوع الدفع */}
          {paymentWarning && (
            <div className={`p-4 rounded-lg mb-4 ${
              paymentWarning.type === 'error' ? 'bg-red-100 border border-red-300 text-red-700' :
              paymentWarning.type === 'warning' ? 'bg-yellow-100 border border-yellow-300 text-yellow-700' :
              'bg-blue-100 border border-blue-300 text-blue-700'
            }`}>
              <div className="flex items-center gap-2">
                {paymentWarning.type === 'error' && <FaExclamationTriangle />}
                {paymentWarning.type === 'warning' && <FaExclamationTriangle />}
                {paymentWarning.type === 'info' && <FaInfoCircle />}
                <span className="text-sm font-medium">{paymentWarning.message}</span>
              </div>
            </div>
          )}

          {/* الوكيل */}
          <div>
            <select
              name="agentType"
              value={formData.agentType}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="main">اختر وكيل</option>
              <option value="none">بدون</option>
              <option value="invoice">فاتورة</option>
              <option value="carton">كرتونة</option>
            </select>
          </div>

          {/* التاريخ والوقت */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* جدول المنتجات */}
        <div className="mb-4 relative">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700">المنتج</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-20">كمية أساسية</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-20">كمية فرعية</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-24">سعر أساسي</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-24">سعر فرعي</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-24">الخصم</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-24">الإجمالي</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-16">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {/* المنتج */}
                    <td className="px-2 py-2 static">
                      <div className="relative z-[10]">
                        <input
                          ref={(el) => (productInputRefs.current[index] = el)}
                          type="text"
                          value={productSearches[index] || ''}
                          onChange={(e) => handleProductSearch(index, e.target.value)}
                          onBlur={() => handleProductBlur(index)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="ابحث عن المنتج..."
                        />
                        <FaSearch className="absolute left-2 top-2.5 text-gray-400 text-xs" />
                      </div>
                      {showProductSuggestions[index] && productSearches[index]?.trim().length > 0 && getFilteredProducts(index).length > 0 && (
                        <div className="absolute z-[9999] left-0 w-full mt-1 bg-white border-2 border-blue-400 rounded-lg shadow-2xl max-h-64 overflow-y-auto">
                          {getFilteredProducts(index).map((product) => {
                            const warehouse = warehouses.find(w => w.id === product.warehouseId);
                            return (
                              <div
                                key={product.id}
                                onClick={() => selectProduct(index, product)}
                                className="px-4 py-2.5 hover:bg-blue-100 cursor-pointer border-b last:border-b-0 transition-colors"
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex-1">
                                    <span className="font-semibold text-sm text-gray-800">{product.name}</span>
                                    <span className="text-xs text-gray-600 mr-2">({warehouse?.name || 'غير محدد'} - {product.category})</span>
                                  </div>
                                  <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                                    أساسي: {product.mainQuantity || 0}, فرعي: {product.subQuantity || 0}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {/* رسالة تحذير المخزون */}
                      {getQuantityWarning(index)}
                    </td>

                    {/* الكمية الأساسية */}
                    <td className="px-2 py-2">
                      <input
                        ref={(el) => (quantityInputRefs.current[index] = el)}
                        type="number"
                        name={`quantity-${index}`}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className={`w-full px-2 py-1.5 text-sm text-center border rounded-md focus:ring-2 focus:ring-blue-500 ${
                          quantityErrors[index] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        min="0"
                      />
                    </td>

                    {/* الكمية الفرعية */}
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={item.subQuantity}
                        onChange={(e) => handleItemChange(index, 'subQuantity', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </td>

                    {/* السعر الأساسي */}
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        className={`w-full px-2 py-1.5 text-sm text-center border rounded-md focus:ring-2 focus:ring-blue-500 ${
                          priceErrors[index] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        min="0"
                      />
                    </td>

                    {/* السعر الفرعي */}
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.subPrice}
                        onChange={(e) => handleItemChange(index, 'subPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </td>
                    {/* الخصم  */}
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                      className={`w-full px-2 py-1.5 text-sm text-center border rounded-md focus:ring-2 focus:ring-blue-500 ${
                        discountErrors[index] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      min="0"
                    />
                  </td>

                    {/* الإجمالي */}
                    <td className="px-2 py-2 text-center">
                      <span className="font-semibold text-blue-600">
                        {calculateItemTotal(item).toFixed(2)}
                      </span>
                    </td>

                    {/* حذف */}
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* زر إضافة منتج */}
        <button
          type="button"
          onClick={addItem}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors text-sm font-medium"
        >
          + إضافة منتج جديد (Enter)
        </button>

        {/* الجزء السفلي */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 items-start">
            {/* ملاحظات */}
            <div className="col-span-2">
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل ملاحظات إضافية..."
              />
            </div>

            {/* الخصم والمجموع */}
            <div className="space-y-3">
              {/* قسم الخصم */}
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <FaPercent className="text-yellow-600" />
                  <span className="text-sm font-semibold text-gray-700">الخصم</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">نسبة مئوية %</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step={formData.discountType === 'percentage' ? '0.1' : '0.01'}
                    placeholder={formData.discountType === 'percentage' ? '0.0%' : '0.00'}
                  />
                </div>
                {formData.discountValue > 0 && (
                  <div className="text-xs text-gray-600 text-center">
                    قيمة الخصم: {calculateDiscountAmount().toFixed(2)} ج.م
                  </div>
                )}
              </div>

              {/* المجموع */}
              <div className="w-full bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">المجموع الفرعي:</span>
                    <span className="text-sm font-medium text-gray-600">{calculateSubTotal().toFixed(2)} ج.م</span>
                  </div>
                  
                  {formData.discountValue > 0 && (
                    <div className="flex justify-between items-center pt-1 border-t border-blue-200">
                      <span className="text-sm font-semibold text-gray-700">الخصم:</span>
                      <span className="text-sm font-medium text-red-600">-{calculateDiscountAmount().toFixed(2)} ج.م</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-sm font-semibold text-gray-700">المجموع الكلي:</span>
                    <span className="text-lg font-bold text-blue-700">{calculateTotal().toFixed(2)} ج.م</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-center mt-2">
                  عدد المنتجات: {items.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* الأزرار */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              title="إعادة تعيين الفاتورة بالكامل"
            >
              <FaTrash /> إعادة تعيين
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <FaSave /> حفظ الفاتورة
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <FaPrint /> حفظ وطباعة
            </button>
          </div>
        </div>

        {/* اختصارات الكيبورد */}
        <div className="mt-4 pt-3 border-t text-xs text-gray-500 text-center">
          <span className="inline-block mx-2">💡 اختصارات: </span>
          <span className="inline-block mx-2">Ctrl+S = حفظ</span>
          <span className="inline-block mx-2">Enter = صف جديد</span>
          <span className="inline-block mx-2">Tab = التنقل</span>
        </div>
      </div>
    </div>
  );
};

export default NewSalesInvoice;