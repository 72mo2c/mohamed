import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { 
  FaCalendarAlt, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaChevronDown,
  FaMoneyBillWave,
  FaUserClock,
  FaCalendarCheck,
  FaCalendarTimes,
  FaChartLine,
  FaDownload,
  FaUpload,
  FaExclamationTriangle
} from 'react-icons/fa';

const LeaveManagement = ({ onNavigate }) => {
  const {
    employees,
    leaves,
    leaveTypes,
    departments,
    addLeave,
    updateLeave,
    deleteLeave,
    getLeavesByEmployee,
    getLeaveBalance,
    getLeavesByStatus,
    getLeavesByDateRange
  } = useData();

  // حالة البيانات
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLeaveType, setFilterLeaveType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortBy, setSortBy] = useState('requestDate');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // حالة النماذج المنبثقة
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showBalanceForm, setShowBalanceForm] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    requestDate: new Date().toISOString().split('T')[0],
    reason: '',
    emergencyContact: '',
    status: 'pending',
    approvedBy: '',
    approvalDate: '',
    annualLeaveCount: 0,
    accruedLeaveCount: 0,
    notes: ''
  });

  // حالة الإحصائيات
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalLeaveDays: 0
  });

  // تحميل البيانات عند تغيير الفلاتر
  useEffect(() => {
    filterLeaves();
  }, [leaves, searchTerm, filterEmployee, filterStatus, filterLeaveType, filterDateFrom, filterDateTo, sortBy, sortOrder]);

  // فلترة وترتيب طلبات الإجازة
  const filterLeaves = () => {
    let filtered = [...leaves];

    // تطبيق البحث
    if (searchTerm) {
      const employee = employees.find(emp => 
        emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (employee) {
        filtered = filtered.filter(leave => leave.employeeId === employee.id);
      }
    }

    // تطبيق الفلاتر
    if (filterEmployee) {
      filtered = filtered.filter(leave => leave.employeeId === parseInt(filterEmployee));
    }

    if (filterStatus) {
      filtered = filtered.filter(leave => leave.status === filterStatus);
    }

    if (filterLeaveType) {
      filtered = filtered.filter(leave => leave.leaveTypeId === parseInt(filterLeaveType));
    }

    if (filterDateFrom) {
      filtered = filtered.filter(leave => leave.startDate >= filterDateFrom);
    }

    if (filterDateTo) {
      filtered = filtered.filter(leave => leave.endDate <= filterDateTo);
    }

    // الترتيب
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'startDate' || sortBy === 'endDate' || sortBy === 'requestDate') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    setFilteredLeaves(filtered);
    
    // حساب الإحصائيات
    calculateStats(filtered);
  };

  // حساب الإحصائيات
  const calculateStats = (leavesList) => {
    const totalRequests = leavesList.length;
    const pendingRequests = leavesList.filter(l => l.status === 'pending').length;
    const approvedRequests = leavesList.filter(l => l.status === 'approved').length;
    const rejectedRequests = leavesList.filter(l => l.status === 'rejected').length;
    const totalLeaveDays = leavesList
      .filter(l => l.status === 'approved')
      .reduce((sum, leave) => sum + calculateLeaveDays(leave), 0);

    setStats({
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalLeaveDays
    });
  };

  // الحصول على اسم الموظف
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'غير محدد';
  };

  // الحصول على اسم القسم
  const getEmployeeDepartment = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return 'غير محدد';
    
    const department = departments.find(dept => dept.id === employee.departmentId);
    return department ? department.name : 'غير محدد';
  };

  // الحصول على اسم نوع الإجازة
  const getLeaveTypeName = (leaveTypeId) => {
    const leaveType = leaveTypes.find(type => type.id === leaveTypeId);
    return leaveType ? leaveType.name : 'غير محدد';
  };

  // حساب عدد أيام الإجازة
  const calculateLeaveDays = (leave) => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const timeDiff = end.getTime() - start.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    return dayDiff;
  };

  // حفظ طلب الإجازة
  const handleSave = () => {
    if (!formData.employeeId || !formData.leaveTypeId || !formData.startDate || !formData.endDate) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const leaveDays = calculateLeaveDays(formData);
    const leaveData = {
      ...formData,
      leaveDays,
      createdAt: new Date().toISOString()
    };

    if (showAddForm) {
      addLeave(leaveData);
      alert('تم تقديم طلب الإجازة بنجاح');
    } else if (showEditForm) {
      updateLeave(selectedLeave.id, leaveData);
      alert('تم تحديث طلب الإجازة بنجاح');
    }

    resetForm();
    setShowAddForm(false);
    setShowEditForm(false);
  };

  // حذف طلب الإجازة
  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف طلب الإجازة هذا؟')) {
      deleteLeave(id);
      alert('تم حذف طلب الإجازة بنجاح');
    }
  };

  // تعديل طلب الإجازة
  const handleEdit = (leave) => {
    setSelectedLeave(leave);
    setFormData({
      employeeId: leave.employeeId.toString(),
      leaveTypeId: leave.leaveTypeId.toString(),
      startDate: leave.startDate,
      endDate: leave.endDate,
      requestDate: leave.requestDate,
      reason: leave.reason || '',
      emergencyContact: leave.emergencyContact || '',
      status: leave.status,
      approvedBy: leave.approvedBy || '',
      approvalDate: leave.approvalDate || '',
      annualLeaveCount: leave.annualLeaveCount || 0,
      accruedLeaveCount: leave.accruedLeaveCount || 0,
      notes: leave.notes || ''
    });
    setShowEditForm(true);
  };

  // الموافقة على الطلب
  const handleApprove = (leave) => {
    const updatedLeave = {
      ...leave,
      status: 'approved',
      approvedBy: 'مدير الموارد البشرية',
      approvalDate: new Date().toISOString().split('T')[0]
    };
    updateLeave(leave.id, updatedLeave);
    alert('تم الموافقة على طلب الإجازة بنجاح');
  };

  // رفض الطلب
  const handleReject = (leave) => {
    const reason = prompt('سبب رفض الطلب:');
    if (reason) {
      const updatedLeave = {
        ...leave,
        status: 'rejected',
        approvedBy: 'مدير الموارد البشرية',
        approvalDate: new Date().toISOString().split('T')[0],
        rejectionReason: reason
      };
      updateLeave(leave.id, updatedLeave);
      alert('تم رفض طلب الإجازة');
    }
  };

  // عرض رصيد الإجازات
  const handleViewBalance = (employee) => {
    setSelectedEmployee(employee);
    setShowBalanceForm(true);
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      employeeId: '',
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      requestDate: new Date().toISOString().split('T')[0],
      reason: '',
      emergencyContact: '',
      status: 'pending',
      approvedBy: '',
      approvalDate: '',
      annualLeaveCount: 0,
      accruedLeaveCount: 0,
      notes: ''
    });
    setSelectedLeave(null);
  };

  // تصدير البيانات
  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "تاريخ الطلب,الموظف,القسم,نوع الإجازة,تاريخ البداية,تاريخ النهاية,عدد الأيام,الحالة,تاريخ الموافقة,المقترح\n" +
      filteredLeaves.map(leave => {
        return `${leave.requestDate},${getEmployeeName(leave.employeeId)},${getEmployeeDepartment(leave.employeeId)},${getLeaveTypeName(leave.leaveTypeId)},${leave.startDate},${leave.endDate},${leave.leaveDays},${leave.status},${leave.approvalDate || ''},${leave.approvedBy || ''}`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leave_requests.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* العنوان الرئيسي */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="text-2xl text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-800">إدارة الإجازات</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaPlus /> طلب إجازة جديد
            </button>
          </div>
        </div>

        {/* الإحصائيات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalRequests}</p>
              </div>
              <FaCalendarAlt className="text-orange-500 text-xl" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">في الانتظار</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
              </div>
              <FaClock className="text-yellow-500 text-xl" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مقبولة</p>
                <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
              </div>
              <FaCheckCircle className="text-green-500 text-xl" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مرفوضة</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejectedRequests}</p>
              </div>
              <FaTimesCircle className="text-red-500 text-xl" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الأيام</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalLeaveDays}</p>
              </div>
              <FaCalendarCheck className="text-blue-500 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* أدوات البحث والفلترة */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div className="relative">
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="البحث عن موظف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">جميع الموظفين</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>

          <select
            value={filterLeaveType}
            onChange={(e) => setFilterLeaveType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">جميع أنواع الإجازات</option>
            {leaveTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">جميع الحالات</option>
            <option value="pending">في الانتظار</option>
            <option value="approved">مقبول</option>
            <option value="rejected">مرفوض</option>
          </select>

          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="من تاريخ"
          />

          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="إلى تاريخ"
          />

          <button
            onClick={exportData}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FaDownload /> تصدير
          </button>
        </div>
      </div>

      {/* قائمة طلبات الإجازة */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الطلب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الموظف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع الإجازة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الفترة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الأيام</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{leave.requestDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getEmployeeName(leave.employeeId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getEmployeeDepartment(leave.employeeId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getLeaveTypeName(leave.leaveTypeId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {leave.startDate} - {leave.endDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {leave.leaveDays} يوم
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {leave.status === 'approved' ? 'مقبول' :
                       leave.status === 'rejected' ? 'مرفوض' :
                       'في الانتظار'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {leave.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(leave)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="موافقة"
                          >
                            <FaCheckCircle />
                          </button>
                          <button
                            onClick={() => handleReject(leave)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="رفض"
                          >
                            <FaTimesCircle />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEdit(leave)}
                        className="text-orange-600 hover:text-orange-900 p-1"
                        title="تعديل"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(leave.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="حذف"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeaves.length === 0 && (
          <div className="text-center py-12">
            <FaCalendarAlt className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-500">لا توجد طلبات إجازة مسجلة</p>
          </div>
        )}
      </div>

      {/* نموذج إضافة/تعديل طلب الإجازة */}
      {(showAddForm || showEditForm) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {showAddForm ? 'طلب إجازة جديد' : 'تعديل طلب الإجازة'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الموظف *</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">اختر الموظف</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع الإجازة *</label>
                  <select
                    value={formData.leaveTypeId}
                    onChange={(e) => setFormData({...formData, leaveTypeId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">اختر نوع الإجازة</option>
                    {leaveTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ البداية *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ النهاية *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الطلب</label>
                  <input
                    type="date"
                    value={formData.requestDate}
                    onChange={(e) => setFormData({...formData, requestDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="pending">في الانتظار</option>
                    <option value="approved">مقبول</option>
                    <option value="rejected">مرفوض</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">التصاريح السنوية المستخدمة</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.annualLeaveCount}
                    onChange={(e) => setFormData({...formData, annualLeaveCount: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">التصاريح المتراكمة المستخدمة</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.accruedLeaveCount}
                    onChange={(e) => setFormData({...formData, accruedLeaveCount: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">سبب الإجازة</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="شرح سبب طلب الإجازة..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">جهة الاتصال في الطوارئ</label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="اسم ورقم الهاتف..."
                />
              </div>

              {formData.startDate && formData.endDate && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">ملخص الإجازة:</h3>
                  <div className="text-sm text-gray-600">
                    <p>عدد أيام الإجازة: {calculateLeaveDays(formData)} يوم</p>
                    <p>المدة: {formData.startDate} - {formData.endDate}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="ملاحظات إضافية..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleSave}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaCheckCircle />
                {showAddForm ? 'تقديم الطلب' : 'تحديث'}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                  setShowEditForm(false);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نموذج عرض رصيد الإجازات */}
      {showBalanceForm && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                رصيد إجازات {getEmployeeName(selectedEmployee.id)}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">إجمالي التصاريح:</h3>
                <div className="space-y-2 text-sm">
                  {leaveTypes.map(type => {
                    const employeeLeaves = leaves.filter(leave => 
                      leave.employeeId === selectedEmployee.id && 
                      leave.leaveTypeId === type.id && 
                      leave.status === 'approved'
                    );
                    const usedDays = employeeLeaves.reduce((sum, leave) => sum + leave.leaveDays, 0);
                    const balance = (type.annualLimit || 0) - usedDays;
                    
                    return (
                      <div key={type.id} className="flex justify-between">
                        <span>{type.name}:</span>
                        <span className="font-medium">
                          {usedDays} مستخدم / {type.annualLimit || 0} متاح (باقي: {balance})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowBalanceForm(false);
                  setSelectedEmployee(null);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;