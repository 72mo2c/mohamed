// ======================================
// Advanced Treasury Dashboard - لوحة تحكم الخزينة المتقدمة
// ======================================

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Modal from '../../components/Common/Modal';
import { 
  FaWallet, 
  FaArrowUp, 
  FaArrowDown, 
  FaChartLine, 
  FaExclamationTriangle,
  FaClock,
  FaGem,
  FaShieldAlt,
  FaTasks,
  FaBell,
  FaFilter,
  FaDownload,
  FaPrint,
  FaCalculator,
  FaPiggyBank,
  FaTrendUp,
  FaEye,
  FaInfoCircle,
  FaCog,
  FaSync
} from 'react-icons/fa';

// مكون الرسم البياني البسيط
const SimpleChart = ({ data, type = 'line', height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  if (type === 'bar') {
    return (
      <div className="flex items-end gap-1 h-48 px-4">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-blue-500 rounded-t"
              style={{ 
                height: `${Math.max(5, ((item.value - minValue) / range) * 180)}px`,
                backgroundColor: item.value >= 0 ? '#3B82F6' : '#EF4444'
              }}
              title={`${item.label}: ${item.value.toFixed(2)}`}
            />
            <span className="text-xs text-gray-600 mt-1 transform rotate-45 whitespace-nowrap">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'doughnut') {
    const total = data.reduce((sum, item) => sum + Math.abs(item.value), 0);
    
    return (
      <div className="flex items-center justify-center h-48">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            {data.map((item, index) => {
              const percentage = (Math.abs(item.value) / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -data.slice(0, index).reduce((sum, d) => sum + (Math.abs(d.value) / total) * 100, 0);
              
              return (
                <circle
                  key={index}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={item.color || '#3B82F6'}
                  strokeWidth="3"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-800">{total.toFixed(0)}</div>
              <div className="text-xs text-gray-600">الإجمالي</div>
            </div>
          </div>
        </div>
        <div className="mr-4 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center text-sm">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: item.color || '#3B82F6' }}
              />
              <span className="text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // خط الرسم البياني
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = range > 0 ? 100 - ((item.value - minValue) / range) * 80 : 50;
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
          const y = range > 0 ? 100 - ((item.value - minValue) / range) * 80 : 50;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill="#3B82F6"
            />
          );
        })}
      </svg>
    </div>
  );
};

const AdvancedTreasuryDashboard = () => {
  const { 
    cashReceipts, 
    cashDisbursements, 
    treasuryBalance, 
    customers, 
    suppliers,
    salesInvoices,
    purchaseInvoices
  } = useData();
  
  const { settings } = useSystemSettings();
  const { hasPermission } = useAuth();
  const { showWarning, showInfo, showSuccess } = useNotification();
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showForecastModal, setShowForecastModal] = useState(false);

  // إعداد التحديث التلقائي
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        showInfo('تم تحديث بيانات الخزينة');
      }, 30000); // كل 30 ثانية
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, showInfo]);

  // حساب الإحصائيات المتقدمة
  const advancedStats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // الإيرادات والمصروفات
    const recentReceipts = cashReceipts.filter(r => new Date(r.date) >= sevenDaysAgo);
    const recentDisbursements = cashDisbursements.filter(d => new Date(d.date) >= sevenDaysAgo);
    
    const totalReceipts = cashReceipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const totalDisbursements = cashDisbursements.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    
    // معدل التدفق
    const dailyAverage = (totalReceipts - totalDisbursements) / 30;
    const weeklyAverage = dailyAverage * 7;
    
    // مؤشر السيولة
    const liquidityRatio = treasuryBalance > 0 ? (treasuryBalance / (totalDisbursements / 30)) : 0;
    
    // تنبؤ بالاحتياجات
    const projectedNeeds = weeklyAverage * 4; // توقعات الشهر القادم
    
    // مؤشرات المخاطر
    const riskLevel = liquidityRatio < 1 ? 'عالي' : liquidityRatio < 3 ? 'متوسط' : 'منخفض';
    const liquidityDays = liquidityRatio * 30;
    
    return {
      totalReceipts,
      totalDisbursements,
      dailyAverage,
      weeklyAverage,
      liquidityRatio,
      projectedNeeds,
      riskLevel,
      liquidityDays,
      recentReceiptsCount: recentReceipts.length,
      recentDisbursementsCount: recentDisbursements.length
    };
  }, [cashReceipts, cashDisbursements, treasuryBalance]);

  // بيانات الرسوم البيانية
  const chartData = useMemo(() => {
    // بيانات آخر 30 يوم
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => {
      const dayReceipts = cashReceipts
        .filter(r => r.date.startsWith(date))
        .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      
      const dayDisbursements = cashDisbursements
        .filter(d => d.date.startsWith(date))
        .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

      return {
        label: new Date(date).getDate().toString(),
        value: dayReceipts - dayDisbursements
      };
    });
  }, [cashReceipts, cashDisbursements]);

  // تحذيرات ذكية
  const smartAlerts = useMemo(() => {
    const alerts = [];
    
    if (advancedStats.liquidityRatio < 1) {
      alerts.push({
        type: 'danger',
        title: 'تحذير من السيولة',
        message: `معدل السيولة منخفض جداً (${advancedStats.liquidityRatio.toFixed(2)}). تحتاج إلى ${advancedStats.projectedNeeds.toFixed(2)} جنيه خلال الشهر القادم.`,
        icon: <FaExclamationTriangle className="text-red-500" />
      });
    }
    
    if (advancedStats.recentDisbursementsCount > 10) {
      alerts.push({
        type: 'warning',
        title: 'نشاط مصروفات مرتفع',
        message: `تم تسجيل ${advancedStats.recentDisbursementsCount} معاملة صرف خلال الأسبوع الماضي.`,
        icon: <FaArrowDown className="text-yellow-500" />
      });
    }
    
    if (treasuryBalance < 0) {
      alerts.push({
        type: 'danger',
        title: 'رصيد سالب',
        message: `رصيد الخزينة سالب بمقدار ${Math.abs(treasuryBalance).toFixed(2)} جنيه.`,
        icon: <FaWallet className="text-red-500" />
      });
    }
    
    return alerts;
  }, [advancedStats, treasuryBalance]);

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

  const getRiskColor = (level) => {
    switch (level) {
      case 'عالي': return 'text-red-600 bg-red-100';
      case 'متوسط': return 'text-yellow-600 bg-yellow-100';
      case 'منخفض': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي مع أدوات التحكم */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">لوحة تحكم الخزينة المتقدمة</h1>
          <p className="text-gray-600 mt-1">مراقبة وتحليل شامل للوضع المالي والسيولة</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant={autoRefresh ? "primary" : "secondary"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            icon={<FaSync className={autoRefresh ? "animate-spin" : ""} />}
          >
            تحديث تلقائي {autoRefresh ? 'مفعل' : 'معطل'}
          </Button>
          
          <Button variant="secondary" onClick={() => setShowForecastModal(true)} icon={<FaChartLine />}>
            التنبؤات
          </Button>
          
          <Button variant="secondary" onClick={() => setShowRiskModal(true)} icon={<FaShieldAlt />}>
            تحليل المخاطر
          </Button>
        </div>
      </div>

      {/* بطاقات KPIs الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">رصيد الخزينة</p>
              <p className={`text-3xl font-bold ${treasuryBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {hasPermission('view_financial_data') ? formatCurrency(treasuryBalance) : '••••••'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <FaTrendUp className="inline mr-1" />
                متوسط يومي: {hasPermission('view_financial_data') ? formatCurrency(advancedStats.dailyAverage) : '••••••'}
              </p>
            </div>
            <div className="bg-blue-100 p-4 rounded-full">
              <FaWallet className="text-3xl text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">معدل السيولة</p>
              <p className={`text-3xl font-bold ${advancedStats.liquidityRatio >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                {advancedStats.liquidityRatio.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <FaClock className="inline mr-1" />
                {advancedStats.liquidityDays.toFixed(0)} يوم تغطية
              </p>
            </div>
            <div className="bg-green-100 p-4 rounded-full">
              <FaPiggyBank className="text-3xl text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">مستوى المخاطر</p>
              <p className={`text-2xl font-bold ${getRiskColor(advancedStats.riskLevel).split(' ')[0]}`}>
                {advancedStats.riskLevel}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <FaExclamationTriangle className="inline mr-1" />
                تحديث كل 30 ثانية
              </p>
            </div>
            <div className={`p-4 rounded-full ${getRiskColor(advancedStats.riskLevel).split(' ')[1]}`}>
              <FaShieldAlt className={`text-3xl ${getRiskColor(advancedStats.riskLevel).split(' ')[0]}`} />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">التنبؤ الشهري</p>
              <p className={`text-2xl font-bold ${advancedStats.projectedNeeds >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {hasPermission('view_financial_data') ? formatCurrency(advancedStats.projectedNeeds) : '••••••'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <FaCalculator className="inline mr-1" />
                احتياجات متوقعة
              </p>
            </div>
            <div className="bg-orange-100 p-4 rounded-full">
              <FaGem className="text-3xl text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* التنبيهات الذكية */}
      {smartAlerts.length > 0 && (
        <Card className="border-r-4 border-r-yellow-500 bg-yellow-50">
          <div className="flex items-center gap-3 mb-4">
            <FaBell className="text-yellow-600 text-xl" />
            <h3 className="text-lg font-semibold text-yellow-800">تنبيهات ذكية</h3>
          </div>
          
          <div className="space-y-3">
            {smartAlerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                {alert.icon}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{alert.title}</h4>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="اتجاه التدفقات النقدية (آخر 30 يوم)">
          <SimpleChart 
            data={chartData.slice(-15)} 
            type="line" 
            height={250}
          />
        </Card>

        <Card title="توزيع المعاملات">
          <SimpleChart 
            data={[
              { label: 'إيرادات', value: advancedStats.totalReceipts, color: '#10B981' },
              { label: 'مصروفات', value: -advancedStats.totalDisbursements, color: '#EF4444' }
            ]} 
            type="doughnut" 
            height={250}
          />
        </Card>
      </div>

      {/* معلومات تفصيلية */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="إحصائيات الإيرادات" className="border-t-4 border-t-green-500">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">إجمالي الإيرادات:</span>
              <span className="font-bold text-green-600">
                {hasPermission('view_financial_data') ? formatCurrency(advancedStats.totalReceipts) : '••••••'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">متوسط يومي:</span>
              <span className="font-medium">
                {hasPermission('view_financial_data') ? formatCurrency(advancedStats.dailyAverage) : '••••••'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">معاملات هذا الأسبوع:</span>
              <span className="font-medium">{advancedStats.recentReceiptsCount}</span>
            </div>
          </div>
        </Card>

        <Card title="إحصائيات المصروفات" className="border-t-4 border-t-red-500">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">إجمالي المصروفات:</span>
              <span className="font-bold text-red-600">
                {hasPermission('view_financial_data') ? formatCurrency(advancedStats.totalDisbursements) : '••••••'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">متوسط يومي:</span>
              <span className="font-medium">
                {hasPermission('view_financial_data') ? formatCurrency(advancedStats.dailyAverage) : '••••••'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">معاملات هذا الأسبوع:</span>
              <span className="font-medium">{advancedStats.recentDisbursementsCount}</span>
            </div>
          </div>
        </Card>

        <Card title="مؤشرات الأداء" className="border-t-4 border-t-blue-500">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">صافي التدفق:</span>
              <span className={`font-bold ${advancedStats.dailyAverage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {hasPermission('view_financial_data') ? formatCurrency(advancedStats.dailyAverage * 30) : '••••••'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">كفاءة السيولة:</span>
              <span className="font-medium">
                {advancedStats.liquidityRatio > 3 ? 'ممتازة' : 
                 advancedStats.liquidityRatio > 1 ? 'جيدة' : 'تحتاج تحسين'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">مستوى الاستقرار:</span>
              <span className="font-medium">
                {Math.abs(advancedStats.liquidityRatio - 2) < 0.5 ? 'مستقر' : 'متقلب'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal تحليل المخاطر */}
      <Modal isOpen={showRiskModal} onClose={() => setShowRiskModal(false)} title="تحليل المخاطر المالية">
        <div className="space-y-6">
          <div className={`p-4 rounded-lg ${getRiskColor(advancedStats.riskLevel)}`}>
            <div className="flex items-center gap-3 mb-2">
              <FaShieldAlt className="text-xl" />
              <h3 className="text-lg font-semibold">مستوى المخاطر: {advancedStats.riskLevel}</h3>
            </div>
            <p className="text-sm">
              {advancedStats.riskLevel === 'عالي' && 'هناك حاجة فورية لتحسين السيولة وتخطيط مالي طارئ'}
              {advancedStats.riskLevel === 'متوسط' && 'الوضع المالي مقبول ولكن يحتاج مراقبة وتخطيط'}
              {advancedStats.riskLevel === 'منخفض' && 'الوضع المالي ممتاز ومستقر'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">التوصيات:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                {advancedStats.liquidityRatio < 1 && (
                  <li>• تسريع تحصيل الديون المستحقة</li>
                )}
                {advancedStats.liquidityRatio < 1 && (
                  <li>• تأجيل المصروفات غير الضرورية</li>
                )}
                {advancedStats.recentDisbursementsCount > 10 && (
                  <li>• مراجعة وتيرة المصروفات</li>
                )}
                {treasuryBalance < 0 && (
                  <li>• البحث عن مصادر تمويل فورية</li>
                )}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">المؤشرات المالية:</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>معدل السيولة:</span>
                  <span className="font-medium">{advancedStats.liquidityRatio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>أيام التغطية:</span>
                  <span className="font-medium">{advancedStats.liquidityDays.toFixed(0)} يوم</span>
                </div>
                <div className="flex justify-between">
                  <span>التدفق اليومي:</span>
                  <span className="font-medium">
                    {hasPermission('view_financial_data') ? formatCurrency(advancedStats.dailyAverage) : '••••••'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal التنبؤات */}
      <Modal isOpen={showForecastModal} onClose={() => setShowForecastModal(false)} title="التنبؤات المالية">
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">توقعات الشهر القادم</h3>
            <p className="text-sm text-blue-700">
              بناءً على المعاملات الحالية، من المتوقع أن تحتاج إلى 
              <span className="font-bold mx-1">
                {hasPermission('view_financial_data') ? formatCurrency(advancedStats.projectedNeeds) : '••••••'}
              </span>
              خلال الـ 30 يوم القادمة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {hasPermission('view_financial_data') ? formatCurrency(advancedStats.projectedNeeds * 0.6) : '••••••'}
              </div>
              <div className="text-sm text-gray-600">سيناريو متفائل</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {hasPermission('view_financial_data') ? formatCurrency(advancedStats.projectedNeeds) : '••••••'}
              </div>
              <div className="text-sm text-gray-600">سيناريو واقعي</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {hasPermission('view_financial_data') ? formatCurrency(advancedStats.projectedNeeds * 1.4) : '••••••'}
              </div>
              <div className="text-sm text-gray-600">سيناريو متشائم</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">خطة العمل المقترحة:</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• مراقبة التدفق اليومي بانتظام</li>
              <li>• تحصيل الديون المستحقة بأسرع وقت</li>
              <li>• تحسين شروط الدفع مع الموردين</li>
              <li>• الاحتفاظ باحتياطي طوارئ</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdvancedTreasuryDashboard;