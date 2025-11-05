// ======================================
// إدارة الأصول الثابتة
// ======================================

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../Common/Card';
import Button from '../Common/Button';
import Table from '../Common/Table';
import Modal from '../Common/Modal';

const AssetManagement = () => {
  const {
    fixedAssets,
    assetCategories,
    assetLocations,
    addFixedAsset,
    updateFixedAsset,
    deleteFixedAsset,
    calculateDepreciation,
    getAssetValuation
  } = useData();

  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // بيانات النموذج
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    locationId: '',
    originalValue: '',
    currentValue: '',
    purchaseDate: '',
    depreciationMethod: 'straight-line',
    usefulLife: '',
    salvageValue: '',
    status: 'Active',
    serialNumber: '',
    vendor: '',
    warrantyExpiry: '',
    notes: ''
  });

  // تصفية الأصول
  const filteredAssets = fixedAssets.filter(asset => {
    const matchesSearch = asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filterCategory || asset.categoryId === filterCategory;
    const matchesLocation = !filterLocation || asset.locationId === filterLocation;
    const matchesStatus = !filterStatus || asset.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
  });

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      locationId: '',
      originalValue: '',
      currentValue: '',
      purchaseDate: '',
      depreciationMethod: 'straight-line',
      usefulLife: '',
      salvageValue: '',
      status: 'Active',
      serialNumber: '',
      vendor: '',
      warrantyExpiry: '',
      notes: ''
    });
  };

  // فتح نموذج الإضافة
  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  // فتح نموذج التعديل
  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name || '',
      description: asset.description || '',
      categoryId: asset.categoryId || '',
      locationId: asset.locationId || '',
      originalValue: asset.originalValue || '',
      currentValue: asset.currentValue || '',
      purchaseDate: asset.purchaseDate || '',
      depreciationMethod: asset.depreciationMethod || 'straight-line',
      usefulLife: asset.usefulLife || '',
      salvageValue: asset.salvageValue || '',
      status: asset.status || 'Active',
      serialNumber: asset.serialNumber || '',
      vendor: asset.vendor || '',
      warrantyExpiry: asset.warrantyExpiry || '',
      notes: asset.notes || ''
    });
    setShowEditModal(true);
  };

  // حفظ الأصل
  const handleSave = () => {
    const assetData = {
      ...formData,
      originalValue: parseFloat(formData.originalValue) || 0,
      currentValue: parseFloat(formData.currentValue) || parseFloat(formData.originalValue) || 0,
      usefulLife: parseInt(formData.usefulLife) || 0,
      salvageValue: parseFloat(formData.salvageValue) || 0
    };

    if (editingAsset) {
      updateFixedAsset(editingAsset.id, assetData);
      setShowEditModal(false);
      setEditingAsset(null);
    } else {
      addFixedAsset(assetData);
      setShowAddModal(false);
    }
    resetForm();
  };

  // حذف الأصل
  const handleDelete = (assetId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الأصل؟')) {
      deleteFixedAsset(assetId);
      setSelectedAssets(selectedAssets.filter(id => id !== assetId));
    }
  };

  // أعمدة الجدول
  const columns = [
    {
      header: 'اسم الأصل',
      accessor: 'name',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          {row.description && (
            <div className="text-sm text-gray-500">{row.description}</div>
          )}
        </div>
      )
    },
    {
      header: 'التصنيف',
      accessor: 'categoryId',
      render: (value) => {
        const category = assetCategories.find(c => c.id === value);
        return (
          <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
            {category?.name || 'غير محدد'}
          </div>
        );
      }
    },
    {
      header: 'الموقع',
      accessor: 'locationId',
      render: (value) => {
        const location = assetLocations.find(l => l.id === value);
        return (
          <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
            {location?.name || 'غير محدد'}
          </div>
        );
      }
    },
    {
      header: 'القيمة الأصلية',
      accessor: 'originalValue',
      render: (value) => (
        <div className="font-medium text-green-600">
          {value ? value.toLocaleString() : 0} ريال
        </div>
      )
    },
    {
      header: 'القيمة الحالية',
      accessor: 'currentValue',
      render: (value, row) => {
        const depreciation = calculateDepreciation(row.id, row.depreciationMethod || 'straight-line');
        const currentValue = value || (row.originalValue - (depreciation?.totalDepreciation || 0));
        return (
          <div className="font-medium text-blue-600">
            {currentValue.toLocaleString()} ريال
          </div>
        );
      }
    },
    {
      header: 'حالة الأصل',
      accessor: 'status',
      render: (value) => {
        const statusColors = {
          'Active': 'bg-green-100 text-green-800',
          'Under Maintenance': 'bg-yellow-100 text-yellow-800',
          'Disposed': 'bg-red-100 text-red-800',
          'In Use': 'bg-blue-100 text-blue-800'
        };
        const statusLabels = {
          'Active': 'نشط',
          'Under Maintenance': 'تحت الصيانة',
          'Disposed': 'تم التصرف',
          'In Use': 'قيد الاستخدام'
        };
        return (
          <div className={`px-2 py-1 rounded text-sm ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {statusLabels[value] || value}
          </div>
        );
      }
    },
    {
      header: 'الرقم التسلسلي',
      accessor: 'serialNumber',
      render: (value) => (
        <div className="font-mono text-sm text-gray-600">
          {value || '-'}
        </div>
      )
    },
    {
      header: 'تاريخ الشراء',
      accessor: 'purchaseDate',
      render: (value) => (
        <div className="text-sm text-gray-600">
          {value ? new Date(value).toLocaleDateString('ar-SA') : '-'}
        </div>
      )
    },
    {
      header: 'الإجراءات',
      accessor: 'id',
      render: (value, row) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            تعديل
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(value)}
            className="text-red-600 hover:text-red-700"
          >
            حذف
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الأصول الثابتة</h1>
          <p className="mt-1 text-sm text-gray-500">
            إدارة شاملة لجميع الأصول الثابتة في المؤسسة
          </p>
        </div>
        <Button onClick={handleAdd}>
          إضافة أصل جديد
        </Button>
      </div>

      {/* شريط البحث والفلترة */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البحث
              </label>
              <input
                type="text"
                placeholder="البحث في الأصول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                التصنيف
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">جميع التصنيفات</option>
                {assetCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الموقع
              </label>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">جميع المواقع</option>
                {assetLocations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">جميع الحالات</option>
                <option value="Active">نشط</option>
                <option value="Under Maintenance">تحت الصيانة</option>
                <option value="In Use">قيد الاستخدام</option>
                <option value="Disposed">تم التصرف</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                  setFilterLocation('');
                  setFilterStatus('');
                }}
              >
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {fixedAssets.length}
            </div>
            <div className="text-sm text-gray-500">إجمالي الأصول</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {fixedAssets.filter(a => a.status === 'Active').length}
            </div>
            <div className="text-sm text-gray-500">الأصول النشطة</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {fixedAssets.filter(a => a.status === 'Disposed').length}
            </div>
            <div className="text-sm text-gray-500">الأصول المتصرفة</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {fixedAssets.filter(a => a.status === 'Under Maintenance').length}
            </div>
            <div className="text-sm text-gray-500">تحت الصيانة</div>
          </div>
        </Card>
      </div>

      {/* جدول الأصول */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              قائمة الأصول ({filteredAssets.length})
            </h3>
          </div>
          <Table
            columns={columns}
            data={filteredAssets}
            searchable={false}
            maxHeight="600px"
          />
        </div>
      </Card>

      {/* نموذج إضافة أصل */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="إضافة أصل جديد"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم الأصل *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                التصنيف *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">اختر التصنيف</option>
                {assetCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الموقع *
              </label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({...formData, locationId: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">اختر الموقع</option>
                {assetLocations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                القيمة الأصلية *
              </label>
              <input
                type="number"
                value={formData.originalValue}
                onChange={(e) => setFormData({...formData, originalValue: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ الشراء *
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                طريقة الإهلاك
              </label>
              <select
                value={formData.depreciationMethod}
                onChange={(e) => setFormData({...formData, depreciationMethod: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="straight-line">القسط الثابت</option>
                <option value="declining-balance">الرصيد المتناقص</option>
                <option value="units-of-production">وحدات الإنتاج</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                العمر الافتراضي (بالسنوات)
              </label>
              <input
                type="number"
                value={formData.usefulLife}
                onChange={(e) => setFormData({...formData, usefulLife: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                القيمة المتبقية
              </label>
              <input
                type="number"
                value={formData.salvageValue}
                onChange={(e) => setFormData({...formData, salvageValue: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الوصف
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الرقم التسلسلي
              </label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المورد
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                انتهاء الضمان
              </label>
              <input
                type="date"
                value={formData.warrantyExpiry}
                onChange={(e) => setFormData({...formData, warrantyExpiry: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={2}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleSave}>
              حفظ الأصل
            </Button>
          </div>
        </div>
      </Modal>

      {/* نموذج تعديل أصل */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="تعديل الأصل"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم الأصل *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="Active">نشط</option>
                <option value="Under Maintenance">تحت الصيانة</option>
                <option value="In Use">قيد الاستخدام</option>
                <option value="Disposed">تم التصرف</option>
              </select>
            </div>
          </div>
          
          {/* باقي الحقول مشابهة للنموذج الأصلي */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleSave}>
              حفظ التعديلات
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssetManagement;