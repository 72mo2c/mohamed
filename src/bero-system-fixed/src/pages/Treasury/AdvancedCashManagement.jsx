// ======================================
// Advanced Cash Management - إدارة النقد المتقدمة
// ======================================

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Modal from '../../components/Common/Modal';
import Table from '../../components/Common/Table';
import { 
  FaWallet, 
  FaChartLine, 
  FaCalculator,
  FaCalendarAlt,
  FaPiggyBank,
  FaExchangeAlt,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaFilter,
  FaDownload,
  FaPrint,
  FaGem,
  FaTrendUp,
  FaTrendDown,
  FaShieldAlt,
  FaInfoCircle,
  FaCog,
  FaTasks,
  FaBell,
  FaExpand,
  FaCompress
} from 'react-icons/fa';

// مكون الرسم البياني الخطي
const LineChart = ({ data, height = 200 }) => {
  if (!data || data.length === 0) return <div className="text-center text-gray-500 p-8">لا توجد بيانات</div>;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 80;
    return `${x},${y}`;
  }).join(' ');

  // إنشاء المناطق (gradient fill)
  const gradientPoints = [
    ...points.split(' '),
    '100,100',
    '0,100'
  ].join(' ');

  return (
    <div className="h-48 px-4">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Gradient */}
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* الخط الرئيسي */}
        <polyline
          fill="url(#chartGradient)"
          stroke="#3B82F6"
          strokeWidth="2"
          points={gradientPoints}
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
              fill="#3B82F6"
              className="hover:r-3 cursor-pointer"
            >
              <title>{`${item.label}: ${item.value.toFixed(2)}`}</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
};

// مكون مخطط دائري
const DonutChart = ({ data, centerText, centerSubtext }) => {
  const total = data.reduce((sum, item) => sum + Math.abs(item.value), 0);
  let currentOffset = 0;
  
  return (
    <div className="flex items-center justify-center h-64">
      <div className="relative w-40 h-40">
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
                stroke={item.color}
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
            <div className="text-xl font-bold text-gray-800">{centerText}</div>
            <div className="text-xs text-gray-600">{centerSubtext}</div>
          </div>
        </div>
      </div>
      <div className="mr-6 space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center text-sm">
            <div 
              className="w-4 h-4 rounded-full mr-3 cursor-pointer hover:scale-110 transition-transform" 
              style={{ backgroundColor: item.color }}
            />
            <div>
              <div className="text-gray-700 font-medium">{item.label}</div>
              <div className="text-xs text-gray-500">{item.value.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdvancedCashManagement = () => {
  const navigate = useNavigate();
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
  const { showWarning, showInfo, showSuccess } = useNotification();
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedView, setSelectedView] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    cashFlow: true,
    projections: true,
    management: false,
    alerts: true
  });
  const [showProjectionsModal, setShowProjectionsModal] = useState(false);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  
  // حساب تحليل التدفقات النقدية المتقدم
  const cashFlowAnalysis = useMemo(() => {
    try {
      const now = new Date();
      const analysisPeriod = selectedPeriod === 'week' ? 7 : 
                            selectedPeriod === 'month' ? 30 : 
                            selectedPeriod === 'quarter' ? 90 : 365;
      
      const startDate = new Date(now.getTime() - analysisPeriod * 24 * 60 * 60 * 1000);
      
      // جمع المعاملات
      const periodReceipts = cashReceipts.filter(r => new Date(r.date) >= startDate);
      const periodDisbursements = cashDisbursements.filter(d => new Date(d.date) >= startDate);
      
      // تحليل التدفقات حسب الفئات
      const receiptsByCategory = {};
      const disbursementsByCategory = {};
      
      periodReceipts.forEach(r => {
        if (r.category) {
          receiptsByCategory[r.category] = (receiptsByCategory[r.category] || 0) + parseFloat(r.amount || 0);
        }
      });
      
      periodDisbursements.forEach(d => {
        if (d.category) {
          disbursementsByCategory[d.category] = (disbursementsByCategory[d.category] || 0) + parseFloat(d.amount || 0);
        }
      });
      
      // حساب المتوسطات والتوجهات
      const totalReceipts = periodReceipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      const totalDisbursements = periodDisbursements.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
      const netFlow = totalReceipts - totalDisbursements;
      
      const dailyAverage = analysisPeriod > 0 ? netFlow / analysisPeriod : 0;
      const volatilityIndex = Math.abs(dailyAverage) > 0 ? 
        Math.sqrt((periodReceipts.length + periodDisbursements.length)) / analysisPeriod : 0;
      
      // التنبؤ
      const projected30Days = dailyAverage * 30;
      const projected90Days = dailyAverage * 90;
      
      return {
        totalReceipts,
        totalDisbursements,
        netFlow,
        dailyAverage,
        volatilityIndex: Math.min(Math.max(volatilityIndex, 0), 1), // ضمان أن القيمة بين 0 و 1
        projected30Days,
        projected90Days,
        receiptsByCategory,
        disbursementsByCategory,
        periodLength: analysisPeriod,
        transactionCount: periodReceipts.length + periodDisbursements.length
      };
    } catch (error) {
      console.error('خطأ في تحليل التدفقات النقدية:', error);
      return {
        totalReceipts: 0,
        totalDisbursements: 0,
        netFlow: 0,
        dailyAverage: 0,
        volatilityIndex: 0,
        projected30Days: 0,
        projected90Days: 0,
        receiptsByCategory: {},
        disbursementsByCategory: {},
        periodLength: 30,
        transactionCount: 0
      };
    }
  }, [cashReceipts, cashDisbursements, selectedPeriod]);

  // تحليل السيولة والمخاطر
  const liquidityAnalysis = useMemo(() => {
    try {
      // حساب احتياطيات الطوارئ المقترحة
      const emergencyReserve = Math.abs(cashFlowAnalysis.dailyAverage) * 30; // 30 يوم تغطية
      
      // معدل دوران النقد
      const cashTurnover = treasuryBalance > 0 ? 
        (cashFlowAnalysis.totalReceipts + cashFlowAnalysis.totalDisbursements) / treasuryBalance : 0;
      
      // مؤشر الاستقرار
      const stabilityIndex = cashFlowAnalysis.volatilityIndex < 0.1 ? 'مستقر جداً' :
                            cashFlowAnalysis.volatilityIndex < 0.2 ? 'مستقر' :
                            cashFlowAnalysis.volatilityIndex < 0.3 ? 'متقلب قليلاً' :
                            cashFlowAnalysis.volatilityIndex < 0.5 ? 'متقلب' : 'متقلب جداً';
      
      // مستوى السيولة
      const liquidityLevel = treasuryBalance > emergencyReserve * 2 ? 'ممتاز' :
                            treasuryBalance > emergencyReserve ? 'جيد' :
                            treasuryBalance > emergencyReserve * 0.5 ? 'مقبول' : 'ضعيف';
      
      return {
        emergencyReserve: Math.max(0, emergencyReserve),
        cashTurnover: Math.max(0, Math.min(cashTurnover, 100)), // منع القيم المرتفعة جداً
        stabilityIndex,
        liquidityLevel,
        reserveRatio: emergencyReserve > 0 ? treasuryBalance / emergencyReserve : 0
      };
    } catch (error) {
      console.error('خطأ في تحليل السيولة:', error);
      return {
        emergencyReserve: 0,
        cashTurnover: 0,
        stabilityIndex: 'غير محدد',
        liquidityLevel: 'غير محدد',
        reserveRatio: 0
      };
    }
  }, [cashFlowAnalysis, treasuryBalance]);

  // اقتراحات التحسين
  const optimizationSuggestions = useMemo(() => {
    const suggestions = [];
    
    // تحليل السيولة
    if (liquidityAnalysis.reserveRatio < 1) {
      suggestions.push({
        type: 'danger',
        title: 'تحسين السيولة',
        description: 'الاحتياطي أقل من الحد الآمن. يُنصح بزيادة السيولة.',
        action: 'زيادة السيولة',
        priority: 'عالي'
      });
    }
    
    // تحليل التقلب
    if (cashFlowAnalysis.volatilityIndex > 0.3) {
      suggestions.push({
        type: 'warning',
        title: 'تقليل التقلب',
        description: 'التدفق النقدي متقلب. يُنصح بتطبيق جدولة أفضل.',
        action: 'جدولة التدفقات',
        priority: 'متوسط'
      });
    }
    
    // تحليل دوران النقد
    if (liquidityAnalysis.cashTurnover > 10) {
      suggestions.push({
        type: 'info',
        title: 'تحسين استغلال النقد',
        description: 'معدل دوران النقد عالي. يمكن الاستفادة من الاستثمارات قصيرة المدى.',
        action: 'استثمار فائض النقد',
        priority: 'منخفض'
      });
    }
    
    return suggestions;
  }, [liquidityAnalysis, cashFlowAnalysis]);

  // بيانات الرسوم البيانية
  const chartData = useMemo(() => {
    try {
      const days = selectedPeriod === 'week' ? 7 : 
                  selectedPeriod === 'month' ? 30 : 
                  selectedPeriod === 'quarter' ? 90 : 365;
      
      const dailyData = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        const dayReceipts = cashReceipts
          .filter(r => r.date && r.date.startsWith(dateStr))
          .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
        
        const dayDisbursements = cashDisbursements
          .filter(d => d.date && d.date.startsWith(dateStr))
          .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
        
        return {
          label: selectedPeriod === 'week' ? 
            ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][date.getDay()] :
            date.getDate().toString(),
          value: dayReceipts - dayDisbursements,
          receipts: dayReceipts,
          disbursements: dayDisbursements
        };
      });
      
      return dailyData;
    } catch (error) {
      console.error('خطأ في إنشاء بيانات الرسوم البيانية:', error);
      return [];
    }
  }, [cashReceipts, cashDisbursements, selectedPeriod]);

  // بيانات توزيع التدفقات
  const distributionData = useMemo(() => {
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];
    
    const receiptsData = Object.entries(cashFlowAnalysis.receiptsByCategory).map(([category, value], index) => ({
      label: getCategoryLabel(category, 'receipt'),
      value,
      color: colors[index % colors.length]
    }));
    
    const disbursementsData = Object.entries(cashFlowAnalysis.disbursementsByCategory).map(([category, value], index) => ({
      label: getCategoryLabel(category, 'disbursement'),
      value: -value,
      color: colors[index % colors.length]
    }));
    
    return { receiptsData, disbursementsData };
  }, [cashFlowAnalysis]);

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

  // تبديل إعدادات العرض
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // الحصول على لون التحذير
  const getAlertColor = (type) => {
    switch (type) {
      case 'danger': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">إدارة النقد المتقدمة</h1>
          <p className="text-gray-600 mt-1">تحليل شامل للتدفقات النقدية والسيولة مع تنبؤات ذكية</p>
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
          
          <Button 
            variant="primary" 
            onClick={() => setShowProjectionsModal(true)} 
            icon={<FaChartLine />}
          >
            التنبؤات
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={() => setShowOptimizationModal(true)} 
            icon={<FaCog />}
          >
            التحسين
          </Button>
        </div>
      </div>

      {/* بطاقات المؤشرات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">صافي التدفق</p>
              <p className={`text-2xl font-bold ${cashFlowAnalysis.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {hasPermission('view_financial_data') ? formatCurrency(cashFlowAnalysis.netFlow) : '••••••'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <FaTrendUp className="inline mr-1" />
                {selectedPeriod === 'week' ? 'أسبوعي' : 
                 selectedPeriod === 'month' ? 'شهري' : 
                 selectedPeriod === 'quarter' ? 'ربع سنوي' : 'سنوي'}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaWallet className="text-2xl text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">السيولة</p>
              <p className={`text-2xl font-bold ${liquidityAnalysis.liquidityLevel === 'ممتاز' ? 'text-green-600' : 
                                                   liquidityAnalysis.liquidityLevel === 'جيد' ? 'text-blue-600' :
                                                   liquidityAnalysis.liquidityLevel === 'مقبول' ? 'text-yellow-600' : 'text-red-600'}`}>
                {liquidityAnalysis.liquidityLevel}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <FaShieldAlt className="inline mr-1" />
                احتياطي: {hasPermission('view_financial_data') ? formatCurrency(liquidityAnalysis.emergencyReserve) : '••••••'}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaPiggyBank className="text-2xl text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">الاستقرار</p>
              <p className="text-2xl font-bold text-purple-600">{liquidityAnalysis.stabilityIndex}</p>
              <p className="text-xs text-gray-500 mt-1">
                <FaExchangeAlt className="inline mr-1" />
                معدل التقلب: {(cashFlowAnalysis.volatilityIndex * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FaChartLine className="text-2xl text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">دوران النقد</p>
              <p className="text-2xl font-bold text-orange-600">{liquidityAnalysis.cashTurnover.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-1">
                <FaCalculator className="inline mr-1" />
                {cashFlowAnalysis.transactionCount} معاملة
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FaGem className="text-2xl text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* قسم التنبيهات والتحسينات */}
      {optimizationSuggestions.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FaBell className="text-yellow-600 text-xl" />
              <h3 className="text-lg font-semibold">اقتراحات التحسين</h3>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowOptimizationModal(true)}
            >
              عرض الكل
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {optimizationSuggestions.slice(0, 6).map((suggestion, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getAlertColor(suggestion.type)}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{suggestion.title}</h4>
                    <p className="text-sm opacity-90">{suggestion.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    suggestion.priority === 'عالي' ? 'bg-red-100 text-red-700' :
                    suggestion.priority === 'متوسط' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {suggestion.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card 
          title={`اتجاه التدفقات النقدية (${selectedPeriod === 'week' ? 'آخر أسبوع' : 
                                          selectedPeriod === 'month' ? 'آخر شهر' : 
                                          selectedPeriod === 'quarter' ? 'آخر 3 أشهر' : 'آخر سنة'})`}
          className="lg:col-span-2"
        >
          <LineChart data={chartData} height={300} />
          
          {/* إحصائيات تفصيلية تحت الرسم البياني */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">إجمالي الإيرادات</div>
              <div className="text-lg font-bold text-green-600">
                {hasPermission('view_financial_data') ? formatCurrency(cashFlowAnalysis.totalReceipts) : '••••••'}
              </div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-sm text-gray-600">إجمالي المصروفات</div>
              <div className="text-lg font-bold text-red-600">
                {hasPermission('view_financial_data') ? formatCurrency(cashFlowAnalysis.totalDisbursements) : '••••••'}
              </div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">متوسط يومي</div>
              <div className={`text-lg font-bold ${cashFlowAnalysis.dailyAverage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {hasPermission('view_financial_data') ? formatCurrency(cashFlowAnalysis.dailyAverage) : '••••••'}
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">صافي التدفق</div>
              <div className={`text-lg font-bold ${cashFlowAnalysis.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {hasPermission('view_financial_data') ? formatCurrency(cashFlowAnalysis.netFlow) : '••••••'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* توزيع التدفقات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="توزيع الإيرادات حسب الفئة">
          <DonutChart 
            data={distributionData.receiptsData}
            centerText={cashFlowAnalysis.totalReceipts.toFixed(0)}
            centerSubtext="إجمالي الإيرادات"
          />
        </Card>

        <Card title="توزيع المصروفات حسب الفئة">
          <DonutChart 
            data={distributionData.disbursementsData}
            centerText={cashFlowAnalysis.totalDisbursements.toFixed(0)}
            centerSubtext="إجمالي المصروفات"
          />
        </Card>
      </div>

      {/* التنبؤات المالية */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">التنبؤات المالية</h3>
          <Button 
            variant="primary" 
            onClick={() => setShowProjectionsModal(true)}
            icon={<FaChartLine />}
          >
            عرض التفاصيل
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {hasPermission('view_financial_data') ? formatCurrency(cashFlowAnalysis.projected30Days) : '••••••'}
            </div>
            <div className="text-sm text-green-700 font-medium">توقعات 30 يوم</div>
            <div className="text-xs text-green-600 mt-1">
              <FaTrendUp className="inline mr-1" />
              سيناريو متفائل
            </div>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {hasPermission('view_financial_data') ? formatCurrency(cashFlowAnalysis.projected30Days * 0.8) : '••••••'}
            </div>
            <div className="text-sm text-blue-700 font-medium">سيناريو واقعي</div>
            <div className="text-xs text-blue-600 mt-1">
              <FaCalculator className="inline mr-1" />
              بناءً على المتوسط
            </div>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600 mb-2">
              {hasPermission('view_financial_data') ? formatCurrency(cashFlowAnalysis.projected30Days * 0.6) : '••••••'}
            </div>
            <div className="text-sm text-red-700 font-medium">سيناريو متشائم</div>
            <div className="text-xs text-red-600 mt-1">
              <FaTrendDown className="inline mr-1" />
              أكثر تحفظاً
            </div>
          </div>
        </div>
      </Card>

      {/* جدول تفصيلي للتدفقات */}
      <Card title="تفاصيل التدفقات اليومية">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold">التاريخ</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">الإيرادات</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">المصروفات</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">صافي التدفق</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chartData.slice(-10).map((day, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{day.label}</td>
                  <td className="px-4 py-3 text-sm text-green-600">
                    {hasPermission('view_financial_data') ? formatCurrency(day.receipts) : '••••••'}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600">
                    {hasPermission('view_financial_data') ? formatCurrency(day.disbursements) : '••••••'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${day.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {hasPermission('view_financial_data') ? formatCurrency(day.value) : '••••••'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {day.value > 0 ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        فائض
                      </span>
                    ) : day.value < 0 ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        عجز
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        متعادل
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal التنبؤات */}
      <Modal 
        isOpen={showProjectionsModal} 
        onClose={() => setShowProjectionsModal(false)} 
        title="التنبؤات المالية التفصيلية"
        size="xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="توقعات 30 يوم">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>السيناريو المتفائل:</span>
                  <span className="font-bold text-green-600">
                    {hasPermission('view_financial_data') ? formatCurrency(cashFlowAnalysis.projected30Days) : '••••••'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>السيناريو الواقعي:</span>
                  <span className="font-bold text-blue-600">
                    {hasPermission('view_financial_data') ? formatCurrency(cashFlowAnalysis.projected30Days * 0.8) : '••••••'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>السيناريو المتشائم:</span>
                  <span className="font-bold text-red-600">
                    {hasPermission('view_financial_data') ? formatCurrency(cashFlowAnalysis.projected30Days * 0.6) : '••••••'}
                  </span>
                </div>
              </div>
            </Card>

            <Card title="توقعات 90 يوم">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>السيناريو المتفائل:</span>
                  <span className="font-bold text-green-600">
                    {hasPermission('view_financial_data') ? formatCurrency(cashFlowAnalysis.projected90Days) : '••••••'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>السيناريو الواقعي:</span>
                  <span className="font-bold text-blue-600">
                    {hasPermission('view_financial_data') ? formatCurrency(cashFlowAnalysis.projected90Days * 0.8) : '••••••'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>السيناريو المتشائم:</span>
                  <span className="font-bold text-red-600">
                    {hasPermission('view_financial_data') ? formatCurrency(cashFlowAnalysis.projected90Days * 0.6) : '••••••'}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <Card title="خطة العمل المقترحة">
            <div className="space-y-3">
              {optimizationSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FaTasks className="text-blue-500 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-medium">{suggestion.title}</h4>
                    <p className="text-sm text-gray-600">{suggestion.description}</p>
                  </div>
                  <Button variant="secondary" size="sm">
                    {suggestion.action}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Modal>

      {/* Modal التحسين */}
      <Modal 
        isOpen={showOptimizationModal} 
        onClose={() => setShowOptimizationModal(false)} 
        title="اقتراحات التحسين"
        size="lg"
      >
        <div className="space-y-6">
          {optimizationSuggestions.map((suggestion, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getAlertColor(suggestion.type)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">{suggestion.title}</h3>
                  <p className="text-sm opacity-90 mb-3">{suggestion.description}</p>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      suggestion.priority === 'عالي' ? 'bg-red-100 text-red-700' :
                      suggestion.priority === 'متوسط' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {suggestion.priority}
                    </span>
                  </div>
                </div>
                <Button variant="secondary" size="sm">
                  {suggestion.action}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default AdvancedCashManagement;