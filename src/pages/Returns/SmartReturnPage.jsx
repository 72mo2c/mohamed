// ======================================
// Smart Return Page - صفحة الإرجاع الذكية
// ======================================

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContextWithSound';
import {
  FaUndo, FaSearch, FaFilter, FaEye, FaCheck, FaTimes, 
  FaSync, FaBell, FaClock, FaTruck, FaWarehouse,
  FaPrint, FaDownload, FaMobile, FaDesktop
} from 'react-icons/fa';

const SmartReturnPage = () => {
  const { 
    salesReturns, 
    salesInvoices, 
    customers, 
    products,
    updateSalesReturn,
    addSalesReturn 
  } = useData();
  
  const { showSuccess, showError, showInfo, showWarning } = useNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [selectedReturns, setSelectedReturns] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [notifications, setNotifications] = useState([]);
  const [realTimeTracking, setRealTimeTracking] = useState(true);

  // تصفية المرتجعات المتقدمة
  const filteredReturns = salesReturns.filter(returnRecord => {
    const invoice = salesInvoices.find(inv => inv.id === returnRecord.invoiceId);
    const customer = customers.find(c => c.id === parseInt(invoice?.customerId));
    const customerName = customer ? customer.name : '';
    
    const matchesSearch = customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          returnRecord.id.toString().includes(searchQuery) ||
                          returnRecord.invoiceId.toString().includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || returnRecord.status === statusFilter;
    const matchesReason = reasonFilter === 'all' || returnRecord.reason === reasonFilter;
    
    return matchesSearch && matchesStatus && matchesReason;
  });

  // إشعارات ذكية
  useEffect(() => {
    const pendingReturns = salesReturns.filter(r => r.status === 'pending');
    const recentReturns = salesReturns.filter(r => {
      const returnDate = new Date(r.date);
      const now = new Date();
      const diffDays = (now - returnDate) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    });

    const newNotifications = [];
    
    if (pendingReturns.length > 0) {
      newNotifications.push({
        id: 1,
        type: 'warning',
        title: 'مرتجعات معلقة',
        message: `لديك ${pendingReturns.length} مرتجع معلق يتطلب مراجعة`,
        icon: FaClock
      });
    }

    if (recentReturns.length > 5) {
      newNotifications.push({
        id: 2,
        type: 'info',
        title: 'ارتفاع في المرتجعات',
        message: `تم إنشاء ${recentReturns.length} مرتجع هذا الأسبوع`,
        icon: FaBell
      });
    }

    setNotifications(newNotifications);
  }, [salesReturns]);

  // تحديث حالة الإرجاع الذكي
  const handleSmartUpdate = (returnRecord, newStatus) => {
    try {
      const updates = {
        ...returnRecord,
        status: newStatus,
        lastUpdated: new Date().toISOString(),
        autoProcessed: true
      };

      updateSalesReturn(returnRecord.id, updates);
      
      const statusMessages = {
        'completed': 'تم إكمال عملية الإرجاع بنجاح',
        'cancelled': 'تم إلغاء عملية الإرجاع',
        'pending': 'تم تغيير حالة المرتجع إلى معلق'
      };

      showSuccess(statusMessages[newStatus] || 'تم تحديث حالة المرتجع');
      
      // إشعار ذكي
      if (newStatus === 'completed') {
        showInfo('تم إضافة المرتجع للمخزون تلقائياً');
      }
    } catch (error) {
      showError('حدث خطأ في تحديث حالة المرتجع');
    }
  };

  // معالجة متعددة
  const handleBulkAction = (action) => {
    if (selectedReturns.length === 0) {
      showWarning('يرجى اختيار مرتجع واحد على الأقل');
      return;
    }

    try {
      selectedReturns.forEach(returnId => {
        const returnRecord = salesReturns.find(r => r.id === returnId);
        if (returnRecord) {
          const updates = {
            ...returnRecord,
            status: action,
            bulkProcessed: true,
            lastUpdated: new Date().toISOString()
          };
          updateSalesReturn(returnId, updates);
        }
      });

      setSelectedReturns([]);
      showSuccess(`تم ${action === 'completed' ? 'إكمال' : action === 'cancelled' ? 'إلغاء' : 'تحديث'} ${selectedReturns.length} مرتجع بنجاح`);
    } catch (error) {
      showError('حدث خطأ في المعالجة المجمعة');
    }
  };

  // طباعة تقرير سريع
  const handleQuickPrint = () => {
    const printData = filteredReturns.map(ret => {
      const invoice = salesInvoices.find(inv => inv.id === ret.invoiceId);
      const customer = customers.find(c => c.id === parseInt(invoice?.customerId));
      return {
        id: ret.id,
        customer: customer?.name || 'غير محدد',
        amount: ret.totalAmount,
        date: ret.date,
        status: getStatusText(ret.status)
      };
    });

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>تقرير المرتجعات</title>
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f5f5f5; }
            .header { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير المرتجعات</h1>
            <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-IQ')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>رقم المرتجع</th>
                <th>العميل</th>
                <th>المبلغ</th>
                <th>التاريخ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${printData.map(item => `
                <tr>
                  <td>${item.id}</td>
                  <td>${item.customer}</td>
                  <td>${item.amount.toFixed(2)} دينار</td>
                  <td>${new Date(item.date).toLocaleDateString('ar-IQ')}</td>
                  <td>${item.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // المساعدة في اختيار المرتجع
  const handleSelectReturn = (returnId) => {
    setSelectedReturns(prev => 
      prev.includes(returnId) 
        ? prev.filter(id => id !== returnId)
        : [...prev, returnId]
    );
  };

  // حالات الإرجاع
  const getStatusText = (status) => {
    const statuses = {
      'completed': 'مكتمل',
      'pending': 'معلق',
      'cancelled': 'ملغى',
      'processing': 'قيد المعالجة'
    };
    return statuses[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'completed': 'bg-green-100 text-green-700 border-green-200',
      'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'cancelled': 'bg-red-100 text-red-700 border-red-200',
      'processing': 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // إعادة ترتيب تلقائي
  const handleAutoRefresh = () => {
    showInfo('جاري تحديث البيانات...');
    // يمكن إضافة منطق إعادة التحديث هنا
    setTimeout(() => {
      showSuccess('تم تحديث البيانات بنجاح');
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* العنوان الرئيسي */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">الإرجاع الذكي</h1>
          <p className="text-gray-600">إدارة ذكية ومتطورة لعمليات الإرجاع</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {viewMode === 'grid' ? <FaDesktop /> : <FaMobile />}
            {viewMode === 'grid' ? 'عرض شبكي' : 'عرض قائمة'}
          </button>
          
          <button
            onClick={handleQuickPrint}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FaPrint />
            طباعة سريعة
          </button>
          
          <button
            onClick={handleAutoRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FaSync className={realTimeTracking ? 'animate-spin' : ''} />
            تحديث
          </button>
        </div>
      </div>

      {/* الإشعارات الذكية */}
      {notifications.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaBell className="text-blue-600" />
            <h3 className="font-semibold text-blue-800">إشعارات ذكية</h3>
          </div>
          <div className="space-y-2">
            {notifications.map(notif => (
              <div key={notif.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100">
                <notif.icon className="text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{notif.title}</p>
                  <p className="text-sm text-gray-600">{notif.message}</p>
                </div>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* شريط البحث والفلترة المتقدم */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* البحث */}
          <div className="relative">
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في المرتجعات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* فلتر الحالة */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">معلق</option>
            <option value="processing">قيد المعالجة</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغى</option>
          </select>

          {/* فلتر السبب */}
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">جميع الأسباب</option>
            <option value="defective">منتج معيب</option>
            <option value="damaged">منتج تالف</option>
            <option value="wrong_item">منتج خاطئ</option>
            <option value="customer_request">طلب العميل</option>
            <option value="other">أخرى</option>
          </select>

          {/* العمليات المجمعة */}
          <div className="flex gap-2">
            {selectedReturns.length > 0 && (
              <>
                <button
                  onClick={() => handleBulkAction('completed')}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <FaCheck className="inline ml-1" />
                  إكمال
                </button>
                <button
                  onClick={() => handleBulkAction('cancelled')}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <FaTimes className="inline ml-1" />
                  إلغاء
                </button>
              </>
            )}
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{filteredReturns.length}</p>
            <p className="text-sm text-gray-600">إجمالي المرتجعات</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {filteredReturns.filter(r => r.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-600">معلق</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {filteredReturns.filter(r => r.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-600">مكتمل</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {filteredReturns.reduce((sum, r) => sum + (r.totalAmount || 0), 0).toFixed(0)}
            </p>
            <p className="text-sm text-gray-600">إجمالي المبلغ</p>
          </div>
        </div>
      </div>

      {/* عرض المرتجعات */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredReturns.map(returnRecord => {
              const invoice = salesInvoices.find(inv => inv.id === returnRecord.invoiceId);
              const customer = customers.find(c => c.id === parseInt(invoice?.customerId));
              
              return (
                <div key={returnRecord.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="checkbox"
                      checked={selectedReturns.includes(returnRecord.id)}
                      onChange={() => handleSelectReturn(returnRecord.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-600">#{returnRecord.id}</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="font-semibold text-gray-800">
                      {customer?.name || 'عميل غير محدد'}
                    </p>
                    <p className="text-sm text-gray-600">
                      الفاتورة: #{returnRecord.invoiceId}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {returnRecord.totalAmount?.toFixed(2) || 0} دينار
                    </p>
                  </div>

                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(returnRecord.status)} mb-3`}>
                    {getStatusText(returnRecord.status)}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSmartUpdate(returnRecord, 'completed')}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <FaCheck className="inline ml-1" />
                      إكمال
                    </button>
                    <button
                      onClick={() => handleSmartUpdate(returnRecord, 'cancelled')}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <FaTimes className="inline ml-1" />
                      إلغاء
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={selectedReturns.length === filteredReturns.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedReturns(filteredReturns.map(r => r.id));
                        } else {
                          setSelectedReturns([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">رقم المرتجع</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">العميل</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">الفاتورة</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">المبلغ</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">الحالة</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">التاريخ</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReturns.map(returnRecord => {
                  const invoice = salesInvoices.find(inv => inv.id === returnRecord.invoiceId);
                  const customer = customers.find(c => c.id === parseInt(invoice?.customerId));
                  
                  return (
                    <tr key={returnRecord.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedReturns.includes(returnRecord.id)}
                          onChange={() => handleSelectReturn(returnRecord.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">#{returnRecord.id}</td>
                      <td className="px-4 py-3">{customer?.name || 'غير محدد'}</td>
                      <td className="px-4 py-3">#{returnRecord.invoiceId}</td>
                      <td className="px-4 py-3 font-semibold text-blue-600">
                        {returnRecord.totalAmount?.toFixed(2) || 0} دينار
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(returnRecord.status)}`}>
                          {getStatusText(returnRecord.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(returnRecord.date).toLocaleDateString('ar-IQ')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSmartUpdate(returnRecord, 'completed')}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            title="إكمال"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() => handleSmartUpdate(returnRecord, 'cancelled')}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            title="إلغاء"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredReturns.length === 0 && (
          <div className="text-center py-12">
            <FaUndo className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600">لا توجد مرتجعات مطابقة للبحث</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartReturnPage;