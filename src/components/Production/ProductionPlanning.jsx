// ======================================
// تخطيط الإنتاج
// ======================================

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../Common/Card';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
import Table from '../Common/Table';
import Modal from '../Common/Modal';

const ProductionPlanning = () => {
  const {
    productionPlans,
    addProductionPlan,
    updateProductionPlan,
    products,
    workCenters,
    productionOrders,
    bomItems,
    generateMRPRequirements,
    getBomItemsByProduct
  } = useData();

  const [showMRPModal, setShowMRPModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [mrpResults, setMrpResults] = useState([]);
  const [scheduleResults, setScheduleResults] = useState([]);

  const [planFormData, setPlanFormData] = useState({
    name: '',
    description: '',
    period: 'Monthly',
    startDate: '',
    endDate: ''
  });

  const [mrpFormData, setMrpFormData] = useState({
    productId: '',
    quantity: '',
    requiredDate: ''
  });

  // فترة الخطة
  const periodOptions = [
    { value: 'Weekly', label: 'أسبوعي' },
    { value: 'Monthly', label: 'شهري' },
    { value: 'Quarterly', label: 'ربع سنوي' },
    { value: 'Yearly', label: 'سنوي' }
  ];

  // فتح نافذة MRP
  const handleOpenMRPModal = () => {
    setMrpFormData({
      productId: '',
      quantity: '',
      requiredDate: ''
    });
    setMrpResults([]);
    setShowMRPModal(true);
  };

  // فتح نافذة الجدولة
  const handleOpenScheduleModal = (plan = null) => {
    setSelectedPlan(plan);
    setScheduleResults([]);
    setShowScheduleModal(true);
  };

  // حساب متطلبات المواد (MRP)
  const handleGenerateMRP = () => {
    if (!mrpFormData.productId || !mrpFormData.quantity) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const requirements = generateMRPRequirements(
      mrpFormData.productId,
      parseInt(mrpFormData.quantity)
    );

    // إضافة معلومات المواد
    const enrichedRequirements = requirements.map(req => {
      const material = products.find(p => p.id === req.materialId);
      return {
        ...req,
        materialName: material?.name || 'مادة غير محددة',
        unit: material?.unit || '',
        currentStock: Math.floor(Math.random() * 100) + 20, // مخزون افتراضي
        reorderPoint: Math.floor(Math.random() * 50) + 10, // نقطة إعادة الطلب افتراضية
        leadTime: Math.floor(Math.random() * 7) + 1 // زمن التوريد افتراضي
      };
    });

    setMrpResults(enrichedRequirements);
  };

  // إنشاء خطة إنتاج جديدة
  const handleCreatePlan = () => {
    if (!planFormData.name || !planFormData.startDate || !planFormData.endDate) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    addProductionPlan(planFormData);
    setPlanFormData({
      name: '',
      description: '',
      period: 'Monthly',
      startDate: '',
      endDate: ''
    });
  };

  // جدولة الإنتاج
  const handleScheduleProduction = () => {
    if (!selectedPlan) return;

    const orders = productionOrders.filter(order => {
      const orderStart = new Date(order.plannedStartDate);
      const planStart = new Date(selectedPlan.startDate);
      const planEnd = new Date(selectedPlan.endDate);
      return orderStart >= planStart && orderStart <= planEnd;
    });

    // تجميع الأوامر حسب مركز العمل
    const scheduleByWorkCenter = {};
    orders.forEach(order => {
      const centerId = order.workCenterId || 'unassigned';
      if (!scheduleByWorkCenter[centerId]) {
        scheduleByWorkCenter[centerId] = [];
      }
      scheduleByWorkCenter[centerId].push(order);
    });

    // إنشاء جدول مفصل
    const schedule = [];
    Object.entries(scheduleByWorkCenter).forEach(([centerId, centerOrders]) => {
      const workCenter = workCenters.find(wc => wc.id === parseInt(centerId));
      const centerName = workCenter?.name || (centerId === 'unassigned' ? 'غير محدد' : 'مركز غير معروف');
      
      centerOrders.forEach((order, index) => {
        const product = products.find(p => p.id === order.productId);
        schedule.push({
          id: `${centerId}_${order.id}`,
          workCenterId: centerId,
          workCenterName: centerName,
          orderId: order.id,
          productName: product?.name || 'منتج غير محدد',
          quantity: order.quantity,
          plannedStartDate: order.plannedStartDate,
          plannedEndDate: order.plannedEndDate,
          priority: order.priority,
          sequence: index + 1,
          estimatedDuration: Math.floor(Math.random() * 8) + 2 // مدة افتراضية
        });
      });
    });

    setScheduleResults(schedule.sort((a, b) => new Date(a.plannedStartDate) - new Date(b.plannedStartDate)));
  };

  // أعمدة جدول MRP
  const mrpColumns = [
    {
      header: 'المادة',
      accessor: 'materialName',
      render: (value) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      header: 'الكمية المطلوبة',
      accessor: 'requiredQuantity',
      render: (value) => (
        <div className="text-gray-900">{value}</div>
      )
    },
    {
      header: 'المخزون الحالي',
      accessor: 'currentStock',
      render: (value) => (
        <div className={`font-medium ${value < 20 ? 'text-red-600' : 'text-green-600'}`}>
          {value}
        </div>
      )
    },
    {
      header: 'النقص',
      accessor: 'shortage',
      render: (value) => {
        const shortage = Math.max(0, value);
        return (
          <div className={`font-medium ${shortage > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {shortage}
          </div>
        );
      }
    },
    {
      header: 'نقطة إعادة الطلب',
      accessor: 'reorderPoint',
      render: (value) => (
        <div className="text-gray-600">{value}</div>
      )
    },
    {
      header: 'زمن التوريد',
      accessor: 'leadTime',
      render: (value) => (
        <div className="text-gray-600">{value} يوم</div>
      )
    },
    {
      header: 'الإجراءات المطلوبة',
      accessor: 'action',
      render: (value, row) => {
        const needsOrder = row.shortage > 0 || row.currentStock < row.reorderPoint;
        return needsOrder ? (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
            طلب شراء
          </span>
        ) : (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
            متوفر
          </span>
        );
      }
    }
  ];

  // أعمدة جدول الجدولة
  const scheduleColumns = [
    {
      header: 'مركز العمل',
      accessor: 'workCenterName',
      render: (value) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      header: 'رقم الأمر',
      accessor: 'orderId',
      render: (value) => (
        <div className="text-blue-600 font-medium">#{value}</div>
      )
    },
    {
      header: 'المنتج',
      accessor: 'productName',
      render: (value) => (
        <div className="text-gray-900">{value}</div>
      )
    },
    {
      header: 'الكمية',
      accessor: 'quantity',
      render: (value) => (
        <div className="text-gray-900">{value} وحدة</div>
      )
    },
    {
      header: 'التسلسل',
      accessor: 'sequence',
      render: (value) => (
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {value}
          </span>
        </div>
      )
    },
    {
      header: 'المدة المقدرة',
      accessor: 'estimatedDuration',
      render: (value) => (
        <div className="text-gray-600">{value} ساعة</div>
      )
    },
    {
      header: 'تاريخ البدء',
      accessor: 'plannedStartDate',
      render: (value) => (
        <div className="text-gray-900">
          {value ? new Date(value).toLocaleDateString('ar') : 'غير محدد'}
        </div>
      )
    },
    {
      header: 'تاريخ الانتهاء',
      accessor: 'plannedEndDate',
      render: (value) => (
        <div className="text-gray-900">
          {value ? new Date(value).toLocaleDateString('ar') : 'غير محدد'}
        </div>
      )
    },
    {
      header: 'الأولوية',
      accessor: 'priority',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Urgent' ? 'bg-red-100 text-red-800' :
          value === 'High' ? 'bg-orange-100 text-orange-800' :
          value === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {value}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تخطيط الإنتاج</h1>
          <p className="text-gray-600">تخطيط متطلبات المواد والجدولة الإنتاجية</p>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {productionPlans.length}
          </div>
          <div className="text-gray-600">خطط الإنتاج</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {workCenters.length}
          </div>
          <div className="text-gray-600">مراكز العمل</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {productionOrders.filter(o => o.status === 'Scheduled').length}
          </div>
          <div className="text-gray-600">أوامر مجدولة</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {bomItems.length}
          </div>
          <div className="text-gray-600">مواد BOM</div>
        </Card>
      </div>

      {/* أدوات التخطيط */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* تخطيط متطلبات المواد (MRP) */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            تخطيط متطلبات المواد (MRP)
          </h3>
          <p className="text-gray-600 mb-4">
            احسب متطلبات المواد الخام لمنتج معين والكمية المطلوبة
          </p>
          <Button
            onClick={handleOpenMRPModal}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            حساب متطلبات المواد
          </Button>
        </Card>

        {/* جدولة الإنتاج */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            جدولة الإنتاج
          </h3>
          <p className="text-gray-600 mb-4">
            جدولة أوامر الإنتاج على مراكز العمل المختلفة
          </p>
          <Button
            onClick={() => handleOpenScheduleModal()}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            جدولة الإنتاج
          </Button>
        </Card>
      </div>

      {/* إنشاء خطة إنتاج جديدة */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          إنشاء خطة إنتاج جديدة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="اسم الخطة"
            value={planFormData.name}
            onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
          />
          <Select
            value={planFormData.period}
            onChange={(e) => setPlanFormData({ ...planFormData, period: e.target.value })}
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            placeholder="تاريخ البداية"
            value={planFormData.startDate}
            onChange={(e) => setPlanFormData({ ...planFormData, startDate: e.target.value })}
          />
          <Input
            type="date"
            placeholder="تاريخ النهاية"
            value={planFormData.endDate}
            onChange={(e) => setPlanFormData({ ...planFormData, endDate: e.target.value })}
          />
        </div>
        <div className="mt-4">
          <textarea
            placeholder="وصف الخطة"
            value={planFormData.description}
            onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-4">
          <Button
            onClick={handleCreatePlan}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            إنشاء الخطة
          </Button>
        </div>
      </Card>

      {/* قائمة خطط الإنتاج */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            خطط الإنتاج
          </h3>
          {productionPlans.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              لا توجد خطط إنتاج بعد
            </p>
          ) : (
            <div className="space-y-4">
              {productionPlans.map(plan => (
                <div
                  key={plan.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{plan.name}</h4>
                      <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>الفترة: {periodOptions.find(p => p.value === plan.period)?.label}</span>
                        <span>من: {plan.startDate ? new Date(plan.startDate).toLocaleDateString('ar') : 'غير محدد'}</span>
                        <span>إلى: {plan.endDate ? new Date(plan.endDate).toLocaleDateString('ar') : 'غير محدد'}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleOpenScheduleModal(plan)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        جدولة
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* نافذة تخطيط متطلبات المواد (MRP) */}
      <Modal
        isOpen={showMRPModal}
        onClose={() => setShowMRPModal(false)}
        title="تخطيط متطلبات المواد (MRP)"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المنتج *
              </label>
              <Select
                value={mrpFormData.productId}
                onChange={(e) => setMrpFormData({ ...mrpFormData, productId: e.target.value })}
              >
                <option value="">اختر المنتج</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الكمية المطلوبة *
              </label>
              <Input
                type="number"
                value={mrpFormData.quantity}
                onChange={(e) => setMrpFormData({ ...mrpFormData, quantity: e.target.value })}
                placeholder="أدخل الكمية"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التاريخ المطلوب
              </label>
              <Input
                type="date"
                value={mrpFormData.requiredDate}
                onChange={(e) => setMrpFormData({ ...mrpFormData, requiredDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleGenerateMRP}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              حساب المتطلبات
            </Button>
          </div>

          {/* نتائج MRP */}
          {mrpResults.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-4">نتائج تخطيط المتطلبات:</h4>
              <Table
                columns={mrpColumns}
                data={mrpResults}
                className="min-w-full"
              />
            </div>
          )}
        </div>
      </Modal>

      {/* نافذة جدولة الإنتاج */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="جدولة الإنتاج"
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={handleScheduleProduction}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              إنشاء الجدول
            </Button>
          </div>

          {/* نتائج الجدولة */}
          {scheduleResults.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-4">جدول الإنتاج:</h4>
              <Table
                columns={scheduleColumns}
                data={scheduleResults}
                className="min-w-full"
              />
            </div>
          )}

          {scheduleResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              اضغط "إنشاء الجدول" لعرض جدولة الإنتاج
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProductionPlanning;
