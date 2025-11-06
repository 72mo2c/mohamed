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
    invoiceType: 'direct',
    notes: '',
    discountType: 'percentage',
    discountValue: 0
  });

  const [items, setItems] = useState([{
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
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSubmit(e);
      }
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
    setShowCustomerSuggestions(value.trim().length > 0);
  };

  const selectCustomer = (customer) => {
    setFormData({ 
      ...formData, 
      customerId: customer.id,
      agentType: customer.agentType || ''
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
  const openQuickCustomerModal = () => {
    setQuickCustomerForm({
      name: '',
      phone1: '',
      address: '',
      agentType: 'general'
    });
    setShowQuickCustomerModal(true);
  };

  const closeQuickCustomerModal = () => {
    setShowQuickCustomerModal(false);
    setQuickCustomerLoading(false);
  };

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
      const newCustomer = addCustomer({
        ...quickCustomerForm,
        createdAt: new Date().toISOString(),
        status: 'active'
      });

      showSuccess(`تم إضافة العميل "${newCustomer.name}" بنجاح`);
      
      setFormData({ 
        ...formData, 
        customerId: newCustomer.id,
        agentType: newCustomer.agentType || ''
      });
      
      setCustomerSearch(newCustomer.name);
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

    const newShowSuggestions = [...showProductSuggestions];
    newShowSuggestions[index] = value.trim().length > 0;
    setShowProductSuggestions(newShowSuggestions);
  };

  const selectProduct = (index, product) => {
    const newItems = [...items];
    
    const currentInvoiceType = formData.invoiceType || 'direct';
    let appliedPrice = parseFloat(product.directPrice) || 0;
    
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
      price: appliedPrice,
      quantity: 1,
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
    
    if (field === 'invoiceType') {
      setFormData(prev => ({ ...prev, invoiceType: value }));
      
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
    
    if (!formData.customerId) {
      errors.customer = 'يجب اختيار العميل';
    }
    
    if (!formData.date) {
      errors.date = 'يجب إدخال تاريخ الفاتورة';
    }
    
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
    
    const newQuantityErrors = [];
    const newPriceErrors = [];
    const newDiscountErrors = [];
    
    items.forEach((item, index) => {
      if (!item.productId) {
        errors[`product_${index}`] = 'يجب اختيار المنتج';
      }
      
      if (item.quantity < 0) {
        errors[`quantity_${index}`] = 'الكمية الأساسية لا يمكن أن تكون سالبة';
        newQuantityErrors[index] = true;
      } else if (item.quantity === 0 && item.subQuantity === 0) {
        errors[`quantity_${index}`] = 'يجب إدخال كمية أساسية أو فرعية';
        newQuantityErrors[index] = true;
      } else {
        newQuantityErrors[index] = false;
      }
      
      if (item.price < 0) {
        errors[`price_${index}`] = 'السعر الأساسي لا يمكن أن يكون سالباً';
        newPriceErrors[index] = true;
      } else if (item.price === 0 && item.quantity > 0) {
        errors[`price_${index}`] = 'يجب إدخال سعر أساسي للمنتج';
        newPriceErrors[index] = true;
      } else {
        newPriceErrors[index] = false;
      }
      
      if (item.productId && item.price <= 0) {
        errors[`price_${index}`] = 'يجب إدخال سعر للشريحة المختارة';
      }

      if (item.discount < 0) {
        errors[`discount_${index}`] = 'خصم العنصر لا يمكن أن يكون سالباً';
        newDiscountErrors[index] = true;
      } else if (item.discount > calculateItemTotalWithoutDiscount(item)) {
        errors[`discount_${index}`] = 'خصم العنصر لا يمكن أن يزيد عن إجماليه';
        newDiscountErrors[index] = true;
      } else {
        newDiscountErrors[index] = false;
      }

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
    
    const total = calculateTotal();
    if (total <= 0) {
      errors.total = 'المجموع الكلي يجب أن يكون أكبر من صفر';
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e, shouldPrint = false) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      showError('يرجى تصحيح الأخطاء قبل حفظ الفاتورة');
      
      const firstError = Object.values(validationErrors)[0];
      if (firstError) {
        setTimeout(() => showError(firstError), 500);
      }
      return;
    }

    try {
      const convertedItems = items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity || 0,
        subQuantity: 0,
        mainPrice: item.price || 0,
        subPrice: 0,
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
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* العنوان الرئيسي */}
        <div className="mb-6 pb-4 border-b">
          <h1 className="text-2xl font-bold text-gray-800 text-center">فاتورة مبيعات جديدة</h1>
        </div>

        {/* الصف العلوي: معلومات الفاتورة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* العميل */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">العميل</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={customerInputRef}
                  type="text"
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  onBlur={handleCustomerBlur}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ابحث عن العميل..."
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
              </div>
              <button
                type="button"
                onClick={openQuickCustomerModal}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 text-sm"
                title="إضافة عميل جديد سريع"
              >
                <FaUserPlus className="text-sm" />
                جديد
              </button>
            </div>
            {showCustomerSuggestions && customerSearch.trim().length > 0 && filteredCustomers.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">{customer.name}</span>
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{customer.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* نوع الفاتورة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الفاتورة</label>
            <select
              name="paymentType"
              value={formData.paymentType}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="main">اختر نوع الفاتورة</option>
              <option value="cash">نقدي</option>
              <option value="deferred">آجل</option>
              <option value="partial">جزئي</option>
            </select>
          </div>

          {/* نوع الشريحة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الشريحة</label>
            <select
              name="invoiceType"
              value={formData.invoiceType || 'direct'}
              onChange={(e) => handleItemChange(0, 'invoiceType', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="direct">💚 بيع مباشر</option>
              <option value="wholesale">🧡 جملة</option>
              <option value="wholesale10">💜 جملة الجملة</option>
            </select>
          </div>

          {/* الوكيل */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الوكيل / المندوب</label>
            <select
              name="agentType"
              value={formData.agentType}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر نوع الوكيل</option>
              <option value="general">عام</option>
              <option value="fatora">فاتورة</option>
              <option value="kartona">كرتونة</option>
            </select>
          </div>
        </div>

        {/* التاريخ والوقت */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الوقت</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* تحذيرات نوع الدفع */}
        {paymentWarning && (
          <div className={`p-4 rounded-lg mb-6 ${
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

        {/* جدول المنتجات */}
        <div className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 min-w-[200px]">المنتج</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 w-24">الكمية</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 w-28">السعر</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 w-28">الخصم</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 w-28">الإجمالي</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 w-16">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {/* المنتج */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <input
                          ref={(el) => (productInputRefs.current[index] = el)}
                          type="text"
                          value={productSearches[index] || ''}
                          onChange={(e) => handleProductSearch(index, e.target.value)}
                          onBlur={() => handleProductBlur(index)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="ابحث عن المنتج..."
                        />
                        <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
                      </div>
                      {showProductSuggestions[index] && productSearches[index]?.trim().length > 0 && getFilteredProducts(index).length > 0 && (
                        <div className="absolute z-40 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                          {getFilteredProducts(index).map((product) => {
                            const warehouse = warehouses.find(w => w.id === product.warehouseId);
                            return (
                              <div
                                key={product.id}
                                onClick={() => selectProduct(index, product)}
                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-800">{product.name}</div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      {warehouse?.name || 'غير محدد'} - {product.category}
                                    </div>
                                  </div>
                                  <div className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                                    متوفر: {product.mainQuantity || 0}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {getQuantityWarning(index)}
                    </td>

                    {/* الكمية الأساسية */}
                    <td className="px-3 py-3">
                      <input
                        ref={(el) => (quantityInputRefs.current[index] = el)}
                        type="number"
                        name={`quantity-${index}`}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-2 text-sm text-center border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          quantityErrors[index] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        min="0"
                      />
                    </td>

                    {/* السعر */}
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 text-sm text-center border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          priceErrors[index] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        min="0"
                      />
                    </td>

                    {/* الخصم */}
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 text-sm text-center border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          discountErrors[index] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        min="0"
                      />
                    </td>

                    {/* الإجمالي */}
                    <td className="px-3 py-3 text-center">
                      <span className="font-semibold text-blue-600 text-sm">
                        {calculateItemTotal(item).toFixed(2)}
                      </span>
                    </td>

                    {/* حذف */}
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* زر إضافة منتج */}
          <button
            type="button"
            onClick={addItem}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium"
          >
            + إضافة منتج جديد (Enter)
          </button>
        </div>

        {/* الجزء السفلي */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ملاحظات */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل ملاحظات إضافية..."
              />
            </div>

            {/* الخصم */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">خصم الفاتورة</label>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="percentage">نسبة مئوية %</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                  <div className="relative">
                    <input
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                      min="0"
                      step={formData.discountType === 'percentage' ? '0.1' : '0.01'}
                    />
                    {formData.discountType === 'percentage' ? (
                      <FaPercent className="absolute right-3 top-3 text-gray-400 text-sm" />
                    ) : (
                      <FaMoneyBillWave className="absolute right-3 top-3 text-gray-400 text-sm" />
                    )}
                  </div>
                </div>
                {formData.discountValue > 0 && (
                  <div className="text-sm text-gray-700 text-center">
                    قيمة الخصم: <span className="font-semibold text-red-600">{calculateDiscountAmount().toFixed(2)} ج.م</span>
                  </div>
                )}
              </div>
            </div>

            {/* الإجماليات */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">المجموع الفرعي:</span>
                  <span className="text-sm font-semibold text-gray-800">{calculateSubTotal().toFixed(2)} ج.م</span>
                </div>
                
                {formData.discountValue > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-sm font-medium text-gray-700">الخصم:</span>
                    <span className="text-sm font-semibold text-red-600">-{calculateDiscountAmount().toFixed(2)} ج.م</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                  <span className="text-lg font-bold text-gray-900">المجموع الكلي:</span>
                  <span className="text-lg font-bold text-blue-700">{calculateTotal().toFixed(2)} ج.م</span>
                </div>
                
                <div className="text-xs text-gray-500 text-center pt-2 border-t border-blue-200">
                  عدد المنتجات: {items.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* الأزرار */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <FaTrash /> إعادة تعيين
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <FaSave /> حفظ الفاتورة
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <FaPrint /> حفظ وطباعة
            </button>
          </div>
        </div>

        {/* اختصارات الكيبورد */}
        <div className="mt-6 pt-4 border-t text-xs text-gray-500 text-center">
          <span className="inline-block mx-2">💡 اختصارات: </span>
          <span className="inline-block mx-2">Ctrl+S = حفظ</span>
          <span className="inline-block mx-2">Enter = صف جديد</span>
          <span className="inline-block mx-2">Tab = التنقل</span>
        </div>
      </div>

      {/* Modal إضافة العميل السريع */}
      {showQuickCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">إضافة عميل جديد</h3>
              <button
                onClick={closeQuickCustomerModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم العميل *</label>
                <input
                  type="text"
                  name="name"
                  value={quickCustomerForm.name}
                  onChange={handleQuickCustomerChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل اسم العميل..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف *</label>
                <input
                  type="tel"
                  name="phone1"
                  value={quickCustomerForm.phone1}
                  onChange={handleQuickCustomerChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل رقم الهاتف..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                <input
                  type="text"
                  name="address"
                  value={quickCustomerForm.address}
                  onChange={handleQuickCustomerChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل العنوان..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع العميل</label>
                <select
                  name="agentType"
                  value={quickCustomerForm.agentType}
                  onChange={handleQuickCustomerChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">عام</option>
                  <option value="fatora">فاتورة</option>
                  <option value="kartona">كرتونة</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={closeQuickCustomerModal}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddQuickCustomer}
                disabled={quickCustomerLoading}
                className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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