import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import PageHeader from '../../components/Common/PageHeader';

// تسجيل Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

const AnalyticsReport = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  // بيانات وهمية للمؤشرات
  const kpiData = {
    inventoryTurnover: 4.2,
    avgInvoiceValue: 1250.75,
    salesReturnRate: 2.3,
    avgPaymentPeriod: 15.2,
    periodComparison: {
      inventoryTurnoverChange: 8.5,
      avgInvoiceValueChange: -3.2,
      salesReturnRateChange: -12.1,
      avgPaymentPeriodChange: 5.8
    }
  };

  // بيانات المبيعات الشهرية
  const monthlySalesData = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [
      {
        label: 'مبيعات 2024',
        data: [65000, 72000, 58000, 81000, 95000, 87000, 92000, 78000, 89000, 96000, 102000, 115000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'مبيعات 2023',
        data: [58000, 62000, 54000, 71000, 82000, 79000, 85000, 73000, 82000, 88000, 92000, 105000],
        borderColor: 'rgba(156, 163, 175, 0.5)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.4,
      }
    ]
  };

  // بيانات التوزيع حسب العملاء
  const customerDistributionData = {
    labels: ['عميل مميز', 'عميل منتظم', 'عميل جديد', 'عميل قليل'],
    datasets: [
      {
        data: [35, 28, 22, 15],
        backgroundColor: [
          '#10B981',
          '#3B82F6',
          '#F59E0B',
          '#EF4444'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  // بيانات المنتجات الأكثر مبيعاً
  const topProductsData = {
    labels: ['منتج A', 'منتج B', 'منتج C', 'منتج D', 'منتج E', 'منتج F'],
    datasets: [
      {
        label: 'الكمية المباعة',
        data: [1250, 1180, 950, 875, 720, 680],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1
      }
    ]
  };

  // بيانات الأداء المالي
  const performanceData = {
    labels: ['الأرباح', 'المصروفات', 'صافي الربح', 'حجم المبيعات', 'عدد العملاء'],
    datasets: [
      {
        label: 'الشهر الحالي',
        data: [85, 65, 78, 92, 70],
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2
      },
      {
        label: 'الشهر السابق',
        data: [78, 58, 70, 85, 65],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2
      }
    ]
  };

  // مولدات الألوان للرسوم البيانية
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Arial, sans-serif'
          }
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString('ar-SA') + ' ر.س';
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.label + ': ' + context.parsed + '%';
          }
        }
      }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  // دالة تصدير البيانات
  const exportData = () => {
    const data = {
      kpiData,
      dateRange,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-report-${dateRange.from}-to-${dateRange.to}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // دالة طباعة التقرير
  const printReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="تقرير التحليلات المتقدم" />

        {/* فلاتر التقرير */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => setLoading(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                تحديث البيانات
              </button>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                تصدير
              </button>
              <button
                onClick={printReport}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                طباعة
              </button>
            </div>
          </div>
        </div>

        {/* المؤشرات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">معدل دوران المخزون</p>
                <p className="text-3xl font-bold text-blue-600">{kpiData.inventoryTurnover}</p>
                <p className={`text-sm mt-1 ${kpiData.periodComparison.inventoryTurnoverChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpiData.periodComparison.inventoryTurnoverChange > 0 ? '↗' : '↘'} 
                  {Math.abs(kpiData.periodComparison.inventoryTurnoverChange)}% عن الفترة السابقة
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">متوسط قيمة الفاتورة</p>
                <p className="text-3xl font-bold text-green-600">{kpiData.avgInvoiceValue.toLocaleString('ar-SA')} ر.س</p>
                <p className={`text-sm mt-1 ${kpiData.periodComparison.avgInvoiceValueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpiData.periodComparison.avgInvoiceValueChange > 0 ? '↗' : '↘'} 
                  {Math.abs(kpiData.periodComparison.avgInvoiceValueChange)}% عن الفترة السابقة
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">معدل العائد على المبيعات</p>
                <p className="text-3xl font-bold text-purple-600">{kpiData.salesReturnRate}%</p>
                <p className={`text-sm mt-1 ${kpiData.periodComparison.salesReturnRateChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {kpiData.periodComparison.salesReturnRateChange > 0 ? '↗' : '↘'} 
                  {Math.abs(kpiData.periodComparison.salesReturnRateChange)}% عن الفترة السابقة
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">متوسط فترة السداد</p>
                <p className="text-3xl font-bold text-orange-600">{kpiData.avgPaymentPeriod} يوم</p>
                <p className={`text-sm mt-1 ${kpiData.periodComparison.avgPaymentPeriodChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {kpiData.periodComparison.avgPaymentPeriodChange > 0 ? '↗' : '↘'} 
                  {Math.abs(kpiData.periodComparison.avgPaymentPeriodChange)}% عن الفترة السابقة
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* الرسوم البيانية */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* رسم بياني للمبيعات الشهرية */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">المبيعات الشهرية</h3>
            <div className="h-80">
              <Line data={monthlySalesData} options={chartOptions} />
            </div>
          </div>

          {/* رسم بياني للتوزيع حسب العملاء */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">التوزيع حسب العملاء</h3>
            <div className="h-80">
              <Doughnut data={customerDistributionData} options={doughnutOptions} />
            </div>
          </div>

          {/* رسم بياني للمنتجات الأكثر مبيعاً */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">المنتجات الأكثر مبيعاً</h3>
            <div className="h-80">
              <Bar data={topProductsData} options={chartOptions} />
            </div>
          </div>

          {/* رسم بياني للأداء المالي */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">مقارنة الأداء المالي</h3>
            <div className="h-80">
              <Radar data={performanceData} options={radarOptions} />
            </div>
          </div>
        </div>

        {/* جدول بيانات مفصل */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">البيانات التفصيلية</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الشهر</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">إجمالي المبيعات</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">عدد الفواتير</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">متوسط الفاتورة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">معدل النمو</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthlySalesData.labels.map((month, index) => {
                  const sales = monthlySalesData.datasets[0].data[index];
                  const invoices = Math.floor(sales / kpiData.avgInvoiceValue);
                  const avgInvoice = sales / invoices;
                  const growth = index > 0 ? ((sales - monthlySalesData.datasets[0].data[index-1]) / monthlySalesData.datasets[0].data[index-1] * 100).toFixed(1) : 0;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{month}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{sales.toLocaleString('ar-SA')} ر.س</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{invoices}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{avgInvoice.toFixed(0)} ر.س</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          growth > 0 ? 'bg-green-100 text-green-800' : 
                          growth < 0 ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {growth > 0 ? '↗' : growth < 0 ? '↘' : '→'} {Math.abs(growth)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ملخص التحليلات */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-2xl font-bold mb-4">📊 ملخص التحليلات</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2">نقاط القوة</h4>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• نمو ثابت في المبيعات الشهرية</li>
                <li>• تحسن في معدل دوران المخزون</li>
                <li>• عملاء مميزون يحددون 35% من الإيرادات</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">نقاط التحسين</h4>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• زيادة متوسط فترة السداد تحتاج متابعة</li>
                <li>• معدل العائد على المبيعات منخفض</li>
                <li>• ضرورة تطوير العملاء الجدد</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">التوصيات</h4>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• تحسين سياسات السداد والخصومات</li>
                <li>• التركيز على منتجات عالية الجودة</li>
                <li>• برامج ولاء للعملاء الجدد</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReport;