// ======================================
// Manage Sales Invoices - إدارة فواتير المبيعات (محسّنة)
// ======================================

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { useAuth } from '../../context/AuthContext';
import { FaFileInvoice, FaEdit, FaTrash, FaPrint, FaSearch, FaFilter, FaUndo, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { printInvoiceDirectly } from '../../utils/printUtils';

const ManageSalesInvoices = () => {
  const { salesInvoices, products, customers, warehouses, deleteSalesInvoice, addSalesReturn, salesReturns } = useData();
  const { showSuccess, showError } = useNotification();
  const { settings } = useSystemSettings();
  const { hasPermission } = useAuth();

  // دالة تنسيق العملة باستخدام إعدادات النظام
  const formatCurrency = (amount) => {
    const currency = settings?.currency || 'EGP';
    const locale = settings?.language === 'ar' ? 'ar-EG' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // فحص الصلاحيات
  const canViewInvoice = hasPermission('view_sales_invoices');
  const canReturnInvoice = hasPermission('return_sale');
  const canPrintInvoice = hasPermission('print_invoices');
  const canDeleteInvoice = hasPermission('delete_sales_invoice');
  const canManageSales = hasPermission('manage_sales');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnInvoice, setReturnInvoice] = useState(null);

  // تصفية الفواتير
  const filteredInvoices = salesInvoices.filter(invoice => {
    const customer = customers.find(c => c.id === parseInt(invoice.customerId));
    const customerName = customer ? customer.name : '';
    const matchesSearch = customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          invoice.id.toString().includes(searchQuery);
    const matchesFilter = paymentTypeFilter === 'all' || invoice.paymentType === paymentTypeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleReturn = (invoice) => {
    if (!canReturnInvoice) {
      showError('ليس لديك صلاحية لإرجاع فواتير المبيعات');
      return;
    }
    setReturnInvoice(invoice);
    setShowReturnModal(true);
  };

  const handleView = (invoice) => {
    if (!canViewInvoice) {
      showError('ليس لديك صلاحية لعرض فواتير المبيعات');
      return;
    }
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handlePrint = (invoice) => {
    if (!canPrintInvoice) {
      showError('ليس لديك صلاحية لطباعة الفواتير');
      return;
    }
    
    try {
      const invoiceData = {
        formData: invoice,
        items: invoice.items || [],
        total: invoice.total || 0,
        customers,
        products,
        warehouses
      };
      printInvoiceDirectly(invoiceData, 'sales');
      showSuccess('تم إرسال الفاتورة للطباعة');
    } catch (error) {
      showError('حدث خطأ في طباعة الفاتورة');
    }
  };

  const handleDelete = (invoice) => {
    if (!canDeleteInvoice) {
      showError('ليس لديك صلاحية لحذف فواتير المبيعات');
      return;
    }
    
    if (window.confirm(`هل أنت متأكد من حذف الفاتورة #${invoice.id}؟\nسيتم إعادة الكميات إلى المخزون.`)) {
      try {
        deleteSalesInvoice(invoice.id);
        showSuccess('تم حذف الفاتورة بنجاح وإعادة الكميات للمخزون');
      } catch (error) {
        showError(error.message || 'حدث خطأ في حذف الفاتورة');
      }
    }
  };

  // دوال معالجة الإرجاع
  const handleSalesReturn = (returnData) => {
    try {
      addSalesReturn(returnData);
      showSuccess('تم إرجاع المنتجات بنجاح');
      setShowReturnModal(false);
      setReturnInvoice(null);
    } catch (error) {
      showError(error.message || 'حدث خطأ في عملية الإرجاع');
    }
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setReturnInvoice(null);
  };

  const paymentTypes = {
    'cash': 'نقدي',
    'deferred': 'آجل',
    'partial': 'جزئي'
  };

  // فحص صلاحية الوصول
  if (!canManageSales && !canViewInvoice) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
          <FaExclamationTriangle className="text-red-600 text-2xl" />
          <div>
            <h3 className="text-red-800 font-bold text-lg">وصول غير مصرح</h3>
            <p className="text-red-700">ليس لديك صلاحية لعرض أو إدارة فواتير المبيعات</p>
            <p className="text-red-600 text-sm mt-1">يرجى التواصل مع المدير للحصول على الصلاحية المطلوبة</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">إدارة فواتير المبيعات</h2>

      {/* شريط البحث والتصفية */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* البحث */}
          <div className="col-span-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ابحث برقم الفاتورة أو اسم العميل..."
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          {/* التصفية حسب نوع الدفع */}
          <div>
            <div className="relative">
              <select
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">كل الأنواع</option>
                <option value="cash">نقدي</option>
                <option value="deferred">آجل</option>
                <option value="partial">جزئي</option>
              </select>
              <FaFilter className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          عرض {filteredInvoices.length} من {salesInvoices.length} فاتورة
        </div>
      </div>

      {/* جدول الفواتير */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">رقم الفاتورة</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">العميل</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">التاريخ</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">نوع الدفع</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">المجموع</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">عدد المنتجات</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-3 py-8 text-center text-gray-500">
                    <FaFileInvoice className="mx-auto mb-2 text-3xl text-gray-300" />
                    <p>لا توجد فواتير</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const customer = customers.find(c => c.id === parseInt(invoice.customerId));
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-semibold text-blue-600">
                        #{invoice.id}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{customer?.name || 'غير محدد'}</div>
                        <div className="text-xs text-gray-500">{customer?.phone || '-'}</div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {new Date(invoice.date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          invoice.paymentType === 'cash' ? 'bg-green-100 text-green-700' :
                          invoice.paymentType === 'deferred' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {paymentTypes[invoice.paymentType] || invoice.paymentType}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-green-600">
                        {formatCurrency(invoice.total || 0)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {invoice.items?.length || 0}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-center gap-2">
                          {canViewInvoice && (
                            <button
                              onClick={() => handleView(invoice)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="عرض"
                            >
                              <FaFileInvoice />
                            </button>
                          )}
                          {canReturnInvoice && (
                            <button
                              onClick={() => handleReturn(invoice)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="إرجاع"
                            >
                              <FaUndo />
                            </button>
                          )}
                          {canPrintInvoice && (
                            <button
                              onClick={() => handlePrint(invoice)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="طباعة"
                            >
                              <FaPrint />
                            </button>
                          )}
                          {canDeleteInvoice && (
                            <button
                              onClick={() => handleDelete(invoice)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="حذف"
                            >
                              <FaTrash />
                            </button>
                          )}
                          {!canViewInvoice && !canReturnInvoice && !canPrintInvoice && !canDeleteInvoice && (
                            <span className="text-xs text-gray-400">غير متوفر</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal عرض تفاصيل الفاتورة */}
      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white sticky top-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">تفاصيل فاتورة المبيعات #{selectedInvoice.id}</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* معلومات الفاتورة */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">العميل</p>
                  <p className="font-semibold text-sm">
                    {customers.find(c => c.id === parseInt(selectedInvoice.customerId))?.name || 'غير محدد'}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">التاريخ</p>
                  <p className="font-semibold text-sm">
                    {new Date(selectedInvoice.date).toLocaleDateString('ar-EG')}
                  </p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">نوع الدفع</p>
                  <p className="font-semibold text-sm">
                    {paymentTypes[selectedInvoice.paymentType] || selectedInvoice.paymentType}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">المجموع الكلي</p>
                  <p className="font-bold text-lg text-purple-600">
                    {formatCurrency(selectedInvoice.total || 0)}
                  </p>
                </div>
              </div>

              {/* جدول المنتجات */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-800 mb-3">المنتجات</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-right text-xs font-semibold">#</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold">المنتج</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold">الكمية</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold">السعر</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(selectedInvoice.items || []).map((item, index) => {
                        const product = products.find(p => p.id === parseInt(item.productId));
                        // محاولة الحصول على اسم المنتج من مصادر متعددة
                        const productName = product?.name || item.productName || 'غير محدد';
                        const productCategory = product?.category || '-';
                        const itemTotal = (item.quantity || 0) * (item.price || 0);
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{index + 1}</td>
                            <td className="px-3 py-2">
                              <div className="font-medium">{productName}</div>
                              <div className="text-xs text-gray-500">{productCategory}</div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div>{item.quantity || 0}</div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div>{formatCurrency(item.price || 0)}</div>
                            </td>
                            <td className="px-3 py-2 text-center font-semibold text-blue-600">
                              {formatCurrency(itemTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* الملاحظات */}
              {selectedInvoice.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">ملاحظات</p>
                  <p className="text-sm">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 border-t flex justify-end gap-2">
              {canPrintInvoice && (
                <button
                  onClick={() => {
                    handlePrint(selectedInvoice);
                    setShowViewModal(false);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FaPrint /> طباعة
                </button>
              )}
              <button
                onClick={() => setShowViewModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة الإرجاع المنبثقة */}
      {showReturnModal && returnInvoice && (
        <SalesReturnModal
          invoice={returnInvoice}
          products={products}
          customers={customers}
          salesReturns={salesReturns}
          onSubmit={handleSalesReturn}
          onClose={closeReturnModal}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

// مكون النافذة المنبثقة للإرجاع في المبيعات
const SalesReturnModal = ({ invoice, products, customers, salesReturns, onSubmit, onClose, formatCurrency }) => {
  const [returnItems, setReturnItems] = useState([]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const customer = customers.find(c => c.id === parseInt(invoice.customerId));

  useEffect(() => {
    // حساب الكميات المرتجعة مسبقاً لكل منتج
    const itemsWithReturnInfo = invoice.items.map(item => {
      const previousReturns = salesReturns.filter(ret => 
        ret.invoiceId === invoice.id && ret.status !== 'cancelled'
      );
      
      let totalReturnedQty = 0;
      previousReturns.forEach(ret => {
        const retItem = ret.items.find(i => i.productId === item.productId);
        if (retItem) {
          totalReturnedQty += (retItem.quantity || 0) + (retItem.subQuantity || 0);
        }
      });
      
      const originalQty = parseInt(item.quantity) || 0;
      const availableQty = originalQty - totalReturnedQty;
      
      // الحصول على اسم المنتج من قائمة المنتجات
      const product = products.find(p => p.id === parseInt(item.productId));
      
      return {
        productId: item.productId,
        productName: product?.name || item.productName || 'غير محدد',
        originalQuantity: originalQty,
        originalPrice: item.price || 0,
        returnedQty: totalReturnedQty,
        availableQty: availableQty,
        returnQuantity: 0,
        returnSubQuantity: 0,
        selected: false
      };
    });
    
    setReturnItems(itemsWithReturnInfo);
  }, [invoice, salesReturns, products]);

  const handleItemSelect = (index) => {
    const updated = [...returnItems];
    updated[index].selected = !updated[index].selected;
    
    // إذا تم إلغاء التحديد، إعادة تعيين الكميات
    if (!updated[index].selected) {
      updated[index].returnQuantity = 0;
      updated[index].returnSubQuantity = 0;
    }
    
    setReturnItems(updated);
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...returnItems];
    const item = updated[index];
    
    updated[index].returnQuantity = Math.max(0, parseInt(value) || 0);
    
    // التحقق من عدم تجاوز الكمية المتاحة
    if (updated[index].returnQuantity > item.availableQty) {
      updated[index].returnQuantity = 0;
    }
    
    setReturnItems(updated);
  };

  const calculateTotalReturn = () => {
    return returnItems.reduce((total, item) => {
      if (item.selected) {
        const mainAmount = item.returnQuantity * item.originalPrice;
        return total + mainAmount;
      }
      return total;
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // التحقق من وجود منتجات محددة
    const selectedItems = returnItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      alert('يرجى اختيار منتج واحد على الأقل للإرجاع');
      return;
    }

    // التحقق من الكميات
    const hasInvalidQuantity = selectedItems.some(item => 
      item.returnQuantity === 0
    );
    
    if (hasInvalidQuantity) {
      alert('يرجى إدخال كمية صحيحة للمنتجات المحددة');
      return;
    }

    // التحقق من سبب الإرجاع
    if (!reason.trim()) {
      alert('يرجى إدخال سبب الإرجاع');
      return;
    }

    try {
      // إعداد بيانات الإرجاع
      const returnData = {
        invoiceId: invoice.id,
        items: selectedItems.map(item => ({
          productId: item.productId,
          quantity: item.returnQuantity,
          subQuantity: 0
        })),
        reason,
        notes
      };

      onSubmit(returnData);
    } catch (error) {
      alert(error.message || 'حدث خطأ في عملية الإرجاع');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* رأس النافذة */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">إرجاع فاتورة مبيعات</h2>
            <p className="text-sm text-gray-600">فاتورة رقم #{invoice.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            <FaTimes />
          </button>
        </div>

        {/* محتوى النافذة */}
        <div className="p-6">
          {/* معلومات الفاتورة الأصلية */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3">معلومات الفاتورة الأصلية</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">العميل</p>
                <p className="font-semibold text-sm">{customer?.name || 'غير محدد'}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">التاريخ</p>
                <p className="font-semibold text-sm">
                  {new Date(invoice.date).toLocaleDateString('ar-EG')}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">نوع الدفع</p>
                <p className="font-semibold text-sm">
                  {invoice.paymentType === 'cash' ? 'نقدي' : invoice.paymentType === 'deferred' ? 'آجل' : 'جزئي'}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">المجموع الكلي</p>
                <p className="font-bold text-lg text-purple-600">{formatCurrency(invoice.total || 0)}</p>
              </div>
            </div>
          </div>

          {/* نموذج الإرجاع */}
          <form onSubmit={handleSubmit}>
            {/* جدول المنتجات */}
            <div className="bg-white border rounded-lg mb-4">
              <div className="p-4 border-b">
                <h3 className="text-sm font-bold text-gray-800">المنتجات المراد إرجاعها</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 w-10">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            const updated = returnItems.map(item => ({
                              ...item,
                              selected: e.target.checked && item.availableQty > 0
                            }));
                            setReturnItems(updated);
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">المنتج</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">الكمية الأصلية</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">المرتجع سابقاً</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">المتاح للإرجاع</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">كمية الإرجاع</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">المبلغ المرتجع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {returnItems.map((item, index) => {
                      const product = products.find(p => p.id === parseInt(item.productId));
                      const returnAmount = item.returnQuantity * item.originalPrice;
                      const isDisabled = item.availableQty === 0;
                      
                      return (
                        <tr key={index} className={`hover:bg-gray-50 ${isDisabled ? 'opacity-50' : ''}`}>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => handleItemSelect(index)}
                              disabled={isDisabled}
                              className="rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-xs text-gray-500">{product?.category || '-'}</div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {item.originalQuantity}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                              {item.returnedQty}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.availableQty > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {item.availableQty}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {item.selected && (
                              <input
                                type="number"
                                value={item.returnQuantity}
                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                className="w-20 px-2 py-1 text-xs text-center border border-gray-300 rounded"
                                min="0"
                                max={item.availableQty}
                              />
                            )}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold text-red-600">
                            {item.selected ? returnAmount.toFixed(2) : '0.00'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* سبب الإرجاع والملاحظات */}
            <div className="bg-white border rounded-lg mb-4 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    سبب الإرجاع <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">اختر السبب...</option>
                    <option value="defective">منتج معيب</option>
                    <option value="damaged">منتج تالف</option>
                    <option value="wrong_item">منتج خاطئ</option>
                    <option value="customer_request">طلب العميل</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات إضافية</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل ملاحظات إضافية..."
                  />
                </div>
              </div>
            </div>

            {/* ملخص الإرجاع */}
            <div className="bg-white border rounded-lg mb-4 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">عدد المنتجات المحددة</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {returnItems.filter(i => i.selected).length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">إجمالي المبلغ المرتجع</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(calculateTotalReturn())}
                  </p>
                </div>
              </div>
            </div>

            {/* أزرار الحفظ */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                <FaUndo /> تنفيذ الإرجاع
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManageSalesInvoices;