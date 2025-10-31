import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';

const ProfitLossReport = () => {
  const { salesInvoices, purchaseInvoices, products } = useData();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalCost: 0,
    grossProfit: 0,
    grossProfitMargin: 0,
    netProfit: 0,
  });

  useEffect(() => {
    generateReport();
  }, [salesInvoices, purchaseInvoices, products, startDate, endDate]);

  const generateReport = () => {
    let filteredSales = salesInvoices || [];
    let filteredPurchases = purchaseInvoices || [];

    if (startDate) {
      filteredSales = filteredSales.filter(
        (inv) => new Date(inv.date) >= new Date(startDate)
      );
      filteredPurchases = filteredPurchases.filter(
        (inv) => new Date(inv.date) >= new Date(startDate)
      );
    }

    if (endDate) {
      filteredSales = filteredSales.filter(
        (inv) => new Date(inv.date) <= new Date(endDate)
      );
      filteredPurchases = filteredPurchases.filter(
        (inv) => new Date(inv.date) <= new Date(endDate)
      );
    }

    const totalRevenue = filteredSales.reduce((sum, inv) => sum + (inv.total || 0), 0);

    let totalCost = 0;
    filteredSales.forEach((invoice) => {
      invoice.items?.forEach((item) => {
        const product = products?.find((p) => p.id === item.productId);
        const costPrice = product?.costPrice || 0;
        totalCost += costPrice * (item.quantity || 0);
      });
    });

    const grossProfit = totalRevenue - totalCost;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfit = grossProfit;

    setReportData({
      totalRevenue,
      totalCost,
      grossProfit,
      grossProfitMargin,
      netProfit,
    });
  };

  const printReport = () => {
    window.print();
  };

  const exportToExcel = () => {
    const headers = ['البيان', 'المبلغ'];
    const csvData = [
      ['إجمالي المبيعات', reportData.totalRevenue.toFixed(2)],
      ['تكلفة البضاعة', reportData.totalCost.toFixed(2)],
      ['مجمل الربح', reportData.grossProfit.toFixed(2)],
      ['هامش الربح الإجمالي', reportData.grossProfitMargin.toFixed(2) + '%'],
      ['صافي الربح', reportData.netProfit.toFixed(2)],
    ];

    let csv = headers.join(',') + '\n';
    csvData.forEach((row) => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `profit_loss_report_${new Date().toISOString().split('T')[0]}.csv`;
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
            grid-template-columns: repeat(3, 1fr);
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
          
          .stats-card .profit {
            color: #2e7d32;
          }
          
          .stats-card .loss {
            color: #c62828;
          }
          
          /* Income Statement */
          .income-statement {
            margin-bottom: 20px;
          }
          
          .income-item {
            display: grid;
            grid-template-columns: 1fr auto;
            padding: 10px;
            border: 1px solid #ddd;
            margin-bottom: 10px;
            background: #f9f9f9;
          }
          
          .income-item.revenue {
            background: #e3f2fd !important;
            border-color: #1976d2;
          }
          
          .income-item.cost {
            background: #fff3e0 !important;
            border-color: #f57c00;
          }
          
          .income-item.gross-profit {
            background: #e8f5e8 !important;
            border-color: #2e7d32;
          }
          
          .income-item.net-profit {
            background: #e8f5e8 !important;
            border-color: #2e7d32;
          }
          
          .income-item.net-loss {
            background: #ffebee !important;
            border-color: #c62828;
          }
          
          .income-label {
            font-weight: bold;
          }
          
          .income-value {
            font-weight: bold;
            font-size: 16px;
          }
          
          .income-subvalue {
            font-size: 14px;
            color: #666;
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
          <div className="report-title">تقرير الأرباح والخسائر</div>
          <div className="report-subtitle">تحليل الأرباح والخسائر خلال فترة زمنية محددة</div>
          <div className="print-date">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</div>
        </div>

        <PageHeader
          title="تقرير الأرباح والخسائر"
          subtitle="تحليل الأرباح والخسائر خلال فترة زمنية محددة"
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

      <Card className="mt-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 stats-grid no-print">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="text-center">
            <p className="text-sm opacity-90">إجمالي المبيعات</p>
            <p className="text-3xl font-bold mt-2">{reportData.totalRevenue.toFixed(2)} ج.م</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="text-center">
            <p className="text-sm opacity-90">تكلنفة البضاعة</p>
            <p className="text-3xl font-bold mt-2">{reportData.totalCost.toFixed(2)} ج.م</p>
          </div>
        </Card>
        <Card className={`bg-gradient-to-r ${
          reportData.netProfit >= 0
            ? 'from-green-500 to-green-600'
            : 'from-red-500 to-red-600'
        } text-white`}>
          <div className="text-center">
            <p className="text-sm opacity-90">صافي الربح</p>
            <p className="text-3xl font-bold mt-2">{reportData.netProfit.toFixed(2)} ج.م</p>
          </div>
        </Card>
      </div>

      {/* إحصائيات للطباعة */}
      <div className="hidden stats-grid print-stats" style={{display: 'none'}}>
        <div className="stats-card">
          <div className="label">إجمالي المبيعات</div>
          <div className="value currency">{reportData.totalRevenue.toFixed(2)} ج.م</div>
        </div>
        <div className="stats-card">
          <div className="label">تكلفة البضاعة</div>
          <div className="value currency">{reportData.totalCost.toFixed(2)} ج.م</div>
        </div>
        <div className={`stats-card ${reportData.netProfit >= 0 ? 'profit' : 'loss'}`}>
          <div className="label">{reportData.netProfit >= 0 ? 'صافي الربح' : 'صافي الخسارة'}</div>
          <div className="value currency">
            {reportData.netProfit >= 0 ? '' : '('}{Math.abs(reportData.netProfit).toFixed(2)} ج.م{reportData.netProfit >= 0 ? '' : ')'}
          </div>
        </div>
      </div>

      <Card className="mt-6 no-page-break">
        <h3 className="text-lg font-bold mb-4 no-print">قائمة الدخل</h3>
        <div className="space-y-4 income-statement">
          <div className="bg-blue-50 p-4 rounded-lg income-item revenue">
            <div className="income-label">الإيرادات</div>
            <div></div>
            <div className="pr-4">إجمالي المبيعات:</div>
            <div className="income-value currency text-blue-700">
              {reportData.totalRevenue.toFixed(2)} ج.م
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg income-item cost">
            <div className="income-label">تكلفة البضاعة المباعة</div>
            <div></div>
            <div className="pr-4">تكلفة البضاعة:</div>
            <div className="income-value currency text-orange-700">
              ({reportData.totalCost.toFixed(2)}) ج.م
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg income-item gross-profit">
            <div className="income-label">مجمل الربح</div>
            <div className="income-value currency text-green-700">
              {reportData.grossProfit.toFixed(2)} ج.م
            </div>
            <div className="income-subvalue">هامش الربح الإجمالي:</div>
            <div className="income-subvalue currency">
              {reportData.grossProfitMargin.toFixed(2)}%
            </div>
          </div>

          <div className={`p-4 rounded-lg income-item ${
            reportData.netProfit >= 0 ? 'net-profit' : 'net-loss'
          }`}>
            <div className="income-label">
              صافي {reportData.netProfit >= 0 ? 'الربح' : 'الخسارة'}
            </div>
            <div className={`income-value currency ${
              reportData.netProfit >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              {reportData.netProfit >= 0 ? '' : '('}
              {Math.abs(reportData.netProfit).toFixed(2)} ج.م
              {reportData.netProfit >= 0 ? '' : ')'}
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-6 no-print">
        <h3 className="text-lg font-bold mb-4">ملاحظات</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li>التقرير يعتمد على الفترة الزمنية المحددة</li>
            <li>تكلفة البضاعة تعتمد على سعر التكلفة المحدد في بيانات المنتج</li>
            <li>هامش الربح يحسب بقسمة مجمل الربح على إجمالي المبيعات</li>
            <li>التقرير لا يتضمن المصاريف التشغيلية الأخرى</li>
          </ul>
        </div>
      </Card>

      {/* Print Footer */}
      <div className="print-footer no-print">
        <span>شركة بero لإدارة المخازن</span>
        <span>صفحة 1 من 1</span>
      </div>
    </div>
  );
};

export default ProfitLossReport;