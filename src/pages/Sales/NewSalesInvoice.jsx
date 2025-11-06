// ======================================
// New Sales Invoice - فاتورة مبيعات جديدة (مُحدَّث ليشمل الخصم)
// ======================================

import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { FaSave, FaPrint, FaSearch, FaTrash, FaPercent, FaMoneyBillWave, FaInfoCircle, FaExclamationTriangle, FaUserPlus, FaTimes } from 'react-icons/fa';
import { printInvoiceDirectly } from '../../utils/printUtils';

const NewSalesInvoice = () => {
  const { customers, products, warehouses, addSalesInvoice, getCustomerBalance, addCustomer } = useData();
  const { showSuccess, showError } = useNotification();
  
  const [formData, setFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    paymentType: 'main',
    agentType: 'main',
    invoiceType: 'direct', // بيع مباشر، جملة، جملة الجملة
    notes: '',
    discountType: 'percentage', // 'percentage' or 'fixed'
    discountValue: 0
  });

  const [items, setItems] = useState([{
    productId: '',
    productName: '',
    price: 0, // السعر محدد تلقائياً بناءً على نوع الفاتورة
    quantity: 0,
    subQuantity: 0,
    discount: 0
  }]);

  // مراجع للبحث والحفظ
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [productSearches, setProductSearches] = useState(['']);
  const [showProductSuggestions, setShowProductSuggestions] = useState([false]);

  // حالات الأخطاء
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

  // ===== Quick Customer States =====
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [quickCustomerForm, setQuickCustomerForm] = useState({
    name: '',
    phone1: '',
    address: '',
    agentType: 'general'
  });
  const [quickCustomerLoading, setQuickCustomerLoading] = useState(false);

  // الحصول على رصيد العميل المحدد
  const getSelectedCustomerBalance = () => {
    if (!formData.customerId) return null;
    return getCustomerBalance(parseInt(formData.customerId));
  };

  // حساب الإجمالي قبل خصم العنصر
  const calculateItemTotalWithoutDiscount = (item) => {
    const mainTotal = (item.quantity || 0) * (item.price || 0);
    // لن نستخدم الكمية الفرعية مع نظام الشرائح الجديد
    // const subTotal = (item.subQuantity || 0) * (item.subPrice || 0);
    return mainTotal;
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

  const calculateTotal = () => {
    const subTotal = calculateSubTotal();
    const discountAmount = calculateDiscountAmount();
    return Math.max(0, subTotal - discountAmount);
  };

  const getPaymentTypeWarning = () => {
    if (formData.paymentType === 'main') return null;
    
    const balance = getSelectedCustomerBalance();
    if (balance !== null && balance < 0) {
      return 'تنبيه: رصيد العميل مدين!';
    }
    return null;
  };

  const paymentWarning = getPaymentTypeWarning();

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

  // تحديث أسعار المنتجات عند تغيير نوع الفاتورة
  useEffect(() => {
    if (formData.invoiceType) {
      updateAllItemPrices(formData.invoiceType);
    }
  }, [formData.invoiceType, products]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCustomerSearch = (value) => {
    setCustomerSearch(value);
    setShowCustomerSuggestions(value.trim().length > 0);
    setCustomerError(false);
  };

  const selectCustomer = (customer) => {
    setFormData({
      ...formData,
      customerId: customer.id
    });
    setCustomerSearch(customer.name);
    setShowCustomerSuggestions(false);
    setCustomerError(false);
  };

  const handleCustomerBlur = () => {
    setTimeout(() => {
      setShowCustomerSuggestions(false);
    }, 200);
  };

  const openQuickCustomerModal = () => {
    setShowQuickCustomerModal(true);
  };

  const closeQuickCustomerModal = () => {
    setShowQuickCustomerModal(false);
    setQuickCustomerForm({
      name: '',
      phone1: '',
      address: '',
      agentType: 'general'
    });
  };

  const handleQuickCustomerChange = (e) => {
    setQuickCustomerForm({
      ...quickCustomerForm,
      [e.target.name]: e.target.value
    });
  };

  const handleAddQuickCustomer = async () => {
    if (!quickCustomerForm.name.trim()) {
      showError('يرجى إدخال اسم العميل');
      return;
    }

    if (!quickCustomerForm.phone1.trim()) {
      showError('يرجى إدخال رقم الهاتف');
      return;
    }

    setQuickCustomerLoading(true);

    try {
      const newCustomer = addCustomer({
        name: quickCustomerForm.name.trim(),
        phone1: quickCustomerForm.phone1.trim(),
        phone2: '',
        address: quickCustomerForm.address.trim(),
        agentType: quickCustomerForm.agentType,
        balance: 0
      });

      showSuccess('تم إضافة العميل بنجاح!');
      closeQuickCustomerModal();

      // تحديد العميل الجديد تلقائياً
      setFormData({
        ...formData,
        customerId: newCustomer.id
      });
      setCustomerSearch(newCustomer.name);
      
    } catch (error) {
      showError('حدث خطأ في إضافة العميل');
    } finally {
      setQuickCustomerLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleProductSearch = (index, value) => {
    const newSearches = [...productSearches];
    newSearches[index] = value;
    setProductSearches(newSearches);

    const newShowSuggestions = [...showProductSuggestions];
    newShowSuggestions[index] = value.trim().length > 0;
    setShowProductSuggestions(newShowSuggestions);
  };

  // دالة التسعير التلقائي بناءً على نوع الفاتورة
  const getPriceByInvoiceType = (product, invoiceType) => {
    switch (invoiceType) {
      case 'direct':
        return parseFloat(product.directPrice) || 0;
      case 'wholesale':
        return parseFloat(product.wholesalePrice) || 0;
      case 'wholesale10':
        return parseFloat(product.wholesalePrice10) || 0;
      default:
        return parseFloat(product.directPrice) || 0;
    }
  };

  // دالة تحديث جميع أسعار المنتجات عند تغيير نوع الفاتورة
  const updateAllItemPrices = (invoiceType) => {
    const newItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        return {
          ...item,
          price: getPriceByInvoiceType(product, invoiceType)
        };
      }
      return item;
    });
    setItems(newItems);
  };

  const selectProduct = (index, product) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      productName: product.name,
      price: getPriceByInvoiceType(product, formData.invoiceType),
      quantity: 1, // افتراضي كمية 1
      subQuantity: 0,
      discount: 0
    };
    setItems(newItems);

    const newSearches = [...productSearches];
    newSearches[index] = product.name;
    setProductSearches(newSearches);

    const newShowSuggestions = [...showProductSuggestions];
    newShowSuggestions[index] = false;
    setShowProductSuggestions(newShowSuggestions);

    setTimeout(() => {
      quantityInputRefs.current[index]?.focus();
    }, 100);
  };

  const handleProductBlur = (index) => {
    setTimeout(() => {
      const newShowSuggestions = [...showProductSuggestions];
      newShowSuggestions[index] = false;
      setShowProductSuggestions(newShowSuggestions);
    }, 200);
  };

  const getFilteredProducts = (index) => {
    const search = productSearches[index] || '';
    return products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
    );
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        productName: '',
        price: 0,
        quantity: 0,
        subQuantity: 0,
        discount: 0
      }
    ]);
    setProductSearches([...productSearches, '']);
    setShowProductSuggestions([...showProductSuggestions, false]);

    setTimeout(() => {
      productInputRefs.current[items.length]?.focus();
    }, 100);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      
      const newSearches = productSearches.filter((_, i) => i !== index);
      setProductSearches(newSearches);
      
      const newShowSuggestions = showProductSuggestions.filter((_, i) => i !== index);
      setShowProductSuggestions(newShowSuggestions);
    }
  };

  const getAvailableQuantity = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    return product.mainQuantity || 0;
  };

  const getQuantityWarning = (index) => {
    const item = items[index];
    if (!item.productId) return null;
    
    const requestedQty = parseInt(item.quantity) || 0;
    const availableQty = getAvailableQuantity(item.productId);
    
    if (requestedQty > availableQty) {
      return (
        <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
          ⚠️ الكمية المطلوبة: {requestedQty}
          <br />
          المتوفر: {availableQty}
          <br />
          زائد بـ {requestedQty - availableQty}
        
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
      
      // التحقق من السعر
      if (item.productId && item.price <= 0) {
        errors[`price_${index}`] = 'يجب إدخال سعر صحيح';
      }
      
      // التحقق من الخصم
      if (item.discount < 0) {
        errors[`discount_${index}`] = 'الخصم لا يمكن أن يكون سالباً';
        newDiscountErrors[index] = true;
      } else {
        newDiscountErrors[index] = false;
      }

      // التحقق من الكمية المتوفرة
      if (item.productId) {
        const product = products.find(p => p.id === parseInt(item.productId));
        if (product) {
          const requestedQty = parseInt(item.quantity) || 0;
          const availableQty = getAvailableQuantity(item.productId);
          
          if (requestedQty > availableQty) {
            errors[`quantity_${index}`] = `الكمية المطلوبة (${requestedQty}) أكبر من المتوفر (${availableQty})`;
          }
        }
      }
    });
    
    setQuantityErrors(newQuantityErrors);
    setPriceErrors(newPriceErrors);
    setDiscountErrors(newDiscountErrors);
    setValidationErrors(errors);
    
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
      agentType: '',
      invoiceType: 'direct',
      notes: '',
      discountType: 'percentage',
      discountValue: 0
    });
    setItems([{ 
      productId: '', 
      productName: '',
      price: 0,
      quantity: 0, 
      subQuantity: 0,
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
            <div className="flex gap-2">
              <div className="relative flex-1">
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
              <button
                type="button"
                onClick={openQuickCustomerModal}
                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                title="إضافة عميل جديد سريع"
              >
                <FaUserPlus className="text-xs" />
                عميل جديد
              </button>
            </div>
            {showCustomerSuggestions && customerSearch.trim().length > 0 && filteredCustomers.length > 0 && (
              <div className="absolute z-[9999] w-full mt-1 bg-white border-2 border-blue-400 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="px-4 py-2.5 hover:bg-blue-100 cursor-pointer border-b last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-sm text-gray-800">{customer.name}</div>
                    <div className="text-xs text-gray-600">{customer.phone1}</div>
                  </div>
                ))}
              </div>
            )}
            {validationErrors.customer && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.customer}</p>
            )}
          </div>

          {/* التاريخ */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              التاريخ
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {validationErrors.date && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.date}</p>
            )}
          </div>

          {/* الوقت */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              الوقت
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* نوع الفاتورة */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              طريقة الدفع
            </label>
            <select
              name="paymentType"
              value={formData.paymentType}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="main">نقدي - حساب رئيسي</option>
              <option value="cash">نقدي</option>
              <option value="credit">آجل</option>
            </select>
            {paymentWarning && (
              <p className="mt-1 text-xs text-orange-600">{paymentWarning}</p>
            )}
          </div>
        </div>

        {/* الصف الثاني: نوع الفاتورة الشريحة التسعيرية */}
        <div className="grid grid-cols-4 gap-3 mb-4 pb-4 border-b">
          {/* نوع الفاتورة (التوكيل) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              نوع الفاتورة
            </label>
            <select
              name="agentType"
              value={formData.agentType}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">اختر نوع الفاتورة</option>
              <option value="main">فاتورة رئيسية</option>
              <option value="agent1">وكيل 1</option>
              <option value="agent2">وكيل 2</option>
            </select>
          </div>

          {/* الشريحة التسعيرية */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              الشريحة التسعيرية
            </label>
            <select
              name="invoiceType"
              value={formData.invoiceType}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="direct">💚 بيع مباشر</option>
              <option value="wholesale">🧡 جملة</option>
              <option value="wholesale10">💜 جملة الجملة</option>
            </select>
          </div>

          {/* المبلغ الإجمالي */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              المبلغ الإجمالي
            </label>
            <div className="w-full px-2 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-md text-gray-700">
              {calculateTotal().toFixed(2)} ج.م
            </div>
          </div>

          {/* الرصيد */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              رصيد العميل
            </label>
            <div className="w-full px-2 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-md text-gray-700">
              {getSelectedCustomerBalance() !== null ? (
                <span className={getSelectedCustomerBalance() < 0 ? 'text-red-600' : 'text-green-600'}>
                  {getSelectedCustomerBalance().toFixed(2)} ج.م
                </span>
              ) : 'غير محدد'}
            </div>
          </div>
        </div>

        {/* جدول المنتجات */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 py-2 text-right font-medium text-gray-700">#</th>
                <th className="px-2 py-2 text-right font-medium text-gray-700">المنتج</th>
                <th className="px-2 py-2 text-right font-medium text-gray-700">الكمية</th>
                <th className="px-2 py-2 text-right font-medium text-gray-700">السعر</th>
                <th className="px-2 py-2 text-right font-medium text-gray-700">الخصم</th>
                <th className="px-2 py-2 text-right font-medium text-gray-700">الإجمالي</th>
                <th className="px-2 py-2 text-right font-medium text-gray-700">حذف</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="px-2 py-2 text-gray-600">{index + 1}</td>
                  
                  {/* المنتج */}
                  <td className="px-2 py-2" style={{ minWidth: '200px' }}>
                    <div className="relative">
                      <input
                        ref={(el) => (productInputRefs.current[index] = el)}
                        type="text"
                        value={productSearches[index]}
                        onChange={(e) => handleProductSearch(index, e.target.value)}
                        onBlur={() => handleProductBlur(index)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="ابحث عن المنتج..."
                      />
                      <FaSearch className="absolute left-2 top-2.5 text-gray-400 text-xs" />
                      
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
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-700">
                                      {getPriceByInvoiceType(product, formData.invoiceType).toFixed(2)} ج.م
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      متوفر: {getAvailableQuantity(product.id)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {validationErrors[`product_${index}`] && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors[`product_${index}`]}</p>
                    )}
                  </td>
                  
                  {/* الكمية الأساسية */}
                  <td className="px-2 py-2">
                    <input
                      ref={(el) => (quantityInputRefs.current[index] = el)}
                      type="number"
                      name={`quantity-${index}`}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 ${
                        quantityErrors[index] || validationErrors[`quantity_${index}`] 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      min="0"
                      placeholder="0"
                    />
                    {getQuantityWarning(index)}
                    {validationErrors[`quantity_${index}`] && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors[`quantity_${index}`]}</p>
                    )}
                  </td>
                  
                  {/* السعر */}
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                      className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 ${
                        priceErrors[index] || validationErrors[`price_${index}`] 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      min="0"
                      step="0.01"
                    />
                    
                    {/* عرض نوع الفاتورة الحالي */}
                    {item.productId && (
                      <div className="text-xs text-gray-500 mt-1">
                        {formData.invoiceType === 'direct' && '💚 بيع مباشر'}
                        {formData.invoiceType === 'wholesale' && '🧡 جملة'}
                        {formData.invoiceType === 'wholesale10' && '💜 جملة الجملة'}
                      </div>
                    )}
                  </td>
                  
                  {/* الخصم */}
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={item.discount}
                      onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                      className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 ${
                        discountErrors[index] || validationErrors[`discount_${index}`] 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      min="0"
                      step="0.01"
                    />
                  </td>
                  
                  {/* الإجمالي */}
                  <td className="px-2 py-2">
                    <div className="text-sm font-medium text-gray-700">
                      {calculateItemTotal(item).toFixed(2)} ج.م
                    </div>
                  </td>
                  
                  {/* حذف */}
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="حذف العنصر"
                      disabled={items.length === 1}
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* أزرار إضافة العنصر */}
        <div className="flex justify-center mb-4">
          <button
            type="button"
            onClick={addItem}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaPlus className="text-sm" />
            إضافة منتج جديد
          </button>
        </div>

        {/* الصف الأخير: الخصم والإجمالي */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* ملاحظات */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              ملاحظات
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="أي ملاحظات إضافية..."
            />
          </div>

          {/* إجمالي الفاتورة */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>المجموع الجزئي:</span>
                <span>{calculateSubTotal().toFixed(2)} ج.م</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <FaPercent className="text-gray-500" />
                  <span>الخصم:</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                    className="px-2 py-1 text-xs border border-gray-300 rounded"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">ج.م</option>
                  </select>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              {validationErrors.discount && (
                <p className="text-xs text-red-600">{validationErrors.discount}</p>
              )}
              
              <div className="flex justify-between text-sm font-medium text-red-600">
                <span>قيمة الخصم:</span>
                <span>{calculateDiscountAmount().toFixed(2)} ج.م</span>
              </div>
              
              <hr className="my-2" />
              
              <div className="flex justify-between text-lg font-bold">
                <span>الإجمالي:</span>
                <span>{calculateTotal().toFixed(2)} ج.م</span>
              </div>
            </div>
          </div>
        </div>

        {/* أزرار الحفظ والطباعة */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FaPrint />
            حفظ وطباعة
          </button>
          
          <button
            type="button"
            onClick={(e) => handleSubmit(e)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaSave />
            حفظ الفاتورة
          </button>
        </div>
      </div>

      {/* نافذة إضافة عميل سريع */}
      {showQuickCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">إضافة عميل جديد سريع</h3>
              <button
                onClick={closeQuickCustomerModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleAddQuickCustomer(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم العميل *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={quickCustomerForm.name}
                    onChange={handleQuickCustomerChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="اسم العميل"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    name="phone1"
                    value={quickCustomerForm.phone1}
                    onChange={handleQuickCustomerChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="رقم الهاتف"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العنوان
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={quickCustomerForm.address}
                    onChange={handleQuickCustomerChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="العنوان"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نوع العميل
                  </label>
                  <select
                    name="agentType"
                    value={quickCustomerForm.agentType}
                    onChange={handleQuickCustomerChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="general">عادي</option>
                    <option value="wholesale">جملة</option>
                    <option value="retail">قطاعي</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={closeQuickCustomerModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={quickCustomerLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {quickCustomerLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري الإضافة...
                    </>
                  ) : (
                    <>
                      <FaUserPlus className="text-sm" />
                      إضافة العميل
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSalesInvoice;