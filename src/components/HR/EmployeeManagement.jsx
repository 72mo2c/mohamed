import React, { useState, useEffect } from 'react';
import { useData } from '../../../context/DataContext.jsx';
import { 
  FaUsers, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter,
  FaEye,
  FaUserTie,
  FaCalendar,
  FaMoneyBillWave,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaMapMarkerAlt,
  FaFilter as FaFilterIcon,
  FaChevronDown,
  FaDownload,
  FaUpload,
  FaCamera
} from 'react-icons/fa';

const EmployeeManagement = ({ onNavigate }) => {
  const {
    employees,
    departments,
    positions,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeProfile
  } = useData();

  // حالة البيانات
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // حالة النماذج المنبثقة
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    dateOfBirth: '',
    hireDate: '',
    departmentId: '',
    positionId: '',
    basicSalary: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    qualification: '',
    experience: '',
    gender: 'male',
    nationality: 'saudi',
    status: 'active'
  });

  // تحميل البيانات المفلترة عند تغيير المرشحات
  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, filterDepartment, filterStatus, sortBy, sortOrder]);

  // دالة تصفية الموظفين
  const filterEmployees = () => {
    let filtered = [...employees];

    // البحث
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeNumber?.includes(searchTerm)
      );
    }

    // فلترة حسب القسم
    if (filterDepartment) {
      filtered = filtered.filter(emp => emp.departmentId === parseInt(filterDepartment));
    }

    // فلترة حسب الحالة
    if (filterStatus) {
      filtered = filtered.filter(emp => emp.status === filterStatus);
    }

    // الترتيب
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (sortBy === 'department') {
        const aDept = departments.find(d => d.id === a.departmentId);
        const bDept = departments.find(d => d.id === b.departmentId);
        aValue = aDept?.name || '';
        bValue = bDept?.name || '';
      }
      
      if (sortBy === 'position') {
        const aPos = positions.find(p => p.id === a.positionId);
        const bPos = positions.find(p => p.id === b.positionId);
        aValue = aPos?.title || '';
        bValue = bPos?.title || '';
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue, 'ar')
          : bValue.localeCompare(aValue, 'ar');
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredEmployees(filtered);
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nationalId: '',
      dateOfBirth: '',
      hireDate: '',
      departmentId: '',
      positionId: '',
      basicSalary: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      qualification: '',
      experience: '',
      gender: 'male',
      nationality: 'saudi',
      status: 'active'
    });
  };

  // فتح نموذج إضافة موظف
  const handleAddEmployee = () => {
    resetForm();
    setShowAddForm(true);
  };

  // فتح نموذج تعديل موظف
  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      nationalId: employee.nationalId || '',
      dateOfBirth: employee.dateOfBirth || '',
      hireDate: employee.hireDate || '',
      departmentId: employee.departmentId || '',
      positionId: employee.positionId || '',
      basicSalary: employee.basicSalary || '',
      address: employee.address || '',
      emergencyContact: employee.emergencyContact || '',
      emergencyPhone: employee.emergencyPhone || '',
      qualification: employee.qualification || '',
      experience: employee.experience || '',
      gender: employee.gender || 'male',
      nationality: employee.nationality || 'saudi',
      status: employee.status || 'active'
    });
    setShowEditForm(true);
  };

  // عرض ملف الموظف
  const handleViewProfile = async (employee) => {
    try {
      const profile = getEmployeeProfile(employee.id);
      setSelectedEmployee(profile);
      setShowProfile(true);
    } catch (error) {
      alert('خطأ في عرض الملف: ' + error.message);
    }
  };

  // حفظ موظف جديد
  const handleSaveEmployee = (e) => {
    e.preventDefault();
    
    try {
      addEmployee(formData);
      setShowAddForm(false);
      resetForm();
      alert('تم إضافة الموظف بنجاح');
    } catch (error) {
      alert('خطأ في إضافة الموظف: ' + error.message);
    }
  };

  // تحديث موظف
  const handleUpdateEmployee = (e) => {
    e.preventDefault();
    
    try {
      updateEmployee(selectedEmployee.id, formData);
      setShowEditForm(false);
      setSelectedEmployee(null);
      resetForm();
      alert('تم تحديث بيانات الموظف بنجاح');
    } catch (error) {
      alert('خطأ في تحديث الموظف: ' + error.message);
    }
  };

  // حذف موظف
  const handleDeleteEmployee = (employee) => {
    if (window.confirm(`هل أنت متأكد من حذف الموظف "${employee.firstName} ${employee.lastName}"؟`)) {
      try {
        deleteEmployee(employee.id);
        alert('تم حذف الموظف بنجاح');
      } catch (error) {
        alert('خطأ في حذف الموظف: ' + error.message);
      }
    }
  };

  // تصدير البيانات
  const handleExportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "الرقم الوظيفي,الاسم,البريد الإلكتروني,الهاتف,القسم,المنصب,الراتب,الحالة\n"
      + filteredEmployees.map(emp => {
          const dept = departments.find(d => d.id === emp.departmentId);
          const pos = positions.find(p => p.id === emp.positionId);
          return `${emp.employeeNumber || ''},"${emp.firstName || ''} ${emp.lastName || ''}",${emp.email || ''},${emp.phone || ''},${dept?.name || ''},${pos?.title || ''},${emp.basicSalary || ''},${emp.status || ''}`;
        }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employees.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // الحصول على لون الحالة
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // الحصول على نص الحالة
  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'inactive': return 'غير نشط';
      case 'on_leave': return 'في إجازة';
      default: return status;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* رأس الصفحة */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaUsers className="text-2xl text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">إدارة الموظفين</h1>
              <p className="text-gray-600">إدارة بيانات الموظفين والمعلومات الشخصية</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <FaDownload />
              تصدير
            </button>
            <button
              onClick={handleAddEmployee}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <FaPlus />
              إضافة موظف
            </button>
          </div>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* البحث */}
          <div className="relative">
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم، البريد الإلكتروني، أو الرقم الوظيفي..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* فلتر القسم */}
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="">جميع الأقسام</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* فلتر الحالة */}
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
              <option value="on_leave">في إجازة</option>
            </select>
          </div>

          {/* الترتيب */}
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">ترتيب بالاسم</option>
              <option value="employeeNumber">ترتيب بالرقم الوظيفي</option>
              <option value="department">ترتيب بالقسم</option>
              <option value="position">ترتيب بالمنصب</option>
              <option value="basicSalary">ترتيب بالراتب</option>
              <option value="hireDate">ترتيب بتاريخ التعيين</option>
            </select>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm">إجمالي الموظفين</p>
                <p className="text-2xl font-bold text-blue-800">{filteredEmployees.length}</p>
              </div>
              <FaUsers className="text-blue-500 text-xl" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm">الموظفين النشطين</p>
                <p className="text-2xl font-bold text-green-800">
                  {filteredEmployees.filter(emp => emp.status === 'active').length}
                </p>
              </div>
              <FaUserTie className="text-green-500 text-xl" />
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm">في إجازة</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {filteredEmployees.filter(emp => emp.status === 'on_leave').length}
                </p>
              </div>
              <FaCalendar className="text-yellow-500 text-xl" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm">متوسط الراتب</p>
                <p className="text-2xl font-bold text-purple-800">
                  {filteredEmployees.length > 0 ? (
                    Math.round(filteredEmployees.reduce((sum, emp) => sum + (parseFloat(emp.basicSalary) || 0), 0) / filteredEmployees.length)
                  ) : 0}
                </p>
              </div>
              <FaMoneyBillWave className="text-purple-500 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* جدول الموظفين */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الموظف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الرقم الوظيفي</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القسم/المنصب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">معلومات الاتصال</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الراتب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    لا توجد موظفين مسجلين
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const department = departments.find(d => d.id === employee.departmentId);
                  const position = positions.find(p => p.id === employee.positionId);
                  
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                            {employee.firstName?.charAt(0) || ''}{employee.lastName?.charAt(0) || ''}
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.nationalId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.employeeNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{department?.name || 'غير محدد'}</div>
                        <div className="text-sm text-gray-500">{position?.title || 'غير محدد'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <FaPhone className="text-xs text-gray-400" />
                          {employee.phone || '-'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <FaEnvelope className="text-xs text-gray-400" />
                          {employee.email || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <FaMoneyBillWave className="text-xs text-green-500" />
                          {parseFloat(employee.basicSalary || 0).toLocaleString()} ريال
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                          {getStatusText(employee.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewProfile(employee)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="عرض الملف"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            className="text-yellow-600 hover:text-yellow-900 p-1"
                            title="تعديل"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="حذف"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نموذج إضافة موظف */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">إضافة موظف جديد</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSaveEmployee} className="space-y-6">
                {/* البيانات الشخصية */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">البيانات الشخصية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الأول *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الأخير *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني *</label>
                      <input
                        type="email"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
                      <input
                        type="tel"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهوية *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.nationalId}
                        onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الميلاد</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الجنس</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      >
                        <option value="male">ذكر</option>
                        <option value="female">أنثى</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الجنسية</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.nationality}
                        onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                      >
                        <option value="saudi">سعودي</option>
                        <option value="non_saudi">غير سعودي</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* البيانات الوظيفية */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">البيانات الوظيفية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التعيين *</label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.hireDate}
                        onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">القسم *</label>
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.departmentId}
                        onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                      >
                        <option value="">اختر القسم</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">المنصب</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.positionId}
                        onChange={(e) => setFormData({...formData, positionId: e.target.value})}
                      >
                        <option value="">اختر المنصب</option>
                        {positions.map(pos => (
                          <option key={pos.id} value={pos.id}>{pos.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الراتب الأساسي *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.basicSalary}
                        onChange={(e) => setFormData({...formData, basicSalary: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">المؤهل العلمي</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.qualification}
                        onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">سنوات الخبرة</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.experience}
                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الحالة الوظيفية</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="active">نشط</option>
                        <option value="inactive">غير نشط</option>
                        <option value="on_leave">في إجازة</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* معلومات الاتصال الطارئ */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">معلومات الاتصال الطارئ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">اسم جهة الاتصال</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">هاتف جهة الاتصال</label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.emergencyPhone}
                        onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>

                {/* أزرار الحفظ */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    حفظ الموظف
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* نموذج تعديل موظف */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">تعديل بيانات الموظف</h2>
                <button
                  onClick={() => setShowEditForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleUpdateEmployee} className="space-y-6">
                {/* نفس حقول نموذج الإضافة */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">البيانات الشخصية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الأول *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الأخير *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني *</label>
                      <input
                        type="email"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
                      <input
                        type="tel"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهوية *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.nationalId}
                        onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الميلاد</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الجنس</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      >
                        <option value="male">ذكر</option>
                        <option value="female">أنثى</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الجنسية</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.nationality}
                        onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                      >
                        <option value="saudi">سعودي</option>
                        <option value="non_saudi">غير سعودي</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* البيانات الوظيفية */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">البيانات الوظيفية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التعيين *</label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.hireDate}
                        onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">القسم *</label>
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.departmentId}
                        onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                      >
                        <option value="">اختر القسم</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">المنصب</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.positionId}
                        onChange={(e) => setFormData({...formData, positionId: e.target.value})}
                      >
                        <option value="">اختر المنصب</option>
                        {positions.map(pos => (
                          <option key={pos.id} value={pos.id}>{pos.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الراتب الأساسي *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.basicSalary}
                        onChange={(e) => setFormData({...formData, basicSalary: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">المؤهل العلمي</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.qualification}
                        onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">سنوات الخبرة</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.experience}
                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الحالة الوظيفية</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="active">نشط</option>
                        <option value="inactive">غير نشط</option>
                        <option value="on_leave">في إجازة</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* معلومات الاتصال الطارئ */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">معلومات الاتصال الطارئ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">اسم جهة الاتصال</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">هاتف جهة الاتصال</label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.emergencyPhone}
                        onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>

                {/* أزرار الحفظ */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* نافذة عرض الملف الشخصي */}
      {showProfile && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">الملف الشخصي للموظف</h2>
                <button
                  onClick={() => setShowProfile(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {/* معلومات أساسية */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
                  <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-3xl font-bold">
                      {selectedEmployee.firstName?.charAt(0) || ''}{selectedEmployee.lastName?.charAt(0) || ''}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
                      <p className="text-orange-100">الرقم الوظيفي: {selectedEmployee.employeeNumber || '-'}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                          {departments.find(d => d.id === selectedEmployee.departmentId)?.name || 'غير محدد'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedEmployee.status)}`}>
                          {getStatusText(selectedEmployee.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* بيانات تفصيلية */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* البيانات الشخصية */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <FaUserTie className="text-orange-500" />
                      البيانات الشخصية
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">البريد الإلكتروني:</span>
                        <span className="font-medium">{selectedEmployee.email || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">رقم الهاتف:</span>
                        <span className="font-medium">{selectedEmployee.phone || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">رقم الهوية:</span>
                        <span className="font-medium">{selectedEmployee.nationalId || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">تاريخ الميلاد:</span>
                        <span className="font-medium">{selectedEmployee.dateOfBirth || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الجنس:</span>
                        <span className="font-medium">{selectedEmployee.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الجنسية:</span>
                        <span className="font-medium">{selectedEmployee.nationality === 'saudi' ? 'سعودي' : 'غير سعودي'}</span>
                      </div>
                    </div>
                  </div>

                  {/* البيانات الوظيفية */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <FaIdCard className="text-orange-500" />
                      البيانات الوظيفية
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">القسم:</span>
                        <span className="font-medium">{departments.find(d => d.id === selectedEmployee.departmentId)?.name || 'غير محدد'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">المنصب:</span>
                        <span className="font-medium">{positions.find(p => p.id === selectedEmployee.positionId)?.title || 'غير محدد'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">تاريخ التعيين:</span>
                        <span className="font-medium">{selectedEmployee.hireDate || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الراتب الأساسي:</span>
                        <span className="font-medium text-green-600">{parseFloat(selectedEmployee.basicSalary || 0).toLocaleString()} ريال</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">المؤهل العلمي:</span>
                        <span className="font-medium">{selectedEmployee.qualification || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">سنوات الخبرة:</span>
                        <span className="font-medium">{selectedEmployee.experience || '0'} سنة</span>
                      </div>
                    </div>
                  </div>

                  {/* إحصائيات الحضور */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <FaCalendar className="text-blue-500" />
                      إحصائيات الحضور الشهرية
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">أيام الحضور:</span>
                        <span className="font-medium text-blue-600">{selectedEmployee.currentMonthAttendance?.length || 0} يوم</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">إجمالي الساعات:</span>
                        <span className="font-medium text-blue-600">{selectedEmployee.totalWorkingHours?.toFixed(2) || '0'} ساعة</span>
                      </div>
                    </div>
                  </div>

                  {/* معلومات الاتصال الطارئ */}
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <FaPhone className="text-red-500" />
                      معلومات الاتصال الطارئ
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">اسم جهة الاتصال:</span>
                        <span className="font-medium">{selectedEmployee.emergencyContact || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">هاتف جهة الاتصال:</span>
                        <span className="font-medium">{selectedEmployee.emergencyPhone || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* العنوان */}
                {selectedEmployee.address && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <FaMapMarkerAlt className="text-gray-500" />
                      العنوان
                    </h4>
                    <p className="text-sm text-gray-600">{selectedEmployee.address}</p>
                  </div>
                )}

                {/* أزرار الإجراءات */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    onClick={() => setShowProfile(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    إغلاق
                  </button>
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      handleEditEmployee(selectedEmployee);
                    }}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    تعديل البيانات
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;