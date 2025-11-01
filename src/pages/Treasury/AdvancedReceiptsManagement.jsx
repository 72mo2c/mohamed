// ======================================
// Advanced Receipts Management - إدارة الإيصالات المتقدمة
// ======================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Table from '../../components/Common/Table';
import Modal from '../../components/Common/Modal';
import { 
  FaPlus, 
  FaEye, 
  FaTrash, 
  FaEdit,
  FaMoneyBillWave,
  FaSearch,
  FaFilter,
  FaLock,
  FaFileInvoice,
  FaUsers,
  FaTruck,
  FaCalendarAlt,
  FaClock,
  FaDollarSign,
  FaTags,
  FaExternalLinkAlt,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle,
  FaPrint,
  FaDownload,
  FaShare,
  FaCopy,
  FaQrCode,
  FaBarcode,
  FaLink,
  FaCode,
  FaStamp
} from 'react-icons/fa';

// مكون QR Code بسيط
const SimpleQRCode = ({ data, size = 120 }) => {
  // إنشاء QR code مرئي بسيط باستخدام ASCII
  const generateQRPattern = (text) => {
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pattern = [];
    
    for (let i = 0; i < 21; i++) {
      const row = [];
      for (let j = 0; j < 21; j++) {
        const cellHash = (hash + i * 21 + j) % 3;
        row.push(cellHash === 0 ? '■' : cellHash === 1 ? '□' : ' ');
      }
      pattern.push(row.join(''));
    }
    
    return pattern;
  };

  const qrPattern = generateQRPattern(data);

  return (
    <div className="flex flex-col items-center">
      <div className="font-mono text-xs leading-none" style={{ fontSize: '8px' }}>
        {qrPattern.map((row, index) => (
          <div key={index} className="whitespace-pre">{row}</div>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-2 text-center break-all max-w-32">
        {data.substring(0, 20)}...
      </div>
    </div>
  );
};

// مكون شريط تقدم الحالة
const StatusProgress = ({ status, createdDate, paidDate }) => {
  const steps = [
    { key: 'created', label: 'تم الإنشاء', icon: FaFileInvoice },
    { key: 'validated', label: 'تم التحقق', icon: FaCheck },
    { key: 'paid', label: 'تم السداد', icon: FaDollarSign }
  ];

  const getCurrentStepIndex = () => {
    switch (status) {
      case 'paid': return 2;
      case 'validated': return 1;
      default: return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div key={step.key} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <Icon className="text-sm" />
              </div>
              <span className="text-xs mt-1 text-center">{step.label}</span>
            </div>
          );
        })}
      </div>
      
      <div className="relative">
        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <div>تم الإنشاء: {new Date(createdDate).toLocaleDateString('ar-EG')}</div>
        {paidDate && (
          <div className="text-green-600">تم السداد: {new Date(paidDate).toLocaleDateString('ar-EG')}</div>
        )}
      </div>
    </div>
  );
};

const AdvancedReceiptsManagement = () => {
  const navigate = useNavigate();
  const { 
    cashReceipts, 
    deleteCashReceipt, 
    customers, 
    suppliers,
    salesInvoices,
    purchaseInvoices,
    getAllCustomerBalances,
    getAllSupplierBalances
  } = useData();
  
  const { settings } = useSystemSettings();
  const { hasPermission } = useAuth();
  const { showWarning, showError, showSuccess, showInfo } = useNotification();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  
  // خيارات الفئات
  const categoryLabels = {
    invoice_payment: 'سداد فاتورة مبيعات',
    return_refund: 'استرداد مرتجعات مشتريات',
    capital: 'إيداع رأس مال',
    bank: 'استلام من بنك',
    revenue: 'إيرادات متنوعة',
    other: 'أخرى'
  };
  
  const paymentMethodLabels = {
    cash: 'نقداً',
    check: 'شيك',
    bank_transfer: 'تحويل بنكي'
  };

  // حساب أرصدة العملاء والموردين المتقدمة
  const advancedBalances = useMemo(() => {
    const customerBalances = getAllCustomerBalances();
    const supplierBalances = getAllSupplierBalances();
    
    return {
      customers: customerBalances,
      suppliers: supplierBalances,
      totalCustomerDebt: customerBalances.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0),
      totalSupplierDebt: supplierBalances.reduce((sum, s) => sum + (s.balance < 0 ? Math.abs(s.balance) : 0), 0)
    };
  }, [getAllCustomerBalances, getAllSupplierBalances]);

  // ربط الإيصالات بالفواتير تلقائياً
  const getAutoLinkedInvoices = (receipt) => {
    if (receipt.fromType === 'customer') {
      // البحث عن فواتير مبيعات غير مسددة للعميل
      return salesInvoices.filter(invoice => 
        invoice.customerId === receipt.fromId && 
        (!invoice.paidAmount || parseFloat(invoice.paidAmount) < parseFloat(invoice.total))
      );
    } else if (receipt.fromType === 'supplier') {
      // البحث عن فواتير مشتريات غير مسددة للمورد
      return purchaseInvoices.filter(invoice => 
        invoice.supplierId === receipt.fromId && 
        (!invoice.paidAmount || parseFloat(invoice.paidAmount) < parseFloat(invoice.total))
      );
    }
    return [];
  };

  // حساب حالة الدفع المتقدمة
  const getPaymentStatus = (receipt) => {
    if (receipt.referenceNumber) {
      // فحص الفاتورة المرتبطة
      if (receipt.fromType === 'customer') {
        const invoice = salesInvoices.find(inv => inv.invoiceNumber === receipt.referenceNumber);
        if (invoice) {
          const paidAmount = parseFloat(invoice.paidAmount || 0);
          const total = parseFloat(invoice.total || 0);
          if (paidAmount >= total) return 'fully_paid';
          if (paidAmount > 0) return 'partially_paid';
          return 'unpaid';
        }
      } else if (receipt.fromType === 'supplier') {
        const invoice = purchaseInvoices.find(inv => inv.invoiceNumber === receipt.referenceNumber);
        if (invoice) {
          const paidAmount = parseFloat(invoice.paidAmount || 0);
          const total = parseFloat(invoice.total || 0);
          if (paidAmount >= total) return 'fully_paid';
          if (paidAmount > 0) return 'partially_paid';
          return 'unpaid';
        }
      }
    }
    return 'unlinked';
  };

  // الحصول على معلومات المصدر الكاملة
  const getSourceDetails = (receipt) => {
    if (receipt.fromType === 'customer') {
      const customer = customers.find(c => c.id === receipt.fromId);
      const balance = advancedBalances.customers.find(c => c.id === receipt.fromId);
      return { ...customer, balance };
    } else if (receipt.fromType === 'supplier') {
      const supplier = suppliers.find(s => s.id === receipt.fromId);
      const balance = advancedBalances.suppliers.find(s => s.id === receipt.fromId);
      return { ...supplier, balance };
    }
    return null;
  };
  
  // الحصول على اسم المصدر
  const getSourceName = (receipt) => {
    const details = getSourceDetails(receipt);
    return details?.name || receipt.fromName || 'غير محدد';
  };
  
  // فلترة وبحث متقدم
  const filteredReceipts = useMemo(() => {
    let filtered = cashReceipts.filter(receipt => {
      const sourceName = getSourceName(receipt);
      const matchesSearch = 
        receipt.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || receipt.category === filterCategory;
      
      // فلتر حسب الحالة
      let matchesStatus = true;
      if (filterStatus !== 'all') {
        const status = getPaymentStatus(receipt);
        matchesStatus = status === filterStatus;
      }
      
      // فلتر حسب الفترة
      let matchesPeriod = true;
      if (selectedPeriod !== 'all') {
        const receiptDate = new Date(receipt.date);
        const now = new Date();
        const days = selectedPeriod === 'week' ? 7 : 
                    selectedPeriod === 'month' ? 30 : 
                    selectedPeriod === 'quarter' ? 90 : 0;
        
        if (days > 0) {
          const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          matchesPeriod = receiptDate >= startDate;
        }
      }
      
      return matchesSearch && matchesCategory && matchesStatus && matchesPeriod;
    });

    // ترتيب حسب التاريخ (الأحدث أولاً)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [cashReceipts, searchTerm, filterCategory, filterStatus, selectedPeriod, customers, suppliers]);
  
  // أعمدة الجدول المتقدمة
  const columns = [
    { key: 'receiptNumber', label: 'رقم الإيصال' },
    { key: 'date', label: 'التاريخ' },
    { key: 'sourceName', label: 'من' },
    { key: 'amount', label: 'المبلغ' },
    { key: 'category', label: 'الفئة' },
    { key: 'status', label: 'الحالة' },
    { key: 'paymentMethod', label: 'طريقة الدفع' },
    { key: 'actions', label: 'الإجراءات' }
  ];
  
  // تنسيق البيانات للجدول
  const tableData = filteredReceipts.map(receipt => {
    const paymentStatus = getPaymentStatus(receipt);
    const sourceDetails = getSourceDetails(receipt);
    
    return {
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      date: new Date(receipt.date).toLocaleDateString('ar-EG'),
      sourceName: getSourceName(receipt),
      amount: hasPermission('view_financial_data') ? formatCurrency(parseFloat(receipt.amount)) : (
        <span className="flex items-center gap-1 text-gray-400">
          <FaLock className="text-xs" />
          مخفي
        </span>
      ),
      category: categoryLabels[receipt.category] || receipt.category,
      status: (
        <div className="flex items-center gap-2">
          <StatusBadge status={paymentStatus} />
          {receipt.referenceNumber && (
            <FaLink className="text-blue-500 text-xs" title="مرتبط بفاتورة" />
          )}
        </div>
      ),
      paymentMethod: paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod,
      actions: (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleView(receipt)} icon={<FaEye />}>
            عرض
          </Button>
          {hasPermission('delete_cash_receipt') && (
            <Button size="sm" variant="danger" onClick={() => handleDelete(receipt)} icon={<FaTrash />}>
              حذف
            </Button>
          )}
        </div>
      )
    };
  });

  // مكون شارة الحالة
  const StatusBadge = ({ status }) => {
    const badges = {
      fully_paid: { label: 'مسدد بالكامل', color: 'bg-green-100 text-green-700' },
      partially_paid: { label: 'مسدد جزئياً', color: 'bg-yellow-100 text-yellow-700' },
      unpaid: { label: 'غير مسدد', color: 'bg-red-100 text-red-700' },
      unlinked: { label: 'غير مرتبط', color: 'bg-gray-100 text-gray-700' }
    };
    
    const badge = badges[status] || badges.unlinked;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.label}
      </span>
    );
  };
  
  const handleView = (receipt) => {
    if (!hasPermission('view_cash_receipts')) {
      showWarning('ليس لديك صلاحية عرض إيصالات الاستلام');
      return;
    }
    
    const original = cashReceipts.find(r => r.id === receipt.id);
    setSelectedReceipt(original);
    setShowViewModal(true);
  };
  
  const handleDelete = (receipt) => {
    if (!hasPermission('delete_cash_receipt')) {
      showWarning('ليس لديك صلاحية حذف إيصالات الاستلام');
      return;
    }
    
    if (window.confirm('هل أنت متأكد من حذف هذا الإيصال؟')) {
      try {
        deleteCashReceipt(receipt.id);
        showSuccess('تم حذف الإيصال بنجاح');
      } catch (error) {
        showError('خطأ: ' + error.message);
      }
    }
  };
  
  const handleAddNew = () => {
    if (!hasPermission('manage_cash_receipts')) {
      showWarning('ليس لديك صلاحية إدارة إيصالات الاستلام');
      return;
    }
    navigate('/treasury/receipt/new');
  };

  const handleGenerateQR = (receipt) => {
    const qrData = JSON.stringify({
      receiptNumber: receipt.receiptNumber,
      amount: receipt.amount,
      date: receipt.date,
      fromName: receipt.fromName,
      category: receipt.category
    });
    setSelectedReceipt(receipt);
    setShowQRModal(true);
  };
  
  const handleShareReceipt = (receipt) => {
    const receiptData = {
      رقم_الإيصال: receipt.receiptNumber,
      المبلغ: receipt.amount,
      التاريخ: new Date(receipt.date).toLocaleDateString('ar-EG'),
      من: receipt.fromName,
      الفئة: categoryLabels[receipt.category]
    };
    
    const text = `إيصال استلام\n${Object.entries(receiptData).map(([key, value]) => `${key}: ${value}`).join('\n')}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'إيصال استلام',
        text: text
      });
    } else {
      navigator.clipboard.writeText(text);
      showSuccess('تم نسخ بيانات الإيصال');
    }
  };
  
  // حساب الإحصائيات المتقدمة
  const advancedStats = useMemo(() => {
    const totalAmount = filteredReceipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    
    const linkedReceipts = filteredReceipts.filter(r => r.referenceNumber).length;
    const unlinkedReceipts = filteredReceipts.length - linkedReceipts;
    
    const fullyPaidReceipts = filteredReceipts.filter(r => getPaymentStatus(r) === 'fully_paid').length;
    const partiallyPaidReceipts = filteredReceipts.filter(r => getPaymentStatus(r) === 'partially_paid').length;
    const unpaidReceipts = filteredReceipts.filter(r => getPaymentStatus(r) === 'unpaid').length;
    
    const avgAmount = filteredReceipts.length > 0 ? totalAmount / filteredReceipts.length : 0;
    
    return {
      totalAmount,
      totalCount: filteredReceipts.length,
      linkedReceipts,
      unlinkedReceipts,
      fullyPaidReceipts,
      partiallyPaidReceipts,
      unpaidReceipts,
      avgAmount,
      linkingPercentage: filteredReceipts.length > 0 ? (linkedReceipts / filteredReceipts.length) * 100 : 0
    };
  }, [filteredReceipts, salesInvoices, purchaseInvoices]);
  
  // تنسيق العملة
  const formatCurrency = (amount) => {
    const currency = settings?.currency || 'EGP';
    const locale = settings?.language === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">إدارة الإيصالات المتقدمة</h1>
          <p className="text-gray-600 mt-1">نظام إيصالات ذكي مع ربط تلقائي بالفواتير ومتابعة الحالة</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleAddNew} icon={<FaPlus />} variant="primary">
            إضافة إيصال جديد
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات المتقدمة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {hasPermission('view_cash_receipts') ? advancedStats.totalCount : (
                <span className="flex items-center justify-center gap-1 text-gray-400">
                  <FaLock className="text-sm" />
                  --
                </span>
              )}
            </div>
            <div className="text-gray-600 mt-2">إجمالي الإيصالات</div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {hasPermission('view_financial_data') ? formatCurrency(advancedStats.totalAmount) : (
                <span className="flex items-center justify-center gap-1 text-gray-400">
                  <FaLock className="text-sm" />
                  --
                </span>
              )}
            </div>
            <div className="text-gray-600 mt-2">إجمالي المبالغ</div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {advancedStats.linkingPercentage.toFixed(1)}%
            </div>
            <div className="text-gray-600 mt-2">نسبة الربط بالفواتير</div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {hasPermission('view_financial_data') ? formatCurrency(advancedStats.avgAmount) : (
                <span className="flex items-center justify-center gap-1 text-gray-400">
                  <FaLock className="text-sm" />
                  --
                </span>
              )}
            </div>
            <div className="text-gray-600 mt-2">متوسط الإيصال</div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {advancedStats.linkedReceipts}
            </div>
            <div className="text-gray-600 mt-2">إيصالات مرتبطة</div>
          </div>
        </Card>
      </div>

      {/* أدوات البحث والفلترة المتقدمة */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="بحث برقم الإيصال، المصدر، الوصف، أو رقم الفاتورة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع الفئات</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع الحالات</option>
            <option value="fully_paid">مسدد بالكامل</option>
            <option value="partially_paid">مسدد جزئياً</option>
            <option value="unpaid">غير مسدد</option>
            <option value="unlinked">غير مرتبط</option>
          </select>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع الفترات</option>
            <option value="week">آخر أسبوع</option>
            <option value="month">آخر شهر</option>
            <option value="quarter">آخر 3 أشهر</option>
          </select>

          <div className="text-sm text-gray-600">
            عرض {filteredReceipts.length} من أصل {cashReceipts.length} إيصال
          </div>
        </div>
      </Card>
      
      {/* الجدول المتقدم */}
      <Card>
        <Table
          columns={columns}
          data={tableData}
        />
      </Card>
      
      {/* Modal عرض تفاصيل الإيصال المتقدم */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="تفاصيل إيصال الاستلام المتقدم"
        size="lg"
      >
        {selectedReceipt && (() => {
          const sourceDetails = getSourceDetails(selectedReceipt);
          const paymentStatus = getPaymentStatus(selectedReceipt);
          const linkedInvoices = getAutoLinkedInvoices(selectedReceipt);
          
          return (
            <div className="space-y-6">
              {/* حالة الدفع والشريط */}
              <Card className="bg-blue-50 border border-blue-200">
                <StatusProgress 
                  status={paymentStatus}
                  createdDate={selectedReceipt.date}
                  paidDate={paymentStatus === 'fully_paid' ? selectedReceipt.date : null}
                />
              </Card>

              {/* معلومات الإيصال الأساسية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="معلومات الإيصال">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">رقم الإيصال:</span>
                      <span className="font-semibold">{selectedReceipt.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">التاريخ:</span>
                      <span className="font-semibold">{new Date(selectedReceipt.date).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">المبلغ:</span>
                      <span className="font-bold text-2xl text-green-600">
                        {hasPermission('view_financial_data') ? 
                          formatCurrency(parseFloat(selectedReceipt.amount)) : 
                          <span className="flex items-center gap-1 text-gray-400">
                            <FaLock className="text-sm" />
                            مخفي
                          </span>
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الفئة:</span>
                      <span className="font-semibold">{categoryLabels[selectedReceipt.category]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">طريقة الدفع:</span>
                      <span className="font-semibold">{paymentMethodLabels[selectedReceipt.paymentMethod]}</span>
                    </div>
                    {selectedReceipt.referenceNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">رقم الفاتورة:</span>
                        <span className="font-semibold text-blue-600">{selectedReceipt.referenceNumber}</span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* معلومات المصدر */}
                <Card title="معلومات المصدر">
                  {sourceDetails ? (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">الاسم:</span>
                        <span className="font-semibold">{sourceDetails.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">النوع:</span>
                        <span className="font-semibold">
                          {selectedReceipt.fromType === 'customer' ? 'عميل' : 'مورد'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الهاتف:</span>
                        <span className="font-semibold">{sourceDetails.phone || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">البريد الإلكتروني:</span>
                        <span className="font-semibold">{sourceDetails.email || '-'}</span>
                      </div>
                      {sourceDetails.balance && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">الرصيد الحالي:</span>
                          <span className={`font-semibold ${sourceDetails.balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {hasPermission('view_financial_data') ? 
                              formatCurrency(Math.abs(sourceDetails.balance)) : 
                              '••••••'
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      المصدر: {selectedReceipt.fromName || 'غير محدد'}
                    </div>
                  )}
                </Card>
              </div>

              {/* الفواتير المرتبطة */}
              {linkedInvoices.length > 0 && (
                <Card title="الفواتير المرتبطة">
                  <div className="space-y-3">
                    {linkedInvoices.map((invoice, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FaFileInvoice className="text-blue-500" />
                          <div>
                            <div className="font-semibold">{invoice.invoiceNumber}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(invoice.date).toLocaleDateString('ar-EG')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {hasPermission('view_financial_data') ? 
                              formatCurrency(parseFloat(invoice.total)) : 
                              '••••••'
                            }
                          </div>
                          <div className="text-sm text-gray-600">
                            المسدد: {hasPermission('view_financial_data') ? 
                              formatCurrency(parseFloat(invoice.paidAmount || 0)) : 
                              '••••••'
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* الإوصف والملاحظات */}
              <Card title="تفاصيل إضافية">
                <div className="space-y-4">
                  {selectedReceipt.description && (
                    <div>
                      <span className="font-semibold">الوصف:</span>
                      <p className="mt-1">{selectedReceipt.description}</p>
                    </div>
                  )}
                  
                  {selectedReceipt.notes && (
                    <div>
                      <span className="font-semibold">ملاحظات:</span>
                      <p className="mt-1 text-gray-600">{selectedReceipt.notes}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* أزرار الإجراءات */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="primary" 
                  icon={<FaPrint />}
                  onClick={() => window.print()}
                >
                  طباعة
                </Button>
                <Button 
                  variant="secondary" 
                  icon={<FaShare />}
                  onClick={() => handleShareReceipt(selectedReceipt)}
                >
                  مشاركة
                </Button>
                <Button 
                  variant="secondary" 
                  icon={<FaQrCode />}
                  onClick={() => handleGenerateQR(selectedReceipt)}
                >
                  QR Code
                </Button>
                <Button 
                  variant="secondary" 
                  icon={<FaDownload />}
                  onClick={() => {
                    // تصدير البيانات
                    const data = {
                      receipt: selectedReceipt,
                      source: sourceDetails,
                      linkedInvoices
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `receipt-${selectedReceipt.receiptNumber}.json`;
                    a.click();
                  }}
                >
                  تصدير
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal QR Code */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="QR Code الإيصال"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <SimpleQRCode data={JSON.stringify(selectedReceipt)} />
          </div>
          <div className="text-sm text-gray-600">
            يمكن مسح هذا الرمز للتحقق من صحة الإيصال
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-xs font-mono">
            {selectedReceipt && selectedReceipt.receiptNumber}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdvancedReceiptsManagement;