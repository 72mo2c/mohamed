// ======================================
// تتبع المواد الخام والإنتاج
// ======================================

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../Common/Card';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
import Table from '../Common/Table';
import Modal from '../Common/Modal';

const MaterialTracking = () => {
  const {
    materialConsumption,
    productionWaste,
    addMaterialConsumption,
    addProductionWaste,
    getMaterialConsumptionByOrder,
    getWasteByOrder,
    productionOrders,
    products,
    warehouses
  } = useData();

  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [activeTab, setActiveTab] = useState('consumption');

  const [consumptionFormData, setConsumptionFormData] = useState({
    orderId: '',
    materialId: '',
    warehouseId: '',
    quantity: '',
    unit: '',
    consumptionDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [wasteFormData, setWasteFormData] = useState({
    orderId: '',
    materialId: '',
    wasteType: '',
    quantity: '',
    unit: '',
    wasteDate: new Date().toISOString().split('T')[0],
    reason: '',
    cost: ''
  });

  // أنواع الهدر
  const wasteTypes = [
    { value: 'Material', label: 'هدر مواد خام' },
    { value: 'Production', label: 'هدر إنتاجي' },
    { value: 'Quality', label: 'هدر جودة' },
    { value: 'Equipment', label: 'هدر معدات' },
    { value: 'Process', label: 'هدر عمليات' }
  ];

  // فتح نافذة تسجيل استهلاك مواد
  const handleOpenConsumptionModal = (orderId = null) => {
    setConsumptionFormData({
      orderId: orderId || '',
      materialId: '',
      warehouseId: '',
      quantity: '',
      unit: '',
      consumptionDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowConsumptionModal(true);
  };

  // فتح نافذة تسجيل هدر
  const handleOpenWasteModal = (orderId = null) => {
    setWasteFormData({
      orderId: orderId || '',
      materialId: '',
      wasteType: '',
      quantity: '',
      unit: '',
      wasteDate: new Date().toISOString().split('T')[0],
      reason: '',
      cost: ''
    });
    setShowWasteModal(true);
  };

  // حفظ استهلاك المواد
  const handleSaveConsumption = () => {
    if (!consumptionFormData.orderId || !consumptionFormData.materialId || !consumptionFormData.quantity) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    addMaterialConsumption(consumptionFormData);
    setShowConsumptionModal(false);
    setConsumptionFormData({
      orderId: '',
      materialId: '',
      warehouseId: '',
      quantity: '',
      unit: '',
      consumptionDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  // حفظ الهدر
  const handleSaveWaste = () => {
    if (!wasteFormData.orderId || !wasteFormData.materialId || !wasteFormData.wasteType || !wasteFormData.quantity) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    addProductionWaste(wasteFormData);
    setShowWasteModal(false);
    setWasteFormData({
      orderId: '',
      materialId: '',
      wasteType: '',
      quantity: '',
      unit: '',
      wasteDate: new Date().toISOString().split('T')[0],
      reason: '',
      cost: ''
    });
  };

  // الحصول على اسم المنتج
  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'منتج غير محدد';
  };

  // الحصول على اسم المخزن
  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'مخزن غير محدد';
  };

  // حساب إجمالي استهلاك المواد لكل أمر
  const getTotalConsumptionByOrder = (orderId) => {
    const consumption = getMaterialConsumptionByOrder(orderId);
    return consumption.reduce((total, item) => total + parseFloat(item.quantity || 0), 0);
  };

  // حساب إجمالي الهدر لكل أمر
  const getTotalWasteByOrder = (orderId) => {
    const waste = getWasteByOrder(orderId);
    return waste.reduce((total, item) => total + parseFloat(item.quantity || 0), 0);
  };

  // أعمدة جدول استهلاك المواد
  const consumptionColumns = [
    {
      header: 'أمر الإنتاج',
      accessor: 'orderId',
      render: (value) => (
        <div className="font-medium text-blue-600">#{value}</div>
      )
    },
    {
      header: 'المنتج',
      accessor: 'materialId',
      render: (value) => (
        <div className="font-medium text-gray-900">{getProductName(value)}</div>
      )
    },
    {
      header: 'الكمية المستهلكة',
      accessor: 'quantity',
      render: (value) => (
        <div className="text-gray-900">{value} {value?.unit || ''}</div>
      )
    },
    {
      header: 'المخزن',
      accessor: 'warehouseId',
      render: (value) => (
        <div className="text-gray-600">{getWarehouseName(value)}</div>
      )
    },
    {
      header: 'تاريخ الاستهلاك',
      accessor: 'consumptionDate',
      render: (value) => (
        <div className="text-gray-900">
          {value ? new Date(value).toLocaleDateString('ar') : 'غير محدد'}
        </div>
      )
    },
    {
      header: 'الملاحظات',
      accessor: 'notes',
      render: (value) => (
        <div className="text-gray-600 max-w-xs truncate">{value || 'لا توجد ملاحظات'}</div>
      )
    }
  ];

  // أعمدة جدول الهدر
  const wasteColumns = [
    {
      header: 'أمر الإنتاج',
      accessor: 'orderId',
      render: (value) => (
        <div className="font-medium text-blue-600">#{value}</div>
      )
    },
    {
      header: 'المادة',
      accessor: 'materialId',
      render: (value) => (
        <div className="font-medium text-gray-900">{getProductName(value)}</div>
      )
    },
    {
      header: 'نوع الهدر',
      accessor: 'wasteType',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Material' ? 'bg-red-100 text-red-800' :
          value === 'Production' ? 'bg-orange-100 text-orange-800' :
          value === 'Quality' ? 'bg-yellow-100 text-yellow-800' :
          value === 'Equipment' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {wasteTypes.find(w => w.value === value)?.label || value}
        </span>
      )
    },
    {
      header: 'كمية الهدر',
      accessor: 'quantity',
      render: (value) => (
        <div className="text-red-600 font-medium">{value} {value?.unit || ''}</div>
      )
    },
    {
      header: 'التكلفة',
      accessor: 'cost',
      render: (value) => (
        <div className="text-gray-900">
          {value ? `${parseFloat(value).toFixed(2)} ر.س` : '0.00 ر.س'}
        </div>
      )
    },
    {
      header: 'السبب',
      accessor: 'reason',
      render: (value) => (
        <div className="text-gray-600 max-w-xs truncate">{value || 'غير محدد'}</div>
      )
    },
    {
      header: 'التاريخ',
      accessor: 'wasteDate',
      render: (value) => (
        <div className="text-gray-900">
          {value ? new Date(value).toLocaleDateString('ar') : 'غير محدد'}
        </div>
      )
    }
  ];

  // عرض البيانات حسب الأمر المحدد
  const getFilteredConsumptionData = () => {
    if (!selectedOrder) return materialConsumption;
    return getMaterialConsumptionByOrder(selectedOrder);
  };

  const getFilteredWasteData = () => {
    if (!selectedOrder) return productionWaste;
    return getWasteByOrder(selectedOrder);
  };

  // حساب الإحصائيات
  const totalConsumption = materialConsumption.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
  const totalWaste = productionWaste.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
  const wastePercentage = totalConsumption > 0 ? ((totalWaste / totalConsumption) * 100).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تتبع المواد الخام والإنتاج</h1>
          <p className="text-gray-600">تتبع استهلاك المواد والهدر في الإنتاج</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => handleOpenConsumptionModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            تسجيل استهلاك مواد
          </Button>
          <Button
            onClick={() => handleOpenWasteModal()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            تسجيل هدر
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {materialConsumption.length}
          </div>
          <div className="text-gray-600">سجلات الاستهلاك</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {productionWaste.length}
          </div>
          <div className="text-gray-600">سجلات الهدر</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {totalConsumption.toFixed(2)}
          </div>
          <div className="text-gray-600">إجمالي الاستهلاك</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {wastePercentage}%
          </div>
          <div className="text-gray-600">نسبة الهدر</div>
        </Card>
      </div>

      {/* فلترة حسب أمر الإنتاج */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            عرض بيانات أمر إنتاج:
          </label>
          <Select
            value={selectedOrder}
            onChange={(e) => setSelectedOrder(e.target.value)}
            className="w-64"
          >
            <option value="">جميع الأوامر</option>
            {productionOrders.map(order => (
              <option key={order.id} value={order.id}>
                #{order.id} - {getProductName(order.productId)} ({order.quantity})
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* تبويبات */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('consumption')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'consumption'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            استهلاك المواد
          </button>
          <button
            onClick={() => setActiveTab('waste')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'waste'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            الهدر في الإنتاج
          </button>
        </nav>
      </div>

      {/* محتوى التبويبات */}
      {activeTab === 'consumption' && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                سجلات استهلاك المواد
              </h3>
              <Button
                onClick={() => handleOpenConsumptionModal(selectedOrder)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                إضافة استهلاك
              </Button>
            </div>
            <Table
              columns={consumptionColumns}
              data={getFilteredConsumptionData()}
              className="min-w-full"
            />
          </div>
        </Card>
      )}

      {activeTab === 'waste' && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                سجلات الهدر في الإنتاج
              </h3>
              <Button
                onClick={() => handleOpenWasteModal(selectedOrder)}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                إضافة هدر
              </Button>
            </div>
            <Table
              columns={wasteColumns}
              data={getFilteredWasteData()}
              className="min-w-full"
            />
          </div>
        </Card>
      )}

      {/* ملخص أمر الإنتاج المحدد */}
      {selectedOrder && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ملخص أمر الإنتاج #{selectedOrder}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600">إجمالي الاستهلاك</div>
              <div className="text-2xl font-bold text-blue-700">
                {getTotalConsumptionByOrder(selectedOrder).toFixed(2)}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600">إجمالي الهدر</div>
              <div className="text-2xl font-bold text-red-700">
                {getTotalWasteByOrder(selectedOrder).toFixed(2)}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">معدل الكفاءة</div>
              <div className="text-2xl font-bold text-green-700">
                {getTotalConsumptionByOrder(selectedOrder) > 0 
                  ? (100 - (getTotalWasteByOrder(selectedOrder) / getTotalConsumptionByOrder(selectedOrder)) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* نافذة تسجيل استهلاك مواد */}
      <Modal
        isOpen={showConsumptionModal}
        onClose={() => setShowConsumptionModal(false)}
        title="تسجيل استهلاك مواد"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                أمر الإنتاج *
              </label>
              <Select
                value={consumptionFormData.orderId}
                onChange={(e) => setConsumptionFormData({ ...consumptionFormData, orderId: e.target.value })}
              >
                <option value="">اختر أمر الإنتاج</option>
                {productionOrders.map(order => (
                  <option key={order.id} value={order.id}>
                    #{order.id} - {getProductName(order.productId)} ({order.quantity})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المادة *
              </label>
              <Select
                value={consumptionFormData.materialId}
                onChange={(e) => setConsumptionFormData({ ...consumptionFormData, materialId: e.target.value })}
              >
                <option value="">اختر المادة</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.unit}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المخزن
              </label>
              <Select
                value={consumptionFormData.warehouseId}
                onChange={(e) => setConsumptionFormData({ ...consumptionFormData, warehouseId: e.target.value })}
              >
                <option value="">اختر المخزن</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الكمية *
              </label>
              <Input
                type="number"
                step="0.01"
                value={consumptionFormData.quantity}
                onChange={(e) => setConsumptionFormData({ ...consumptionFormData, quantity: e.target.value })}
                placeholder="أدخل الكمية"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوحدة
              </label>
              <Input
                value={consumptionFormData.unit}
                onChange={(e) => setConsumptionFormData({ ...consumptionFormData, unit: e.target.value })}
                placeholder="مثل: كغ، لتر، قطعة"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ الاستهلاك
              </label>
              <Input
                type="date"
                value={consumptionFormData.consumptionDate}
                onChange={(e) => setConsumptionFormData({ ...consumptionFormData, consumptionDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات
            </label>
            <textarea
              value={consumptionFormData.notes}
              onChange={(e) => setConsumptionFormData({ ...consumptionFormData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ملاحظات إضافية حول استهلاك المادة"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              onClick={() => setShowConsumptionModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveConsumption}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              حفظ
            </Button>
          </div>
        </div>
      </Modal>

      {/* نافذة تسجيل هدر */}
      <Modal
        isOpen={showWasteModal}
        onClose={() => setShowWasteModal(false)}
        title="تسجيل هدر في الإنتاج"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                أمر الإنتاج *
              </label>
              <Select
                value={wasteFormData.orderId}
                onChange={(e) => setWasteFormData({ ...wasteFormData, orderId: e.target.value })}
              >
                <option value="">اختر أمر الإنتاج</option>
                {productionOrders.map(order => (
                  <option key={order.id} value={order.id}>
                    #{order.id} - {getProductName(order.productId)} ({order.quantity})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المادة *
              </label>
              <Select
                value={wasteFormData.materialId}
                onChange={(e) => setWasteFormData({ ...wasteFormData, materialId: e.target.value })}
              >
                <option value="">اختر المادة</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.unit}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الهدر *
              </label>
              <Select
                value={wasteFormData.wasteType}
                onChange={(e) => setWasteFormData({ ...wasteFormData, wasteType: e.target.value })}
              >
                <option value="">اختر نوع الهدر</option>
                {wasteTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الكمية *
              </label>
              <Input
                type="number"
                step="0.01"
                value={wasteFormData.quantity}
                onChange={(e) => setWasteFormData({ ...wasteFormData, quantity: e.target.value })}
                placeholder="أدخل كمية الهدر"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوحدة
              </label>
              <Input
                value={wasteFormData.unit}
                onChange={(e) => setWasteFormData({ ...wasteFormData, unit: e.target.value })}
                placeholder="مثل: كغ، لتر، قطعة"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تكلفة الهدر (ر.س)
              </label>
              <Input
                type="number"
                step="0.01"
                value={wasteFormData.cost}
                onChange={(e) => setWasteFormData({ ...wasteFormData, cost: e.target.value })}
                placeholder="تكلفة الهدر"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ الهدر
              </label>
              <Input
                type="date"
                value={wasteFormData.wasteDate}
                onChange={(e) => setWasteFormData({ ...wasteFormData, wasteDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              سبب الهدر
            </label>
            <textarea
              value={wasteFormData.reason}
              onChange={(e) => setWasteFormData({ ...wasteFormData, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="وضح سبب حدوث الهدر"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              onClick={() => setShowWasteModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveWaste}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              حفظ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MaterialTracking;
