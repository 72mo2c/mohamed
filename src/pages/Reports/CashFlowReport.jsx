import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';
import Loading from '../../components/Common/Loading';

const CashFlowReport = () => {
  const { cashReceipts, cashDisbursements, salesInvoices, purchaseInvoices } = useData();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    salesCash: 0,
    purchasesCash: 0,
    otherReceipts: 0,
    otherPayments: 0,
    invoiceReceipts: 0,
    invoicePayments: 0,
    totalInflow: 0,
    totalOutflow: 0,
    netCashFlow: 0,
  });

  useEffect(() => {
    generateReport();
  }, [cashReceipts, cashDisbursements, salesInvoices, purchaseInvoices, startDate, endDate]);

  const generateReport = () => {
    setLoading(true);
    
    // إضافة تأخير بسيط لمحاكاة تحميل البيانات
    setTimeout(() => {
      // التحقق من وجود البيانات
      if (!salesInvoices && !purchaseInvoices && !cashReceipts && !cashDisbursements) {
        setReportData({
          salesCash: 0,
          purchasesCash: 0,
          otherReceipts: 0,
          otherPayments: 0,
          invoiceReceipts: 0,
          invoicePayments: 0,
          totalInflow: 0,
          totalOutflow: 0,
          netCashFlow: 0,
        });
        setLoading(false);
        return;
      }

      let filteredSales = salesInvoices || [];
      let filteredPurchases = purchaseInvoices || [];
      let filteredReceipts = cashReceipts || [];
      let filteredDisbursements = cashDisbursements || [];

    // تطبيق الفلاتر على المبيعات
    if (startDate) {
      filteredSales = filteredSales.filter(
        (inv) => new Date(inv.date) >= new Date(startDate)
      );
    }
    if (endDate) {
      filteredSales = filteredSales.filter(
        (inv) => new Date(inv.date) <= new Date(endDate)
      );
    }

    // تطبيق الفلاتر على المشتريات
    if (startDate) {
      filteredPurchases = filteredPurchases.filter(
        (inv) => new Date(inv.date) >= new Date(startDate)
      );
    }
    if (endDate) {
      filteredPurchases = filteredPurchases.filter(
        (inv) => new Date(inv.date) <= new Date(endDate)
      );
    }

    // تطبيق الفلاتر على المقبوضات النقدية
    if (startDate) {
      filteredReceipts = filteredReceipts.filter(
        (receipt) => new Date(receipt.date) >= new Date(startDate)
      );
    }
    if (endDate) {
      filteredReceipts = filteredReceipts.filter(
        (receipt) => new Date(receipt.date) <= new Date(endDate)
      );
    }

    // تطبيق الفلاتر على المدفوعات النقدية
    if (startDate) {
      filteredDisbursements = filteredDisbursements.filter(
        (disbursement) => new Date(disbursement.date) >= new Date(startDate)
      );
    }
    if (endDate) {
      filteredDisbursements = filteredDisbursements.filter(
        (disbursement) => new Date(disbursement.date) <= new Date(endDate)
      );
    }

    // حساب التدفقات النقدية من المبيعات
    const salesCash = filteredSales.reduce((sum, inv) => {
      // جمع المدفوعات النقدية المسجلة في الفواتير
      const paidAmount = inv.paid || inv.amountPaid || 0;
      return sum + paidAmount;
    }, 0);

    // حساب التدفقات النقدية من المشتريات
    const purchasesCash = filteredPurchases.reduce((sum, inv) => {
      // جمع المدفوعات النقدية المسجلة في الفواتير
      const paidAmount = inv.paid || inv.amountPaid || 0;
      return sum + paidAmount;
    }, 0);

    // حساب المقبوضات الأخرى (لا تشمل سداد فواتير المبيعات)
    const otherReceipts = filteredReceipts
      .filter((receipt) => {
        // استبعاد المقبوضات المرتبطة بسداد فواتير المبيعات
        return receipt.category !== 'invoice_payment';
      })
      .reduce((sum, receipt) => sum + (receipt.amount || 0), 0);

    // حساب المدفوعات الأخرى (لا تشمل سداد فواتير المشتريات)
    const otherPayments = filteredDisbursements
      .filter((disbursement) => {
        // استبعاد المدفوعات المرتبطة بسداد فواتير المشتريات
        return disbursement.category !== 'invoice_payment';
      })
      .reduce((sum, disbursement) => sum + (disbursement.amount || 0), 0);

    // إضافة المقبوضات والمدفوعات المرتبطة بالفواتير
    const invoiceReceipts = filteredReceipts
      .filter((receipt) => receipt.category === 'invoice_payment')
      .reduce((sum, receipt) => sum + (receipt.amount || 0), 0);

    const invoicePayments = filteredDisbursements
      .filter((disbursement) => disbursement.category === 'invoice_payment')
      .reduce((sum, disbursement) => sum + (disbursement.amount || 0), 0);

    const totalInflow = salesCash + otherReceipts + invoiceReceipts;
    const totalOutflow = purchasesCash + otherPayments + invoicePayments;
    const netCashFlow = totalInflow - totalOutflow;

    setReportData({
      salesCash,
      purchasesCash,
      otherReceipts,
      otherPayments,
      invoiceReceipts,
      invoicePayments,
      totalInflow,
      totalOutflow,
      netCashFlow,
    });
    
    setLoading(false);
    }, 100);
  };

  const printReport = () => {
    window.print();
  };

  const exportToExcel = () => {
    const headers = ['البيان', 'المبلغ'];
    const csvData = [
      ['التدفقات الداخلة', ''],
      ['المبيعات النقدية', (reportData.salesCash || 0).toFixed(2)],
      ['مقبوضات أخرى', (reportData.otherReceipts || 0).toFixed(2)],
      ...(reportData.invoiceReceipts > 0 ? [['سداد فواتير مبيعات', reportData.invoiceReceipts.toFixed(2)]] : []),
      ['إجمالي التدفقات الداخلة', (reportData.totalInflow || 0).toFixed(2)],
      ['', ''],
      ['التدفقات الخارجة', ''],
      ['المشتريات النقدية', (reportData.purchasesCash || 0).toFixed(2)],
      ['مدفوعات أخرى', (reportData.otherPayments || 0).toFixed(2)],
      ...(reportData.invoicePayments > 0 ? [['سداد فواتير مشتريات', reportData.invoicePayments.toFixed(2)]] : []),
      ['إجمالي التدفقات الخارجة', (reportData.totalOutflow || 0).toFixed(2)],
      ['', ''],
      ['صافي التدفق النقدي', (reportData.netCashFlow || 0).toFixed(2)],
    ];

    let csv = headers.join(',') + '\n';
    csvData.forEach((row) => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cash_flow_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="تقرير التدفقات النقدية"
        subtitle="تحليل التدفقات النقدية الداخلة والخارجة"
        icon={
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

      <Card className="mt-6">
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

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loading />
        </div>
      ) : !salesInvoices?.length && !purchaseInvoices?.length && !cashReceipts?.length && !cashDisbursements?.length ? (
        <Card className="mt-6">
          <div className="text-center py-12 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد بيانات مالية</h3>
            <p>قم بإضافة بعض المعاملات المالية لعرض تقرير التدفق النقدي</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <h3 className="text-xl font-bold mb-4">التدفقات الداخلة</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-green-400">
              <span className="text-sm opacity-90">المبيعات النقدية</span>
              <span className="font-bold">{reportData.salesCash?.toFixed(2)} ج.م</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-green-400">
              <span className="text-sm opacity-90">مقبوضات أخرى</span>
              <span className="font-bold">{reportData.otherReceipts?.toFixed(2)} ج.م</span>
            </div>
            {reportData.invoiceReceipts > 0 && (
              <div className="flex justify-between items-center pb-2 border-b border-green-400">
                <span className="text-sm opacity-90">سداد فواتير مبيعات</span>
                <span className="font-bold">{reportData.invoiceReceipts?.toFixed(2)} ج.م</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold">الإجمالي</span>
              <span className="text-2xl font-bold">{reportData.totalInflow?.toFixed(2)} ج.م</span>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <h3 className="text-xl font-bold mb-4">التدفقات الخارجة</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-red-400">
              <span className="text-sm opacity-90">المشتريات النقدية</span>
              <span className="font-bold">{reportData.purchasesCash?.toFixed(2)} ج.م</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-red-400">
              <span className="text-sm opacity-90">مدفوعات أخرى</span>
              <span className="font-bold">{reportData.otherPayments?.toFixed(2)} ج.م</span>
            </div>
            {reportData.invoicePayments > 0 && (
              <div className="flex justify-between items-center pb-2 border-b border-red-400">
                <span className="text-sm opacity-90">سداد فواتير مشتريات</span>
                <span className="font-bold">{reportData.invoicePayments?.toFixed(2)} ج.م</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold">الإجمالي</span>
              <span className="text-2xl font-bold">{reportData.totalOutflow?.toFixed(2)} ج.م</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className={`mt-6 bg-gradient-to-r ${
        reportData.netCashFlow >= 0
          ? 'from-blue-500 to-blue-600'
          : 'from-orange-500 to-orange-600'
      } text-white`}>
        <div className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4">صافي التدفق النقدي</h3>
          <p className="text-5xl font-bold">{reportData.netCashFlow?.toFixed(2)} ج.م</p>
          <p className="mt-4 text-sm opacity-90">
            {reportData.netCashFlow >= 0
              ? 'تدفق نقدي إيجابي'
              : 'تدفق نقدي سلبي'}
          </p>
        </div>
      </Card>

      <Card className="mt-6">
        <h3 className="text-lg font-bold mb-4">ملخص التدفقات النقدية</h3>
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">التدفقات الداخلة</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>المبيعات النقدية:</div>
              <div className="text-right font-medium">{reportData.salesCash?.toFixed(2)} ج.م</div>
              <div>مقبوضات أخرى:</div>
              <div className="text-right font-medium">{reportData.otherReceipts?.toFixed(2)} ج.م</div>
              {reportData.invoiceReceipts > 0 && (
                <>
                  <div>سداد فواتير مبيعات:</div>
                  <div className="text-right font-medium">{reportData.invoiceReceipts?.toFixed(2)} ج.م</div>
                </>
              )}
              <div className="font-bold">الإجمالي:</div>
              <div className="text-right font-bold text-green-700">{reportData.totalInflow?.toFixed(2)} ج.م</div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">التدفقات الخارجة</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>المشتريات النقدية:</div>
              <div className="text-right font-medium">{reportData.purchasesCash?.toFixed(2)} ج.م</div>
              <div>مدفوعات أخرى:</div>
              <div className="text-right font-medium">{reportData.otherPayments?.toFixed(2)} ج.م</div>
              {reportData.invoicePayments > 0 && (
                <>
                  <div>سداد فواتير مشتريات:</div>
                  <div className="text-right font-medium">{reportData.invoicePayments?.toFixed(2)} ج.م</div>
                </>
              )}
              <div className="font-bold">الإجمالي:</div>
              <div className="text-right font-bold text-red-700">{reportData.totalOutflow?.toFixed(2)} ج.م</div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-bold text-lg">صافي التدفق النقدي:</div>
              <div className={`text-right font-bold text-lg ${
                reportData.netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}>
                {reportData.netCashFlow?.toFixed(2)} ج.م
              </div>
            </div>
          </div>
        </div>
      </Card>
      )}
    </div>
  );
};

// ======================================
// ملاحظات مهمة:
// 1. البيانات تُقرأ من cashReceipts و cashDisbursements بدلاً من treasuryTransactions
// 2. يتم تصنيف المعاملات إلى:
//    - مقبوضات/مدفوعات أخرى (لا تشمل سداد الفواتير)
//    - سداد فواتير مبيعات/مشتريات
// 3. الفلاتر تعمل على جميع أنواع المعاملات
// 4. التقرير يعرض إجمالي صافي التدفق النقدي مع الحالة (إيجابي/سلبي)
// ======================================

export default CashFlowReport;