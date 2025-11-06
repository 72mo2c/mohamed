import React, { useState } from 'react';
import { 
  FaTruck, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter,
  FaShippingFast,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt
} from 'react-icons/fa';

const ShippingManagement = () => {
  const [shippingData, setShippingData] = useState([
    {
      id: 1,
      vehicleType: 'شاحنة كبيرة',
      vehicleNumber: 'أ 1234 ب',
      driver: 'أحمد محمد',
      capacity: '5 طن',
      status: 'متاح',
      currentLocation: 'المخزن الرئيسي',
      phone: '01012345678'
    },
    {
      id: 2,
      vehicleType: 'فان',
      vehicleNumber: 'ج 5678 د',
      driver: 'محمد علي',
      capacity: '2 طن',
      status: 'في الطريق',
      currentLocation: 'العملاء - المنطقة الشمالية',
      phone: '01087654321'
    },
    {
      id: 3,
      vehicleType: 'شاحنة صغيرة',
      vehicleNumber: 'ه 9012 و',
      driver: 'علي أحمد',
      capacity: '3 طن',
      status: 'مشغول',
      currentLocation: 'تم التسليم - العميل رقم 25',
      phone: '01012345679'
    }
  ]);

  const [activeTab, setActiveTab] = useState('vehicles');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // قائمة جديدة لالشحنات النشطة
  const [activeShipments] = useState([
    {
      id: 1,
      invoiceNumber: 'INV-2025-001',
      customerName: 'شركة البناء الحديث',
      address: 'شارع الجامعة - الجيزة',
      vehicle: 'أ 1234 ب - أحمد محمد',
      status: 'في الطريق',
      priority: 'عادي',
      estimatedDelivery: '2025-11-07 18:00',
      items: 15
    },
    {
      id: 2,
      invoiceNumber: 'INV-2025-002', 
      customerName: 'معرض الأثاث الذهبي',
      address: 'شارع التحرير - القاهرة',
      vehicle: 'ج 5678 د - محمد علي',
      status: 'قيد التحضير',
      priority: 'عالي',
      estimatedDelivery: '2025-11-08 12:00',
      items: 8
    }
  ]);

  const filteredData = shippingData.filter(vehicle => {
    const matchesSearch = vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'متاح': return 'bg-green-100 text-green-800';
      case 'مشغول': return 'bg-yellow-100 text-yellow-800';
      case 'في الطريق': return 'bg-blue-100 text-blue-800';
      case 'قيد التحضير': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'عالي': return 'bg-red-100 text-red-800';
      case 'عادي': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddVehicle = (vehicleData) => {
    const newVehicle = {
      id: shippingData.length + 1,
      ...vehicleData
    };
    setShippingData([...shippingData, newVehicle]);
    setShowAddModal(false);
  };

  const handleEditVehicle = (vehicleData) => {
    const updatedData = shippingData.map(vehicle => 
      vehicle.id === selectedVehicle.id 
        ? { ...vehicle, ...vehicleData }
        : vehicle
    );
    setShippingData(updatedData);
    setShowEditModal(false);
    setSelectedVehicle(null);
  };

  const handleDeleteVehicle = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الشاحنة؟')) {
      setShippingData(shippingData.filter(vehicle => vehicle.id !== id));
    }
  };

  const VehicleForm = ({ vehicle, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(
      vehicle || {
        vehicleType: '',
        vehicleNumber: '',
        driver: '',
        capacity: '',
        status: 'متاح',
        currentLocation: '',
        phone: ''
      }
    );

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-bold mb-4 text-gray-800">
            {vehicle ? 'تعديل الشاحنة' : 'إضافة شاحنة جديدة'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع الشاحنة</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                value={formData.vehicleType}
                onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
              >
                <option value="">اختر نوع الشاحنة</option>
                <option value="شاحنة كبيرة">شاحنة كبيرة</option>
                <option value="شاحنة متوسطة">شاحنة متوسطة</option>
                <option value="شاحنة صغيرة">شاحنة صغيرة</option>
                <option value="فان">فان</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الشاحنة</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                placeholder="مثال: أ 1234 ب"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم السائق</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                value={formData.driver}
                onChange={(e) => setFormData({...formData, driver: e.target.value})}
                placeholder="اسم السائق"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعة</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
              >
                <option value="">اختر السعة</option>
                <option value="1 طن">1 طن</option>
                <option value="2 طن">2 طن</option>
                <option value="3 طن">3 طن</option>
                <option value="4 طن">4 طن</option>
                <option value="5 طن">5 طن</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="متاح">متاح</option>
                <option value="مشغول">مشغول</option>
                <option value="في الطريق">في الطريق</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الموقع الحالي</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                value={formData.currentLocation}
                onChange={(e) => setFormData({...formData, currentLocation: e.target.value})}
                placeholder="الموقع الحالي"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
              <input
                type="tel"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="01012345678"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => onSubmit(formData)}
              className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
            >
              {vehicle ? 'تحديث' : 'إضافة'}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">إدارة الشحن</h1>
            <p className="text-gray-600">إدارة الشاحنات والعمليات الخاصة بالشحن والتوصيل</p>
          </div>
          <div className="text-4xl text-orange-600">
            <FaTruck />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'vehicles'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaTruck className="inline-block mr-2" />
              الشاحنات
            </button>
            <button
              onClick={() => setActiveTab('shipments')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'shipments'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaShippingFast className="inline-block mr-2" />
              الشحنات النشطة
            </button>
          </nav>
        </div>

        {/* Vehicles Tab */}
        {activeTab === 'vehicles' && (
          <div className="p-6">
            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="البحث عن شاحنة أو سائق..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">جميع الحالات</option>
                <option value="متاح">متاح</option>
                <option value="مشغول">مشغول</option>
                <option value="في الطريق">في الطريق</option>
              </select>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <FaPlus />
                إضافة شاحنة
              </button>
            </div>

            {/* Vehicles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.map((vehicle) => (
                <div key={vehicle.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl text-orange-600">
                      <FaTruck />
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-800">{vehicle.vehicleType}</h3>
                    <p className="text-sm text-gray-600">رقم الشاحنة: {vehicle.vehicleNumber}</p>
                    <p className="text-sm text-gray-600">السائق: {vehicle.driver}</p>
                    <p className="text-sm text-gray-600">السعة: {vehicle.capacity}</p>
                    <p className="text-sm text-gray-600">هاتف: {vehicle.phone}</p>
                    
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-xs" />
                        {vehicle.currentLocation}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setShowEditModal(true);
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <FaEdit />
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <FaTrash />
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Shipments Tab */}
        {activeTab === 'shipments' && (
          <div className="p-6">
            <div className="space-y-4">
              {activeShipments.map((shipment) => (
                <div key={shipment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{shipment.invoiceNumber}</h3>
                      <p className="text-sm text-gray-600">{shipment.customerName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(shipment.priority)}`}>
                        {shipment.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                        {shipment.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="flex items-center gap-2 mb-1">
                        <FaMapMarkerAlt className="text-xs text-gray-400" />
                        {shipment.address}
                      </p>
                      <p>الشاحنة: {shipment.vehicle}</p>
                    </div>
                    <div>
                      <p className="flex items-center gap-2 mb-1">
                        <FaClock className="text-xs text-gray-400" />
                        التسليم المتوقع: {shipment.estimatedDelivery}
                      </p>
                      <p>عدد الأصناف: {shipment.items} صنف</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2">
                      <FaCheckCircle />
                      تأكيد التسليم
                    </button>
                    <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2">
                      <FaMapMarkerAlt />
                      تتبع الموقع
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <VehicleForm
          onSubmit={handleAddVehicle}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Vehicle Modal */}
      {showEditModal && selectedVehicle && (
        <VehicleForm
          vehicle={selectedVehicle}
          onSubmit={handleEditVehicle}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedVehicle(null);
          }}
        />
      )}
    </div>
  );
};

export default ShippingManagement;