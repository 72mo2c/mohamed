// ======================================
// Data Context - إدارة بيانات النظام
// ======================================

import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

// Hook لاستخدام Data Context
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  // بيانات المخازن
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // بيانات المشتريات
  const [purchases, setPurchases] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  
  // بيانات المبيعات
  const [sales, setSales] = useState([]);
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [salesReturns, setSalesReturns] = useState([]);
  
  // بيانات الشركات والموردين
  const [suppliers, setSuppliers] = useState([]);
  
  // بيانات العملاء
  const [customers, setCustomers] = useState([]);
  
  // بيانات الخزينة الشاملة
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [cashReceipts, setCashReceipts] = useState([]); // إيصالات الاستلام النقدي
  const [cashDisbursements, setCashDisbursements] = useState([]); // إيصالات الصرف النقدي
  
  // بيانات التحويلات بين المخازن
  const [transfers, setTransfers] = useState([]);

  // تحميل البيانات من LocalStorage
  useEffect(() => {
    loadAllData();
  }, []);

  // تحميل جميع البيانات
  const loadAllData = () => {
    const loadData = (key, setter, defaultValue = []) => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          setter(JSON.parse(stored));
        } catch (error) {
          console.error(`خطأ في تحميل ${key}:`, error);
          setter(defaultValue);
        }
      }
    };

    loadData('bero_warehouses', setWarehouses);
    loadData('bero_products', setProducts);
    loadData('bero_categories', setCategories);
    loadData('bero_purchases', setPurchases);
    loadData('bero_purchase_invoices', setPurchaseInvoices);
    loadData('bero_purchase_returns', setPurchaseReturns);
    loadData('bero_sales', setSales);
    loadData('bero_sales_invoices', setSalesInvoices);
    loadData('bero_sales_returns', setSalesReturns);
    loadData('bero_suppliers', setSuppliers);
    loadData('bero_customers', setCustomers);
    loadData('bero_treasury_balance', setTreasuryBalance, 0);
    loadData('bero_cash_receipts', setCashReceipts);
    loadData('bero_cash_disbursements', setCashDisbursements);
    loadData('bero_transfers', setTransfers);
  };

  // حفض البيانات في LocalStorage
  const saveData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // ==================== دوال المخازن ====================
  
  const addWarehouse = (warehouse) => {
    const newWarehouse = { id: Date.now(), ...warehouse };
    const updated = [...warehouses, newWarehouse];
    setWarehouses(updated);
    saveData('bero_warehouses', updated);
    return newWarehouse;
  };

  const updateWarehouse = (id, updatedData) => {
    const updated = warehouses.map(w => w.id === id ? { ...w, ...updatedData } : w);
    setWarehouses(updated);
    saveData('bero_warehouses', updated);
  };

  const deleteWarehouse = (id) => {
    const updated = warehouses.filter(w => w.id !== id);
    setWarehouses(updated);
    saveData('bero_warehouses', updated);
  };

  // ==================== دوال الفئات ====================
  
  const addCategory = (category) => {
    const newCategory = { id: Date.now(), createdAt: new Date().toISOString(), ...category };
    const updated = [...categories, newCategory];
    setCategories(updated);
    saveData('bero_categories', updated);
    return newCategory;
  };

  const updateCategory = (id, updatedData) => {
    const updated = categories.map(c => c.id === id ? { ...c, ...updatedData } : c);
    setCategories(updated);
    saveData('bero_categories', updated);
  };

  const deleteCategory = (id) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    saveData('bero_categories', updated);
  };

  // ==================== دوال المنتجات ====================
  
  const addProduct = (product) => {
    const newProduct = { id: Date.now(), ...product };
    const updated = [...products, newProduct];
    setProducts(updated);
    saveData('bero_products', updated);
    return newProduct;
  };

  const updateProduct = (id, updatedData) => {
    const updated = products.map(p => p.id === id ? { ...p, ...updatedData } : p);
    setProducts(updated);
    saveData('bero_products', updated);
  };

  const deleteProduct = (id) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    saveData('bero_products', updated);
  };

  // ==================== دوال الموردين ====================
  
  const addSupplier = (supplier) => {
    const newSupplier = { id: Date.now(), ...supplier };
    const updated = [...suppliers, newSupplier];
    setSuppliers(updated);
    saveData('bero_suppliers', updated);
    return newSupplier;
  };

  const updateSupplier = (id, updatedData) => {
    const updated = suppliers.map(s => s.id === id ? { ...s, ...updatedData } : s);
    setSuppliers(updated);
    saveData('bero_suppliers', updated);
  };

  const deleteSupplier = (id) => {
    const updated = suppliers.filter(s => s.id !== id);
    setSuppliers(updated);
    saveData('bero_suppliers', updated);
  };

  // ==================== دوال العملاء ====================
  
  const addCustomer = (customer) => {
    const newCustomer = { id: Date.now(), ...customer };
    const updated = [...customers, newCustomer];
    setCustomers(updated);
    saveData('bero_customers', updated);
    return newCustomer;
  };

  const updateCustomer = (id, updatedData) => {
    const updated = customers.map(c => c.id === id ? { ...c, ...updatedData } : c);
    setCustomers(updated);
    saveData('bero_customers', updated);
  };

  const deleteCustomer = (id) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    saveData('bero_customers', updated);
  };

  // ==================== دوال فواتير المشتريات ====================
  
  const addPurchaseInvoice = (invoice) => {
    // إثراء بيانات items بأسماء المنتجات
    const enrichedItems = invoice.items.map(item => {
      const product = products.find(p => p.id === parseInt(item.productId));
      return {
        ...item,
        productName: product?.name || item.productName || 'غير محدد'
      };
    });
    
    const newInvoice = { 
      id: Date.now(), 
      date: new Date().toISOString(), 
      ...invoice,
      items: enrichedItems,
      supplierId: parseInt(invoice.supplierId), // تحويل إلى رقم
      paid: invoice.paymentType === 'cash' ? invoice.total : 0, // إضافة حقل المدفوع
      remaining: invoice.paymentType === 'cash' ? 0 : invoice.total // إضافة حقل المتبقي
    };
    
    // === الكود الجديد: ربط المشتريات بالخزينة ===
    if (invoice.paymentType === 'cash') {
      // التحقق من الرصيد الكافي
      if (treasuryBalance < invoice.total) {
        throw new Error(`الرصيد المتوفر في الخزينة (${treasuryBalance.toFixed(2)}) غير كافٍ للفاتورة (${invoice.total.toFixed(2)})`);
      }
      
      // خصم من رصيد الخزينة
      const newBalance = treasuryBalance - invoice.total;
      setTreasuryBalance(newBalance);
      saveData('bero_treasury_balance', newBalance);
      
      // تسجيل حركة صرف نقدي
      const disbursementData = {
        amount: invoice.total,
        toType: 'supplier',
        toId: invoice.supplierId,
        description: `شراء نقدي من المورد - فاتورة رقم ${newInvoice.id}`,
        reference: `فاتورة مشتريات #${newInvoice.id}`,
        type: 'purchase_payment'
      };
      
      addCashDisbursement(disbursementData);
    }
    // === نهاية الكود الجديد ===
    
    const updated = [...purchaseInvoices, newInvoice];
    setPurchaseInvoices(updated);
    saveData('bero_purchase_invoices', updated);
    
    // تحديث كميات المنتجات (مع الكمية الرئيسية والفرعية)
    if (invoice.items && Array.isArray(invoice.items)) {
      const updatedProducts = [...products];
      
      invoice.items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === parseInt(item.productId));
        if (productIndex !== -1) {
          // حساب الكمية الإجمالية (الرئيسية + الفرعية)
          const mainQty = parseInt(item.quantity) || 0;
          const subQty = parseInt(item.subQuantity) || 0;
          const totalQty = mainQty + subQty;
          
          // التحقق من الكميات السالبة
          if (totalQty < 0) {
            throw new Error(`الكمية لا يمكن أن تكون سالبة للمنتج: ${updatedProducts[productIndex].name}`);
          }
          
          // زيادة الكمية الإجمالية في المخزون
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            mainQuantity: (updatedProducts[productIndex].mainQuantity || 0) + totalQty
          };
        }
      });
      
      setProducts(updatedProducts);
      saveData('bero_products', updatedProducts);
    }
    
    // === الكود الجديد: تحديث رصيد المورد ===
    updateSupplierBalance(newInvoice.supplierId, newInvoice.total, 'debit');
    // === نهاية الكود الجديد ===
    
    return newInvoice;
  };

  const updatePurchaseInvoice = (invoiceId, updatedData) => {
    // إيجاد الفاتورة القديمة
    const oldInvoice = purchaseInvoices.find(inv => inv.id === invoiceId);
    if (!oldInvoice) {
      throw new Error('الفاتورة غير موجودة');
    }

    // إعادة الكميات القديمة (عكس عملية الشراء القديمة) - مع الكمية الفرعية
    if (oldInvoice.items && Array.isArray(oldInvoice.items)) {
      const updatedProducts = [...products];
      
      oldInvoice.items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === parseInt(item.productId));
        if (productIndex !== -1) {
          // حساب الكمية الإجمالية القديمة (الرئيسية + الفرعية)
          const oldMainQty = parseInt(item.quantity) || 0;
          const oldSubQty = parseInt(item.subQuantity) || 0;
          const oldTotalQty = oldMainQty + oldSubQty;
          
          // إعادة الكمية للمخزون
          const newQuantity = (updatedProducts[productIndex].mainQuantity || 0) - oldTotalQty;
          
          // التحقق من عدم حدوث كميات سالبة
          if (newQuantity < 0) {
            throw new Error(`لا يمكن تحديث الفاتورة: الكمية المتوفرة غير كافية للمنتج ${updatedProducts[productIndex].name}`);
          }
          
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            mainQuantity: newQuantity
          };
        }
      });
      
      setProducts(updatedProducts);
      saveData('bero_products', updatedProducts);
    }

    // تحديث الفاتورة
    const updated = purchaseInvoices.map(inv => 
      inv.id === invoiceId ? { ...inv, ...updatedData } : inv
    );
    setPurchaseInvoices(updated);
    saveData('bero_purchase_invoices', updated);

    // إضافة الكميات الجديدة - مع الكمية الفرعية
    if (updatedData.items && Array.isArray(updatedData.items)) {
      const updatedProducts = [...products];
      
      updatedData.items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === parseInt(item.productId));
        if (productIndex !== -1) {
          // حساب الكمية الإجمالية الجديدة (الرئيسية + الفرعية)
          const newMainQty = parseInt(item.quantity) || 0;
          const newSubQty = parseInt(item.subQuantity) || 0;
          const newTotalQty = newMainQty + newSubQty;
          
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            mainQuantity: (updatedProducts[productIndex].mainQuantity || 0) + newTotalQty
          };
        }
      });
      
      setProducts(updatedProducts);
      saveData('bero_products', updatedProducts);
    }
  };

  const deletePurchaseInvoice = (invoiceId) => {
    // إيجاد الفاتورة المراد حذفها
    const invoice = purchaseInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      throw new Error('الفاتورة غير موجودة');
    }
    
    // التحقق من عدم وجود مرتجعات مرتبطة
    const hasReturns = purchaseReturns.some(ret => ret.invoiceId === invoiceId);
    if (hasReturns) {
      throw new Error('لا يمكن حذف الفاتورة: توجد مرتجعات مرتبطة بها');
    }
    
    // === الكود الجديد: إرجاع المبلغ للخزينة ===
    if (invoice.paymentType === 'cash') {
      // إرجاع المبلغ للخزينة
      const newBalance = treasuryBalance + invoice.total;
      setTreasuryBalance(newBalance);
      saveData('bero_treasury_balance', newBalance);
      
      // حذف حركة الصرف المرتبطة
      const disbursementToDelete = cashDisbursements.find(d => 
        d.description?.includes(`فاتورة مشتريات #${invoiceId}`)
      );
      if (disbursementToDelete) {
        deleteCashDisbursement(disbursementToDelete.id);
      }
    }
    
    // تحديث رصيد المورد (إلغاء الدين)
    updateSupplierBalance(invoice.supplierId, invoice.total, 'credit');
    // === نهاية الكود الجديد ===
    
    // إعادة الكميات من المخزون (عكس عملية الشراء) - مع الكمية الفرعية
    if (invoice.items && Array.isArray(invoice.items)) {
      const updatedProducts = [...products];
      
      invoice.items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === parseInt(item.productId));
        if (productIndex !== -1) {
          // حساب الكمية الإجمالية (الرئيسية + الفرعية)
          const mainQty = parseInt(item.quantity) || 0;
          const subQty = parseInt(item.subQuantity) || 0;
          const totalQty = mainQty + subQty;
          
          // خصم الكمية من المخزون (عكس عملية الشراء)
          const newQuantity = (updatedProducts[productIndex].mainQuantity || 0) - totalQty;
          
          // التحقق من عدم حدوث كميات سالبة
          if (newQuantity < 0) {
            throw new Error(`لا يمكن حذف الفاتورة: سيؤدي ذلك إلى كمية سالبة للمنتج ${updatedProducts[productIndex].name}`);
          }
          
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            mainQuantity: newQuantity
          };
        }
      });
      
      setProducts(updatedProducts);
      saveData('bero_products', updatedProducts);
    }
    
    // حذف الفاتورة
    const updated = purchaseInvoices.filter(inv => inv.id !== invoiceId);
    setPurchaseInvoices(updated);
    saveData('bero_purchase_invoices', updated);
  };

  // ==================== دوال مرتجعات المشتريات ====================
  
  const addPurchaseReturn = (returnData) => {
    const { invoiceId, items, reason, notes } = returnData;
    
    // التحقق من وجود الفاتورة
    const invoice = purchaseInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      throw new Error('الفاتورة غير موجودة');
    }
    
    // حساب إجمالي المبلغ المرتجع
    let totalAmount = 0;
    
    // التحقق من الكميات المرتجعة وتحديث المخزون
    const updatedProducts = [...products];
    
    items.forEach(item => {
      // إضافة التحقق من وجود المنتج في النظام
      const product = products.find(p => p.id === parseInt(item.productId));
      if (!product) {
        throw new Error(`المنتج برقم ${item.productId} غير موجود في النظام`);
      }
      
      // البحث عن المنتج في الفاتورة الأصلية
      const originalItem = invoice.items.find(i => i.productId === item.productId);
      if (!originalItem) {
        throw new Error('المنتج غير موجود في الفاتورة الأصلية');
      }
      
      // حساب الكميات المرتجعة مسبقاً
      const previousReturns = purchaseReturns.filter(ret => 
        ret.invoiceId === invoiceId && ret.status !== 'cancelled'
      );
      
      let totalReturnedQty = 0;
      previousReturns.forEach(ret => {
        const retItem = ret.items.find(i => i.productId === item.productId);
        if (retItem) {
          totalReturnedQty += (retItem.quantity || 0) + (retItem.subQuantity || 0);
        }
      });
      
      // الكمية المتاحة للإرجاع
      const originalQty = (originalItem.quantity || 0) + (originalItem.subQuantity || 0);
      const returnQty = (item.quantity || 0) + (item.subQuantity || 0);
      const availableQty = originalQty - totalReturnedQty;
      
      if (returnQty > availableQty) {
        throw new Error(`الكمية المرتجعة تتجاوز الكمية المتاحة للمنتج: ${product.name}`);
      }
      
      // خصم الكميات المرتجعة من المخزون
      const productIndex = updatedProducts.findIndex(p => p.id === parseInt(item.productId));
      if (productIndex !== -1) {
        const newQuantity = (updatedProducts[productIndex].mainQuantity || 0) - returnQty;
        
        if (newQuantity < 0) {
          throw new Error(`الكمية المتوفرة في المخزون غير كافية للمنتج: ${product.name}`);
        }
        
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          mainQuantity: newQuantity
        };
      }
      
      // حساب المبلغ المرتجع لهذا العنصر
      const itemAmount = (item.quantity || 0) * (originalItem.price || 0) + 
                        (item.subQuantity || 0) * (originalItem.subPrice || 0);
      totalAmount += itemAmount;
    });
    
    // إنشاء سجل المرتجع
    const newReturn = {
      id: Date.now(),
      invoiceId,
      date: new Date().toISOString(),
      items,
      reason,
      notes,
      totalAmount,
      status: 'completed' // completed, pending, cancelled
    };
    
    // === الكود الجديد: ربط المرتجع بالخزينة ===
    if (invoice.paymentType === 'cash') {
      // إضافة للرصيد
      const newBalance = treasuryBalance + totalAmount;
      setTreasuryBalance(newBalance);
      saveData('bero_treasury_balance', newBalance);
      
      // تسجيل إيصال استلام نقدي
      const receiptData = {
        amount: totalAmount,
        fromType: 'supplier',
        fromId: invoice.supplierId,
        description: `مرتجع مشتريات نقدية - فاتورة رقم ${invoiceId}`,
        reference: `مرتجع مشتريات #${newReturn.id}`,
        type: 'purchase_return'
      };
      
      addCashReceipt(receiptData);
    }
    
    // تحديث رصيد المورد (تخفيض الدين)
    updateSupplierBalance(invoice.supplierId, totalAmount, 'credit');
    // === نهاية الكود الجديد ===
    
    // حفظ المرتجع
    const updatedReturns = [newReturn, ...purchaseReturns];
    setPurchaseReturns(updatedReturns);
    saveData('bero_purchase_returns', updatedReturns);
    
    // تحديث المخزون
    setProducts(updatedProducts);
    saveData('bero_products', updatedProducts);
    
    // تحديث حالة الفاتورة الأصلية
    const updatedInvoices = purchaseInvoices.map(inv => {
      if (inv.id === invoiceId) {
        return { ...inv, hasReturns: true };
      }
      return inv;
    });
    setPurchaseInvoices(updatedInvoices);
    saveData('bero_purchase_invoices', updatedInvoices);
    
    return newReturn;
  };
  
  const deletePurchaseReturn = (returnId) => {
    // البحث عن المرتجع
    const returnRecord = purchaseReturns.find(ret => ret.id === returnId);
    if (!returnRecord) {
      throw new Error('المرتجع غير موجود');
    }
    
    // الحصول على الفاتورة الأصلية
    const invoice = purchaseInvoices.find(inv => inv.id === returnRecord.invoiceId);
    if (!invoice) {
      throw new Error('الفاتورة الأصلية غير موجودة');
    }
    
    // === الكود الجديد: خصم المبلغ من الخزينة ===
    if (invoice.paymentType === 'cash') {
      // خصم المبلغ المرتجع من الخزينة
      const newBalance = treasuryBalance - returnRecord.totalAmount;
      if (newBalance < 0) {
        throw new Error('لا يمكن حذف المرتجع: سيؤدي إلى رصيد سالب في الخزينة');
      }
      
      setTreasuryBalance(newBalance);
      saveData('bero_treasury_balance', newBalance);
      
      // حذف إيصال الاستلام المرتبط
      const receiptToDelete = cashReceipts.find(r => 
        r.description?.includes(`مرتجع مشتريات #${returnId}`)
      );
      if (receiptToDelete) {
        deleteCashReceipt(receiptToDelete.id);
      }
    }
    
    // تحديث رصيد المورد (إعادة الدين)
    updateSupplierBalance(invoice.supplierId, returnRecord.totalAmount, 'debit');
    // === نهاية الكود الجديد ===
    
    // إعادة الكميات المرتجعة للمخزون
    const updatedProducts = [...products];
    
    returnRecord.items.forEach(item => {
      const productIndex = updatedProducts.findIndex(p => p.id === parseInt(item.productId));
      if (productIndex !== -1) {
        const returnQty = (item.quantity || 0) + (item.subQuantity || 0);
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          mainQuantity: (updatedProducts[productIndex].mainQuantity || 0) + returnQty
        };
      }
    });
    
    setProducts(updatedProducts);
    saveData('bero_products', updatedProducts);
    
    // حذف المرتجع
    const updated = purchaseReturns.filter(ret => ret.id !== returnId);
    setPurchaseReturns(updated);
    saveData('bero_purchase_returns', updated);
  };

  // ==================== دوال فواتير المبيعات ====================
  
  const addSalesInvoice = (invoice) => {
    // التحقق من توفر الكميات قبل البيع
    if (invoice.items && Array.isArray(invoice.items)) {
      for (const item of invoice.items) {
        const product = products.find(p => p.id === parseInt(item.productId));
        if (!product) {
          throw new Error(`المنتج غير موجود`);
        }
        
        // حساب الكمية الإجمالية (الرئيسية + الفرعية)
        const mainQty = parseInt(item.quantity) || 0;
        const subQty = parseInt(item.subQuantity) || 0;
        const totalQty = mainQty + subQty;
        const availableQty = product.mainQuantity || 0;
        
        if (totalQty > availableQty) {
          throw new Error(
            `الكمية المتوفرة غير كافية للمنتج "${product.name}".\n` +
            `المتوفر: ${availableQty}، المطلوب: ${totalQty}`
          );
        }
      }
    }
    
    // إثراء بيانات items بأسماء المنتجات
    const enrichedItems = invoice.items.map(item => {
      const product = products.find(p => p.id === parseInt(item.productId));
      return {
        ...item,
        productName: product?.name || item.productName || 'غير محدد'
      };
    });
    
    const newInvoice = { 
      id: Date.now(), 
      date: new Date().toISOString(), 
      ...invoice,
      items: enrichedItems,
      customerId: parseInt(invoice.customerId) // تحويل إلى رقم
    };
    const updated = [...salesInvoices, newInvoice];
    
    // تحديث كميات المنتجات (خصم الكميات المباعة من المخزون)
    if (invoice.items && Array.isArray(invoice.items)) {
      const updatedProducts = [...products];
      
      invoice.items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === parseInt(item.productId));
        if (productIndex !== -1) {
          // حساب الكمية الإجمالية (الرئيسية + الفرعية)
          const mainQty = parseInt(item.quantity) || 0;
          const subQty = parseInt(item.subQuantity) || 0;
          const totalQty = mainQty + subQty;
          
          const newQuantity = (updatedProducts[productIndex].mainQuantity || 0) - totalQty;
          
          // تأكيد نهائي لمنع الكميات السالبة
          if (newQuantity < 0) {
            throw new Error(
              `خطأ: الكمية أصبحت سالبة للمنتج ${updatedProducts[productIndex].name}`
            );
          }
          
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            mainQuantity: newQuantity
          };
        }
      });
      
      setProducts(updatedProducts);
      saveData('bero_products', updatedProducts);
    }
    
    // ==================== إضافة: التكامل المالي الكامل ====================
    
    // 1. تسجيل Cash Receipt للدفع النقدي
    if (invoice.paymentType === 'cash') {
      const receiptData = {
        amount: newInvoice.total,
        fromType: 'customer',
        fromId: newInvoice.customerId,
        description: `مبيعات نقدية - فاتورة رقم ${newInvoice.id}`,
        reference: `فاتورة مبيعات #${newInvoice.id}`,
        type: 'sales_payment'
      };
      
      try {
        const receipt = addCashReceipt(receiptData);
        console.log('تم تسجيل إيصال استلام نقدي:', receipt);
      } catch (error) {
        console.error('خطأ في تسجيل الإيصال النقدي:', error);
        // يجب أن تفشل العملية إذا فشل تسجيل الإيصال
        throw new Error(`فشل في تسجيل المعاملة المالية: ${error.message}`);
      }
    }
    
    // 2. تسجيل دين العميل للدفع الآجل والجزئي
    if (invoice.paymentType === 'deferred' || invoice.paymentType === 'partial') {
      // سيتم حساب الرصيد تلقائياً بواسطة getCustomerBalance
    }
    
    // تحديث حالة الفاتورة
    const invoiceWithStatus = {
      ...newInvoice,
      paymentStatus: invoice.paymentType === 'cash' ? 'paid' : 'pending',
      paid: invoice.paymentType === 'cash' ? newInvoice.total : 0,
      remaining: invoice.paymentType === 'cash' ? 0 : newInvoice.total
    };
    
    // تحديث قاعدة البيانات
    const updatedInvoices = [...salesInvoices, invoiceWithStatus];
    setSalesInvoices(updatedInvoices);
    saveData('bero_sales_invoices', updatedInvoices);
    
    return invoiceWithStatus;
  };
  
  const deleteSalesInvoice = (invoiceId) => {
    // إيجاد الفاتورة المراد حذفها
    const invoice = salesInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      throw new Error('الفاتورة غير موجودة');
    }
    
    // التحقق من عدم وجود مرتجعات مرتبطة
    const hasReturns = salesReturns.some(ret => ret.invoiceId === invoiceId);
    if (hasReturns) {
      throw new Error('لا يمكن حذف الفاتورة: توجد مرتجعات مرتبطة بها');
    }
    
    // ==================== إضافة: عكس المعاملات المالية ====================
    
    // 1. عكس تسجيل Cash Receipt للدفع النقدي
    if (invoice.paymentType === 'cash') {
      // البحث عن الإيصال المرتبط مع تحسين منطق البحث
      const invoiceIdStr = invoiceId.toString();
      const customerIdNum = parseInt(invoice.customerId);
      
      console.log('البحث عن الإيصال المرتبط للفاتورة:', {
        invoiceId: invoiceId,
        invoiceIdStr: invoiceIdStr,
        customerId: invoice.customerId,
        customerIdNum: customerIdNum,
        paymentType: invoice.paymentType
      });
      
      // البحث المحسن: البحث عن جميع الإيصالات المتعلقة بهذا العميل
      const possibleReceipts = cashReceipts.filter(r => 
        r.fromType === 'customer' && 
        r.type === 'sales_payment' &&
        (r.fromId === customerIdNum || r.fromId === invoice.customerId)
      );
      
      console.log('الإيصالات المحتملة:', possibleReceipts);
      
      // البحث عن الإيصال المحدد للفاتورة
      const relatedReceipt = possibleReceipts.find(r => 
        r.reference === `فاتورة مبيعات #${invoiceIdStr}` ||
        r.reference === `فاتورة مبيعات #${invoiceId}` ||
        r.description.includes(`فاتورة رقم ${invoiceIdStr}`) ||
        r.description.includes(`فاتورة رقم ${invoiceId}`)
      );
      
      console.log('الإيصال المرتبط الموجود:', relatedReceipt);
      
      if (relatedReceipt) {
        try {
          console.log('حذف الإيصال المرتبط:', relatedReceipt.id);
          
          // حذف الإيصال
          const updatedReceipts = cashReceipts.filter(r => r.id !== relatedReceipt.id);
          setCashReceipts(updatedReceipts);
          saveData('bero_cash_receipts', updatedReceipts);
          
          // خصم من رصيد الخزينة
          const receiptAmount = parseFloat(relatedReceipt.amount) || 0;
          const newBalance = treasuryBalance - receiptAmount;
          setTreasuryBalance(newBalance);
          saveData('bero_treasury_balance', newBalance);
          
          console.log('✅ تم حذف الإيصال المرتبط وعكس المبلغ من الخزينة:', {
            receiptId: relatedReceipt.id,
            amount: receiptAmount,
            oldBalance: treasuryBalance,
            newBalance: newBalance
          });
        } catch (error) {
          console.error('خطأ في حذف الإيصال المرتبط:', error);
          throw new Error(`فشل في حذف المعاملة المالية: ${error.message}`);
        }
      } else {
        console.warn('⚠️ لم يتم العثور على إيصال مرتبط للفاتورة:', invoiceId);
      }
    }
    
    // 2. عكس دين العميل للدفع الآجل والجزئي
    if (invoice.paymentType === 'deferred' || invoice.paymentType === 'partial') {
      // سيتم تحديث رصيد العميل تلقائياً بعد حذف الفاتورة
    }
    
    // إعادة الكميات إلى المخزون (عكس عملية البيع)
    if (invoice.items && Array.isArray(invoice.items)) {
      const updatedProducts = [...products];
      
      invoice.items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === parseInt(item.productId));
        if (productIndex !== -1) {
          // حساب الكمية الإجمالية (الرئيسية + الفرعية)
          const mainQty = parseInt(item.quantity) || 0;
          const subQty = parseInt(item.subQuantity) || 0;
          const totalQty = mainQty + subQty;
          
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            mainQuantity: (updatedProducts[productIndex].mainQuantity || 0) + totalQty
          };
        }
      });
      
      setProducts(updatedProducts);
      saveData('bero_products', updatedProducts);
    }
    
    // حذف الفاتورة
    const updated = salesInvoices.filter(inv => inv.id !== invoiceId);
    setSalesInvoices(updated);
    saveData('bero_sales_invoices', updated);
  };

  // ==================== دوال مرتجعات المبيعات ====================
  
  const addSalesReturn = (returnData) => {
    const { invoiceId, items, reason, notes } = returnData;
    
    // التحقق من وجود الفاتورة
    const invoice = salesInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      throw new Error('الفاتورة غير موجودة');
    }
    
    // حساب إجمالي المبلغ المرتجع
    let totalAmount = 0;
    
    // التحقق من الكميات المرتجعة وتحديث المخزون
    const updatedProducts = [...products];
    
    items.forEach(item => {
      // البحث عن المنتج في الفاتورة الأصلية
      const originalItem = invoice.items.find(i => i.productId === item.productId);
      if (!originalItem) {
        throw new Error('المنتج غير موجود في الفاتورة الأصلية');
      }
      
      // حساب الكميات المرتجعة مسبقاً
      const previousReturns = salesReturns.filter(ret => 
        ret.invoiceId === invoiceId && ret.status !== 'cancelled'
      );
      
      let totalReturnedQty = 0;
      previousReturns.forEach(ret => {
        const retItem = ret.items.find(i => i.productId === item.productId);
        if (retItem) {
          totalReturnedQty += (retItem.quantity || 0) + (retItem.subQuantity || 0);
        }
      });
      
      // الكمية المتاحة للإرجاع
      const originalQty = parseInt(originalItem.quantity) || 0;
      const returnQty = (item.quantity || 0) + (item.subQuantity || 0);
      const availableQty = originalQty - totalReturnedQty;
      
      if (returnQty > availableQty) {
        throw new Error(`الكمية المرتجعة تتجاوز الكمية المتاحة للمنتج`);
      }
      
      // إضافة الكميات المرتجعة للمخزون (عكس البيع)
      const productIndex = updatedProducts.findIndex(p => p.id === parseInt(item.productId));
      if (productIndex !== -1) {
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          mainQuantity: (updatedProducts[productIndex].mainQuantity || 0) + returnQty
        };
      }
      
      // حساب المبلغ المرتجع
      const itemAmount = returnQty * (originalItem.price || 0);
      totalAmount += itemAmount;
    });
    
    // إنشاء سجل المرتجع
    const newReturn = {
      id: Date.now(),
      invoiceId,
      date: new Date().toISOString(),
      items,
      reason,
      notes,
      totalAmount,
      status: 'completed' // completed, pending, cancelled
    };
    
    // ==================== إضافة: معالجة المعاملات المالية للمرتجع ====================
    
    // 1. إذا كان الإرجاع نقدي، حذف Cash Receipt وخصم من الخزينة
    if (invoice.paymentType === 'cash') {
      // البحث المحسن عن الإيصال المرتبط
      const invoiceIdStr = invoiceId.toString();
      const customerIdNum = parseInt(invoice.customerId);
      
      console.log('البحث عن الإيصال المرتبط في المرتجعات:', {
        invoiceId: invoiceId,
        customerId: invoice.customerId
      });
      
      // البحث عن جميع الإيصالات المتعلقة بهذا العميل
      const possibleReceipts = cashReceipts.filter(r => 
        r.fromType === 'customer' && 
        r.type === 'sales_payment' &&
        (r.fromId === customerIdNum || r.fromId === invoice.customerId)
      );
      
      // البحث عن الإيصال المحدد للفاتورة
      const relatedReceipt = possibleReceipts.find(r => 
        r.reference === `فاتورة مبيعات #${invoiceIdStr}` ||
        r.reference === `فاتورة مبيعات #${invoiceId}` ||
        r.description.includes(`فاتورة رقم ${invoiceIdStr}`) ||
        r.description.includes(`فاتورة رقم ${invoiceId}`)
      );
      
      if (relatedReceipt) {
        try {
          console.log('حذف الإيصال المرتبط في المرتجعات:', relatedReceipt.id);
          
          // حذف الإيصال
          const updatedReceipts = cashReceipts.filter(r => r.id !== relatedReceipt.id);
          setCashReceipts(updatedReceipts);
          saveData('bero_cash_receipts', updatedReceipts);
          
          // خصم من رصيد الخزينة
          const newBalance = treasuryBalance - totalAmount;
          setTreasuryBalance(newBalance);
          saveData('bero_treasury_balance', newBalance);
          
          console.log('تم حذف الإيصال المرتبط وعكس المبلغ من الخزينة');
        } catch (error) {
          console.error('خطأ في حذف الإيصال المرتبط:', error);
          throw new Error(`فشل في معالجة المرتجع المالي: ${error.message}`);
        }
      }
    }
    
    // 2. إذا كان الإرجاع آجل، تقليل دين العميل
    if (invoice.paymentType === 'deferred' || invoice.paymentType === 'partial') {
      const updatedSalesInvoices = salesInvoices.map(inv => {
        if (inv.id === invoiceId) {
          const currentRemaining = inv.remaining || inv.total || 0;
          return {
            ...inv,
            remaining: Math.max(0, currentRemaining - totalAmount)
          };
        }
        return inv;
      });
      setSalesInvoices(updatedSalesInvoices);
      saveData('bero_sales_invoices', updatedSalesInvoices);
    }
    
    // حفظ المرتجع
    const updatedReturns = [newReturn, ...salesReturns];
    setSalesReturns(updatedReturns);
    saveData('bero_sales_returns', updatedReturns);
    
    // تحديث المخزون
    setProducts(updatedProducts);
    saveData('bero_products', updatedProducts);
    
    // تحديث حالة الفاتورة الأصلية
    const updatedInvoices = salesInvoices.map(inv => {
      if (inv.id === invoiceId) {
        return { ...inv, hasReturns: true };
      }
      return inv;
    });
    setSalesInvoices(updatedInvoices);
    saveData('bero_sales_invoices', updatedInvoices);
    
    return newReturn;
  };
  
  const deleteSalesReturn = (returnId) => {
    // البحث عن المرتجع
    const returnRecord = salesReturns.find(ret => ret.id === returnId);
    if (!returnRecord) {
      throw new Error('المرتجع غير موجود');
    }
    
    // خصم الكميات المرتجعة من المخزون (لأن الإرجاع كان قد أضافها)
    const updatedProducts = [...products];
    
    returnRecord.items.forEach(item => {
      const productIndex = updatedProducts.findIndex(p => p.id === parseInt(item.productId));
      if (productIndex !== -1) {
        const returnQty = (item.quantity || 0) + (item.subQuantity || 0);
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          mainQuantity: (updatedProducts[productIndex].mainQuantity || 0) - returnQty
        };
      }
    });
    
    setProducts(updatedProducts);
    saveData('bero_products', updatedProducts);
    
    // حذف المرتجع
    const updated = salesReturns.filter(ret => ret.id !== returnId);
    setSalesReturns(updated);
    saveData('bero_sales_returns', updated);
  };

  // ==================== دوال الخزينة الشاملة ====================
  
  // إضافة إيصال استلام نقدي
  const addCashReceipt = (receiptData) => {
    const newReceipt = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...receiptData,
      type: 'receipt', // receipt
      status: 'completed' // completed, pending, cancelled
    };
    
    const updatedReceipts = [newReceipt, ...cashReceipts];
    setCashReceipts(updatedReceipts);
    saveData('bero_cash_receipts', updatedReceipts);
    
    // تحديث رصيد الخزينة (إضافة)
    const newBalance = treasuryBalance + parseFloat(receiptData.amount);
    setTreasuryBalance(newBalance);
    saveData('bero_treasury_balance', newBalance);
    
    return newReceipt;
  };
  
  // تحديث إيصال استلام نقدي
  const updateCashReceipt = (id, updatedData) => {
    const oldReceipt = cashReceipts.find(r => r.id === id);
    if (!oldReceipt) {
      throw new Error('الإيصال غير موجود');
    }
    
    // إعادة المبلغ القديم
    let newBalance = treasuryBalance - parseFloat(oldReceipt.amount);
    // إضافة المبلغ الجديد
    newBalance += parseFloat(updatedData.amount || oldReceipt.amount);
    
    setTreasuryBalance(newBalance);
    saveData('bero_treasury_balance', newBalance);
    
    const updated = cashReceipts.map(r => 
      r.id === id ? { ...r, ...updatedData } : r
    );
    setCashReceipts(updated);
    saveData('bero_cash_receipts', updated);
  };
  
  // حذف إيصال استلام نقدي
  const deleteCashReceipt = (id) => {
    const receipt = cashReceipts.find(r => r.id === id);
    if (!receipt) {
      throw new Error('الإيصال غير موجود');
    }
    
    // إعادة المبلغ من الخزينة
    const newBalance = treasuryBalance - parseFloat(receipt.amount);
    
    if (newBalance < 0) {
      throw new Error('لا يمكن حذف الإيصال: سيؤدي ذلك إلى رصيد سالب في الخزينة');
    }
    
    setTreasuryBalance(newBalance);
    saveData('bero_treasury_balance', newBalance);
    
    const updated = cashReceipts.filter(r => r.id !== id);
    setCashReceipts(updated);
    saveData('bero_cash_receipts', updated);
  };
  
  // إضافة إيصال صرف نقدي
  const addCashDisbursement = (disbursementData) => {
    // التحقق من الرصيد الكافي
    if (treasuryBalance < parseFloat(disbursementData.amount)) {
      throw new Error('الرصيد المتوفر في الخزينة غير كافٍ');
    }
    
    const newDisbursement = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...disbursementData,
      type: 'disbursement', // disbursement
      status: 'completed' // completed, pending, cancelled
    };
    
    const updatedDisbursements = [newDisbursement, ...cashDisbursements];
    setCashDisbursements(updatedDisbursements);
    saveData('bero_cash_disbursements', updatedDisbursements);
    
    // تحديث رصيد الخزينة (خصم)
    const newBalance = treasuryBalance - parseFloat(disbursementData.amount);
    setTreasuryBalance(newBalance);
    saveData('bero_treasury_balance', newBalance);
    
    return newDisbursement;
  };
  
  // تحديث إيصال صرف نقدي
  const updateCashDisbursement = (id, updatedData) => {
    const oldDisbursement = cashDisbursements.find(d => d.id === id);
    if (!oldDisbursement) {
      throw new Error('الإيصال غير موجود');
    }
    
    // إعادة المبلغ القديم للخزينة
    let newBalance = treasuryBalance + parseFloat(oldDisbursement.amount);
    // خصم المبلغ الجديد
    const newAmount = parseFloat(updatedData.amount || oldDisbursement.amount);
    newBalance -= newAmount;
    
    if (newBalance < 0) {
      throw new Error('الرصيد المتوفر في الخزينة غير كافٍ للتحديث');
    }
    
    setTreasuryBalance(newBalance);
    saveData('bero_treasury_balance', newBalance);
    
    const updated = cashDisbursements.map(d => 
      d.id === id ? { ...d, ...updatedData } : d
    );
    setCashDisbursements(updated);
    saveData('bero_cash_disbursements', updated);
  };
  
  // حذف إيصال صرف نقدي
  const deleteCashDisbursement = (id) => {
    const disbursement = cashDisbursements.find(d => d.id === id);
    if (!disbursement) {
      throw new Error('الإيصال غير موجود');
    }
    
    // إعادة المبلغ للخزينة
    const newBalance = treasuryBalance + parseFloat(disbursement.amount);
    setTreasuryBalance(newBalance);
    saveData('bero_treasury_balance', newBalance);
    
    const updated = cashDisbursements.filter(d => d.id !== id);
    setCashDisbursements(updated);
    saveData('bero_cash_disbursements', updated);
  };
  
  // حساب رصيد عميل معين
  const getCustomerBalance = (customerId) => {
    let balance = 0;
    
    // المبيعات (دين على العميل)
    salesInvoices.forEach(invoice => {
      if (invoice.customerId === customerId) {
        balance += parseFloat(invoice.total || 0);
      }
    });
    
    // المرتجعات (تخفض من دين العميل)
    salesReturns.forEach(returnRecord => {
      const invoice = salesInvoices.find(inv => inv.id === returnRecord.invoiceId);
      if (invoice && invoice.customerId === customerId) {
        balance -= parseFloat(returnRecord.totalAmount || 0);
      }
    });
    
    // الاستلامات من العميل (تخفض من دين العميل)
    cashReceipts.forEach(receipt => {
      if (receipt.fromType === 'customer' && receipt.fromId === customerId) {
        balance -= parseFloat(receipt.amount || 0);
      }
    });
    
    return balance;
  };
  
  // حساب رصيد مورد معين
  const getSupplierBalance = (supplierId) => {
    let balance = 0;
    
    // المشتريات (دين علينا للمورد)
    purchaseInvoices.forEach(invoice => {
      if (invoice.supplierId === supplierId) {
        balance += parseFloat(invoice.total || 0);
      }
    });
    
    // المرتجعات (تخفض من ديوننا للمورد)
    purchaseReturns.forEach(returnRecord => {
      const invoice = purchaseInvoices.find(inv => inv.id === returnRecord.invoiceId);
      if (invoice && invoice.supplierId === supplierId) {
        balance -= parseFloat(returnRecord.totalAmount || 0);
      }
    });
    
    // الصرف للمورد (تخفض من ديوننا للمورد)
    cashDisbursements.forEach(disbursement => {
      if (disbursement.toType === 'supplier' && disbursement.toId === supplierId) {
        balance -= parseFloat(disbursement.amount || 0);
      }
    });
    
    return balance;
  };
  
  // دالة مساعدة لتحديث رصيد المورد
  const updateSupplierBalance = (supplierId, amount, type = 'debit') => {
    const supplierIndex = suppliers.findIndex(s => s.id === supplierId);
    if (supplierIndex !== -1) {
      const currentBalance = suppliers[supplierIndex].balance || 0;
      const newBalance = type === 'debit' 
        ? currentBalance + amount  // زيادة الدين على المورد
        : currentBalance - amount; // تخفيض الدين على المورد
      
      const updatedSuppliers = [...suppliers];
      updatedSuppliers[supplierIndex] = {
        ...updatedSuppliers[supplierIndex],
        balance: newBalance
      };
      
      setSuppliers(updatedSuppliers);
      saveData('bero_suppliers', updatedSuppliers);
    }
  };
  
  // الحصول على جميع أرصدة العملاء
  const getAllCustomerBalances = () => {
    return customers.map(customer => ({
      ...customer,
      balance: getCustomerBalance(customer.id)
    })).filter(c => c.balance !== 0); // عرض فقط من لديهم رصيد
  };
  
  // الحصول على جميع أرصدة الموردين
  const getAllSupplierBalances = () => {
    return suppliers.map(supplier => ({
      ...supplier,
      balance: getSupplierBalance(supplier.id)
    })).filter(s => s.balance !== 0); // عرض فقط من لديهم رصيد
  };

  // ==================== دوال التحويلات بين المخازن ====================
  
  const transferProduct = (transferData) => {
    const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = transferData;
    
    // البحث عن المنتج في المخزن المصدر
    const sourceProduct = products.find(
      p => p.id === productId && p.warehouseId === fromWarehouseId
    );
    
    if (!sourceProduct) {
      throw new Error('المنتج غير موجود في المخزن المصدر');
    }
    
    if (sourceProduct.mainQuantity < quantity) {
      throw new Error('الكمية المتوفرة غير كافية');
    }
    
    // البحث عن نفس المنتج في المخزن المستهدف
    const targetProduct = products.find(
      p => p.name === sourceProduct.name && 
           p.category === sourceProduct.category && 
           p.warehouseId === toWarehouseId
    );
    
    let updatedProducts;
    
    if (targetProduct) {
      // المنتج موجود في المخزن المستهدف - نزيد الكمية
      updatedProducts = products.map(p => {
        if (p.id === sourceProduct.id) {
          return { ...p, mainQuantity: p.mainQuantity - quantity };
        }
        if (p.id === targetProduct.id) {
          return { ...p, mainQuantity: p.mainQuantity + quantity };
        }
        return p;
      });
    } else {
      // المنتج غير موجود في المخزن المستهدف - ننشئ منتج جديد
      const newProduct = {
        ...sourceProduct,
        id: Date.now(),
        warehouseId: toWarehouseId,
        mainQuantity: quantity,
        createdAt: new Date().toISOString()
      };
      
      updatedProducts = products.map(p => 
        p.id === sourceProduct.id 
          ? { ...p, mainQuantity: p.mainQuantity - quantity }
          : p
      );
      updatedProducts.push(newProduct);
    }
    
    // حذف المنتجات ذات الكمية صفر
    updatedProducts = updatedProducts.filter(p => p.mainQuantity > 0);
    
    setProducts(updatedProducts);
    saveData('bero_products', updatedProducts);
    
    // حفظ سجل التحويل
    const newTransfer = {
      id: Date.now(),
      date: new Date().toISOString(),
      productId,
      productName: sourceProduct.name,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      notes
    };
    
    const updatedTransfers = [newTransfer, ...transfers];
    setTransfers(updatedTransfers);
    saveData('bero_transfers', updatedTransfers);
    
    return newTransfer;
  };

  const value = {
    warehouses,
    products,
    categories,
    purchases,
    purchaseInvoices,
    purchaseReturns,
    sales,
    salesInvoices,
    salesReturns,
    suppliers,
    customers,
    treasuryBalance,
    cashReceipts,
    cashDisbursements,
    transfers,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addPurchaseInvoice,
    updatePurchaseInvoice,
    deletePurchaseInvoice,
    addPurchaseReturn,
    deletePurchaseReturn,
    addSalesInvoice,
    deleteSalesInvoice,
    addSalesReturn,
    deleteSalesReturn,
    addCashReceipt,
    updateCashReceipt,
    deleteCashReceipt,
    addCashDisbursement,
    updateCashDisbursement,
    deleteCashDisbursement,
    getCustomerBalance,
    getSupplierBalance,
    updateSupplierBalance,
    getAllCustomerBalances,
    getAllSupplierBalances,
    transferProduct
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
