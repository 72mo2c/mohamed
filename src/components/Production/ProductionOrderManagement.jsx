// ======================================
// إدارة أوامر الإنتاج
// ======================================

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../Common/Card';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
import Modal from '../Common/Modal';
import Table from '../Common/Table';
import Loading from '../Common/Loading';

const ProductionOrderManagement = () => {
  const { 
    productionOrders, 
    addProductionOrder, 
    updateProductionOrder, 
    updateProductionOrderStatus,
    getProductionOrdersByStatus,
    products,
    workCenters,
    bomItems,
    getBomItemsByProduct
  } = useData();

  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    plannedStartDate: '',
    plannedEndDate: '',
    priority: 'Medium',
    workCenterId: '',
    description: ''
  });

  // حالات أمر الإنتاج
  const statusOptions = [
    { value: 'Created', label: 'تم الإنشاء' },
    { value: 'Planned', label: 'مخطط' },
    { value: 'Scheduled', label: 'مجدول' },
    { value: 'Released', label: 'مطلق' },
    { value: 'In Progress', label: 'قيد التشغيل' },
    { value: 'Completed', label: 'مكتمل' },
    { value: 'Closed', label: 'مغلق' },
    { value: 'Hold', label: 'معلق' },
    { value: 'Cancelled', label: 'ملغي' }
  ];

  const priorityOptions = [
    { value: 'Low', label: 'منخفض' },
    { value: 'Medium', label: 'متوسط' },
    { value: 'High', label: 'عالي' },
    { value: 'Urgent', label: 'عاجل' }
  ];

  // فلترة الأوامر
  const filteredOrders = filterStatus === 'All' 
    ? productionOrders 
    : getProductionOrdersByStatus(filterStatus);

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      productId: '',
      quantity: '',
      plannedStartDate: '',
      plannedEndDate: '',
      priority: 'Medium',
      workCenterId: '',
      description: ''
    });
    setEditingOrder(null);
  };

  // فتح النافذة للإضافة/التعديل
  const handleOpenModal = (order = null) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        productId: order.productId || '',
        quantity: order.quantity || '',
        plannedStartDate: order.plannedStartDate || '',
        plannedEndDate: order.plannedEndDate || '',
        priority: order.priority || 'Medium',
        workCenterId: order.workCenterId || '',
        description: order.description || ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  // إغلاق النافذة
  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // حفظ أمر الإنتاج
  const handleSave = async () => {
    if (!formData.productId || !formData.quantity) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      if (editingOrder) {
        updateProductionOrder(editingOrder.id, formData);
      } else {
        addProductionOrder(formData);
      }
      handleCloseModal();
    } catch (error) {
      console.error('خطأ في حفظ أمر الإنتاج:', error);
      alert('حدث خطأ أثناء حفظ أمر الإنتاج');
    } finally {
      setLoading(false);
    }
  };

  // تغيير حالة أمر الإنتاج
  const handleStatusChange = (orderId, newStatus) => {
    updateProductionOrderStatus(orderId, newStatus);
  };

  // حساب تقدمي أمر الإنتاج
  const calculateProgress = (order) => {
    if (order.progress) return order.progress;
    
    // حساب تقدمي بسيط بناءً على الحالة
    const statusProgress = {
      'Created': 10,
      'Planned': 25,
      'Scheduled': 40,
      'Released': 50,
      'In Progress': 75,
      'Completed': 100,
      'Closed': 100,
      'Hold': order.progress || 0,
      'Cancelled': 0
    };
    
    return statusProgress[order.status] || 0;
  };

  // الحصول على اسم المنتج
  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'منتج غير محدد';
  };

  // الحصول على اسم مركز العمل
  const getWorkCenterName = (workCenterId) => {
    if (!workCenterId) return 'غير محدد';
    const workCenter = workCenters.find(wc => wc.id === workCenterId);
    return workCenter ? workCenter.name : 'مركز غير محدد';
  };

  // الحصول على لون الحالة
  const getStatusColor = (status) => {
    const colors = {
      'Created': 'bg-blue-100 text-blue-800',
      'Planned': 'bg-yellow-100 text-yellow-800',
      'Scheduled': 'bg-indigo-100 text-indigo-800',
      'Released': 'bg-purple-100 text-purple-800',
      'In Progress': 'bg-green-100 text-green-800',
      'Completed': 'bg-emerald-100 text-emerald-800',
      'Closed': 'bg-gray-100 text-gray-800',
      'Hold': 'bg-orange-100 text-orange-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // أعمدة الجدول
  const columns = [
    {
      header: 'رقم الأمر',
      accessor: 'orderNumber',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">#{row.id}</div>
          <div className="text-sm text-gray-500">
            {new Date(row.createdAt).toLocaleDateString('ar')}
          </div>
        </div>
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
      header: 'الكمية',
      accessor: 'quantity',
      render: (value) => (
        <div className="text-gray-900">{value} وحدة</div>
      )
    },
    {
      header: 'المركز',
      accessor: 'workCenterId',
      render: (value) => (
        <div className="text-gray-900">{getWorkCenterName(value)}</div>
      )
    },
    {
      header: 'الحالة',
      accessor: 'status',
      render: (value, row) => (
        <div className="space-y-2">
          <select
            value={value}
            onChange={(e) => handleStatusChange(row.id, e.target.value)}
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress(row)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 text-center">
            {calculateProgress(row)}%
          </div>
        </div>
      )
    },
    {
      header: 'التواريخ',
      accessor: 'dates',
      render: (value, row) => (
        <div className="text-sm">
          <div className="text-gray-900">
            البدء: {row.plannedStartDate ? new Date(row.plannedStartDate).toLocaleDateString('ar') : 'غير محدد'}
          </div>
          <div className="text-gray-900">
            الانتهاء: {row.plannedEndDate ? new Date(row.plannedEndDate).toLocaleDateString('ar') : 'غير محدد'}
          </div>
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
          {priorityOptions.find(p => p.value === value)?.label || value}
        </span>
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
              if (window.confirm && window.confirm('هل أنت متأكد من حذف أمر الإنتاج هذا؟')) {
                // حذف أمر الإنتاج
                console.log('حذف أمر الإنتاج:', row.id);
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

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة أوامر الإنتاج</h1>
          <p className="text-gray-600">إنشاء وإدارة أوامر الإنتاج وتتبع حالتها</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          أمر إنتاج جديد
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {productionOrders.length}
          </div>
          <div className="text-gray-600">إجمالي الأوامر</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {getProductionOrdersByStatus('In Progress').length}
          </div>
          <div className="text-gray-600">قيد التشغيل</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {getProductionOrdersByStatus('Scheduled').length}
          </div>
          <div className="text-gray-600">مجدولة</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {getProductionOrdersByStatus('Completed').length}
          </div>
          <div className="text-gray-600">مكتملة</div>
        </Card>
      </div>

      {/* فلاتر */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
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
          <div className="text-sm text-gray-500">
            عرض {filteredOrders.length} من {productionOrders.length} أمر
          </div>
        </div>
      </Card>

      {/* جدول أوامر الإنتاج */}
      <Card>
        <Table
          columns={columns}
          data={filteredOrders}
          className="min-w-full"
        />
      </Card>

      {/* نافذة إضافة/تعديل أمر الإنتاج */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingOrder ? 'تعديل أمر الإنتاج' : 'أمر إنتاج جديد'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المنتج *
              </label>
              <Select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                required
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
                الكمية *
              </label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="أدخل الكمية"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ البدء المخطط
              </label>
              <Input
                type="date"
                value={formData.plannedStartDate}
                onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ الانتهاء المخطط
              </label>
              <Input
                type="date"
                value={formData.plannedEndDate}
                onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الأولوية
              </label>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                مركز العمل
              </label>
              <Select
                value={formData.workCenterId}
                onChange={(e) => setFormData({ ...formData, workCenterId: e.target.value })}
              >
                <option value="">اختر مركز العمل</option>
                {workCenters.map(center => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الوصف
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="وصف إضافي لأمر الإنتاج"
            />
          </div>

          {/* معاينة BOM إذا تم اختيار منتج */}
          {formData.productId && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">مواد مطلوبة:</h4>
              <div className="space-y-2">
                {getBomItemsByProduct(formData.productId).map(bomItem => {
                  const product = products.find(p => p.id === bomItem.materialId);
                  return (
                    <div key={bomItem.id} className="flex justify-between text-sm">
                      <span>{product?.name || 'مادة غير محددة'}</span>
                      <span className="text-gray-600">
                        {bomItem.quantity * (parseInt(formData.quantity) || 0)} {product?.unit || ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              onClick={handleCloseModal}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductionOrderManagement;
