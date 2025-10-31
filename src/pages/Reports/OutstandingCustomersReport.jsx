import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';

const OutstandingCustomersReport = () => {
  const { salesInvoices, customers } = useData();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minOutstandingAmount, setMinOutstandingAmount] = useState('');
  const [sortBy, setSortBy] = useState('outstandingAmount');
  const [sortOrder, setSortOrder] = useState('desc');
  const [reportData, setReportData] = useState([]);
  const [stats, setStats] = useState({
    totalOutstandingAmount: 0,
    totalCustomersWithOutstanding: 0,
    averageDelayDays: 0,
    oldestOutstandingInvoice: null,
  });

  // دالة لحساب عدد الأيام بين تاريخين
  const calculateDaysDifference = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    generateReport();
  }, [salesInvoices, customers, startDate, endDate, minOutstandingAmount, sortBy, sortOrder]);

  const generateReport = () => {
    const outstandingByCustomer = {};

    // فلترة الفواتير غير المدفوعة
    let outstandingInvoices = salesInvoices?.filter(invoice => 
      (invoice.total || 0) > (invoice.paid || 0)
    ) || [];

    // فلترة حسب التاريخ
    if (startDate) {
      outstandingInvoices = outstandingInvoices.filter(
        (invoice) => new Date(invoice.date) >= new Date(startDate)
      );
    }

    if (endDate) {
      outstandingInvoices = outstandingInvoices.filter(
        (invoice) => new Date(invoice.date) <= new Date(endDate)
      );
    }

    // تجميع البيانات حسب العميل
    outstandingInvoices.forEach((invoice) => {
      const customerId = invoice.customerId || 'unknown';
      const outstandingAmount = (invoice.total || 0) - (invoice.paid || 0);
      
      if (!outstandingByCustomer[customerId]) {
        outstandingByCustomer[customerId] = {
          customerId,
          customerName: '',
          outstandingAmount: 0,
          invoiceCount: 0,
          invoices: [],
          oldestInvoiceDate: null,
          delayDays: [],
        };
      }

      outstandingByCustomer[customerId].outstandingAmount += outstandingAmount;
      outstandingByCustomer[customerId].invoiceCount += 1;
      outstandingByCustomer[customerId].invoices.push({
        ...invoice,
        outstandingAmount,
        delayDays: calculateDaysDifference(invoice.date, new Date())
      });

      // تحديث أقدم تاريخ فاتورة
      if (!outstandingByCustomer[customerId].oldestInvoiceDate || 
          new Date(invoice.date) < new Date(outstandingByCustomer[customerId].oldestInvoiceDate)) {
        outstandingByCustomer[customerId].oldestInvoiceDate = invoice.date;
      }
    });

    // الحصول على أسماء العملاء وحساب متوسط التأخير
    const data = Object.values(outstandingByCustomer).map((item) => {
      const customer = customers?.find((c) => c.id === item.customerId);
      const customerName = customer?.name || 'عميل غير مسجل';
      
      // حساب متوسط فترة التأخير
      const averageDelay = item.invoices.length > 0 
        ? item.invoices.reduce((sum, inv) => sum + inv.delayDays, 0) / item.invoices.length
        : 0;

      return {
        ...item,
        customerName,
        averageDelayDays: Math.round(averageDelay),
      };
    });

    // فلترة حسب أقل مبلغ متأخر
    if (minOutstandingAmount) {
      const minAmount = parseFloat(minOutstandingAmount);
      data.forEach(customer => {
        customer.invoices = customer.invoices.filter(inv => inv.outstandingAmount >= minAmount);
      });
    }

    // إزالة العملاء الذين لا توجد لديهم فواتير بعد الفلترة
    const filteredData = data.filter(customer => customer.invoices.length > 0);

    // إعادة حساب المبالغ بعد الفلترة
    filteredData.forEach(customer => {
      customer.outstandingAmount = customer.invoices.reduce((sum, inv) => sum + inv.outstandingAmount, 0);
      customer.invoiceCount = customer.invoices.length;
      customer.oldestInvoiceDate = customer.invoices.reduce((oldest, inv) => 
        !oldest || new Date(inv.date) < new Date(oldest) ? inv.date : oldest
      , null);
      customer.averageDelayDays = customer.invoices.length > 0 
        ? Math.round(customer.invoices.reduce((sum, inv) => sum + inv.delayDays, 0) / customer.invoices.length)
        : 0;
    });

    // ترتيب البيانات
    filteredData.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'outstandingAmount':
          aValue = a.outstandingAmount;
          bValue = b.outstandingAmount;
          break;
        case 'invoiceCount':
          aValue = a.invoiceCount;
          bValue = b.invoiceCount;
          break;
        case 'averageDelayDays':
          aValue = a.averageDelayDays;
          bValue = b.averageDelayDays;
          break;
        case 'customerName':
          aValue = a.customerName;
          bValue = b.customerName;
          break;
        default:
          aValue = a.outstandingAmount;
          bValue = b.outstandingAmount;
      }

      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    // حساب الإحصائيات
    const totalOutstandingAmount = filteredData.reduce((sum, customer) => sum + customer.outstandingAmount, 0);
    const totalCustomersWithOutstanding = filteredData.length;
    const averageDelayDays = totalCustomersWithOutstanding > 0
      ? Math.round(filteredData.reduce((sum, customer) => sum + customer.averageDelayDays, 0) / totalCustomersWithOutstanding)
      : 0;

    // العثور على أقدم فاتورة متأخرة
    const allOutstandingInvoices = filteredData.flatMap(customer => customer.invoices);
    const oldestOutstandingInvoice = allOutstandingInvoices.length > 0
      ? allOutstandingInvoices.reduce((oldest, invoice) => 
          !oldest || new Date(invoice.date) < new Date(oldest.date) ? invoice : oldest
        )
      : null;

    setReportData(filteredData);
    setStats({
      totalOutstandingAmount,
      totalCustomersWithOutstanding,
      averageDelayDays,
      oldestOutstandingInvoice,
    });
  };

  const printReport = () => {
    window.print();
  };

  const exportToExcel = () => {
    const headers = ['العميل', 'المبلغ المتأخر', 'عدد الفواتير', 'أقدم فاتورة', 'متوسط التأخير (يوم)'];
    const csvData = reportData.map((customer) => [
      customer.customerName,
      customer.outstandingAmount.toFixed(2),
      customer.invoiceCount,
      customer.oldestInvoiceDate || '-',
      customer.averageDelayDays,
    ]);

    let csv = headers.join(',') + '\n';
    csvData.forEach((row) => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `outstanding_customers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '⬆️' : '⬇️';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .printable, .printable * {
            visibility: visible;
          }
          
          .printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white;
          }
          
          .print-header {
            display: block !important;
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .no-print {
            display: none !important;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          
          .stats-card {
            border: 2px solid #333;
            padding: 15px;
            text-align: center;
            background: #f9f9f9;
          }
          
          .stats-title {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          
          .stats-value {
            font-size: 18px;
            font-weight: bold;
            color: #333;
          }
        }
      `}</style>

      <div className="p-6 max-w-7xl mx-auto">
        <PageHeader
          title="تقرير العملاء المتأخرين في السداد"
          subtitle="تقرير شامل للعملاء الذين لديهم مبالغ متأخرة في السداد"
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          actions={[
            <button
              key="print"
              onClick={printReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors no-print"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              طباعة
            </button>,
            <button
              key="export"
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors no-print"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              تصدير CSV
            </button>,
          ]}
        />

        {/* فلاتر البحث */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                من تاريخ
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                إلى تاريخ
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                أقل مبلغ متأخر
              </label>
              <input
                type="number"
                value={minOutstandingAmount}
                onChange={(e) => setMinOutstandingAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ترتيب حسب
              </label>
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="outstandingAmount_desc">المبلغ المتأخر (تنازلي)</option>
                <option value="outstandingAmount_asc">المبلغ المتأخر (تصاعدي)</option>
                <option value="invoiceCount_desc">عدد الفواتير (تنازلي)</option>
                <option value="invoiceCount_asc">عدد الفواتير (تصاعدي)</option>
                <option value="averageDelayDays_desc">متوسط التأخير (تنازلي)</option>
                <option value="averageDelayDays_asc">متوسط التأخير (تصاعدي)</option>
                <option value="customerName_asc">الاسم (أ-ي)</option>
                <option value="customerName_desc">الاسم (ي-أ)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* الإحصائيات الإجمالية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 printable">
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {stats.totalOutstandingAmount.toLocaleString('ar-SA', {
                  style: 'currency',
                  currency: 'SAR',
                  minimumFractionDigits: 2,
                })}
              </div>
              <div className="text-gray-600">إجمالي المبالغ المتأخرة</div>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.totalCustomersWithOutstanding}
              </div>
              <div className="text-gray-600">عدد العملاء المتأخرين</div>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.averageDelayDays}
              </div>
              <div className="text-gray-600">متوسط فترة التأخير (يوم)</div>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="text-sm font-bold text-gray-800 mb-1">
                أقدم فاتورة متأخرة
              </div>
              <div className="text-lg text-red-600">
                {formatDate(stats.oldestOutstandingInvoice?.date)}
              </div>
              <div className="text-sm text-gray-500">
                {stats.oldestOutstandingInvoice ? 
                  `${stats.oldestOutstandingInvoice.delayDays} يوم تأخير` : 
                  'لا توجد فواتير متأخرة'
                }
              </div>
            </div>
          </Card>
        </div>

        {/* جدول النتائج */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-4 py-3 text-right text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('customerName')}
                  >
                    العميل {getSortIcon('customerName')}
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('outstandingAmount')}
                  >
                    المبلغ المتأخر {getSortIcon('outstandingAmount')}
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('invoiceCount')}
                  >
                    عدد الفواتير {getSortIcon('invoiceCount')}
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('averageDelayDays')}
                  >
                    متوسط التأخير {getSortIcon('averageDelayDays')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    أقدم فاتورة
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.map((customer, index) => (
                  <tr key={customer.customerId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">{customer.customerName}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-bold text-red-600">
                        {customer.outstandingAmount.toLocaleString('ar-SA', {
                          style: 'currency',
                          currency: 'SAR',
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {customer.invoiceCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.averageDelayDays > 30 ? 'bg-red-100 text-red-800' :
                        customer.averageDelayDays > 15 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {customer.averageDelayDays} يوم
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>{formatDate(customer.oldestInvoiceDate)}</div>
                      <div className="text-xs text-gray-500">
                        {customer.invoices.length > 0 ? 
                          `${Math.min(...customer.invoices.map(inv => inv.delayDays))} يوم على الأقل` : 
                          '-'
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {reportData.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد بيانات</h3>
                <p className="mt-1 text-sm text-gray-500">لا توجد فواتير متأخرة للفترة المحددة</p>
              </div>
            )}
          </div>
        </Card>

        {/* Header للطباعة */}
        <div className="print-header no-display">
          <div className="company-name">شركة المثال</div>
          <div className="report-title">تقرير العملاء المتأخرين في السداد</div>
          <div className="report-subtitle">تقرير شامل للعملاء الذين لديهم مبالغ متأخرة في السداد</div>
          <div className="print-date">
            تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}
          </div>
        </div>
      </div>
    </>
  );
};

export default OutstandingCustomersReport;