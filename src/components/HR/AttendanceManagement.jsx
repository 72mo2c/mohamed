import React, { useState, useEffect } from 'react';
import { useData } from '../../../context/DataContext.jsx';
import { 
  FaClock, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter,
  FaEye,
  FaCalendar,
  FaMoneyBillWave,
  FaDownload,
  FaUpload,
  FaCheckCircle,
  FaTimesCircle,
  FaPlay,
  FaPause,
  FaStop,
  FaChevronDown,
  FaChartLine,
  FaCalendarCheck,
  FaCalendarTimes,
  FaUserClock
} from 'react-icons/fa';

const AttendanceManagement = ({ onNavigate }) => {
  const {
    employees,
    attendanceRecords,
    addAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    getAttendanceByEmployee,
    getMonthlyAttendanceReport
  } = useData();

  // حالة البيانات
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // حالة النماذج المنبثقة
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    breakStart: '',
    breakEnd: '',
    status: 'present',
    overtimeHours: 0,
    lateMinutes: 0,
    earlyLeaveMinutes: 0,
    notes: ''
  });

  // حالة الإحصائيات
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    overtimeHours: 0
  });

  // تحميل البيانات عند تغيير الفلاتر
  useEffect(() => {
    filterRecords();
  }, [attendanceRecords, searchTerm, filterEmployee, filterDate, filterStatus, sortBy, sortOrder]);

  // فلترة وترتيب السجلات
  const filterRecords = () => {
    let filtered = [...attendanceRecords];

    // تطبيق البحث
    if (searchTerm) {
      const employee = employees.find(emp => emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                             emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()));
      if (employee) {
        filtered = filtered.filter(record => record.employeeId === employee.id);
      }
    }

    // تطبيق الفلاتر
    if (filterEmployee) {
      filtered = filtered.filter(record => record.employeeId === parseInt(filterEmployee));
    }

    if (filterDate) {
      filtered = filtered.filter(record => record.date === filterDate);
    }

    if (filterStatus) {
      filtered = filtered.filter(record => record.status === filterStatus);
    }

    // الترتيب
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    setFilteredRecords(filtered);
    
    // حساب الإحصائيات
    calculateStats(filtered);
  };

  // حساب الإحصائيات
  const calculateStats = (records) => {
    const employeeRecords = records.filter(r => filterEmployee ? r.employeeId === parseInt(filterEmployee) : true);
    const totalDays = employeeRecords.length;
    const presentDays = employeeRecords.filter(r => r.status === 'present').length;
    const absentDays = employeeRecords.filter(r => r.status === 'absent').length;
    const lateDays = employeeRecords.filter(r => r.lateMinutes > 0).length;
    const overtimeHours = employeeRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

    setStats({
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      overtimeHours
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

  // حساب ساعات العمل
  const calculateWorkHours = (record) => {
    if (!record.checkIn || !record.checkOut) return 0;
    
    const checkIn = new Date(`${record.date}T${record.checkIn}`);
    const checkOut = new Date(`${record.date}T${record.checkOut}`);
    
    let workHours = (checkOut - checkIn) / (1000 * 60 * 60);
    
    // خصم فترة الاستراحة
    if (record.breakStart && record.breakEnd) {
      const breakStart = new Date(`${record.date}T${record.breakStart}`);
      const breakEnd = new Date(`${record.date}T${record.breakEnd}`);
      const breakHours = (breakEnd - breakStart) / (1000 * 60 * 60);
      workHours -= breakHours;
    }
    
    return Math.max(0, workHours);
  };

  // حفظ سجل الحضور
  const handleSave = () => {
    if (!formData.employeeId || !formData.date) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const workHours = calculateWorkHours(formData);
    const recordData = {
      ...formData,
      workHours,
      createdAt: new Date().toISOString()
    };

    if (showAddForm) {
      addAttendanceRecord(recordData);
      alert('تم تسجيل حضور الموظف بنجاح');
    } else if (showEditForm) {
      updateAttendanceRecord(selectedRecord.id, recordData);
      alert('تم تحديث سجل الحضور بنجاح');
    }

    resetForm();
    setShowAddForm(false);
    setShowEditForm(false);
  };

  // حذف سجل الحضور
  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف سجل الحضور هذا؟')) {
      deleteAttendanceRecord(id);
      alert('تم حذف سجل الحضور بنجاح');
    }
  };

  // تعديل سجل الحضور
  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      employeeId: record.employeeId.toString(),
      date: record.date,
      checkIn: record.checkIn || '',
      checkOut: record.checkOut || '',
      breakStart: record.breakStart || '',
      breakEnd: record.breakEnd || '',
      status: record.status,
      overtimeHours: record.overtimeHours || 0,
      lateMinutes: record.lateMinutes || 0,
      earlyLeaveMinutes: record.earlyLeaveMinutes || 0,
      notes: record.notes || ''
    });
    setShowEditForm(true);
  };

  // تسجيل سريع
  const quickCheckIn = (employeeId) => {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    const dateString = now.toISOString().split('T')[0];
    
    const recordData = {
      employeeId: parseInt(employeeId),
      date: dateString,
      checkIn: timeString,
      status: 'present',
      lateMinutes: 0,
      createdAt: now.toISOString()
    };

    addAttendanceRecord(recordData);
    alert('تم تسجيل حضور الموظف بنجاح');
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      checkIn: '',
      checkOut: '',
      breakStart: '',
      breakEnd: '',
      status: 'present',
      overtimeHours: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      notes: ''
    });
    setSelectedRecord(null);
  };

  // تصدير البيانات
  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "التاريخ,الموظف,القسم,وقت الدخول,وقت الخروج,ساعات العمل,الحالة,التأخير (دقيقة),ساعات إضافية,ملاحظات\n" +
      filteredRecords.map(record => {
        return `${record.date},${getEmployeeName(record.employeeId)},${getEmployeeDepartment(record.employeeId)},${record.checkIn || ''},${record.checkOut || ''},${record.workHours || 0},${record.status},${record.lateMinutes || 0},${record.overtimeHours || 0},${record.notes || ''}`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_records.csv");
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
            <FaClock className="text-2xl text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-800">إدارة الحضور والانصراف</h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FaPlus /> تسجيل حضور
          </button>
        </div>

        {/* الإحصائيات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الأيام</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalDays}</p>
              </div>
              <FaCalendar className="text-orange-500 text-xl" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">أيام الحضور</p>
                <p className="text-2xl font-bold text-green-600">{stats.presentDays}</p>
              </div>
              <FaCalendarCheck className="text-green-500 text-xl" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">أيام الغياب</p>
                <p className="text-2xl font-bold text-red-600">{stats.absentDays}</p>
              </div>
              <FaCalendarTimes className="text-red-500 text-xl" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">أيام التأخير</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lateDays}</p>
              </div>
              <FaUserClock className="text-yellow-500 text-xl" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ساعات إضافية</p>
                <p className="text-2xl font-bold text-blue-600">{stats.overtimeHours.toFixed(1)}</p>
              </div>
              <FaMoneyBillWave className="text-blue-500 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* أدوات البحث والفلترة */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="التاريخ"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">جميع الحالات</option>
            <option value="present">حاضر</option>
            <option value="absent">غائب</option>
            <option value="late">متأخر</option>
            <option value="half-day">نصف يوم</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="date">ترتيب بالتاريخ</option>
            <option value="employeeId">ترتيب بالموظف</option>
            <option value="status">ترتيب بالحالة</option>
            <option value="workHours">ترتيب بساعات العمل</option>
          </select>

          <button
            onClick={exportData}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FaDownload /> تصدير
          </button>
        </div>
      </div>

      {/* قائمة السجلات */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الموظف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وقت الدخول</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وقت الخروج</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ساعات العمل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getEmployeeName(record.employeeId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getEmployeeDepartment(record.employeeId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.checkIn || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.checkOut || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.workHours ? record.workHours.toFixed(1) : 0} ساعة
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.status === 'present' ? 'bg-green-100 text-green-800' :
                      record.status === 'absent' ? 'bg-red-100 text-red-800' :
                      record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {record.status === 'present' ? 'حاضر' :
                       record.status === 'absent' ? 'غائب' :
                       record.status === 'late' ? 'متأخر' :
                       'نصف يوم'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-orange-600 hover:text-orange-900 p-1"
                        title="تعديل"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
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

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <FaClock className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-500">لا توجد سجلات حضور مسجلة</p>
          </div>
        )}
      </div>

      {/* نموذج إضافة/تعديل سجل الحضور */}
      {(showAddForm || showEditForm) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {showAddForm ? 'تسجيل حضور جديد' : 'تعديل سجل الحضور'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">وقت الدخول</label>
                  <input
                    type="time"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">وقت الخروج</label>
                  <input
                    type="time"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">بداية الاستراحة</label>
                  <input
                    type="time"
                    value={formData.breakStart}
                    onChange={(e) => setFormData({...formData, breakStart: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نهاية الاستراحة</label>
                  <input
                    type="time"
                    value={formData.breakEnd}
                    onChange={(e) => setFormData({...formData, breakEnd: e.target.value})}
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
                    <option value="present">حاضر</option>
                    <option value="absent">غائب</option>
                    <option value="late">متأخر</option>
                    <option value="half-day">نصف يوم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">دقائق التأخير</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lateMinutes}
                    onChange={(e) => setFormData({...formData, lateMinutes: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ساعات إضافية</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.overtimeHours}
                    onChange={(e) => setFormData({...formData, overtimeHours: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">دقائق المغادرة المبكرة</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.earlyLeaveMinutes}
                    onChange={(e) => setFormData({...formData, earlyLeaveMinutes: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

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

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">ملخص ساعات العمل:</h3>
                <div className="text-sm text-gray-600">
                  <p>ساعات العمل المحسوبة: {calculateWorkHours(formData).toFixed(1)} ساعة</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleSave}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaCheckCircle />
                {showAddForm ? 'تسجيل' : 'تحديث'}
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
    </div>
  );
};

export default AttendanceManagement;