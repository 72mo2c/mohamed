// ======================================
// Manage Purchase Invoices - إدارة فواتير المشتريات (محسنة)
// ======================================

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { useAuth } from '../../context/AuthContext';
import { FaFileInvoice, FaEdit, FaTrash, FaPrint, FaSearch, FaFilter, FaUndo, FaExclamationTriangle, FaEye, FaClock, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { printInvoiceDirectly } from '../../utils/printUtils';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/Common/Table';

const ManagePurchaseInvoices = () => {
  const navigate = useNavigate();
  const { purchaseInvoices, suppliers, products, warehouses, deletePurchaseInvoice } = useData();
  const { showSuccess, showError } = useNotification();
  const { settings } = useSystemSettings();
  const { hasPermission } = useAuth();
  
  // متغيرات البحث والتصفية
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [returnStatusFilter, setReturnStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setDeleteModal] = useState(false);
  
  // إعدادات متقدمة للجدول
  const [tableConfig, setTableConfig] = useState({
    loading: false,
    error: null,
    sortable: true,
    filterable: true,
    pagination: true,
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    sortColumn: null,
    sortDirection: 'asc'
  });

  // إعدادات نظام الإرجاع
  const returnConfig = settings?.returnConfig || {
    security: {
      enableSecurityCheck: true,
      requireManagerApproval: true,
      maxReturnAmount: 50000,
      returnTimeLimit: 30
    }
  };

  // دالة تنسيق العملة
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

  // دالة حساب المعلومات المالية
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

  // دالة حساب حالة الإرجاع
  const calculateReturnInfo = (invoice) => {
    const returnStatus = invoice.returnStatus || 'none';
    
    switch (returnStatus) {
      case 'completed':
        return {
          status: 'مُرجع',
          statusColor: 'bg-green-100 text-green-700',
          icon: <FaCheckCircle className="text-green-500" />,
          canReturn: false,
          canEdit: false,
          canDelete: false
        };
      case 'pending':
        return {
          status: 'في انتظار الإرجاع',
          statusColor: 'bg-yellow-100 text-yellow-700',
          icon: <FaClock className="text-yellow-500" />,
          canReturn: false,
          canEdit: true,
          canDelete: true
        };
      case 'rejected':
        return {
          status: 'مرفوض',
          statusColor: 'bg-red-100 text-red-700',
          icon: <FaExclamationTriangle className="text-red-500" />,
          canReturn: true,
          canEdit: true,
          canDelete: true
        };
      default:
        return {
          status: 'لم يتم الإرجاع',
          statusColor: 'bg-gray-100 text-gray-700',
          icon: <FaFileInvoice className="text-gray-500" />,
          canReturn: true,
          canEdit: true,
          canDelete: true
        };
    }
  };

  // دالة معالجة طلب الإرجاع
  const handleReturn = async (invoice) => {
    if (!hasPermission('create_purchase_returns')) {
      showError('ليس لديك صلاحية لإنشاء مرتجعات المشتريات');
      return;
    }

    const returnInfo = calculateReturnInfo(invoice);
    if (!returnInfo.canReturn) {
      showError('لا يمكن إرجاع هذه الفاتورة');
      return;
    }

    // فحص الأمان
    if (returnConfig.security.enableSecurityCheck) {
      if (invoice.total > returnConfig.security.maxReturnAmount) {
        showError(`لا يمكن إرجاع فاتورة تزيد قيمتها عن ${formatCurrency(returnConfig.security.maxReturnAmount)} بدون موافقة المدير`);
        return;
      }
    }

    // فحص مهلة الإرجاع
    const invoiceDate = new Date(invoice.date);
    const currentDate = new Date();
    const daysDiff = Math.floor((currentDate - invoiceDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > returnConfig.security.returnTimeLimit) {
      showError(`لا يمكن إرجاع فاتورة مضى على إصدارها أكثر من ${returnConfig.security.returnTimeLimit} يوم`);
      return;
    }

    navigate(`/purchases/returns/new?invoiceId=${invoice.id}`);
  };

  // دالة التصفية والترتيب
  const filteredAndSortedData = React.useMemo(() => {
    let filtered = purchaseInvoices || [];

    // تطبيق البحث
    if (searchQuery) {
      filtered = filtered.filter(invoice => 
        invoice.id.toString().includes(searchQuery) ||
        invoice.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // تطبيق تصفية نوع الدفع
    if (paymentTypeFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.paymentType === paymentTypeFilter);
    }

    // تطبيق تصفية حالة الإرجاع
    if (returnStatusFilter !== 'all') {
      filtered = filtered.filter(invoice => (invoice.returnStatus || 'none') === returnStatusFilter);
    }

    // تطبيق الترتيب
    if (tableConfig.sortColumn) {
      filtered.sort((a, b) => {
        let aVal = a[tableConfig.sortColumn];
        let bVal = b[tableConfig.sortColumn];
        
        if (tableConfig.sortColumn === 'supplierName') {
          aVal = suppliers?.find(s => s.id === a.supplierId)?.name || '';
          bVal = suppliers?.find(s => s.id === b.supplierId)?.name || '';
        }
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (tableConfig.sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    return filtered;
  }, [purchaseInvoices, searchQuery, paymentTypeFilter, returnStatusFilter, tableConfig.sortColumn, tableConfig.sortDirection, suppliers]);

  // تحديث تعداد الصفحات
  useEffect(() => {
    const totalPages = Math.ceil(filteredAndSortedData.length / tableConfig.pageSize);
    setTableConfig(prev => ({ ...prev, totalPages }));
  }, [filteredAndSortedData.length]);

  // دوال التحكم في الجدول
  const handlePageChange = (newPage) => {
    setTableConfig(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleSort = (column, direction) => {
    setTableConfig(prev => ({
      ...prev,
      sortColumn: column,
      sortDirection: direction,
      currentPage: 1
    }));
  };

  // فحص الصلاحيات
  const canViewInvoice = hasPermission('view_purchase_invoices');
  const canReturnInvoice = hasPermission('return_purchase');
  const canEditInvoice = hasPermission('edit_purchase_invoice');
  const canDeleteInvoice = hasPermission('delete_purchase_invoice');
  const canPrintInvoice = hasPermission('print_invoices');
  const canManagePurchase = hasPermission('manage_purchases');

  // خيارات الفلاتر
  const paymentTypeOptions = [
    { value: 'all', label: 'جميع الأنواع' },
    { value: 'cash', label: 'نقدي' },
    { value: 'deferred', label: 'آجل' },
    { value: 'partial', label: 'جزئي' }
  ];

  const returnStatusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'none', label: 'لم يتم الإرجاع' },
    { value: 'pending', label: 'في الانتظار' },
    { value: 'completed', label: 'مُرجع' },
    { value: 'rejected', label: 'مرفوض' }
  ];

  // دوال التفاعل
  const handleViewClick = (invoice) => {
    if (!canViewInvoice) {
      showError('ليس لديك صلاحية لعرض فواتير المشتريات');
      return;
    }
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleEditClick = (invoice) => {
    if (!canEditInvoice) {
      showError('ليس لديك صلاحية لتعديل فواتير المشتريات');
      return;
    }
    navigate(`/purchases/new?editId=${invoice.id}`);
  };

  const handleDeleteClick = (invoice) => {
    if (!canDeleteInvoice) {
      showError('ليس لديك صلاحية لحذف فواتير المشتريات');
      return;
    }
    setSelectedInvoice(invoice);
    setShowDeleteModal(true);
  };

  const handlePrintClick = (invoice) => {
    if (!canPrintInvoice) {
      showError('ليس لديك صلاحية لطباعة فواتير المشتريات');
      return;
    }
    printInvoiceDirectly(invoice, 'purchase');
  };

  const handleDeleteConfirm = () => {
    if (!canDeleteInvoice) {
      showError('ليس لديك صلاحية لحذف فواتير المشتريات');
      setShowDeleteModal(false);
      return;
    }
    
    try {
      deletePurchaseInvoice(selectedInvoice.id);
      const itemsCount = selectedInvoice.items?.length || 0;
      const totalQuantity = selectedInvoice.items?.reduce((sum, item) => sum + parseInt(item.quantity), 0) || 0;
      
      showSuccess(`تم حذف الفاتورة بنجاح!\nتمت إعادة ${itemsCount} منتج بإجمالي كمية ${totalQuantity} إلى المخزون`);
      setShowDeleteModal(false);
      setSelectedInvoice(null);
    } catch (error) {
      showError(error.message || 'حدث خطأ في حذف الفاتورة');
      setShowDeleteModal(false);
    }
  };

  // فحص صلاحية الوصول
  if (!canManagePurchase && !canViewInvoice) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
          <FaExclamationTriangle className="text-red-600 text-2xl" />
          <div>
            <h3 className="text-red-800 font-bold text-lg">وصول غير مصرح</h3>
            <p className="text-red-600">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          </div>
        </div>
      </div>
    );
  }

  // تعريف الأعمدة
  const columns = [
    {
      header: 'رقم الفاتورة',
      accessor: 'id',
      sortable: true
    },
    {
      header: 'المورد',
      accessor: 'supplierName',
      render: (row) => {
        const supplier = suppliers?.find(s => s.id === row.supplierId);
        return supplier ? supplier.name : 'غير محدد';
      },
      sortable: true
    },
    {
      header: 'التاريخ',
      accessor: 'date',
      render: (row) => new Date(row.date).toLocaleDateString('ar-EG'),
      sortable: true
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
      header: 'حالة الإرجاع',
      accessor: 'returnStatus',
      render: (row) => {
        const returnInfo = calculateReturnInfo(row);
        return (
          <div className="flex items-center gap-2">
            {returnInfo.icon}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${returnInfo.statusColor}`}>
              {returnInfo.status}
            </span>
          </div>
        );
      }
    },
    {
      header: 'المجموع',
      accessor: 'total',
      render: (row) => (
        <span className="font-bold text-blue-600">{formatCurrency(row.total || 0)}</span>
      ),
      sortable: true
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">إدارة فواتير المشتريات</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* الفلاتر */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">بحث</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم المورد أو رقم الفاتورة..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الدفع</label>
            <select
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {paymentTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">حالة الإرجاع</label>
            <select
              value={returnStatusFilter}
              onChange={(e) => setReturnStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {returnStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setPaymentTypeFilter('all');
                setReturnStatusFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <FaUndo /> إعادة تعيين
            </button>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-600 text-sm font-medium">إجمالي الفواتير</div>
            <div className="text-2xl font-bold text-blue-800">{purchaseInvoices.length}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-yellow-600 text-sm font-medium">فواتير في الانتظار</div>
            <div className="text-2xl font-bold text-yellow-800">
              {purchaseInvoices.filter(inv => (inv.returnStatus || 'none') === 'pending').length}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 text-sm font-medium">فواتير مُرجعة</div>
            <div className="text-2xl font-bold text-green-800">
              {purchaseInvoices.filter(inv => (inv.returnStatus || 'none') === 'completed').length}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-purple-600 text-sm font-medium">قيمة الإرجاعات</div>
            <div className="text-2xl font-bold text-purple-800">
              {formatCurrency(
                purchaseInvoices
                  .filter(inv => (inv.returnStatus || 'none') === 'completed')
                  .reduce((sum, inv) => sum + (inv.total || 0), 0)
              )}
            </div>
          </div>
        </div>

        {/* الجدول */}
        <Table
          columns={columns}
          data={filteredAndSortedData.slice(
            (tableConfig.currentPage - 1) * tableConfig.pageSize,
            tableConfig.currentPage * tableConfig.pageSize
          )}
          loading={tableConfig.loading}
          error={tableConfig.error}
          sortable={tableConfig.sortable}
          filterable={tableConfig.filterable}
          pagination={tableConfig.pagination}
          currentPage={tableConfig.currentPage}
          totalPages={tableConfig.totalPages}
          pageSize={tableConfig.pageSize}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onEdit={canEditInvoice ? handleEditClick : null}
          onDelete={canDeleteInvoice ? handleDeleteClick : null}
          onView={canViewInvoice ? handleViewClick : null}
          onReturn={canReturnInvoice ? handleReturn : null}
          onPrint={canPrintInvoice ? handlePrintClick : null}
          returnConfig={returnConfig}
        />
      </div>

      {/* نافذة عرض التفاصيل */}
      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">تفاصيل فاتورة المشتريات #{selectedInvoice.id}</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <strong>المورد:</strong>
                <span className="mr-2">
                  {suppliers?.find(s => s.id === selectedInvoice.supplierId)?.name || 'غير محدد'}
                </span>
              </div>
              <div>
                <strong>التاريخ:</strong>
                <span className="mr-2">{new Date(selectedInvoice.date).toLocaleDateString('ar-EG')}</span>
              </div>
              <div>
                <strong>المجموع:</strong>
                <span className="mr-2 font-bold text-blue-600">{formatCurrency(selectedInvoice.total || 0)}</span>
              </div>
              <div>
                <strong>حالة الإرجاع:</strong>
                <span className="mr-2">
                  {(() => {
                    const returnInfo = calculateReturnInfo(selectedInvoice);
                    return (
                      <div className="flex items-center gap-2">
                        {returnInfo.icon}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${returnInfo.statusColor}`}>
                          {returnInfo.status}
                        </span>
                      </div>
                    );
                  })()}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-bold mb-3">عناصر الفاتورة</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-right">المنتج</th>
                      <th className="px-4 py-2 text-right">الكمية</th>
                      <th className="px-4 py-2 text-right">السعر</th>
                      <th className="px-4 py-2 text-right">المجموع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">
                          {products?.find(p => p.id === item.productId)?.name || 'غير محدد'}
                        </td>
                        <td className="px-4 py-2">{item.quantity}</td>
                        <td className="px-4 py-2">{formatCurrency(item.price || 0)}</td>
                        <td className="px-4 py-2">{formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تأكيد الحذف */}
      {showDeleteModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <FaExclamationTriangle className="text-red-600 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">تأكيد الحذف</h3>
              <p className="text-gray-600 mb-6">
                هل أنت متأكد من حذف فاتورة المشتريات رقم {selectedInvoice.id}؟
                <br />
                <strong>لا يمكن التراجع عن هذا الإجراء!</strong>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  نعم، احذف الفاتورة
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePurchaseInvoices;