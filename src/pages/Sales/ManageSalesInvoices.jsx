// ======================================
// Manage Sales Invoices - إدارة فواتير المبيعات
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
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnInvoice, setReturnInvoice] = useState(null);

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
  const canEditInvoice = hasPermission('edit_sales_invoice');
  const canDeleteInvoice = hasPermission('delete_sales_invoice');
  const canManageSales = hasPermission('manage_sales');
  const canPrintInvoice = hasPermission('print_invoices');

  // فلترة الفواتير
  const filteredInvoices = salesInvoices.filter(invoice => {
    const customer = customers.find(c => c.id === parseInt(invoice.customerId));
    const customerName = customer ? customer.name : '';
    
    const matchesSearch = customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          invoice.id.toString().includes(searchQuery);
    
    const matchesPaymentType = paymentTypeFilter === 'all' || invoice.paymentType === paymentTypeFilter;
    
    return matchesSearch && matchesPaymentType;
  });

  const handleView = (invoice) => {
    if (!canViewInvoice) {
      showError('ليس لديك صلاحية لعرض فواتير المبيعات');
      return;
    }
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const handleReturn = (invoice) => {
    if (!canReturnInvoice) {
      showError('ليس لديك صلاحية لإرجاع فواتير المبيعات');
      return;
    }
    setReturnInvoice(invoice);
    setShowReturnModal(true);
  };

  const handlePrint = (invoice) => {
    if (!canPrintInvoice) {
      showError('ليس لديك صلاحية لطباعة فواتير المبيعات');
      return;
    }
    try {
      const invoiceData = {
        ...invoice,
        customer: customers.find(c => c.id === parseInt(invoice.customerId)),
        items: invoice.items?.map(item => ({
          ...item,
          product: products.find(p => p.id === parseInt(item.productId))
        }))
      };
      printInvoiceDirectly(invoiceData, 'sales');
    } catch (error) {
      showError(error.message || 'حدث خطأ في طباعة الفاتورة');
    }
  };

  const handleEdit = (invoice) => {
    if (!canEditInvoice) {
      showError('ليس لديك صلاحية لتعديل فواتير المبيعات');
      return;
    }
    showSuccess('ميزة التعديل ستكون متاحة قريباً');
  };

  const handleDeleteClick = (invoice) => {
    if (!canDeleteInvoice) {
      showError('ليس لديك صلاحية لحذف فواتير المبيعات');
      return;
    }
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!canDeleteInvoice) {
      showError('ليس لديك صلاحية لحذف فواتير المبيعات');
      setShowDeleteModal(false);
      return;
    }
    
    try {
      deleteSalesInvoice(invoiceToDelete.id);
      
      const itemsCount = invoiceToDelete.items?.length || 0;
      const totalQuantity = invoiceToDelete.items?.reduce((sum, item) => sum + parseInt(item.quantity), 0) || 0;
      
      showSuccess(`تم حذف الفاتورة بنجاح!\nتمت إعادة ${itemsCount} منتج بإجمالي كمية ${totalQuantity} إلى المخزون`);
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
    } catch (error) {
      showError(error.message || 'حدث خطأ في حذف الفاتورة');
      setShowDeleteModal(false);
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

  const paymentTypeOptions = [
    { value: 'all', label: 'كل الأنواع' },
    { value: 'cash', label: 'نقدي' },
    { value: 'deferred', label: 'آجل' },
    { value: 'partial', label: 'جزئي' }
  ];

  // فحص صلاحية الوصول
  if (!canManageSales && !canViewInvoice) {
    return (
      <div>
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



  const paymentTypeOptions = [
    { value: 'all', label: 'كل الأنواع' },
    { value: 'cash', label: 'نقدي' },
    { value: 'deferred', label: 'آجل' },
    { value: 'partial', label: 'جزئي' }
  ];

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

        {/* عدد النتائج */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            عرض <span className="font-semibold">{filteredInvoices.length}</span> من أصل <span className="font-semibold">{salesInvoices.length}</span> فاتورة
          </p>
          {filteredInvoices.length > 0 && (
            <div className="text-sm text-gray-500">
              إجمالي القيمة: <span className="font-semibold text-green-600">
                {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0))}
              </span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                  رقم الفاتورة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                  العميل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                  عدد المنتجات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                  نوع الدفع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                  المجموع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices && filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => {
                  const customer = customers.find(c => c.id === parseInt(invoice.customerId));
                  const customerName = customer ? customer.name : '-';
                  
                  // تنسيق نوع الدفع
                  const paymentTypes = {
                    'cash': { label: 'نقدي', color: 'bg-green-100 text-green-700' },
                    'deferred': { label: 'آجل', color: 'bg-yellow-100 text-yellow-700' },
                    'partial': { label: 'جزئي', color: 'bg-blue-100 text-blue-700' }
                  };
                  const paymentType = paymentTypes[invoice.paymentType] || { 
                    label: invoice.paymentType, 
                    color: 'bg-gray-100 text-gray-700' 
                  };
                  
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold text-blue-600">#{invoice.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium text-gray-900">{customerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-sm text-gray-900">
                          {new Date(invoice.date).toLocaleDateString('ar-EG')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="text-sm font-medium text-gray-900">
                          {invoice.items?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentType.color}`}>
                          {paymentType.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-bold text-green-600">
                          {formatCurrency(invoice.total || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                              onClick={() => handleDeleteClick(invoice)}
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
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    لا توجد فواتير مبيعات للعرض
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* جدول الفواتير */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  رقم الفاتورة
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  العميل
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  نوع الدفع
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  المجموع
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices && filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => {
                  const customer = customers.find(c => c.id === parseInt(invoice.customerId));
                  const customerName = customer ? customer.name : '-';
                  
                  // تنسيق نوع الدفع
                  const paymentTypes = {
                    'cash': { label: 'نقدي', color: 'bg-green-100 text-green-700' },
                    'deferred': { label: 'آجل', color: 'bg-yellow-100 text-yellow-700' },
                    'partial': { label: 'جزئي', color: 'bg-blue-100 text-blue-700' }
                  };
                  const paymentType = paymentTypes[invoice.paymentType] || { 
                    label: invoice.paymentType, 
                    color: 'bg-gray-100 text-gray-700' 
                  };
                  
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-blue-600">#{invoice.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{customerName}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-gray-900">
                          {new Date(invoice.date).toLocaleDateString('ar-EG')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentType.color}`}>
                          {paymentType.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-green-600">
                          {formatCurrency(invoice.total || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1">
                          {canViewInvoice && (
                            <button
                              onClick={() => handleView(invoice)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="عرض"
                            >
                              <FaFileInvoice size={14} />
                            </button>
                          )}
                          {canReturnInvoice && (
                            <button
                              onClick={() => handleReturn(invoice)}
                              className="p-2 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                              title="إرجاع"
                            >
                              <FaUndo size={14} />
                            </button>
                          )}
                          {canPrintInvoice && (
                            <button
                              onClick={() => handlePrint(invoice)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors"
                              title="طباعة"
                            >
                              <FaPrint size={14} />
                            </button>
                          )}
                          {canDeleteInvoice && (
                            <button
                              onClick={() => handleDeleteClick(invoice)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="حذف"
                            >
                              <FaTrash size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <FaFileInvoice className="text-4xl text-gray-300 mb-2" />
                      <p className="text-lg font-medium">لا توجد فواتير مبيعات</p>
                      <p className="text-sm">لم يتم العثور على أي فواتير مطابقة لمعايير البحث</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

            {/* معلومات الفاتورة */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">معلومات عامة:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">العميل: </span>
                  <span className="font-semibold text-gray-800">
                    {customers.find(c => c.id === parseInt(selectedInvoice.customerId))?.name || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">التاريخ: </span>
                  <span className="font-semibold text-gray-800">
                    {new Date(selectedInvoice.date).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">نوع الدفع: </span>
                  <span className="font-semibold text-gray-800">
                    {{
                      'cash': 'نقدي',
                      'deferred': 'آجل',
                      'partial': 'جزئي'
                    }[selectedInvoice.paymentType] || selectedInvoice.paymentType}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">الحالة: </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                    مكتملة
                  </span>
                </div>
              </div>
            </div>

            {/* المنتجات */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">المنتجات:</h3>
              <div className="space-y-2">
                {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                  selectedInvoice.items.map((item, index) => {
                    const product = products.find(p => p.id === parseInt(item.productId));
                    // محاولة الحصول على اسم المنتج من مصادر متعددة
                    const productName = product?.name || item.productName || 'غير محدد';
                    const warehouse = warehouses.find(w => w.id === product?.warehouseId);
                    return (
                      <div key={index} className="flex justify-between items-center bg-white p-3 rounded">
                        <div className="flex-1">
                          <span className="font-semibold text-gray-800">
                            {productName} - {warehouse?.name || 'غير محدد'}
                          </span>
                          <div className="text-xs text-gray-600">
                            {item.quantity} × {formatCurrency(parseFloat(item.price))}
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-green-600">
                            {formatCurrency(item.quantity * item.price)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-4">لا توجد منتجات</p>
                )}
              </div>
            </div>

            {/* الملاحظات */}
            {selectedInvoice.notes && (
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">ملاحظات:</h3>
                <p className="text-gray-700 text-sm">{selectedInvoice.notes}</p>
              </div>
            )}

            {/* المجموع */}
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">المجموع الإجمالي:</span>
                <span className="text-3xl font-bold text-green-600">
                  {formatCurrency(selectedInvoice.total || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تأكيد الحذف */}
      {showDeleteModal && invoiceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            {/* رمز التحذير */}
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 rounded-full p-4">
                <FaExclamationTriangle className="text-4xl text-red-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              تأكيد حذف الفاتورة
            </h2>

            <div className="bg-yellow-50 p-4 rounded-lg mb-4 border border-yellow-200">
              <p className="text-gray-700 text-center mb-2">
                هل أنت متأكد من حذف الفاتورة <span className="font-bold">#{invoiceToDelete.id}</span>؟
              </p>
              <p className="text-sm text-gray-600 text-center">
                سيتم إعادة الكميات إلى المخزون تلقائياً
              </p>
            </div>

            {/* تفاصيل الفاتورة */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">العميل: </span>
                  <span className="font-semibold">
                    {customers.find(c => c.id === parseInt(invoiceToDelete.customerId))?.name || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">المجموع: </span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(invoiceToDelete.total || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">عدد المنتجات: </span>
                  <span className="font-semibold">{invoiceToDelete.items?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">التاريخ: </span>
                  <span className="font-semibold">
                    {new Date(invoiceToDelete.date).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </div>
            </div>

            {/* الأزرار */}
            <div className="flex gap-4">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                نعم، احذف الفاتورة
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setInvoiceToDelete(null);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة عرض التفاصيل */}
      {showDetailsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white sticky top-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">تفاصيل فاتورة المبيعات #{selectedInvoice.id}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
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
                    {{
                      'cash': 'نقدي',
                      'deferred': 'آجل',
                      'partial': 'جزئي'
                    }[selectedInvoice.paymentType] || selectedInvoice.paymentType}
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
                    setShowDetailsModal(false);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FaPrint /> طباعة
                </button>
              )}
              <button
                onClick={() => setShowDetailsModal(false)}
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
        <ReturnModal
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

// مكون النافذة المنبثقة للإرجاع
const ReturnModal = ({ invoice, products, customers, salesReturns, onSubmit, onClose, formatCurrency }) => {
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
