// ======================================
// Manage Purchase Invoices - إدارة فواتير المشتريات (محسّنة)
// ======================================

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { useAuth } from '../../context/AuthContext';
import { FaFileInvoice, FaEdit, FaTrash, FaPrint, FaSearch, FaFilter, FaUndo, FaExclamationTriangle } from 'react-icons/fa';
import { printInvoiceDirectly } from '../../utils/printUtils';
import { useNavigate } from 'react-router-dom';

const ManagePurchaseInvoices = () => {
  const navigate = useNavigate();
  const { purchaseInvoices, suppliers, products, warehouses, deletePurchaseInvoice } = useData();
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

  // دالة حساب المعلومات المالية للفواتير
  const calculateFinancialInfo = (invoice) => {
    const total = invoice.total || 0;
    
    switch (invoice.paymentType) {
      case 'cash':
        return {
          status: 'مدفوعة بالكامل',
          statusColor: 'bg-green-100 text-green-700',
          amountPaid: total,
          remainingAmount: 0,
          paymentStatus: 'complete'
        };
      case 'deferred':
        return {
          status: 'مطلوبة الدفع',
          statusColor: 'bg-red-100 text-red-700',
          amountPaid: 0,
          remainingAmount: total,
          paymentStatus: 'pending'
        };
      case 'partial':
        return {
          status: 'دفع جزئي',
          statusColor: 'bg-yellow-100 text-yellow-700',
          amountPaid: null,
          remainingAmount: null,
          paymentStatus: 'partial'
        };
      default:
        return {
          status: 'غير محدد',
          statusColor: 'bg-gray-100 text-gray-700',
          amountPaid: 0,
          remainingAmount: total,
          paymentStatus: 'unknown'
        };
    }
  };

  // فحص الصلاحيات المحسن
  const canViewInvoice = hasPermission('view_purchase_invoices');
  const canReturnInvoice = hasPermission('return_purchase');
  const canEditInvoice = hasPermission('edit_purchase_invoice');
  const canDeleteInvoice = hasPermission('delete_purchase_invoice');
  const canPrintInvoice = hasPermission('print_invoices');
  const canManagePurchase = hasPermission('manage_purchases');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');

  // تصفية الفواتير
  const filteredInvoices = purchaseInvoices.filter(invoice => {
    const supplier = suppliers.find(s => s.id === parseInt(invoice.supplierId));
    const supplierName = supplier ? supplier.name : '';
    const matchesSearch = supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          invoice.id.toString().includes(searchQuery);
    const matchesFilter = paymentTypeFilter === 'all' || invoice.paymentType === paymentTypeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleReturn = (invoice) => {
    if (!canReturnInvoice) {
      showError('ليس لديك صلاحية لإرجاع فواتير المشتريات');
      return;
    }
    navigate(`/purchases/return/${invoice.id}`);
  };

  const handleView = (invoice) => {
    if (!canViewInvoice) {
      showError('ليس لديك صلاحية لعرض فواتير المشتريات');
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
        suppliers,
        products,
        warehouses
      };
      printInvoiceDirectly(invoiceData, 'purchase');
      showSuccess('تم إرسال الفاتورة للطباعة');
    } catch (error) {
      showError('حدث خطأ في طباعة الفاتورة');
    }
  };

  const handleEdit = (invoice) => {
    if (!canEditInvoice) {
      showError('ليس لديك صلاحية لتعديل فواتير المشتريات');
      return;
    }
    showSuccess('ميزة التعديل ستكون متاحة قريباً');
  };

  const handleDelete = (invoice) => {
    if (!canDeleteInvoice) {
      showError('ليس لديك صلاحية لحذف فواتير المشتريات');
      return;
    }
    
    if (window.confirm(`هل أنت متأكد من حذف الفاتورة #${invoice.id}؟\nسيتم إعادة الكميات إلى المخزون.`)) {
      try {
        deletePurchaseInvoice(invoice.id);
        
        const itemsCount = invoice.items?.length || 0;
        const totalQuantity = invoice.items?.reduce((sum, item) => sum + parseInt(item.quantity), 0) || 0;
        
        showSuccess(`تم حذف الفاتورة بنجاح!\nتمت إعادة ${itemsCount} منتج بإجمالي كمية ${totalQuantity} إلى المخزون`);
      } catch (error) {
        showError(error.message || 'حدث خطأ في حذف الفاتورة');
      }
    }
  };

  // إعدادات أنواع الدفع للفلترة
  const paymentTypeOptions = [
    { value: 'all', label: 'كل الأنواع' },
    { value: 'cash', label: 'نقدي' },
    { value: 'deferred', label: 'آجل' },
    { value: 'partial', label: 'جزئي' }
  ];

  // تعريف أنواع الدفع للنص
  const paymentTypes = {
    'cash': 'نقدي',
    'deferred': 'آجل',
    'partial': 'جزئي'
  };

  // فحص صلاحية الوصول
  if (!canManagePurchase && !canViewInvoice) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
          <FaExclamationTriangle className="text-red-600 text-2xl" />
          <div>
            <h3 className="text-red-800 font-bold text-lg">وصول غير مصرح</h3>
            <p className="text-red-700">ليس لديك صلاحية لعرض أو إدارة فواتير المشتريات</p>
            <p className="text-red-600 text-sm mt-1">يرجى التواصل مع المدير للحصول على الصلاحية المطلوبة</p>
          </div>
        </div>
      </div>
    );
  }

  // تعريف أعمدة الجدول المحسنة
  const columns = [
    {
      header: 'رقم الفاتورة',
      accessor: 'id',
      render: (row) => (
        <span className="font-semibold text-blue-600">#{row.id}</span>
      )
    },
    {
      header: 'المورد',
      accessor: 'supplierId',
      render: (row) => {
        const supplier = suppliers.find(s => s.id === parseInt(row.supplierId));
        return supplier ? supplier.name : '-';
      }
    },
    {
      header: 'التاريخ',
      accessor: 'date',
      render: (row) => new Date(row.date).toLocaleDateString('ar-EG')
    },
    {
      header: 'عدد المنتجات',
      accessor: 'items',
      render: (row) => row.items?.length || 0
    },
    {
      header: 'نوع الدفع',
      accessor: 'paymentType',
      render: (row) => {
        const types = {
          'cash': { label: 'نقدي', color: 'bg-green-100 text-green-700' },
          'deferred': { label: 'آجل', color: 'bg-red-100 text-red-700' },
          'partial': { label: 'جزئي', color: 'bg-yellow-100 text-yellow-700' }
        };
        const type = types[row.paymentType] || { label: row.paymentType, color: 'bg-gray-100 text-gray-700' };
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${type.color}`}>
            {type.label}
          </span>
        );
      }
    },
    {
      header: 'حالة الدفع',
      accessor: 'paymentStatus',
      render: (row) => {
        const financialInfo = calculateFinancialInfo(row);
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${financialInfo.statusColor}`}>
            {financialInfo.status}
          </span>
        );
      }
    },
    {
      header: 'المبلغ المدفوع',
      accessor: 'amountPaid',
      render: (row) => {
        const financialInfo = calculateFinancialInfo(row);
        if (financialInfo.amountPaid === null) {
          return <span className="text-gray-400">غير محدد</span>;
        }
        return (
          <span className="font-bold text-green-600">
            {formatCurrency(financialInfo.amountPaid || 0)}
          </span>
        );
      }
    },
    {
      header: 'المبلغ المتبقي',
      accessor: 'remainingAmount',
      render: (row) => {
        const financialInfo = calculateFinancialInfo(row);
        if (financialInfo.remainingAmount === null) {
          return <span className="text-gray-400">غير محدد</span>;
        }
        return (
          <span className={`font-bold ${financialInfo.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(financialInfo.remainingAmount || 0)}
          </span>
        );
      }
    },
    {
      header: 'المجموع',
      accessor: 'total',
      render: (row) => (
        <span className="font-bold text-blue-600">{formatCurrency(row.total || 0)}</span>
      )
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">إدارة فواتير المشتريات</h1>

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
                placeholder="ابحث برقم الفاتورة أو اسم المورد..."
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
                {paymentTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <FaFilter className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          عرض {filteredInvoices.length} من {purchaseInvoices.length} فاتورة مشتريات
        </div>
      </div>

      {/* جدول الفواتير المحسن */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                {columns.map((column, index) => (
                  <th key={index} className="px-4 py-3 text-right text-xs font-semibold text-gray-700 border-l border-gray-200 first:border-l-0">
                    {column.header}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <FaFileInvoice className="mb-3 text-4xl text-gray-300" />
                      <p className="text-lg font-medium">لا توجد فواتير</p>
                      <p className="text-sm text-gray-400">لم يتم العثور على أي فواتير مطابقة للبحث</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="px-4 py-3 border-l border-gray-100 first:border-l-0">
                        {column.render ? column.render(invoice) : invoice[column.accessor]}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        {canViewInvoice && (
                          <button
                            onClick={() => handleView(invoice)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="عرض التفاصيل"
                          >
                            <FaFileInvoice size={12} />
                          </button>
                        )}
                        {canReturnInvoice && (
                          <button
                            onClick={() => handleReturn(invoice)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                            title="إرجاع الفاتورة"
                          >
                            <FaUndo size={12} />
                          </button>
                        )}
                        {canPrintInvoice && (
                          <button
                            onClick={() => handlePrint(invoice)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="طباعة الفاتورة"
                          >
                            <FaPrint size={12} />
                          </button>
                        )}
                        {canDeleteInvoice && (
                          <button
                            onClick={() => handleDelete(invoice)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="حذف الفاتورة"
                          >
                            <FaTrash size={12} />
                          </button>
                          )}
                        {!canViewInvoice && !canReturnInvoice && !canPrintInvoice && !canDeleteInvoice && (
                          <span className="text-xs text-gray-400 px-2">غير متوفر</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* إحصائيات سريعة */}
        {filteredInvoices.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 border-t">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>إجمالي الفواتير: {filteredInvoices.length}</span>
              <span>
                المجموع الكلي: <span className="font-bold text-blue-600">
                  {formatCurrency(
                    filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
                  )}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal عرض تفاصيل الفاتورة */}
      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white sticky top-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">تفاصيل فاتورة المشتريات #{selectedInvoice.id}</h3>
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
              {/* معلومات الفاتورة المحسنة */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">المورد</p>
                  <p className="font-semibold text-sm">
                    {suppliers.find(s => s.id === parseInt(selectedInvoice.supplierId))?.name || 'غير محدد'}
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
                  <p className="text-xs text-gray-600 mb-1">حالة الدفع</p>
                  <p className="font-semibold text-sm">
                    {(() => {
                      const financialInfo = calculateFinancialInfo(selectedInvoice);
                      return financialInfo.status;
                    })()}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">المبلغ المدفوع</p>
                  <p className="font-semibold text-sm text-red-600">
                    {(() => {
                      const financialInfo = calculateFinancialInfo(selectedInvoice);
                      return financialInfo.amountPaid === null ? 'غير محدد' : formatCurrency(financialInfo.amountPaid);
                    })()}
                  </p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">المبلغ المتبقي</p>
                  <p className="font-semibold text-sm text-orange-600">
                    {(() => {
                      const financialInfo = calculateFinancialInfo(selectedInvoice);
                      return financialInfo.remainingAmount === null ? 'غير محدد' : formatCurrency(financialInfo.remainingAmount);
                    })()}
                  </p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">عدد المنتجات</p>
                  <p className="font-semibold text-sm">
                    {selectedInvoice.items?.length || 0}
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
                        const itemTotal = (item.quantity || 0) * (item.price || 0) + 
                                         (item.subQuantity || 0) * (item.subPrice || 0);
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{index + 1}</td>
                            <td className="px-3 py-2">
                              <div className="font-medium">{productName}</div>
                              <div className="text-xs text-gray-500">{productCategory}</div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div>{item.quantity || 0} أساسي</div>
                              {item.subQuantity > 0 && (
                                <div className="text-xs text-gray-500">{item.subQuantity} فرعي</div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div>{formatCurrency(item.price || 0)}</div>
                              {item.subPrice > 0 && (
                                <div className="text-xs text-gray-500">{formatCurrency(item.subPrice || 0)}</div>
                              )}
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
    </div>
  );
};

export default ManagePurchaseInvoices;
