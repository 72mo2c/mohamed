// ======================================
// مراقبة الجودة
// ======================================

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../Common/Card';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
import Table from '../Common/Table';
import Modal from '../Common/Modal';

const QualityControl = () => {
  const {
    qualityControls,
    addQualityControl,
    updateQualityControl,
    getQualityControlsByOrder,
    productionOrders,
    products,
    employees
  } = useData();

  const [showModal, setShowModal] = useState(false);
  const [editingQC, setEditingQC] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [activeTab, setActiveTab] = useState('controls');

  const [formData, setFormData] = useState({
    orderId: '',
    productId: '',
    inspectorId: '',
    controlType: '',
    checkDate: new Date().toISOString().split('T')[0],
    testResults: '',
    status: 'Pending',
    standardValue: '',
    actualValue: '',
    deviation: '',
    action: '',
    notes: ''
  });

  // أنواع الفحوصات
  const controlTypes = [
    { value: 'Incoming', label: 'فحص المواد الواردة' },
    { value: 'InProcess', label: 'فحص أثناء الإنتاج' },
    { value: 'Final', label: 'فحص نهائي' },
    { value: 'Random', label: 'فحص عشوائي' },
    { value: 'Customer', label: 'فحص العميل' }
  ];

  // حالات الفحص
  const statusOptions = [
    { value: 'Pending', label: 'في الانتظار' },
    { value: 'Passed', label: 'نجح' },
    { value: 'Failed', label: 'فشل' },
    { value: 'Conditional', label: 'مشروط' },
    { value: 'Rework', label: 'إعادة عمل' }
  ];

  // إجراءات التصحيح
  const actionOptions = [
    { value: 'None', label: 'لا يوجد' },
    { value: 'Accept', label: 'قبول' },
    { value: 'Reject', label: 'رفض' },
    { value: 'Rework', label: 'إعادة عمل' },
    { value: 'Repair', label: 'إصلاح' },
    { value: 'Sort', label: 'فرز' },
    { value: 'UseAsIs', label: 'استخدام كما هو' }
  ];

  // فتح النافذة للإضافة/التعديل
  const handleOpenModal = (qc = null) => {
    if (qc) {
      setEditingQC(qc);
      setFormData({
        orderId: qc.orderId || '',
        productId: qc.productId || '',
        inspectorId: qc.inspectorId || '',
        controlType: qc.controlType || '',
        checkDate: qc.checkDate || new Date().toISOString().split('T')[0],
        testResults: qc.testResults || '',
        status: qc.status || 'Pending',
        standardValue: qc.standardValue || '',
        actualValue: qc.actualValue || '',
        deviation: qc.deviation || '',
        action: qc.action || 'None',
        notes: qc.notes || ''
      });
    } else {
      setEditingQC(null);
      setFormData({
        orderId: '',
        productId: '',
        inspectorId: '',
        controlType: '',
        checkDate: new Date().toISOString().split('T')[0],
        testResults: '',
        status: 'Pending',
        standardValue: '',
        actualValue: '',
        deviation: '',
        action: 'None',
        notes: ''
      });
    }
    setShowModal(true);
  };

  // حفظ فحص الجودة
  const handleSave = () => {
    if (!formData.orderId || !formData.controlType) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // حساب الانحراف
    const standard = parseFloat(formData.standardValue) || 0;
    const actual = parseFloat(formData.actualValue) || 0;
    const deviation = standard > 0 ? ((actual - standard) / standard * 100).toFixed(2) : 0;

    const qcData = {
      ...formData,
      deviation: deviation.toString(),
      calculatedAt: new Date().toISOString()
    };

    if (editingQC) {
      updateQualityControl(editingQC.id, qcData);
    } else {
      addQualityControl(qcData);
    }
    setShowModal(false);
  };

  // حساب الانحراف تلقائياً
  const handleValueChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    if ((field === 'standardValue' || field === 'actualValue') && (formData.standardValue || formData.actualValue)) {
      const standard = field === 'standardValue' ? parseFloat(value) : parseFloat(formData.standardValue) || 0;
      const actual = field === 'actualValue' ? parseFloat(value) : parseFloat(formData.actualValue) || 0;
      
      if (standard > 0) {
        const deviation = ((actual - standard) / standard * 100).toFixed(2);
        setFormData(prev => ({ ...prev, deviation: deviation.toString() }));
      }
    }
  };

  // الحصول على اسم المنتج
  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'منتج غير محدد';
  };

  // الحصول على اسم المفتش
  const getInspectorName = (inspectorId) => {
    if (!inspectorId) return 'غير محدد';
    const employee = employees.find(e => e.id === inspectorId);
    return employee ? employee.name : 'موظف غير محدد';
  };

  // الحصول على اسم أمر الإنتاج
  const getOrderInfo = (orderId) => {
    const order = productionOrders.find(o => o.id === orderId);
    return order ? `#${order.id} - ${getProductName(order.productId)} (${order.quantity})` : 'أمر غير محدد';
  };

  // فلترة الفحوصات
  const filteredControls = filterStatus === 'All' 
    ? qualityControls 
    : qualityControls.filter(qc => qc.status === filterStatus);

  // عرض البيانات حسب الأمر المحدد
  const getFilteredControlsData = () => {
    if (!selectedOrder) return filteredControls;
    return getQualityControlsByOrder(selectedOrder);
  };

  // أعمدة جدول فحوصات الجودة
  const columns = [
    {
      header: 'أمر الإنتاج',
      accessor: 'orderId',
      render: (value) => (
        <div className="font-medium text-blue-600">{getOrderInfo(value)}</div>
      )
    },
    {
      header: 'المنتج',
      accessor: 'productId',
      render: (value) => (
        <div className="font-medium text-gray-900">{getProductName(value)}</div>
      )
    },
    {
      header: 'نوع الفحص',
      accessor: 'controlType',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Incoming' ? 'bg-blue-100 text-blue-800' :
          value === 'InProcess' ? 'bg-yellow-100 text-yellow-800' :
          value === 'Final' ? 'bg-green-100 text-green-800' :
          value === 'Random' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {controlTypes.find(t => t.value === value)?.label || value}
        </span>
      )
    },
    {
      header: 'المفتش',
      accessor: 'inspectorId',
      render: (value) => (
        <div className="text-gray-900">{getInspectorName(value)}</div>
      )
    },
    {
      header: 'القيم',
      accessor: 'values',
      render: (value, row) => (
        <div className="text-sm">
          <div>المعيار: {row.standardValue || 'غير محدد'}</div>
          <div>الفعلي: {row.actualValue || 'غير محدد'}</div>
          <div className={`font-medium ${
            parseFloat(row.deviation) > 5 ? 'text-red-600' :
            parseFloat(row.deviation) < -5 ? 'text-red-600' :
            'text-green-600'
          }`}>
            الانحراف: {row.deviation || 0}%
          </div>
        </div>
      )
    },
    {
      header: 'الحالة',
      accessor: 'status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Passed' ? 'bg-green-100 text-green-800' :
          value === 'Failed' ? 'bg-red-100 text-red-800' :
          value === 'Conditional' ? 'bg-yellow-100 text-yellow-800' :
          value === 'Rework' ? 'bg-orange-100 text-orange-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {statusOptions.find(s => s.value === value)?.label || value}
        </span>
      )
    },
    {
      header: 'الإجراء',
      accessor: 'action',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Accept' ? 'bg-green-100 text-green-800' :
          value === 'Reject' ? 'bg-red-100 text-red-800' :
          value === 'Rework' ? 'bg-orange-100 text-orange-800' :
          value === 'Repair' ? 'bg-blue-100 text-blue-800' :
          value === 'Sort' ? 'bg-yellow-100 text-yellow-800' :
          value === 'UseAsIs' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {actionOptions.find(a => a.value === value)?.label || value}
        </span>
      )
    },
    {
      header: 'التاريخ',
      accessor: 'checkDate',
      render: (value) => (
        <div className="text-gray-900">
          {value ? new Date(value).toLocaleDateString('ar') : 'غير محدد'}
        </div>
      )
    },
    {
      header: 'الإجراءات',
      accessor: 'actions',
      render: (value, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleOpenModal(row)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            تعديل
          </button>
          <button
            onClick={() => {
              // يمكن إضافة نافذة تأكيد مخصصة هنا لاحقاً
              if (window.confirm && window.confirm('هل أنت متأكد من حذف فحص الجودة هذا؟')) {
                // حذف فحص الجودة
                console.log('حذف فحص الجودة:', row.id);
              }
            }}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            حذف
          </button>
        </div>
      )
    }
  ];

  // إحصائيات الجودة
  const totalControls = qualityControls.length;
  const passedControls = qualityControls.filter(qc => qc.status === 'Passed').length;
  const failedControls = qualityControls.filter(qc => qc.status === 'Failed').length;
  const passRate = totalControls > 0 ? ((passedControls / totalControls) * 100).toFixed(1) : 0;

  // معدل العيوب حسب نوع الفحص
  const defectRateByType = controlTypes.map(type => {
    const typeControls = qualityControls.filter(qc => qc.controlType === type.value);
    const typeFailures = typeControls.filter(qc => qc.status === 'Failed').length;
    const rate = typeControls.length > 0 ? ((typeFailures / typeControls.length) * 100).toFixed(1) : 0;
    return {
      type: type.label,
      total: typeControls.length,
      failures: typeFailures,
      rate: rate
    };
  });

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مراقبة الجودة</h1>
          <p className="text-gray-600">إدارة فحوصات الجودة وعمليات عدم المطابقة</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          فحص جودة جديد
        </Button>
      </div>

      {/* إحصائيات الجودة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {totalControls}
          </div>
          <div className="text-gray-600">إجمالي الفحوصات</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {passedControls}
          </div>
          <div className="text-gray-600">فحوصات ناجحة</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {failedControls}
          </div>
          <div className="text-gray-600">فحوصات فاشلة</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {passRate}%
          </div>
          <div className="text-gray-600">معدل النجاح</div>
        </Card>
      </div>

      {/* تحليل معدل العيوب حسب نوع الفحص */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          معدل العيوب حسب نوع الفحص
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {defectRateByType.map((item, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">{item.type}</div>
              <div className="text-lg font-bold text-gray-900">
                {item.failures}/{item.total}
              </div>
              <div className={`text-sm font-medium ${
                parseFloat(item.rate) > 10 ? 'text-red-600' :
                parseFloat(item.rate) > 5 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {item.rate}% عيوب
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* فلاتر */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              فلترة حسب الحالة:
            </label>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-48"
            >
              <option value="All">جميع الحالات</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center space-x-2">
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

          <div className="text-sm text-gray-500">
            عرض {getFilteredControlsData().length} من {totalControls} فحص
          </div>
        </div>
      </Card>

      {/* جدول فحوصات الجودة */}
      <Card>
        <Table
          columns={columns}
          data={getFilteredControlsData()}
          className="min-w-full"
        />
      </Card>

      {/* نافذة إضافة/تعديل فحص الجودة */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingQC ? 'تعديل فحص الجودة' : 'فحص جودة جديد'}
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                أمر الإنتاج *
              </label>
              <Select
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                required
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
                نوع الفحص *
              </label>
              <Select
                value={formData.controlType}
                onChange={(e) => setFormData({ ...formData, controlType: e.target.value })}
                required
              >
                <option value="">اختر نوع الفحص</option>
                {controlTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المفتش
              </label>
              <Select
                value={formData.inspectorId}
                onChange={(e) => setFormData({ ...formData, inspectorId: e.target.value })}
              >
                <option value="">اختر المفتش</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ الفحص
              </label>
              <Input
                type="date"
                value={formData.checkDate}
                onChange={(e) => setFormData({ ...formData, checkDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                القيمة المعيارية
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.standardValue}
                onChange={(e) => handleValueChange('standardValue', e.target.value)}
                placeholder="القيمة المعيارية أو المقبولة"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                القيمة الفعلية
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.actualValue}
                onChange={(e) => handleValueChange('actualValue', e.target.value)}
                placeholder="القيمة المقاسة فعلياً"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الانحراف (%)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.deviation}
                onChange={(e) => setFormData({ ...formData, deviation: e.target.value })}
                placeholder="سيتم حسابه تلقائياً"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الإجراء المطلوب
              </label>
              <Select
                value={formData.action}
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              >
                {actionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نتائج الفحص
            </label>
            <textarea
              value={formData.testResults}
              onChange={(e) => setFormData({ ...formData, testResults: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="تفاصيل نتائج الفحص والقياسات"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ملاحظات إضافية حول الفحص"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              onClick={() => setShowModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              حفظ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QualityControl;
