// ======================================
// Manage Sales Invoices - إدارة فواتير المبيعات
// ======================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Common/Card';
import Table from '../../components/Common/Table';
import Input from '../../components/Common/Input';
import Select from '../../components/Common/Select';
import { FaFileInvoice, FaSearch, FaExclamationTriangle, FaTimes, FaUndo, FaEye, FaTrash, FaPrint, FaEdit, FaFilter, FaSort, FaShieldAlt, FaClock, FaCheckCircle } from 'react-icons/fa';
import InvoicePrint from '../../components/Common/InvoicePrint';

const ManageSalesInvoices = () => {
  const navigate = useNavigate();
  const { salesInvoices, customers, products, warehouses, deleteSalesInvoice } = useData();
  const { showSuccess, showError } = useNotification();
  const { settings } = useSystemSettings();
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [returnStatusFilter, setReturnStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setDeleteModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);
  
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
      autoAuditLog: true,
      maxReturnAmount: 50000,
      dailyReturnLimit: 100000,
      returnTimeLimit: 30
    },
    performance: {
      enableAutoProcessing: false,
      batchProcessingSize: 50
    }
  };

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
    if (!hasPermission('create_sales_returns')) {
      showError('ليس لديك صلاحية لإنشاء مرتجعات المبيعات');
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

    // التوجيه إلى صفحة إنشاء المرتجع
    navigate(`/sales/returns/new?invoiceId=${invoice.id}`);
  };

  const returnStatusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'none', label: 'لم يتم الإرجاع' },
    { value: 'pending', label: 'في الانتظار' },
    { value: 'completed', label: 'مُرجع' },
    { value: 'rejected', label: 'مرفوض' }
  ];

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

  // تشخيص البيانات للجدول
  console.log('بيانات الفواتير المفلترة للجدول:', {
    totalInvoices: salesInvoices.length,
    filteredInvoices: filteredInvoices.length,
    sampleInvoice: filteredInvoices[0] ? {
      id: filteredInvoices[0].id,
      idType: typeof filteredInvoices[0].id,
      customerId: filteredInvoices[0].customerId,
      fullData: filteredInvoices[0]
    } : 'لا توجد فواتير',
    allInvoiceIds: salesInvoices.map(inv => ({ 
      id: inv.id, 
      type: typeof inv.id,
      hasId: inv.id !== undefined && inv.id !== null,
      isString: typeof inv.id === 'string',
      isNumber: typeof inv.id === 'number'
    })),
    allFilteredInvoiceIds: filteredInvoices.map(inv => ({ 
      id: inv.id, 
      type: typeof inv.id,
      hasId: inv.id !== undefined && inv.id !== null,
      isString: typeof inv.id === 'string',
      isNumber: typeof inv.id === 'number',
      fullData: inv
    }))
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
    console.log('🚨 محاولة إرجاع الفاتورة - تشخيص شامل:', {
      fullInvoice: invoice,
      invoiceId: invoice?.id,
      invoiceIdType: typeof invoice?.id,
      invoiceIdValue: invoice?.id,
      isValidId: invoice?.id != null && invoice?.id !== '',
      hasInvoice: !!invoice,
      invoiceKeys: invoice ? Object.keys(invoice) : [],
      allData: invoice
    });
    
    if (!canReturnInvoice) {
      showError('ليس لديك صلاحية لإرجاع فواتير المبيعات');
      return;
    }
    
    // التحقق من صحة المعرف
    if (!invoice || !invoice.id || invoice.id === undefined || invoice.id === null || invoice.id === '') {
      console.error('معرف الفاتورة غير صحيح:', {
        invoice,
        invoiceId: invoice?.id,
        invoiceIdType: typeof invoice?.id,
        hasInvoice: !!invoice
      });
      showError(`خطأ في معرف الفاتورة - المعرف غير موجود أو فارغ. البيانات المستلمة: ${JSON.stringify(invoice)}`);
      return;
    }
    
    console.log('✅ تم التحقق من معرف الفاتورة بنجاح:', invoice.id);
    navigate(`/sales/return/${invoice.id}`);
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

  const handlePrintClick = (invoice) => {
    if (!canPrintInvoice) {
      showError('ليس لديك صلاحية لطباعة فواتير المبيعات');
      return;
    }
    setInvoiceToPrint(invoice);
    setShowPrintModal(true);
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

  const columns = [
    {
      header: 'رقم الفاتورة',
      accessor: 'id',
      render: (row) => (
        <span className="font-semibold text-blue-600">#{row.id}</span>
      )
    },
    {
      header: 'العميل',
      accessor: 'customerId',
      render: (row) => {
        const customer = customers.find(c => c.id === parseInt(row.customerId));
        return customer ? customer.name : '-';
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
          'deferred': { label: 'آجل', color: 'bg-yellow-100 text-yellow-700' },
          'partial': { label: 'جزئي', color: 'bg-blue-100 text-blue-700' }
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
      )
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">إدارة فواتير المبيعات</h1>

      <Card icon={<FaFileInvoice />}>
        {/* الفلاتر */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Input
            label="بحث"
            name="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم العميل أو رقم الفاتورة..."
            icon={<FaSearch />}
          />

          <Select
            label="نوع الدفع"
            name="paymentTypeFilter"
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value)}
            options={paymentTypeOptions}
          />

          <Select
            label="حالة الإرجاع"
            name="returnStatusFilter"
            value={returnStatusFilter}
            onChange={(e) => setReturnStatusFilter(e.target.value)}
            options={returnStatusOptions}
          />

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setPaymentTypeFilter('all');
                setReturnStatusFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <FaUndo />
              إعادة تعيين
            </button>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-600 text-sm font-medium">إجمالي الفواتير</div>
            <div className="text-2xl font-bold text-blue-800">{salesInvoices.length}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-yellow-600 text-sm font-medium">فواتير في الانتظار</div>
            <div className="text-2xl font-bold text-yellow-800">
              {salesInvoices.filter(inv => (inv.returnStatus || 'none') === 'pending').length}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 text-sm font-medium">فواتير مُرجعة</div>
            <div className="text-2xl font-bold text-green-800">
              {salesInvoices.filter(inv => (inv.returnStatus || 'none') === 'completed').length}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-purple-600 text-sm font-medium">قيمة الإرجاعات</div>
            <div className="text-2xl font-bold text-purple-800">
              {formatCurrency(
                salesInvoices
                  .filter(inv => (inv.returnStatus || 'none') === 'completed')
                  .reduce((sum, inv) => sum + (inv.total || 0), 0)
              )}
            </div>
          </div>
        </div>
        
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
          onView={handleView}
          onReturn={handleReturn}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onPrint={handlePrintClick}
        />
      </Card>

      {/* نافذة عرض التفاصيل */}
      {showDetailsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998]">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* رأس النافذة */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                تفاصيل الفاتورة #{selectedInvoice.id}
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <FaTimes />
              </button>
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
                  <span className="text-gray-600">حالة الدفع: </span>
                  {(() => {
                    const financialInfo = calculateFinancialInfo(selectedInvoice);
                    return (
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${financialInfo.statusColor}`}>
                        {financialInfo.status}
                      </span>
                    );
                  })()}
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

            {/* المعلومات المالية المتقدمة */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">المعلومات المالية:</h3>
              {(() => {
                const financialInfo = calculateFinancialInfo(selectedInvoice);
                return (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">المبلغ المدفوع:</span>
                        <span className="font-semibold text-green-600">
                          {financialInfo.amountPaid === null ? 'غير محدد' : formatCurrency(financialInfo.amountPaid)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">المبلغ المتبقي:</span>
                        <span className={`font-semibold ${financialInfo.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {financialInfo.remainingAmount === null ? 'غير محدد' : formatCurrency(financialInfo.remainingAmount)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">حالة الدفع:</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${financialInfo.statusColor}`}>
                          {financialInfo.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">رقم الفاتورة:</span>
                        <span className="font-semibold text-blue-600">#{selectedInvoice.id}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998]">
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

      {/* نافذة طباعة الفاتورة */}
      {showPrintModal && invoiceToPrint && (
        <InvoicePrint
          invoiceData={{
            formData: invoiceToPrint,
            items: invoiceToPrint.items || [],
            total: invoiceToPrint.total || 0,
            subtotal: invoiceToPrint.subtotal || invoiceToPrint.total || 0,
            discountAmount: invoiceToPrint.discountAmount || 0,
            customers,
            products,
            warehouses,
            paymentTypes: [
              { value: 'cash', label: 'نقدي' },
              { value: 'deferred', label: 'آجل' },
              { value: 'partial', label: 'جزئي' }
            ]
          }}
          type="sales"
          onClose={() => {
            setShowPrintModal(false);
            setInvoiceToPrint(null);
          }}
        />
      )}
    </div>
  );
};

export default ManageSalesInvoices;
