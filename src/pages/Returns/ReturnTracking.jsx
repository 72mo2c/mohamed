// ======================================
// Return Tracking Component - واجهة تتبع الإرجاع
// ======================================

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContextWithSound';
import {
  FaSearch, FaTruck, FaWarehouse, FaCheck, FaClock, 
  FaExclamationTriangle, FaMapMarkerAlt, FaPhone, FaEnvelope,
  FaHistory, FaBell, FaEye, FaPrint, FaDownload,
  FaShippingFast, FaBoxes, FaUserCheck, FaSignature,
  FaRoute, FaCalendarAlt, FaComment, FaRefreshCw,
  FaFilter, FaChartLine, FaMobile, FaDesktop
} from 'react-icons/fa';

const ReturnTracking = () => {
  const { 
    salesReturns, 
    salesInvoices, 
    customers, 
    products,
    updateSalesReturn 
  } = useData();
  
  const { showSuccess, showError, showInfo, showWarning } = useNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState('timeline'); // timeline, timeline, map
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // date, status, customer

  // تحديث البيانات في الوقت الفعلي
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      // محاكاة تحديث الحالة
      const pendingReturns = salesReturns.filter(r => r.status === 'pending');
      if (pendingReturns.length > 0) {
        showInfo(`تحديث: يوجد ${pendingReturns.length} مرتجع معلق`);
      }
    }, 30000); // كل 30 ثانية

    return () => clearInterval(interval);
  }, [realTimeUpdates, salesReturns, showInfo]);

  // تصفية وترتيب المرتجعات
  const processedReturns = salesReturns
    .filter(returnRecord => {
      const invoice = salesInvoices.find(inv => inv.id === returnRecord.invoiceId);
      const customer = customers.find(c => c.id === parseInt(invoice?.customerId));
      
      const matchesSearch = 
        customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        returnRecord.id.toString().includes(searchQuery) ||
        returnRecord.invoiceId.toString().includes(searchQuery);
      
      const matchesFilter = selectedFilter === 'all' || returnRecord.status === selectedFilter;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date) - new Date(a.date);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'customer':
          const customerA = customers.find(c => c.id === parseInt(salesInvoices.find(inv => inv.id === a.invoiceId)?.customerId));
          const customerB = customers.find(c => c.id === parseInt(salesInvoices.find(inv => inv.id === b.invoiceId)?.customerId));
          return (customerA?.name || '').localeCompare(customerB?.name || '');
        default:
          return 0;
      }
    });

  // إشعارات التتبع
  useEffect(() => {
    const newNotifications = [];
    
    const pendingCount = salesReturns.filter(r => r.status === 'pending').length;
    const processingCount = salesReturns.filter(r => r.status === 'processing').length;
    const completedToday = salesReturns.filter(r => {
      if (r.status !== 'completed') return false;
      const completedDate = new Date(r.confirmedAt || r.lastUpdated || r.date);
      const today = new Date();
      return completedDate.toDateString() === today.toDateString();
    }).length;

    if (pendingCount > 0) {
      newNotifications.push({
        id: 1,
        type: 'warning',
        title: 'مرتجعات معلقة',
        message: `${pendingCount} مرتجع بانتظار المراجعة`,
        action: () => setSelectedFilter('pending')
      });
    }

    if (processingCount > 0) {
      newNotifications.push({
        id: 2,
        type: 'info',
        title: 'قيد المعالجة',
        message: `${processingCount} مرتجع قيد المعالجة حالياً`,
        action: () => setSelectedFilter('processing')
      });
    }

    if (completedToday > 0) {
      newNotifications.push({
        id: 3,
        type: 'success',
        title: 'مكتمل اليوم',
        message: `تم إكمال ${completedToday} مرتجع اليوم`,
        action: () => setSelectedFilter('completed')
      });
    }

    setNotifications(newNotifications);
  }, [salesReturns, salesInvoices, customers]);

  // تتبع حالة المرتجع
  const getReturnStatus = (returnRecord) => {
    const statusSteps = [
      { status: 'pending', label: 'تم الاستلام', icon: FaClock, color: 'yellow' },
      { status: 'processing', label: 'قيد المراجعة', icon: FaEye, color: 'blue' },
      { status: 'approved', label: 'موافق عليه', icon: FaCheck, color: 'green' },
      { status: 'shipped', label: 'تم الشحن', icon: FaTruck, color: 'purple' },
      { status: 'received', label: 'تم الاستلام', icon: FaWarehouse, color: 'green' },
      { status: 'completed', label: 'مكتمل', icon: FaCheckCircle, color: 'green' }
    ];

    const currentStatusIndex = statusSteps.findIndex(step => step.status === returnRecord.status);
    
    return statusSteps.map((step, index) => ({
      ...step,
      completed: index <= currentStatusIndex,
      current: index === currentStatusIndex
    }));
  };

  // حساب المدة الزمنية
  const getDuration = (startDate, endDate = new Date()) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} يوم`;
    } else if (diffHours > 0) {
      return `${diffHours} ساعة`;
    } else {
      return 'أقل من ساعة';
    }
  };

  // تحديث حالة المرتجع
  const handleStatusUpdate = (returnId, newStatus, notes = '') => {
    try {
      const returnRecord = salesReturns.find(r => r.id === returnId);
      if (!returnRecord) {
        showError('لم يتم العثور على المرتجع');
        return;
      }

      const updates = {
        ...returnRecord,
        status: newStatus,
        statusNotes: notes,
        lastUpdated: new Date().toISOString(),
        statusHistory: [
          ...(returnRecord.statusHistory || []),
          {
            status: newStatus,
            timestamp: new Date().toISOString(),
            notes: notes,
            updatedBy: 'current_user'
          }
        ]
      };

      updateSalesReturn(returnId, updates);
      
      const statusMessages = {
        'processing': 'تم تغيير حالة المرتجع إلى قيد المراجعة',
        'approved': 'تم الموافقة على المرتجع',
        'rejected': 'تم رفض المرتجع',
        'shipped': 'تم شحن المرتجع',
        'received': 'تم استلام المرتجع',
        'completed': 'تم إكمال عملية الإرجاع'
      };

      showSuccess(statusMessages[newStatus] || 'تم تحديث حالة المرتجع');
      
      // إرسال إشعار للعميل
      if (newStatus === 'completed') {
        showInfo('تم إرسال إشعار للعميل بإكمال الإرجاع');
      }

    } catch (error) {
      showError('حدث خطأ في تحديث حالة المرتجع');
    }
  };

  // عرض تفاصيل المرتجع
  const handleViewDetails = (returnRecord) => {
    setSelectedReturn(returnRecord);
    setShowDetails(true);
    
    // بناء تاريخ التتبع
    const history = getReturnStatus(returnRecord);
    setTrackingHistory(history);
  };

  // تصدير بيانات التتبع
  const handleExportTracking = () => {
    const exportData = processedReturns.map(returnRecord => {
      const invoice = salesInvoices.find(inv => inv.id === returnRecord.invoiceId);
      const customer = customers.find(c => c.id === parseInt(invoice?.customerId));
      const duration = getDuration(returnRecord.date);
      
      return {
        'رقم المرتجع': returnRecord.id,
        'العميل': customer?.name || 'غير محدد',
        'رقم الفاتورة': returnRecord.invoiceId,
        'الحالة': getStatusText(returnRecord.status),
        'المبلغ': `${returnRecord.totalAmount || 0} دينار`,
        'تاريخ الإنشاء': new Date(returnRecord.date).toLocaleDateString('ar-IQ'),
        'المدة': duration,
        'آخر تحديث': new Date(returnRecord.lastUpdated || returnRecord.date).toLocaleDateString('ar-IQ')
      };
    });

    const csv = [
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `تتبع_المرتجعات_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess('تم تصدير بيانات التتبع بنجاح');
  };

  // حالات الإرجاع
  const getStatusText = (status) => {
    const statuses = {
      'pending': 'معلق',
      'processing': 'قيد المعالجة',
      'approved': 'موافق عليه',
      'rejected': 'مرفوض',
      'shipped': 'تم الشحن',
      'received': 'تم الاستلام',
      'completed': 'مكتمل',
      'cancelled': 'ملغى'
    };
    return statuses[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'processing': 'bg-blue-100 text-blue-700 border-blue-200',
      'approved': 'bg-green-100 text-green-700 border-green-200',
      'rejected': 'bg-red-100 text-red-700 border-red-200',
      'shipped': 'bg-purple-100 text-purple-700 border-purple-200',
      'received': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'completed': 'bg-green-100 text-green-700 border-green-200',
      'cancelled': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      
      {/* العنوان الرئيسي */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">تتبع الإرجاع</h1>
          <p className="text-gray-600">متابعة حالة المرتجعات في الوقت الفعلي</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRealTimeUpdates(!realTimeUpdates)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              realTimeUpdates 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <FaRefreshCw className={realTimeUpdates ? 'animate-spin' : ''} />
            تحديث مباشر
          </button>
          
          <button
            onClick={handleExportTracking}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaDownload />
            تصدير
          </button>
          
          <button
            onClick={() => setViewMode(viewMode === 'timeline' ? 'cards' : 'timeline')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {viewMode === 'timeline' ? <FaDesktop /> : <FaMobile />}
            {viewMode === 'timeline' ? 'عرض البطاقات' : 'عرض الخط الزمني'}
          </button>
        </div>
      </div>

      {/* الإشعارات السريعة */}
      {notifications.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaBell className="text-indigo-600" />
            <h3 className="font-semibold text-indigo-800">إشعارات التتبع</h3>
          </div>
          <div className="space-y-2">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-indigo-100 cursor-pointer hover:bg-indigo-50 transition-colors"
                onClick={notif.action}
              >
                <div className={`w-3 h-3 rounded-full ${
                  notif.type === 'warning' ? 'bg-yellow-500' :
                  notif.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{notif.title}</p>
                  <p className="text-sm text-gray-600">{notif.message}</p>
                </div>
                <FaChartLine className="text-indigo-600" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* أدوات البحث والفلترة */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* البحث */}
          <div className="relative">
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="البحث برقم المرتجع أو اسم العميل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* فلتر الحالة */}
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">معلق</option>
            <option value="processing">قيد المعالجة</option>
            <option value="approved">موافق عليه</option>
            <option value="shipped">تم الشحن</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغى</option>
          </select>

          {/* ترتيب حسب */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">ترتيب بالتاريخ</option>
            <option value="status">ترتيب بالحالة</option>
            <option value="customer">ترتيب بالعميل</option>
          </select>

          {/* إحصائيات سريعة */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{processedReturns.length}</p>
              <p className="text-xs text-gray-600">إجمالي المرتجعات</p>
            </div>
          </div>
        </div>

        {/* إحصائيات مفصلة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FaClock className="text-yellow-600" />
              <p className="text-xl font-bold text-yellow-600">
                {processedReturns.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <p className="text-sm text-gray-600">معلق</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FaEye className="text-blue-600" />
              <p className="text-xl font-bold text-blue-600">
                {processedReturns.filter(r => r.status === 'processing').length}
              </p>
            </div>
            <p className="text-sm text-gray-600">قيد المعالجة</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FaTruck className="text-purple-600" />
              <p className="text-xl font-bold text-purple-600">
                {processedReturns.filter(r => r.status === 'shipped').length}
              </p>
            </div>
            <p className="text-sm text-gray-600">تم الشحن</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FaCheck className="text-green-600" />
              <p className="text-xl font-bold text-green-600">
                {processedReturns.filter(r => r.status === 'completed').length}
              </p>
            </div>
            <p className="text-sm text-gray-600">مكتمل</p>
          </div>
        </div>
      </div>

      {/* عرض المرتجعات */}
      {viewMode === 'timeline' ? (
        // عرض الخط الزمني
        <div className="space-y-4">
          {processedReturns.map(returnRecord => {
            const invoice = salesInvoices.find(inv => inv.id === returnRecord.invoiceId);
            const customer = customers.find(c => c.id === parseInt(invoice?.customerId));
            const statusSteps = getReturnStatus(returnRecord);
            const currentStep = statusSteps.find(step => step.current);
            const duration = getDuration(returnRecord.date);

            return (
              <div key={returnRecord.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        currentStep?.color === 'green' ? 'bg-green-100' :
                        currentStep?.color === 'blue' ? 'bg-blue-100' :
                        currentStep?.color === 'yellow' ? 'bg-yellow-100' :
                        currentStep?.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                        <currentStep?.icon className={`text-xl ${
                          currentStep?.color === 'green' ? 'text-green-600' :
                          currentStep?.color === 'blue' ? 'text-blue-600' :
                          currentStep?.color === 'yellow' ? 'text-yellow-600' :
                          currentStep?.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                        }`} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        مرتجع #{returnRecord.id}
                      </h3>
                      <p className="text-gray-600">{customer?.name || 'عميل غير محدد'}</p>
                      <p className="text-sm text-gray-500">المدة: {duration}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(returnRecord.status)}`}>
                      {getStatusText(returnRecord.status)}
                    </span>
                    <button
                      onClick={() => handleViewDetails(returnRecord)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FaEye />
                    </button>
                  </div>
                </div>

                {/* شريط التقدم */}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    {statusSteps.map((step, index) => (
                      <div key={step.status} className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                          step.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'bg-gray-100 border-gray-300 text-gray-400'
                        }`}>
                          <step.icon className="text-sm" />
                        </div>
                        <span className="text-xs mt-1 text-center max-w-16">{step.label}</span>
                        {index < statusSteps.length - 1 && (
                          <div className={`absolute top-4 w-full h-0.5 ${
                            statusSteps[index + 1].completed ? 'bg-green-500' : 'bg-gray-300'
                          }`} style={{ left: '50%', width: 'calc(100% - 2rem)' }}></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // عرض البطاقات
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedReturns.map(returnRecord => {
            const invoice = salesInvoices.find(inv => inv.id === returnRecord.invoiceId);
            const customer = customers.find(c => c.id === parseInt(invoice?.customerId));
            const duration = getDuration(returnRecord.date);

            return (
              <div key={returnRecord.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      #{returnRecord.id}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(returnRecord.status)}`}>
                      {getStatusText(returnRecord.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <FaUser className="text-gray-400" />
                      <span className="text-sm">{customer?.name || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-400" />
                      <span className="text-sm">{duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaBoxes className="text-gray-400" />
                      <span className="text-sm">{returnRecord.totalAmount?.toFixed(2) || 0} دينار</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(returnRecord)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <FaEye className="inline ml-1" />
                      التفاصيل
                    </button>
                    {returnRecord.status === 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(returnRecord.id, 'processing')}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <FaCheck />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {processedReturns.length === 0 && (
        <div className="text-center py-12">
          <FaTruck className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-600">لا توجد مرتجعات مطابقة للبحث</p>
        </div>
      )}

      {/* نافذة تفاصيل المرتجع */}
      {showDetails && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* رأس النافذة */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">تفاصيل المرتجع #{selectedReturn.id}</h2>
                  <p className="opacity-90">تتبع شامل لحالة المرتجع</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      printWindow.document.write(`
                        <html dir="rtl" lang="ar">
                        <head><title>تفاصيل المرتجع #${selectedReturn.id}</title></head>
                        <body>
                          <h1>تفاصيل المرتجع #${selectedReturn.id}</h1>
                          <p>الحالة: ${getStatusText(selectedReturn.status)}</p>
                          <p>تاريخ الإنشاء: ${new Date(selectedReturn.date).toLocaleDateString('ar-IQ')}</p>
                        </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
                  >
                    <FaPrint className="inline ml-2" />
                    طباعة
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              
              {/* معلومات أساسية */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">معلومات المرتجع</h3>
                  <div className="space-y-2">
                    <p><strong>الرقم:</strong> #{selectedReturn.id}</p>
                    <p><strong>الحالة:</strong> {getStatusText(selectedReturn.status)}</p>
                    <p><strong>المبلغ:</strong> {selectedReturn.totalAmount?.toFixed(2) || 0} دينار</p>
                    <p><strong>السبب:</strong> {selectedReturn.reason || 'غير محدد'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">معلومات العميل</h3>
                  <div className="space-y-2">
                    {(() => {
                      const invoice = salesInvoices.find(inv => inv.id === selectedReturn.invoiceId);
                      const customer = customers.find(c => c.id === parseInt(invoice?.customerId));
                      return (
                        <>
                          <p><strong>الاسم:</strong> {customer?.name || 'غير محدد'}</p>
                          <p><strong>الهاتف:</strong> {customer?.phone || 'غير محدد'}</p>
                          <p><strong>العنوان:</strong> {customer?.address || 'غير محدد'}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">الزمن</h3>
                  <div className="space-y-2">
                    <p><strong>تاريخ الإنشاء:</strong> {new Date(selectedReturn.date).toLocaleDateString('ar-IQ')}</p>
                    <p><strong>آخر تحديث:</strong> {new Date(selectedReturn.lastUpdated || selectedReturn.date).toLocaleDateString('ar-IQ')}</p>
                    <p><strong>المدة:</strong> {getDuration(selectedReturn.date)}</p>
                  </div>
                </div>
              </div>

              {/* تاريخ التتبع */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4">تاريخ التتبع</h3>
                <div className="space-y-4">
                  {getReturnStatus(selectedReturn).map((step, index) => (
                    <div key={step.status} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.completed 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        <step.icon className="text-lg" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${step.completed ? 'text-gray-800' : 'text-gray-500'}`}>
                          {step.label}
                        </p>
                        <p className="text-sm text-gray-500">
                          {step.completed ? 'مكتمل' : 'معلق'}
                        </p>
                      </div>
                      {step.current && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          الحالي
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* إجراءات سريعة */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4">إجراءات سريعة</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedReturn.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedReturn.id, 'processing')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FaEye />
                      بدء المراجعة
                    </button>
                  )}
                  
                  {selectedReturn.status === 'processing' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(selectedReturn.id, 'approved')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FaCheck />
                        موافقة
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedReturn.id, 'rejected')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <FaTimes />
                        رفض
                      </button>
                    </>
                  )}
                  
                  {selectedReturn.status === 'approved' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedReturn.id, 'shipped')}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <FaTruck />
                      شحن
                    </button>
                  )}
                  
                  {selectedReturn.status === 'shipped' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedReturn.id, 'received')}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <FaWarehouse />
                      استلام
                    </button>
                  )}
                  
                  {selectedReturn.status === 'received' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedReturn.id, 'completed')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FaCheckCircle />
                      إكمال
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnTracking;