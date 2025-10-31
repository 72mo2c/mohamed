import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';

const SalesReport = () => {
  const { salesInvoices, customers, products } = useData();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [reportData, setReportData] = useState([]);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalRemaining: 0,
  });

  useEffect(() => {
    generateReport();
  }, [salesInvoices, startDate, endDate, selectedCustomer]);

  const generateReport = () => {
    let data = salesInvoices || [];

    if (startDate) {
      data = data.filter((invoice) => new Date(invoice.date) >= new Date(startDate));
    }

    if (endDate) {
      data = data.filter((invoice) => new Date(invoice.date) <= new Date(endDate));
    }

    if (selectedCustomer !== 'all') {
      data = data.filter((invoice) => invoice.customerId === selectedCustomer);
    }

    const totalInvoices = data.length;
    const totalAmount = data.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalPaid = data.reduce((sum, inv) => sum + (inv.paid || 0), 0);
    const totalRemaining = totalAmount - totalPaid;

    setReportData(data);
    setStats({ totalInvoices, totalAmount, totalPaid, totalRemaining });
  };

  const getCustomerName = (customerId) => {
    const customer = customers?.find((c) => c.id === customerId);
    return customer?.name || 'عميل غير مسجل';
  };

  const printReport = () => {
    window.print();
  };

  const exportToExcel = () => {
    const headers = ['رقم الفاتورة', 'التاريخ', 'العميل', 'الإجمالي', 'المدفوع', 'المتبقي', 'الحالة'];
    const csvData = reportData.map((invoice) => [
      invoice.id,
      invoice.date,
      getCustomerName(invoice.customerId),
      invoice.total?.toFixed(2) || '0.00',
      invoice.paid?.toFixed(2) || '0.00',
      (invoice.total - invoice.paid).toFixed(2),
      invoice.paid >= invoice.total ? 'مدفوع' : 'غير مدفوع',
    ]);

    let csv = headers.join(',') + '\n';
    csvData.forEach((row) => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
          
          /* Header Styles */
          .print-header {
            display: block !important;
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .print-header .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .print-header .report-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 5px;
          }
          
          .print-header .report-subtitle {
            font-size: 14px;
            color: #666;
          }
          
          .print-header .print-date {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
          
          /* Hide non-essential elements */
          .no-print {
            display: none !important;
          }
          
          /* Statistics Cards */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .stats-card {
            border: 2px solid #333;
            padding: 15px;
            text-align: center;
            background: #f9f9f9 !important;
          }
          
          .stats-card .label {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .stats-card .value {
            font-size: 18px;
            font-weight: bold;
          }
          
          /* Table Styles */
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
          }
          
          .print-table th {
            background: #333 !important;
            color: white !important;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #333;
          }
          
          .print-table td {
            padding: 8px;
            text-align: center;
            border: 1px solid #ddd;
            vertical-align: middle;
          }
          
          .print-table tbody tr:nth-child(even) {
            background: #f9f9f9 !important;
          }
          
          .print-table .status-paid {
            background: #e8f5e8 !important;
            color: #2e7d32 !important;
            font-weight: bold;
            padding: 4px 8px;
            border: 1px solid #2e7d32;
            border-radius: 4px;
          }
          
          .print-table .status-unpaid {
            background: #ffebee !important;
            color: #c62828 !important;
            font-weight: bold;
            padding: 4px 8px;
            border: 1px solid #c62828;
            border-radius: 4px;
          }
          
          /* Page Breaks */
          .page-break {
            page-break-after: always;
          }
          
          .no-page-break {
            page-break-inside: avoid;
          }
          
          /* Footer */
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: #333;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            font-size: 10px;
          }
          
          /* Currency formatting */
          .currency {
            font-family: 'Arial', sans-serif;
          }
          
          .print-stats {
            display: grid !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          .screen-only {
            display: block;
          }
          
          .print-only {
            display: none;
          }
        }
        
        @page {
          margin: 1in;
          size: A4;
        }
        
        @page :first {
          margin-top: 1.5in;
        }
      `}</style>
      
      <div className="p-6 max-w-7xl mx-auto printable">
        {/* Print Header */}
        <div className="print-header no-print">
          <div className="company-name">شركة بero لإدارة المخازن</div>
          <div className="report-title">تقرير المبيعات</div>
          <div className="report-subtitle">تقرير شامل لجميع المبيعات خلال فترة زمنية محددة</div>
          <div className="print-date">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</div>
        </div>

        <PageHeader
          title="تقرير المبيعات"
          subtitle="تقرير شامل لجميع المبيعات خلال فترة زمنية محددة"
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
          actions={[
            {
              label: 'طباعة',
              onClick: printReport,
              variant: 'secondary',
            },
            {
              label: 'تصدير Excel',
              onClick: exportToExcel,
              variant: 'primary',
            },
          ]}
        />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 stats-grid no-print">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="text-center">
            <p className="text-sm opacity-90">عدد الفواتير</p>
            <p className="text-3xl font-bold mt-2">{stats.totalInvoices}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="text-center">
            <p className="text-sm opacity-90">إجمالي المبيعات</p>
            <p className="text-3xl font-bold mt-2">{stats.totalAmount.toFixed(2)} ج.م</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="text-center">
            <p className="text-sm opacity-90">إجمالي المدفوع</p>
            <p className="text-3xl font-bold mt-2">{stats.totalPaid.toFixed(2)} ج.م</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="text-center">
            <p className="text-sm opacity-90">إجمالي المتبقي</p>
            <p className="text-3xl font-bold mt-2">{stats.totalRemaining.toFixed(2)} ج.م</p>
          </div>
        </Card>
      </div>

      {/* إحصائيات للطباعة */}
      <div className="hidden stats-grid print-stats" style={{display: 'none'}}>
        <div className="stats-card">
          <div className="label">عدد الفواتير</div>
          <div className="value">{stats.totalInvoices}</div>
        </div>
        <div className="stats-card">
          <div className="label">إجمالي المبيعات</div>
          <div className="value currency">{stats.totalAmount.toFixed(2)} ج.م</div>
        </div>
        <div className="stats-card">
          <div className="label">إجمالي المدفوع</div>
          <div className="value currency">{stats.totalPaid.toFixed(2)} ج.م</div>
        </div>
        <div className="stats-card">
          <div className="label">إجمالي المتبقي</div>
          <div className="value currency">{stats.totalRemaining.toFixed(2)} ج.م</div>
        </div>
      </div>

      <Card className="mt-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العميل
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع العملاء</option>
              {customers?.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              من تاريخ
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      <Card className="mt-6 overflow-x-auto no-page-break">
        <table className="min-w-full divide-y divide-gray-200 print-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                رقم الفاتورة
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                التاريخ
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                العميل
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجمالي
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                المدفوع
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                المتبقي
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{invoice.id}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {new Date(invoice.date).toLocaleDateString('ar-EG')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                  {getCustomerName(invoice.customerId)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 currency">
                  {(invoice.total || 0).toFixed(2)} ج.م
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 currency">
                  {(invoice.paid || 0).toFixed(2)} ج.م
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-red-600 currency">
                  {((invoice.total || 0) - (invoice.paid || 0)).toFixed(2)} ج.م
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {(invoice.paid || 0) >= (invoice.total || 0) ? (
                    <>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 no-print">
                        مدفوع
                      </span>
                      <span className="print-only status-paid">مدفوع</span>
                    </>
                  ) : (
                    <>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 no-print">
                        غير مدفوع
                      </span>
                      <span className="print-only status-unpaid">غير مدفوع</span>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reportData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            لا توجد بيانات لعرضها
          </div>
        )}
      </Card>

      {/* Print Footer */}
      <div className="print-footer no-print">
        <span>شركة بero لإدارة المخازن</span>
        <span>صفحة 1 من 1</span>
      </div>
    </div>
  );
};

export default SalesReport;