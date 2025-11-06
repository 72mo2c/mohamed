// ======================================
// Advanced Reports System - نظام التقارير المتقدم
// ======================================

import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Modal from '../../components/Common/Modal';
import { 
  FaFileInvoice, 
  FaChartLine, 
  FaDownload,
  FaPrint,
  FaShare,
  FaCog,
  FaCalendarAlt,
  FaFilter,
  FaEye,
  FaBarChart,
  FaPieChart,
  FaTable,
  FaCalculator,
  FaTrendUp,
  FaTrendDown,
  FaSearch,
  FaSort,
  FaExpand,
  FaCompress,
  FaRefresh,
  FaCopy,
  FaEnvelope,
  FaBell,
  FaFilePdf,
  FaFileExcel,
  FaFileCsv,
  FaImage,
  FaExternalLinkAlt,
  FaLink,
  FaDatabase,
  FaChartBar,
  FaChartArea,
  FaSpinner,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle
} from 'react-icons/fa';

// مكون الرسم البياني المتقدم
const AdvancedChart = ({ 
  data, 
  type = 'line', 
  height = 300, 
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
  title,
  showLegend = true,
  animate = true
}) => {
  const containerRef = useRef(null);

  // حساب الحدود
  const maxValue = Math.max(...data.flatMap(d => Array.isArray(d.value) ? d.value : [d.value]));
  const minValue = Math.min(...data.flatMap(d => Array.isArray(d.value) ? d.value : [d.value]));
  const range = maxValue - minValue || 1;

  // رسم الرسم البياني الخطي
  const renderLineChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((item.value - minValue) / range) * 80;
      return `${x},${y}`;
    }).join(' ');

    const gradientPoints = [
      ...points.split(' '),
      '100,100',
      '0,100'
    ].join(' ');

    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors[0]} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* المنطقة المملوءة */}
        <polygon
          fill={`url(#gradient-${title})`}
          stroke={colors[0]}
          strokeWidth="0.5"
          points={gradientPoints}
          className={animate ? 'transition-all duration-1000 ease-out' : ''}
        />
        
        {/* الخط الرئيسي */}
        <polyline
          fill="none"
          stroke={colors[0]}
          strokeWidth="1.5"
          points={points}
          className={animate ? 'transition-all duration-1000 ease-out' : ''}
        />
        
        {/* نقاط البيانات */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((item.value - minValue) / range) * 80;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={colors[0]}
              className="hover:r-3 cursor-pointer transition-all"
            >
              <title>{`${item.label}: ${item.value.toFixed(2)}`}</title>
            </circle>
          );
        })}
      </svg>
    );
  };

  // رسم الرسم البياني الدائري
  const renderDoughnutChart = () => {
    const total = data.reduce((sum, item) => sum + Math.abs(item.value), 0);
    let currentOffset = 0;
    
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="#f3f4f6"
              strokeWidth="3"
            />
            {data.map((item, index) => {
              const percentage = total > 0 ? (Math.abs(item.value) / total) * 100 : 0;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -currentOffset;
              currentOffset += percentage;
              
              return (
                <circle
                  key={index}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={item.color || colors[index % colors.length]}
                  strokeWidth="3"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="hover:stroke-width-4 cursor-pointer transition-all"
                >
                  <title>{`${item.label}: ${item.value.toFixed(2)} (${percentage.toFixed(1)}%)`}</title>
                </circle>
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800">{total.toFixed(0)}</div>
              <div className="text-xs text-gray-600">الإجمالي</div>
            </div>
          </div>
        </div>
        {showLegend && (
          <div className="mr-6 space-y-3">
            {data.map((item, index) => (
              <div key={index} className="flex items-center text-sm">
                <div 
                  className="w-4 h-4 rounded-full mr-3 cursor-pointer hover:scale-110 transition-transform" 
                  style={{ backgroundColor: item.color || colors[index % colors.length] }}
                />
                <div>
                  <div className="text-gray-700 font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.value.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // رسم الرسم البياني العمودي
  const renderBarChart = () => {
    return (
      <div className="flex items-end h-full px-4">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center mx-1">
            <div 
              className="w-full rounded-t transition-all duration-500"
              style={{ 
                height: `${Math.max(5, ((item.value - minValue) / range) * 250)}px`,
                backgroundColor: item.color || colors[index % colors.length]
              }}
              title={`${item.label}: ${item.value.toFixed(2)}`}
            />
            <span className="text-xs text-gray-600 mt-2 transform rotate-45 whitespace-nowrap origin-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <FaExclamationTriangle className="text-2xl mb-2" />
          <p>لا توجد بيانات للعرض</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {title && (
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      <div ref={containerRef} style={{ height }} className="relative">
        {type === 'line' && renderLineChart()}
        {type === 'doughnut' && renderDoughnutChart()}
        {type === 'bar' && renderBarChart()}
      </div>
    </div>
  );
};

// مكون جدول البيانات المتقدم
const AdvancedDataTable = ({ 
  data, 
  columns, 
  sortable = true, 
  filterable = true, 
  exportable = true,
  title 
}) => {
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // فلترة البيانات
  const filteredData = useMemo(() => {
    if (!filterText) return data;
    return data.filter(row => 
      Object.values(row).some(value => 
        value && value.toString().toLowerCase().includes(filterText.toLowerCase())
      )
    );
  }, [data, filterText]);

  // ترتيب البيانات
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // تقسيم البيانات إلى صفحات
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportData = (format) => {
    const csv = [
      columns.map(col => col.label).join(','),
      ...sortedData.map(row => 
        columns.map(col => row[col.key]).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'report'}.${format}`;
    a.click();
  };

  return (
    <Card>
      <div className="space-y-4">
        {/* أدوات التحكم */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center gap-3">
            {filterable && (
              <div className="relative">
                <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            {exportable && (
              <div className="relative group">
                <Button variant="secondary" icon={<FaDownload />} size="sm">
                  تصدير
                </Button>
                <div className="absolute left-0 top-full mt-1 w-32 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => exportData('csv')}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => exportData('json')}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    JSON
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* الجدول */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th 
                    key={column.key} 
                    className={`px-4 py-3 text-right text-sm font-semibold ${
                      sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    onClick={() => sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{column.label}</span>
                      {sortable && sortField === column.key && (
                        <FaSort className={`text-xs ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* الترقيم */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, sortedData.length)} من {sortedData.length} سجل
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                السابق
              </Button>
              <span className="text-sm">
                {currentPage} من {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

const AdvancedReportsSystem = () => {
  const { 
    cashReceipts, 
    cashDisbursements, 
    treasuryBalance, 
    customers, 
    suppliers,
    salesInvoices,
    purchaseInvoices,
    products
  } = useData();
  
  const { settings } = useSystemSettings();
  const { hasPermission } = useAuth();
  const { showWarning, showError, showSuccess, showInfo } = useNotification();
  
  const [selectedReport, setSelectedReport] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedChartType, setSelectedChartType] = useState('line');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    dateFrom: '',
    dateTo: '',
    categories: [],
    sources: []
  });

  // أنواع التقارير المتاحة
  const reportTypes = [
    { id: 'overview', title: 'نظرة عامة', icon: <FaChartLine />, color: 'blue' },
    { id: 'cashflow', title: 'التدفقات النقدية', icon: <FaMoneyBillWave />, color: 'green' },
    { id: 'profitability', title: 'الربحية', icon: <FaTrendUp />, color: 'purple' },
    { id: 'customer_analysis', title: 'تحليل العملاء', icon: <FaUsers />, color: 'yellow' },
    { id: 'supplier_analysis', title: 'تحليل الموردين', icon: <FaTruck />, color: 'red' },
    { id: 'inventory_impact', title: 'تأثير المخزون', icon: <FaDatabase />, color: 'indigo' }
  ];

  // حساب الإحصائيات المتقدمة
  const advancedAnalytics = useMemo(() => {
    const now = new Date();
    const periodDays = selectedPeriod === 'week' ? 7 : 
                      selectedPeriod === 'month' ? 30 : 
                      selectedPeriod === 'quarter' ? 90 : 365;
    
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    
    // فلترة المعاملات حسب الفترة
    const periodReceipts = cashReceipts.filter(r => new Date(r.date) >= startDate);
    const periodDisbursements = cashDisbursements.filter(d => new Date(d.date) >= startDate);
    const periodSales = salesInvoices.filter(s => new Date(s.date) >= startDate);
    const periodPurchases = purchaseInvoices.filter(p => new Date(p.date) >= startDate);
    
    // حساب المؤشرات الرئيسية
    const totalRevenue = periodReceipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const totalExpenses = periodDisbursements.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    
    const totalSales = periodSales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
    const totalPurchases = periodPurchases.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
    const grossProfit = totalSales - totalPurchases;
    
    // حساب النسب المالية
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const grossMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
    const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
    
    // تحليل الاتجاهات
    const dailyAverage = netProfit / periodDays;
    const weeklyGrowth = ((totalRevenue - totalExpenses) - ((totalRevenue - totalExpenses) * 0.8)) / ((totalRevenue - totalExpenses) * 0.8) * 100;
    
    // تحليل العملاء
    const topCustomers = customers
      .map(customer => {
        const customerSales = periodSales.filter(s => s.customerId === customer.id);
        const customerRevenue = customerSales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
        return { ...customer, revenue: customerRevenue };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // تحليل الموردين
    const topSuppliers = suppliers
      .map(supplier => {
        const supplierPurchases = periodPurchases.filter(p => p.supplierId === supplier.id);
        const supplierExpenses = supplierPurchases.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
        return { ...supplier, expenses: supplierExpenses };
      })
      .sort((a, b) => b.expenses - a.expenses)
      .slice(0, 10);
    
    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      grossProfit,
      grossMargin,
      expenseRatio,
      dailyAverage,
      weeklyGrowth,
      topCustomers,
      topSuppliers,
      periodDays
    };
  }, [cashReceipts, cashDisbursements, salesInvoices, purchaseInvoices, customers, suppliers, selectedPeriod]);

  // بيانات الرسوم البيانية
  const chartData = useMemo(() => {
    const days = selectedPeriod === 'week' ? 7 : 
                selectedPeriod === 'month' ? 30 : 
                selectedPeriod === 'quarter' ? 90 : 365;
    
    const dailyData = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRevenue = cashReceipts
        .filter(r => r.date.startsWith(dateStr))
        .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      
      const dayExpenses = cashDisbursements
        .filter(d => d.date.startsWith(dateStr))
        .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
      
      const daySales = salesInvoices
        .filter(s => s.date.startsWith(dateStr))
        .reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
      
      return {
        label: selectedPeriod === 'week' ? 
          ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][date.getDay()] :
          date.getDate().toString(),
        revenue: dayRevenue,
        expenses: dayExpenses,
        sales: daySales,
        profit: (dayRevenue - dayExpenses) || (daySales - dayExpenses)
      };
    });
    
    return dailyData;
  }, [cashReceipts, cashDisbursements, salesInvoices, selectedPeriod]);

  // تحليل الفئات
  const categoryAnalysis = useMemo(() => {
    const categories = {
      receipt: {},
      disbursement: {}
    };
    
    cashReceipts.forEach(r => {
      categories.receipt[r.category] = (categories.receipt[r.category] || 0) + parseFloat(r.amount || 0);
    });
    
    cashDisbursements.forEach(d => {
      categories.disbursement[d.category] = (categories.disbursement[d.category] || 0) + parseFloat(d.amount || 0);
    });
    
    return categories;
  }, [cashReceipts, cashDisbursements]);

  // تنسيق العملة
  const formatCurrency = (amount) => {
    const currency = settings?.currency || 'EGP';
    const locale = settings?.language === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  // تقرير النظرة العامة
  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* بطاقات المؤشرات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {hasPermission('view_financial_data') ? formatCurrency(advancedAnalytics.totalRevenue) : '••••••'}
            </div>
            <div className="text-gray-600 mt-2">إجمالي الإيرادات</div>
            <div className="text-xs text-green-600 mt-1">
              <FaTrendUp className="inline mr-1" />
              +{advancedAnalytics.weeklyGrowth.toFixed(1)}% من الأسبوع الماضي
            </div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {hasPermission('view_financial_data') ? formatCurrency(advancedAnalytics.totalExpenses) : '••••••'}
            </div>
            <div className="text-gray-600 mt-2">إجمالي المصروفات</div>
            <div className="text-xs text-red-600 mt-1">
              {advancedAnalytics.expenseRatio.toFixed(1)}% من الإيرادات
            </div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <div className="text-center">
            <div className={`text-2xl font-bold ${advancedAnalytics.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {hasPermission('view_financial_data') ? formatCurrency(advancedAnalytics.netProfit) : '••••••'}
            </div>
            <div className="text-gray-600 mt-2">صافي الربح</div>
            <div className="text-xs text-blue-600 mt-1">
              هامش الربح: {advancedAnalytics.profitMargin.toFixed(1)}%
            </div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <div className="text-center">
            <div className={`text-2xl font-bold ${advancedAnalytics.grossProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              {hasPermission('view_financial_data') ? formatCurrency(advancedAnalytics.grossProfit) : '••••••'}
            </div>
            <div className="text-gray-600 mt-2">إجمالي المبيعات</div>
            <div className="text-xs text-purple-600 mt-1">
              هامش إجمالي: {advancedAnalytics.grossMargin.toFixed(1)}%
            </div>
          </div>
        </Card>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="اتجاه الإيرادات والمصروفات">
          <AdvancedChart 
            data={chartData.map(d => ({ label: d.label, value: d.revenue }))}
            type={selectedChartType}
            height={250}
          />
        </Card>
        
        <Card title="توزيع الفئات">
          <AdvancedChart 
            data={[
              ...Object.entries(categoryAnalysis.receipt).map(([cat, value]) => ({ 
                label: getCategoryLabel(cat, 'receipt'), 
                value,
                color: '#10B981'
              })),
              ...Object.entries(categoryAnalysis.disbursement).map(([cat, value]) => ({ 
                label: getCategoryLabel(cat, 'disbursement'), 
                value,
                color: '#EF4444'
              }))
            ]}
            type="doughnut"
            height={250}
          />
        </Card>
      </div>

      {/* أفضل العملاء والموردين */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="أفضل 5 عملاء">
          <div className="space-y-3">
            {advancedAnalytics.topCustomers.slice(0, 5).map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.phone || 'لا يوجد هاتف'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {hasPermission('view_financial_data') ? formatCurrency(customer.revenue) : '••••••'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((customer.revenue / advancedAnalytics.totalSales) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card title="أفضل 5 موردين">
          <div className="space-y-3">
            {advancedAnalytics.topSuppliers.slice(0, 5).map((supplier, index) => (
              <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{supplier.name}</div>
                    <div className="text-sm text-gray-600">{supplier.phone || 'لا يوجد هاتف'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">
                    {hasPermission('view_financial_data') ? formatCurrency(supplier.expenses) : '••••••'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((supplier.expenses / advancedAnalytics.totalPurchases) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  // تقرير التدفقات النقدية
  const renderCashFlowReport = () => (
    <div className="space-y-6">
      <AdvancedChart 
        data={chartData.map(d => ({ label: d.label, value: d.profit }))}
        type={selectedChartType}
        height={400}
        title="التدفقات النقدية اليومية"
      />
      
      <AdvancedDataTable
        title="تفاصيل التدفقات اليومية"
        data={chartData.map(d => ({
          التاريخ: d.label,
          الإيرادات: hasPermission('view_financial_data') ? formatCurrency(d.revenue) : '••••••',
          المصروفات: hasPermission('view_financial_data') ? formatCurrency(d.expenses) : '••••••',
          صافي_التدفق: hasPermission('view_financial_data') ? formatCurrency(d.profit) : '••••••',
          المبيعات: hasPermission('view_financial_data') ? formatCurrency(d.sales) : '••••••'
        }))}
        columns={[
          { key: 'التاريخ', label: 'التاريخ' },
          { key: 'الإيرادات', label: 'الإيرادات' },
          { key: 'المصروفات', label: 'المصروفات' },
          { key: 'صافي_التدفق', label: 'صافي التدفق' },
          { key: 'المبيعات', label: 'المبيعات' }
        ]}
      />
    </div>
  );

  // تقرير الربحية
  const renderProfitabilityReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {advancedAnalytics.profitMargin.toFixed(1)}%
          </div>
          <div className="text-gray-600 mt-2">هامش صافي الربح</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600">
            {advancedAnalytics.grossMargin.toFixed(1)}%
          </div>
          <div className="text-gray-600 mt-2">هامش إجمالي الربح</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-3xl font-bold text-orange-600">
            {advancedAnalytics.expenseRatio.toFixed(1)}%
          </div>
          <div className="text-gray-600 mt-2">نسبة المصروفات</div>
        </Card>
      </div>
      
      <AdvancedChart 
        data={chartData.map(d => ({ label: d.label, value: d.sales }))}
        type="bar"
        height={350}
        title="المبيعات اليومية"
      />
    </div>
  );

  // دالة ترجمة الفئات
  const getCategoryLabel = (category, type) => {
    const labels = {
      receipt: {
        invoice_payment: 'سداد فواتير',
        return_refund: 'استردادات',
        capital: 'رأس المال',
        bank: 'بنوك',
        revenue: 'إيرادات',
        other: 'أخرى'
      },
      disbursement: {
        invoice_payment: 'دفع فواتير',
        salary: 'رواتب',
        expenses: 'مصاريف',
        bank: 'بنوك',
        other: 'أخرى'
      }
    };
    
    return labels[type]?.[category] || category;
  };

  const generateReport = () => {
    const reportContent = {
      نوع_التقرير: reportTypes.find(r => r.id === selectedReport)?.title,
      الفترة: selectedPeriod,
      الإحصائيات: advancedAnalytics,
      بيانات_الرسوم_البيانية: chartData,
      تاريخ_التقرير: new Date().toLocaleString('ar-EG')
    };
    
    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${selectedReport}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    showSuccess('تم تصدير التقرير بنجاح');
  };

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">نظام التقارير المتقدم</h1>
          <p className="text-gray-600 mt-1">تقارير تفصيلية وتحليلات متقدمة للوضع المالي</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">آخر أسبوع</option>
            <option value="month">آخر شهر</option>
            <option value="quarter">آخر 3 أشهر</option>
            <option value="year">آخر سنة</option>
          </select>
          
          <Button variant="secondary" onClick={() => setShowCustomizer(true)} icon={<FaCog />}>
            تخصيص
          </Button>
          
          <Button variant="primary" onClick={generateReport} icon={<FaDownload />}>
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* شريط أنواع التقارير */}
      <div className="flex overflow-x-auto gap-4 pb-2">
        {reportTypes.map((report) => (
          <Button
            key={report.id}
            variant={selectedReport === report.id ? 'primary' : 'secondary'}
            onClick={() => setSelectedReport(report.id)}
            icon={report.icon}
            className="whitespace-nowrap"
          >
            {report.title}
          </Button>
        ))}
      </div>

      {/* محتوى التقرير */}
      <div>
        {selectedReport === 'overview' && renderOverviewReport()}
        {selectedReport === 'cashflow' && renderCashFlowReport()}
        {selectedReport === 'profitability' && renderProfitabilityReport()}
        {selectedReport === 'customer_analysis' && renderOverviewReport()}
        {selectedReport === 'supplier_analysis' && renderOverviewReport()}
        {selectedReport === 'inventory_impact' && renderOverviewReport()}
      </div>

      {/* Modal التخصيص */}
      <Modal
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        title="تخصيص التقرير"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">نوع الرسم البياني</label>
            <select
              value={selectedChartType}
              onChange={(e) => setSelectedChartType(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="line">خطي</option>
              <option value="bar">عمودي</option>
              <option value="doughnut">دائري</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">الفلاتر</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={reportFilters.dateFrom}
                  onChange={(e) => setReportFilters({...reportFilters, dateFrom: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={reportFilters.dateTo}
                  onChange={(e) => setReportFilters({...reportFilters, dateTo: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="primary" onClick={() => setShowCustomizer(false)}>
              تطبيق
            </Button>
            <Button variant="secondary" onClick={() => setShowCustomizer(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdvancedReportsSystem;