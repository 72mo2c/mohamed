// ======================================
// New Sales Invoice - فاتورة مبيعات جديدة 
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
    directPrice: 0,
    wholesalePrice: 0,
    wholesalePrice10: 0,
    price: 0, // السعر الحالي حسب نوع الشريحة العام
    quantity: 0,
    subQuantity: 0,
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
      agentType: customer.agentType || '' // تحديد الوكيل تلقائياً من بيانات العميل
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

  // ===== دوال العميل السريع =====
  // فتح modal إضافة العميل السريع
  const openQuickCustomerModal = () => {
    setQuickCustomerForm({
      name: '',
      phone1: '',
      address: '',
      agentType: 'general'
    });
    setShowQuickCustomerModal(true);
  };

  // إغلاق modal العميل السريع
  const closeQuickCustomerModal = () => {
    setShowQuickCustomerModal(false);
    setQuickCustomerLoading(false);
  };

  // تحديث بيانات نموذج العميل السريع
  const handleQuickCustomerChange = (e) => {
    setQuickCustomerForm({
      ...quickCustomerForm,
      [e.target.name]: e.target.value
    });
  };

  // إضافة عميل سريع جديد
  const handleAddQuickCustomer = async () => {
    if (!quickCustomerForm.name.trim() || !quickCustomerForm.phone1.trim()) {
      showError('يجب إدخال الاسم ورقم الهاتف');
      return;
    }

    setQuickCustomerLoading(true);

    try {
      // إضافة العميل الجديد
      const newCustomer = addCustomer({
        ...quickCustomerForm,
        createdAt: new Date().toISOString(),
        status: 'active'
      });

      showSuccess(`تم إضافة العميل "${newCustomer.name}" بنجاح`);
      
      // اختيار العميل الجديد فوراً في الفاتورة
      setFormData({ 
        ...formData, 
        customerId: newCustomer.id,
        agentType: newCustomer.agentType || ''
      });
      
      // تحديث نص البحث ليعكس اسم العميل الجديد
      setCustomerSearch(newCustomer.name);
      
      // إغلاق المودال
      closeQuickCustomerModal();

    } catch (error) {
      showError('حدث خطأ في إضافة العميل');
    } finally {
      setQuickCustomerLoading(false);
    }
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
    
    // تحديد السعر حسب نوع الشريحة العام المحدد
    const currentInvoiceType = formData.invoiceType || 'direct';
    let appliedPrice = parseFloat(product.directPrice) || 0; // افتراضي: بيع مباشر
    
    switch(currentInvoiceType) {
      case 'wholesale':
        appliedPrice = parseFloat(product.wholesalePrice) || 0;
        break;
      case 'wholesale10':
        appliedPrice = parseFloat(product.wholesalePrice10) || 0;
        break;
      default:
        appliedPrice = parseFloat(product.directPrice) || 0;
    }
    
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      productName: product.name,
      directPrice: parseFloat(product.directPrice) || 0,
      wholesalePrice: parseFloat(product.wholesalePrice) || 0,
      wholesalePrice10: parseFloat(product.wholesalePrice10) || 0,
      price: appliedPrice, // السعر المطبق حسب نوع الشريحة العام
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
    
    // تحديث نوع الشريحة العام وتطبيق السعر على جميع المنتجات
    if (field === 'invoiceType') {
      setFormData(prev => ({ ...prev, invoiceType: value }));
      
      // تطبيق السعر الجديد على جميع المنتجات
      newItems.forEach((item, itemIndex) => {
        if (item.productId) {
          switch(value) {
            case 'wholesale':
              newItems[itemIndex].price = parseFloat(item.wholesalePrice) || 0;
              break;
            case 'wholesale10':
              newItems[itemIndex].price = parseFloat(item.wholesalePrice10) || 0;
              break;
            default:
              newItems[itemIndex].price = parseFloat(item.directPrice) || 0;
          }
        }
      });
    } else {
      newItems[index][field] = value;
    }
    
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
      directPrice: 0,
      wholesalePrice: 0,
      wholesalePrice10: 0,
      price: 0,
      quantity: 0, 
      subQuantity: 0,
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
    if (!product) return 0;
    
    // إرجاع الكمية الأساسية فقط (نظام الشرائح لا يستخدم الكمية الفرعية)
    return product.mainQuantity || 0;
  };

  // عرض تحذير عن الكمية المطلوبة
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
      
      // التحقق من السعر المختار
      if (item.productId && item.price <= 0) {
        errors[`price_${index}`] = 'يجب إدخال سعر للشريحة المختارة';
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
        const requestedQty = parseInt(item.quantity) || 0;
        const availableQty = product.mainQuantity || 0;
        
        if (requestedQty > availableQty) {
          errors[`stock_${index}`] = `الكمية المطلوبة (${requestedQty}) تتجاوز المتوفر (${availableQty})`;
          newQuantityErrors[index] = true;
        } else {
          newQuantityErrors[index] = false;
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
      // تحويل البيانات للصيغة المتوافقة مع النظام
      const convertedItems = items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity || 0,
        subQuantity: 0, // لم يعد يستخدم مع نظام الشرائح
        mainPrice: item.price || 0, // السعر المطبق حسب نوع الشريحة العام
        subPrice: 0, // لم يعد يستخدم مع نظام الشرائح
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
      invoiceType: 'direct', // بيع مباشر، جملة، جملة الجملة
      notes: '',
      discountType: 'percentage',
      discountValue: 0
    });
    setItems([{ 
      productId: '', 
      productName: '',
      directPrice: 0,
      wholesalePrice: 0,
      wholesalePrice10: 0,
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

          {/* نوع الشريحة */}
          <div>
            <select
              name="invoiceType"
              value={formData.invoiceType || 'direct'}
              onChange={(e) => handleItemChange(0, 'invoiceType', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="direct">💚 بيع مباشر</option>
              <option value="wholesale">🧡 جملة</option>
              <option value="wholesale10">💜 جملة الجملة</option>
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
              <option value="">اختر نوع الوكيل / المندوب</option>
              <option value="general">عام</option>
              <option value="fatora">فاتورة</option>
              <option value="kartona">كرتونة</option>
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
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-20">الكمية</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-24">السعر</th>
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

                    {/* السعر */}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ملاحظات إضافية..."
              />
            </div>

            {/* الخصم */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">خصم الفاتورة</label>
              <div className="flex gap-2">
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">نسبة مئوية %</option>
                  <option value="fixed">قيمة ثابتة</option>
                </select>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step={formData.discountType === 'percentage' ? '0.1' : '0.01'}
                  />
                  {formData.discountType === 'percentage' && (
                    <FaPercent className="absolute left-2 top-2 text-gray-400 text-xs" />
                  )}
                  {formData.discountType === 'fixed' && (
                    <FaMoneyBillWave className="absolute left-2 top-2 text-gray-400 text-xs" />
                  )}
                </div>
              </div>
              {formData.discountValue > 0 && (
                <div className="text-sm text-gray-600">
                  قيمة الخصم: <span className="font-semibold text-red-600">{calculateDiscountAmount().toFixed(2)} ج.م</span>
                </div>
              )}
            </div>

            {/* الإجماليات */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">المجموع الفرعي:</span>
                <span className="text-sm font-semibold text-gray-800">{calculateSubTotal().toFixed(2)} ج.م</span>
              </div>
              {formData.discountValue > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">الخصم:</span>
                  <span className="text-sm font-semibold text-red-600">-{calculateDiscountAmount().toFixed(2)} ج.م</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-900">الإجمالي النهائي:</span>
                <span className="text-lg font-bold text-green-600">{calculateTotal().toFixed(2)} ج.م</span>
              </div>
            </div>
          </div>
        </div>

        {/* أزرار الحفظ والطباعة */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <FaSave />
            حفظ الفاتورة (Ctrl+S)
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <FaPrint />
            حفظ وطباعة
          </button>
        </div>
      </div>

      {/* Modal إضافة العميل السريع */}
      {showQuickCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">إضافة عميل جديد</h3>
              <button
                onClick={closeQuickCustomerModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل *</label>
                <input
                  type="text"
                  name="name"
                  value={quickCustomerForm.name}
                  onChange={handleQuickCustomerChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل اسم العميل..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
                <input
                  type="tel"
                  name="phone1"
                  value={quickCustomerForm.phone1}
                  onChange={handleQuickCustomerChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل رقم الهاتف..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <input
                  type="text"
                  name="address"
                  value={quickCustomerForm.address}
                  onChange={handleQuickCustomerChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل العنوان..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع العميل</label>
                <select
                  name="agentType"
                  value={quickCustomerForm.agentType}
                  onChange={handleQuickCustomerChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">عام</option>
                  <option value="fatora">فاتورة</option>
                  <option value="kartona">كرتونة</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 p-4 border-t">
              <button
                onClick={closeQuickCustomerModal}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddQuickCustomer}
                disabled={quickCustomerLoading}
                className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {quickCustomerLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <FaUserPlus />
                    إضافة العميل
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSalesInvoice;