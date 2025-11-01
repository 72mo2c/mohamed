// ======================================
// Advanced Balances Management - إدارة الأرصدة المتقدمة
// ======================================

import React, { useState, useMemo } from 'react';
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
  FaUsers, 
  FaTruck,
  FaSearch,
  FaFilter,
  FaSort,
  FaEye,
  FaExclamationTriangle,
  FaInfoCircle,
  FaShieldAlt,
  FaChartLine,
  FaCalendarAlt,
  FaClock,
  FaBell,
  FaTasks,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaCreditCard,
  FaFileInvoice,
  FaExternalLinkAlt,
  FaDownload,
  FaPrint,
  FaShare,
  FaEdit,
  FaPlus,
  FaMinus,
  FaCalculator,
  FaTrendUp,
  FaTrendDown,
  FaGem,
  FaCog,
  FaCheck,
  FaTimes,
  FaLock,
  FaUnlock,
  FaChartPie,
  FaChartBar,
  FaDatabase,
  FaHistory,
  FaFlag
} from 'react-icons/fa';

// مكون مخطط دائري للأرصدة
const BalanceDistributionChart = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + Math.abs(item.balance), 0);
  let currentOffset = 0;
  const colors = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

  return (
    <div className="flex items-center justify-center h-64">
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
            const percentage = total > 0 ? (Math.abs(item.balance) / total) * 100 : 0;
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
                stroke={colors[index % colors.length]}
                strokeWidth="3"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
              >
                <title>{`${item.name}: ${item.balance.toFixed(2)} (${percentage.toFixed(1)}%)`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800">{total.toFixed(0)}</div>
            <div className="text-xs text-gray-600">إجمالي الرصيد</div>
          </div>
        </div>
      </div>
      <div className="mr-6 space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center text-sm">
            <div 
              className="w-4 h-4 rounded-full mr-3" 
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <div>
              <div className="text-gray-700 font-medium">{item.name}</div>
              <div className="text-xs text-gray-500">
                {item.balance.toFixed(2)} ({((Math.abs(item.balance) / total) * 100).toFixed(1)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// مكون مؤشر المخاطر
const RiskIndicator = ({ level, score, description }) => {
  const getRiskColor = (level) => {
    switch (level) {
      case 'عالي': return 'text-red-600 bg-red-100 border-red-200';
      case 'متوسط': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'منخفض': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className={`p-4 rounded-lg border ${getRiskColor(level)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FaShieldAlt />
          <span className="font-semibold">مستوى المخاطر: {level}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">النقاط:</span>
          <span className={`text-xl font-bold ${getScoreColor(score)}`}>{score}/100</span>
        </div>
      </div>
      <p className="text-sm opacity-90">{description}</p>
      
      {/* شريط التقدم */}
      <div className="mt-3">
        <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              score >= 80 ? 'bg-green-500' :
              score >= 60 ? 'bg-yellow-500' :
              score >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// مكون تتبع اتجاه الرصيد
const BalanceTrendChart = ({ data, days = 30 }) => {
  if (!data || data.length === 0) return <div className="text-center text-gray-500 p-8">لا توجد بيانات</div>;
  
  const maxValue = Math.max(...data.map(d => d.balance));
  const minValue = Math.min(...data.map(d => d.balance));
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((item.balance - minValue) / range) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-48 px-4">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          points={points}
        />
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((item.balance - minValue) / range) * 80;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill="#3B82F6"
            >
              <title>{`${item.date}: ${item.balance.toFixed(2)}`}</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
};

const AdvancedBalancesManagement = () => {
  const navigate = useNavigate();
  const { 
    getAllCustomerBalances, 
    getAllSupplierBalances,
    customers,
    suppliers,
    salesInvoices,
    purchaseInvoices,
    cashReceipts,
    cashDisbursements
  } = useData();
  
  const { settings } = useSystemSettings();
  const { hasPermission } = useAuth();
  const { showWarning, showError, showSuccess, showInfo } = useNotification();
  
  const [selectedTab, setSelectedTab] = useState('customers'); // customers, suppliers, analysis
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all'); // all, high, medium, low
  const [filterBalance, setFilterBalance] = useState('all'); // all, positive, negative
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [timeRange, setTimeRange] = useState('month'); // week, month, quarter, year

  // حساب الأرصدة المتقدمة مع التحليل
  const advancedBalances = useMemo(() => {
    const customerBalances = getAllCustomerBalances();
    const supplierBalances = getAllSupplierBalances();
    
    // تحليل المخاطر للعملاء
    const analyzedCustomers = customerBalances.map(customer => {
      const balance = customer.balance || 0;
      const riskScore = calculateRiskScore(customer, balance);
      
      // حساب اتجاه الرصيد
      const balanceHistory = calculateBalanceHistory(customer.id, 'customer', timeRange);
      
      return {
        ...customer,
        balance,
        riskScore,
        riskLevel: getRiskLevel(riskScore),
        balanceHistory,
        lastActivity: getLastActivity(customer.id, 'customer'),
        paymentBehavior: analyzePaymentBehavior(customer.id, 'customer'),
        recommendations: generateRecommendations(customer, balance, riskScore)
      };
    });
    
    // تحليل المخاطر للموردين
    const analyzedSuppliers = supplierBalances.map(supplier => {
      const balance = supplier.balance || 0;
      const riskScore = calculateRiskScore(supplier, balance);
      
      // حساب اتجاه الرصيد
      const balanceHistory = calculateBalanceHistory(supplier.id, 'supplier', timeRange);
      
      return {
        ...supplier,
        balance,
        riskScore,
        riskLevel: getRiskLevel(riskScore),
        balanceHistory,
        lastActivity: getLastActivity(supplier.id, 'supplier'),
        paymentBehavior: analyzePaymentBehavior(supplier.id, 'supplier'),
        recommendations: generateRecommendations(supplier, balance, riskScore)
      };
    });
    
    return {
      customers: analyzedCustomers,
      suppliers: analyzedSuppliers,
      totalCustomerDebt: analyzedCustomers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0),
      totalSupplierDebt: analyzedSuppliers.reduce((sum, s) => sum + (s.balance < 0 ? Math.abs(s.balance) : 0), 0),
      highRiskCustomers: analyzedCustomers.filter(c => c.riskLevel === 'عالي').length,
      highRiskSuppliers: analyzedSuppliers.filter(s => s.riskLevel === 'عالي').length,
      averageCustomerBalance: analyzedCustomers.length > 0 ? analyzedCustomers.reduce((sum, c) => sum + c.balance, 0) / analyzedCustomers.length : 0,
      averageSupplierBalance: analyzedSuppliers.length > 0 ? analyzedSuppliers.reduce((sum, s) => sum + s.balance, 0) / analyzedSuppliers.length : 0
    };
  }, [getAllCustomerBalances, getAllSupplierBalances, salesInvoices, purchaseInvoices, cashReceipts, cashDisbursements, timeRange]);

  // حساب نقاط المخاطر
  const calculateRiskScore = (entity, balance) => {
    let score = 50; // النقاط الأساسية
    
    // تأثير الرصيد
    if (balance > 10000) score -= 30;
    else if (balance > 5000) score -= 20;
    else if (balance > 1000) score -= 10;
    else if (balance < -10000) score += 25;
    else if (balance < -5000) score += 15;
    else if (balance < -1000) score += 5;
    
    // تأثير النشاط الأخير
    const daysSinceActivity = getDaysSinceActivity(entity.id, entity.type || 'customer');
    if (daysSinceActivity > 90) score -= 15;
    else if (daysSinceActivity > 30) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  };

  // تحديد مستوى المخاطر
  const getRiskLevel = (score) => {
    if (score >= 70) return 'عالي';
    if (score >= 40) return 'متوسط';
    return 'منخفض';
  };

  // حساب تاريخ الرصيد
  const calculateBalanceHistory = (entityId, type, timeRange) => {
    const days = timeRange === 'week' ? 7 : 
                timeRange === 'month' ? 30 : 
                timeRange === 'quarter' ? 90 : 365;
    
    const history = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // حساب الرصيد لهذا التاريخ (تبسيط)
      let balance = 0;
      if (type === 'customer') {
        const sales = salesInvoices.filter(s => 
          s.customerId === entityId && s.date.startsWith(dateStr)
        );
        const receipts = cashReceipts.filter(r => 
          r.fromId === entityId && r.date.startsWith(dateStr)
        );
        balance = sales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0) - 
                 receipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      } else {
        const purchases = purchaseInvoices.filter(p => 
          p.supplierId === entityId && p.date.startsWith(dateStr)
        );
        const disbursements = cashDisbursements.filter(d => 
          d.toId === entityId && d.date.startsWith(dateStr)
        );
        balance = purchases.reduce((sum, p) => sum + parseFloat(p.total || 0), 0) - 
                 disbursements.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
      }
      
      history.push({
        date: dateStr,
        balance
      });
    }
    
    return history;
  };

  // حساب آخر نشاط
  const getLastActivity = (entityId, type) => {
    const invoices = type === 'customer' ? salesInvoices : purchaseInvoices;
    const transactions = type === 'customer' ? cashReceipts : cashDisbursements;
    
    const lastInvoice = invoices
      .filter(inv => (type === 'customer' ? inv.customerId : inv.supplierId) === entityId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    const lastTransaction = transactions
      .filter(trans => (type === 'customer' ? trans.fromId : trans.toId) === entityId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    const activities = [lastInvoice, lastTransaction].filter(Boolean);
    return activities.length > 0 ? 
      activities.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : null;
  };

  // حساب أيام منذ آخر نشاط
  const getDaysSinceActivity = (entityId, type) => {
    const lastActivity = getLastActivity(entityId, type);
    if (!lastActivity) return 999;
    
    const days = Math.floor((new Date() - new Date(lastActivity)) / (1000 * 60 * 60 * 24));
    return days;
  };

  // تحليل سلوك الدفع
  const analyzePaymentBehavior = (entityId, type) => {
    const transactions = type === 'customer' ? cashReceipts : cashDisbursements;
    const recentTransactions = transactions
      .filter(trans => (type === 'customer' ? trans.fromId : trans.toId) === entityId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
    
    if (recentTransactions.length === 0) return 'غير نشط';
    
    const avgAmount = recentTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) / recentTransactions.length;
    const frequency = recentTransactions.length;
    
    if (frequency >= 5 && avgAmount > 1000) return 'ممتاز';
    if (frequency >= 3 && avgAmount > 500) return 'جيد';
    if (frequency >= 1) return 'مقبول';
    return 'ضعيف';
  };

  // توليد التوصيات
  const generateRecommendations = (entity, balance, riskScore) => {
    const recommendations = [];
    
    if (balance > 5000 && riskScore >= 70) {
      recommendations.push({
        type: 'urgent',
        title: 'تحصيل عاجل',
        description: `المبلغ المستحق ${Math.abs(balance).toFixed(2)} كبير ويجب تحصيله فوراً`
      });
    }
    
    if (balance > 0 && riskScore >= 50) {
      recommendations.push({
        type: 'follow_up',
        title: 'متابعة دورية',
        description: 'ضرورة التواصل المنتظم لتحصيل المبلغ المستحق'
      });
    }
    
    if (balance < -2000) {
      recommendations.push({
        type: 'review',
        title: 'مراجعة الشروط',
        description: 'مراجعة شروط الدفع والتفاوض على شروط أفضل'
      });
    }
    
    if (getDaysSinceActivity(entity.id, entity.type || 'customer') > 60) {
      recommendations.push({
        type: 'contact',
        title: 'إعادة التواصل',
        description: 'لم يتم تسجيل نشاط منذ فترة، يُنصح بالتواصل'
      });
    }
    
    return recommendations;
  };

  // فلترة البيانات
  const filteredData = useMemo(() => {
    const data = selectedTab === 'customers' ? advancedBalances.customers : advancedBalances.suppliers;
    
    return data.filter(item => {
      // البحث
      const matchesSearch = 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone?.includes(searchTerm) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // فلتر المخاطر
      const matchesRisk = filterRisk === 'all' || item.riskLevel === filterRisk;
      
      // فلتر الرصيد
      let matchesBalance = true;
      if (filterBalance === 'positive') matchesBalance = item.balance > 0;
      else if (filterBalance === 'negative') matchesBalance = item.balance < 0;
      
      return matchesSearch && matchesRisk && matchesBalance;
    });
  }, [advancedBalances, selectedTab, searchTerm, filterRisk, filterBalance]);

  // أعمدة الجدول
  const columns = [
    { key: 'name', label: 'الاسم' },
    { key: 'phone', label: 'الهاتف' },
    { key: 'balance', label: 'الرصيد' },
    { key: 'riskLevel', label: 'مستوى المخاطر' },
    { key: 'riskScore', label: 'النقاط' },
    { key: 'lastActivity', label: 'آخر نشاط' },
    { key: 'paymentBehavior', label: 'سلوك الدفع' },
    { key: 'actions', label: 'الإجراءات' }
  ];

  // تنسيق البيانات للجدول
  const tableData = filteredData.map(item => ({
    ...item,
    balance: (
      <div className="text-center">
        <div className={`font-bold ${item.balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
          {hasPermission('view_financial_data') ? formatCurrency(Math.abs(item.balance)) : '••••••'}
        </div>
        <div className="text-xs text-gray-500">
          {item.balance >= 0 ? 'مدين' : 'دائن'}
        </div>
      </div>
    ),
    riskLevel: (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
        item.riskLevel === 'عالي' ? 'bg-red-100 text-red-700' :
        item.riskLevel === 'متوسط' ? 'bg-yellow-100 text-yellow-700' :
        'bg-green-100 text-green-700'
      }`}>
        {item.riskLevel}
      </span>
    ),
    riskScore: (
      <div className="text-center">
        <div className={`font-bold ${
          item.riskScore >= 70 ? 'text-red-600' :
          item.riskScore >= 40 ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {item.riskScore}
        </div>
        <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
          <div 
            className={`h-2 rounded-full ${
              item.riskScore >= 70 ? 'bg-red-500' :
              item.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${item.riskScore}%` }}
          />
        </div>
      </div>
    ),
    lastActivity: (
      <div className="text-sm">
        {item.lastActivity ? new Date(item.lastActivity).toLocaleDateString('ar-EG') : 'لا يوجد'}
        <div className="text-xs text-gray-500">
          {item.lastActivity ? `${getDaysSinceActivity(item.id, item.type || 'customer')} يوم` : ''}
        </div>
      </div>
    ),
    paymentBehavior: (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
        item.paymentBehavior === 'ممتاز' ? 'bg-green-100 text-green-700' :
        item.paymentBehavior === 'جيد' ? 'bg-blue-100 text-blue-700' :
        item.paymentBehavior === 'مقبول' ? 'bg-yellow-100 text-yellow-700' :
        item.paymentBehavior === 'ضعيف' ? 'bg-red-100 text-red-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        {item.paymentBehavior}
      </span>
    ),
    actions: (
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => viewDetails(item)} icon={<FaEye />}>
          عرض
        </Button>
        {item.recommendations.length > 0 && (
          <Button size="sm" variant="primary" onClick={() => takeAction(item)} icon={<FaTasks />}>
            إجراءات
          </Button>
        )}
      </div>
    )
  }));

  const viewDetails = (entity) => {
    setSelectedEntity(entity);
    setShowRiskModal(true);
  };

  const takeAction = (entity) => {
    setSelectedEntity(entity);
    setShowActionModal(true);
  };

  // تنسيق العملة
  const formatCurrency = (amount) => {
    const currency = settings?.currency || 'EGP';
    const locale = settings?.language === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const exportData = () => {
    const data = {
      النوع: selectedTab === 'customers' ? 'عملاء' : 'موردين',
      إجمالي_الأرصدة: advancedBalances,
      تاريخ_التقرير: new Date().toISOString(),
      الفلاتر: { searchTerm, filterRisk, filterBalance }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balances-${selectedTab}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    showSuccess('تم تصدير البيانات بنجاح');
  };

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">إدارة الأرصدة المتقدمة</h1>
          <p className="text-gray-600 mt-1">تحليل شامل للأرصدة مع تقييم المخاطر واقتراح الإجراءات</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">آخر أسبوع</option>
            <option value="month">آخر شهر</option>
            <option value="quarter">آخر 3 أشهر</option>
            <option value="year">آخر سنة</option>
          </select>
          
          <Button variant="secondary" icon={<FaDownload />} onClick={exportData}>
            تصدير
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {advancedBalances.customers.length}
            </div>
            <div className="text-gray-600 mt-2">إجمالي العملاء</div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {advancedBalances.suppliers.length}
            </div>
            <div className="text-gray-600 mt-2">إجمالي الموردين</div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {hasPermission('view_financial_data') ? formatCurrency(advancedBalances.totalCustomerDebt) : '••••••'}
            </div>
            <div className="text-gray-600 mt-2">إجمالي مدين العملاء</div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {hasPermission('view_financial_data') ? formatCurrency(advancedBalances.totalSupplierDebt) : '••••••'}
            </div>
            <div className="text-gray-600 mt-2">إجمالي دائن الموردين</div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {advancedBalances.highRiskCustomers}
            </div>
            <div className="text-gray-600 mt-2">عملاء عالي المخاطر</div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {advancedBalances.highRiskSuppliers}
            </div>
            <div className="text-gray-600 mt-2">موردين عالي المخاطر</div>
          </div>
        </Card>
      </div>

      {/* علامات التبويب */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setSelectedTab('customers')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            selectedTab === 'customers' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaUsers className="inline mr-2" />
          العملاء ({advancedBalances.customers.length})
        </button>
        <button
          onClick={() => setSelectedTab('suppliers')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            selectedTab === 'suppliers' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaTruck className="inline mr-2" />
          الموردين ({advancedBalances.suppliers.length})
        </button>
        <button
          onClick={() => setSelectedTab('analysis')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            selectedTab === 'analysis' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaChartLine className="inline mr-2" />
          التحليل الإجمالي
        </button>
      </div>

      {/* أدوات البحث والفلترة */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف أو البريد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع مستويات المخاطر</option>
            <option value="عالي">عالي المخاطر</option>
            <option value="متوسط">متوسط المخاطر</option>
            <option value="منخفض">منخفض المخاطر</option>
          </select>

          <select
            value={filterBalance}
            onChange={(e) => setFilterBalance(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع الأرصدة</option>
            <option value="positive">مدين (لهم دين علينا)</option>
            <option value="negative">دائن (عليهم دين لنا)</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            <FaInfoCircle className="ml-2" />
            عرض {filteredData.length} من {selectedTab === 'customers' ? advancedBalances.customers.length : advancedBalances.suppliers.length}
          </div>
        </div>
      </Card>

      {/* محتوى التبويبات */}
      {selectedTab === 'analysis' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="توزيع أرصدة العملاء">
            <BalanceDistributionChart 
              data={advancedBalances.customers.slice(0, 10).map(c => ({
                name: c.name,
                balance: c.balance
              }))}
            />
          </Card>
          
          <Card title="توزيع أرصدة الموردين">
            <BalanceDistributionChart 
              data={advancedBalances.suppliers.slice(0, 10).map(s => ({
                name: s.name,
                balance: s.balance
              }))}
            />
          </Card>
        </div>
      ) : (
        <Card>
          <Table
            columns={columns}
            data={tableData}
          />
        </Card>
      )}

      {/* Modal تفاصيل المخاطر */}
      <Modal
        isOpen={showRiskModal}
        onClose={() => setShowRiskModal(false)}
        title={`تفاصيل ${selectedEntity?.name}`}
        size="lg"
      >
        {selectedEntity && (
          <div className="space-y-6">
            <RiskIndicator 
              level={selectedEntity.riskLevel}
              score={selectedEntity.riskScore}
              description={`تحليل شامل للمخاطر المالية والحالة الائتمانية`}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="معلومات أساسية">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>الاسم:</span>
                    <span className="font-semibold">{selectedEntity.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الهاتف:</span>
                    <span className="font-semibold">{selectedEntity.phone || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>البريد الإلكتروني:</span>
                    <span className="font-semibold">{selectedEntity.email || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الرصيد الحالي:</span>
                    <span className={`font-bold ${selectedEntity.balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {hasPermission('view_financial_data') ? formatCurrency(Math.abs(selectedEntity.balance)) : '••••••'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>آخر نشاط:</span>
                    <span className="font-semibold">
                      {selectedEntity.lastActivity ? new Date(selectedEntity.lastActivity).toLocaleDateString('ar-EG') : 'لا يوجد'}
                    </span>
                  </div>
                </div>
              </Card>

              <Card title="تقييم الأداء">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>سلوك الدفع:</span>
                    <span className={`font-semibold px-2 py-1 rounded ${
                      selectedEntity.paymentBehavior === 'ممتاز' ? 'bg-green-100 text-green-700' :
                      selectedEntity.paymentBehavior === 'جيد' ? 'bg-blue-100 text-blue-700' :
                      selectedEntity.paymentBehavior === 'مقبول' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {selectedEntity.paymentBehavior}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>نقاط المخاطر:</span>
                    <span className="font-semibold">{selectedEntity.riskScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مستوى المخاطر:</span>
                    <span className={`font-semibold px-2 py-1 rounded ${
                      selectedEntity.riskLevel === 'عالي' ? 'bg-red-100 text-red-700' :
                      selectedEntity.riskLevel === 'متوسط' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {selectedEntity.riskLevel}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* التوصيات */}
            {selectedEntity.recommendations.length > 0 && (
              <Card title="التوصيات والإجراءات المقترحة">
                <div className="space-y-3">
                  {selectedEntity.recommendations.map((rec, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      rec.type === 'urgent' ? 'bg-red-50 border-red-200' :
                      rec.type === 'follow_up' ? 'bg-yellow-50 border-yellow-200' :
                      rec.type === 'review' ? 'bg-blue-50 border-blue-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <FaTasks className={`mt-1 ${
                          rec.type === 'urgent' ? 'text-red-500' :
                          rec.type === 'follow_up' ? 'text-yellow-500' :
                          rec.type === 'review' ? 'text-blue-500' :
                          'text-gray-500'
                        }`} />
                        <div className="flex-1">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* اتجاه الرصيد */}
            <Card title="اتجاه الرصيد">
              <BalanceTrendChart data={selectedEntity.balanceHistory} days={30} />
            </Card>
          </div>
        )}
      </Modal>

      {/* Modal الإجراءات */}
      <Modal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title="إجراءات مقترحة"
      >
        {selectedEntity && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">{selectedEntity.name}</h3>
              <p className="text-gray-600">الرصيد: <span className={`font-bold ${selectedEntity.balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {hasPermission('view_financial_data') ? formatCurrency(Math.abs(selectedEntity.balance)) : '••••••'}
              </span></p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedEntity.balance > 0 && (
                <Button variant="primary" className="w-full" icon={<FaPhone />}>
                  اتصال هاتفي
                </Button>
              )}
              
              <Button variant="secondary" className="w-full" icon={<FaEnvelope />}>
                إرسال بريد إلكتروني
              </Button>
              
              <Button variant="secondary" className="w-full" icon={<FaFileInvoice />}>
                إنشاء فاتورة متابعة
              </Button>
              
              <Button variant="secondary" className="w-full" icon={<FaCalendarAlt />}>
                جدولة اجتماع
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdvancedBalancesManagement;