import React, { useState, useEffect } from 'react';
import { useData } from '../../../context/DataContext.jsx';
import { 
  FaMoneyCheckAlt, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter,
  FaEye,
  FaCalculator,
  FaDownload,
  FaUpload,
  FaDollarSign,
  FaCreditCard,
  FaChevronDown,
  FaChartLine,
  FaFileInvoiceDollar,
  FaCalculator as FaCalc,
  FaChartBar,
  FaBuilding,
  FaUserTie,
  FaMoneyBillWave
} from 'react-icons/fa';

const SalaryManagement = ({ onNavigate }) => {
  const {
    employees,
    salaries,
    salaryComponents,
    attendanceRecords,
    departments,
    positions,
    addSalary,
    updateSalary,
    deleteSalary,
    getSalariesByEmployee,
    getMonthlySalaryReport,
    calculateMonthlySalary
  } = useData();

  // حالة البيانات
  const [filteredSalaries, setFilteredSalaries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('month');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // حالة النماذج المنبثقة
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCalcForm, setShowCalcForm] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
    allowances: [],
    deductions: [],
    overtimeAmount: 0,
    bonusAmount: 0,
    lateDeduction: 0,
    absentDeduction: 0,
    totalAllowances: 0,
    totalDeductions: 0,
    netSalary: 0,
    grossSalary: 0,
    paymentStatus: 'pending',
    paymentDate: '',
    paymentMethod: '',
    paymentReference: '',
    notes: ''
  });

  // حالة الإحصائيات
  const [stats, setStats] = useState({
    totalSalaries: 0,
    totalAmount: 0,
    paidSalaries: 0,
    pendingSalaries: 0,
    avgSalary: 0
  });

  // مكونات الراتب الافتراضية
  const [allowanceComponents] = useState([
    { id: 1, name: 'بدل السكن', type: 'allowance', amount: 500 },
    { id: 2, name: 'بدل النقل', type: 'allowance', amount: 200 },
    { id: 3, name: 'بدل الاتصالات', type: 'allowance', amount: 100 },
    { id: 4, name: 'بدل الوجبات', type: 'allowance', amount: 150 }
  ]);

  const [deductionComponents] = useState([
    { id: 1, name: 'التأمين الطبي', type: 'deduction', amount: 150 },
    { id: 2, name: 'صندوق التقاعد', type: 'deduction', amount: 300 },
    { id: 3, name: 'ضريبة الدخل', type: 'deduction', amount: 0 },
    { id: 4, name: 'الخصومات الأخرى', type: 'deduction', amount: 0 }
  ]);

  // تحميل البيانات عند تغيير الفلاتر
  useEffect(() => {
    filterSalaries();
  }, [salaries, searchTerm, filterEmployee, filterMonth, filterYear, filterStatus, sortBy, sortOrder]);

  // فلترة وترتيب سجلات الرواتب
  const filterSalaries = () => {
    let filtered = [...salaries];

    // تطبيق البحث
    if (searchTerm) {
      const employee = employees.find(emp => 
        emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (employee) {
        filtered = filtered.filter(salary => salary.employeeId === employee.id);
      }
    }

    // تطبيق الفلاتر
    if (filterEmployee) {
      filtered = filtered.filter(salary => salary.employeeId === parseInt(filterEmployee));
    }

    if (filterMonth) {
      filtered = filtered.filter(salary => salary.month === parseInt(filterMonth));
    }

    if (filterYear) {
      filtered = filtered.filter(salary => salary.year === parseInt(filterYear));
    }

    if (filterStatus) {
      filtered = filtered.filter(salary => salary.paymentStatus === filterStatus);
    }

    // الترتيب
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'month') {
        aVal = a.year * 100 + a.month;
        bVal = b.year * 100 + b.month;
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    setFilteredSalaries(filtered);
    
    // حساب الإحصائيات
    calculateStats(filtered);
  };

  // حساب الإحصائيات
  const calculateStats = (salariesList) => {
    const totalSalaries = salariesList.length;
    const totalAmount = salariesList.reduce((sum, salary) => sum + (salary.netSalary || 0), 0);
    const paidSalaries = salariesList.filter(s => s.paymentStatus === 'paid').length;
    const pendingSalaries = salariesList.filter(s => s.paymentStatus === 'pending').length;
    const avgSalary = totalSalaries > 0 ? totalAmount / totalSalaries : 0;

    setStats({
      totalSalaries,
      totalAmount,
      paidSalaries,
      pendingSalaries,
      avgSalary
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

  // الحصول على المرتب الأساسي للموظف
  const getEmployeeBasicSalary = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.basicSalary || 0;
  };

  // حساب الرواتب الشهرية للموظف
  const calculateSalaryForEmployee = (employeeId, month, year) => {
    const employee = employees.find(emp => emp.id === parseInt(employeeId));
    if (!employee) return { grossSalary: 0, deductions: 0, netSalary: 0 };

    const basicSalary = employee.basicSalary || 0;
    
    // حساب الحضور والغياب
    const employeeAttendance = attendanceRecords.filter(record => 
      record.employeeId === parseInt(employeeId) && 
      record.date >= `${year}-${String(month).padStart(2, '0')}-01` &&
      record.date <= `${year}-${String(month).padStart(2, '0')}-31`
    );

    const totalDays = employeeAttendance.length;
    const presentDays = employeeAttendance.filter(r => r.status === 'present').length;
    const absentDays = employeeAttendance.filter(r => r.status === 'absent').length;

    // حساب البدلات
    const allowances = allowanceComponents.reduce((sum, comp) => sum + comp.amount, 0);
    
    // حساب الخصومات
    const insuranceDeduction = 150;
    const pensionDeduction = Math.round(basicSalary * 0.05); // 5% للتقاعد
    const absentDeduction = (basicSalary / 22) * absentDays;
    const lateDeduction = employeeAttendance.reduce((sum, r) => sum + (r.lateMinutes || 0), 0) * 0.5;

    const deductions = insuranceDeduction + pensionDeduction + absentDeduction + lateDeduction;
    
    // حساب الراتب الإجمالي والصافي
    const grossSalary = basicSalary + allowances;
    const netSalary = grossSalary - deductions;

    return {
      grossSalary,
      deductions,
      netSalary,
      presentDays,
      absentDays,
      totalDays
    };
  };

  // حفظ سجل الراتب
  const handleSave = () => {
    if (!formData.employeeId || !formData.month || !formData.year) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // التحقق من عدم وجود راتب مسجل لنفس الشهر
    const existingSalary = salaries.find(s => 
      s.employeeId === parseInt(formData.employeeId) && 
      s.month === formData.month && 
      s.year === formData.year
    );

    if (existingSalary && !showEditForm) {
      alert('يوجد راتب مسجل بالفعل لهذا الشهر');
      return;
    }

    const salaryData = {
      ...formData,
      grossSalary: formData.basicSalary + formData.totalAllowances,
      createdAt: new Date().toISOString()
    };

    if (showAddForm) {
      addSalary(salaryData);
      alert('تم حساب الراتب بنجاح');
    } else if (showEditForm) {
      updateSalary(selectedSalary.id, salaryData);
      alert('تم تحديث الراتب بنجاح');
    }

    resetForm();
    setShowAddForm(false);
    setShowEditForm(false);
  };

  // حذف سجل الراتب
  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف سجل الراتب هذا؟')) {
      deleteSalary(id);
      alert('تم حذف سجل الراتب بنجاح');
    }
  };

  // تعديل سجل الراتب
  const handleEdit = (salary) => {
    setSelectedSalary(salary);
    setFormData({
      employeeId: salary.employeeId.toString(),
      month: salary.month,
      year: salary.year,
      basicSalary: salary.basicSalary,
      allowances: salary.allowances || [],
      deductions: salary.deductions || [],
      overtimeAmount: salary.overtimeAmount || 0,
      bonusAmount: salary.bonusAmount || 0,
      lateDeduction: salary.lateDeduction || 0,
      absentDeduction: salary.absentDeduction || 0,
      totalAllowances: salary.totalAllowances || 0,
      totalDeductions: salary.totalDeductions || 0,
      netSalary: salary.netSalary || 0,
      grossSalary: salary.grossSalary || 0,
      paymentStatus: salary.paymentStatus,
      paymentDate: salary.paymentDate || '',
      paymentMethod: salary.paymentMethod || '',
      paymentReference: salary.paymentReference || '',
      notes: salary.notes || ''
    });
    setShowEditForm(true);
  };

  // حساب تلقائي للراتب
  const handleAutoCalculate = () => {
    if (!formData.employeeId || !formData.month || !formData.year) {
      alert('يرجى تحديد الموظف والشهر والسنة أولاً');
      return;
    }

    const calculations = calculateSalaryForEmployee(formData.employeeId, formData.month, formData.year);
    
    setFormData({
      ...formData,
      basicSalary: getEmployeeBasicSalary(formData.employeeId),
      totalAllowances: allowanceComponents.reduce((sum, comp) => sum + comp.amount, 0),
      totalDeductions: calculations.deductions,
      grossSalary: calculations.grossSalary,
      netSalary: calculations.netSalary,
      absentDeduction: (getEmployeeBasicSalary(formData.employeeId) / 22) * calculations.absentDays
    });
    
    alert('تم حساب الراتب تلقائياً');
  };

  // عرض تفاصيل الراتب
  const handleViewDetails = (salary) => {
    setSelectedSalary(salary);
    setShowCalcForm(true);
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      employeeId: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: 0,
      allowances: [],
      deductions: [],
      overtimeAmount: 0,
      bonusAmount: 0,
      lateDeduction: 0,
      absentDeduction: 0,
      totalAllowances: 0,
      totalDeductions: 0,
      netSalary: 0,
      grossSalary: 0,
      paymentStatus: 'pending',
      paymentDate: '',
      paymentMethod: '',
      paymentReference: '',
      notes: ''
    });
    setSelectedSalary(null);
  };

  // تصدير البيانات
  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "الشهر,السنة,الموظف,القسم,الراتب الأساسي,البدلات,الخصومات,الراتب الإجمالي,الراتب الصافي,حالة الدفع\n" +
      filteredSalaries.map(salary => {
        return `${salary.month},${salary.year},${getEmployeeName(salary.employeeId)},${getEmployeeDepartment(salary.employeeId)},${salary.basicSalary},${salary.totalAllowances},${salary.totalDeductions},${salary.grossSalary},${salary.netSalary},${salary.paymentStatus}`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "salary_records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // الحصول على اسم الشهر
  const getMonthName = (month) => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month - 1] || 'غير محدد';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* العنوان الرئيسي */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaMoneyCheckAlt className="text-2xl text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-800">إدارة الرواتب</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaPlus /> حساب راتب جديد
            </button>
          </div>
        </div>

        {/* الإحصائيات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي السجلات</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalSalaries}</p>
              </div>
              <FaFileInvoiceDollar className="text-orange-500 text-xl" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المبلغ</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalAmount.toLocaleString()}</p>
              </div>
              <FaMoneyBillWave className="text-green-500 text-xl" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مدفوعة</p>
                <p className="text-2xl font-bold text-blue-600">{stats.paidSalaries}</p>
              </div>
              <FaCreditCard className="text-blue-500 text-xl" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">في الانتظار</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingSalaries}</p>
              </div>
              <FaCalculator className="text-yellow-500 text-xl" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متوسط الراتب</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgSalary.toLocaleString()}</p>
              </div>
              <FaChartBar className="text-purple-500 text-xl" />
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
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">جميع الشهور</option>
            {Array.from({length: 12}, (_, i) => (
              <option key={i+1} value={i+1}>
                {getMonthName(i+1)}
              </option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">جميع السنوات</option>
            {Array.from({length: 5}, (_, i) => (
              <option key={2024+i} value={2024+i}>
                {2024+i}
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
            <option value="paid">مدفوعة</option>
            <option value="cancelled">ملغية</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="month">ترتيب بالشهر</option>
            <option value="employeeId">ترتيب بالموظف</option>
            <option value="netSalary">ترتيب بالراتب</option>
            <option value="paymentStatus">ترتيب بالحالة</option>
          </select>

          <button
            onClick={exportData}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FaDownload /> تصدير
          </button>
        </div>
      </div>

      {/* قائمة سجلات الرواتب */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الشهر</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الموظف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الراتب الأساسي</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">البدلات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الخصومات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الراتب الصافي</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSalaries.map((salary) => (
                <tr key={salary.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getMonthName(salary.month)} {salary.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getEmployeeName(salary.employeeId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getEmployeeDepartment(salary.employeeId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {salary.basicSalary?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {salary.totalAllowances?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {salary.totalDeductions?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    {salary.netSalary?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      salary.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      salary.paymentStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {salary.paymentStatus === 'paid' ? 'مدفوعة' :
                       salary.paymentStatus === 'cancelled' ? 'ملغية' :
                       'في الانتظار'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(salary)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="عرض التفاصيل"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEdit(salary)}
                        className="text-orange-600 hover:text-orange-900 p-1"
                        title="تعديل"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(salary.id)}
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

        {filteredSalaries.length === 0 && (
          <div className="text-center py-12">
            <FaMoneyCheckAlt className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-500">لا توجد سجلات رواتب مسجلة</p>
          </div>
        )}
      </div>

      {/* نموذج إضافة/تعديل الراتب */}
      {(showAddForm || showEditForm) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {showAddForm ? 'حساب راتب جديد' : 'تعديل الراتب'}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">الشهر *</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    {Array.from({length: 12}, (_, i) => (
                      <option key={i+1} value={i+1}>
                        {getMonthName(i+1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">السنة *</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    {Array.from({length: 5}, (_, i) => (
                      <option key={2024+i} value={2024+i}>
                        {2024+i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* مكونات الراتب */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* الإيجابي (المكاسب) */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <FaDollarSign className="text-green-600" />
                    مكونات الراتب الإيجابية
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الراتب الأساسي</label>
                      <input
                        type="number"
                        value={formData.basicSalary}
                        onChange={(e) => setFormData({...formData, basicSalary: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">بدل السكن</label>
                      <input
                        type="number"
                        value={allowanceComponents.find(c => c.name === 'بدل السكن')?.amount || 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">بدل النقل</label>
                      <input
                        type="number"
                        value={allowanceComponents.find(c => c.name === 'بدل النقل')?.amount || 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ساعات إضافية</label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.overtimeAmount}
                        onChange={(e) => setFormData({...formData, overtimeAmount: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">مكافآت</label>
                      <input
                        type="number"
                        value={formData.bonusAmount}
                        onChange={(e) => setFormData({...formData, bonusAmount: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* السلبي (الخصومات) */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <FaCreditCard className="text-red-600" />
                    مكونات الراتب السلبية
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">التأمين الطبي</label>
                      <input
                        type="number"
                        value={deductionComponents.find(c => c.name === 'التأمين الطبي')?.amount || 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">صندوق التقاعد</label>
                      <input
                        type="number"
                        value={Math.round((formData.basicSalary || 0) * 0.05)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">خصم التأخير</label>
                      <input
                        type="number"
                        value={formData.lateDeduction}
                        onChange={(e) => setFormData({...formData, lateDeduction: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">خصم الغياب</label>
                      <input
                        type="number"
                        value={formData.absentDeduction}
                        onChange={(e) => setFormData({...formData, absentDeduction: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* إجماليات الراتب */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                  <FaCalc className="text-orange-600" />
                  ملخص الراتب
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">الراتب الإجمالي</p>
                    <p className="text-xl font-bold text-green-600">
                      {(formData.basicSalary + (formData.overtimeAmount || 0) + (formData.bonusAmount || 0) + 
                        allowanceComponents.reduce((sum, c) => sum + c.amount, 0)).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-gray-600">إجمالي الخصومات</p>
                    <p className="text-xl font-bold text-red-600">
                      {(deductionComponents.reduce((sum, c) => sum + c.amount, 0) + 
                        Math.round((formData.basicSalary || 0) * 0.05) + 
                        (formData.lateDeduction || 0) + 
                        (formData.absentDeduction || 0)).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-gray-600">الراتب الصافي</p>
                    <p className="text-xl font-bold text-blue-600">
                      {(formData.basicSalary + (formData.overtimeAmount || 0) + (formData.bonusAmount || 0) + 
                        allowanceComponents.reduce((sum, c) => sum + c.amount, 0) - 
                        deductionComponents.reduce((sum, c) => sum + c.amount, 0) - 
                        Math.round((formData.basicSalary || 0) * 0.05) - 
                        (formData.lateDeduction || 0) - 
                        (formData.absentDeduction || 0)).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex justify-center items-center">
                    <button
                      onClick={handleAutoCalculate}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <FaCalculator />
                      حساب تلقائي
                    </button>
                  </div>
                </div>
              </div>

              {/* معلومات الدفع */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">حالة الدفع</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="pending">في الانتظار</option>
                    <option value="paid">مدفوعة</option>
                    <option value="cancelled">ملغية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الدفع</label>
                  <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">اختر طريقة الدفع</option>
                    <option value="cash">نقدي</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="check">شيك</option>
                    <option value="digital">محفظة رقمية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم المرجع</label>
                  <input
                    type="text"
                    value={formData.paymentReference}
                    onChange={(e) => setFormData({...formData, paymentReference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="رقم مرجع الدفع..."
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
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleSave}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaDollarSign />
                {showAddForm ? 'حساب الراتب' : 'تحديث'}
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

      {/* نموذج عرض تفاصيل الراتب */}
      {showCalcForm && selectedSalary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                تفاصيل راتب {getEmployeeName(selectedSalary.employeeId)}
              </h2>
              <p className="text-sm text-gray-600">{getMonthName(selectedSalary.month)} {selectedSalary.year}</p>
            </div>

            <div className="p-6 space-y-4">
              {/* تفاصيل الراتب */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <FaDollarSign className="text-green-600" />
                  مكونات الراتب
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>الراتب الأساسي:</span>
                    <span className="font-medium">{selectedSalary.basicSalary?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>بدل السكن:</span>
                    <span className="font-medium">{allowanceComponents.find(c => c.name === 'بدل السكن')?.amount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>بدل النقل:</span>
                    <span className="font-medium">{allowanceComponents.find(c => c.name === 'بدل النقل')?.amount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ساعات إضافية:</span>
                    <span className="font-medium">{(selectedSalary.overtimeAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مكافآت:</span>
                    <span className="font-medium">{(selectedSalary.bonusAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>الإجمالي:</span>
                    <span>{(selectedSalary.grossSalary || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* تفاصيل الخصومات */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <FaCreditCard className="text-red-600" />
                  الخصومات
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>التأمين الطبي:</span>
                    <span className="font-medium">{deductionComponents.find(c => c.name === 'التأمين الطبي')?.amount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>صندوق التقاعد:</span>
                    <span className="font-medium">{Math.round((selectedSalary.basicSalary || 0) * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>خصم التأخير:</span>
                    <span className="font-medium">{(selectedSalary.lateDeduction || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>خصم الغياب:</span>
                    <span className="font-medium">{(selectedSalary.absentDeduction || 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>إجمالي الخصومات:</span>
                    <span>{((selectedSalary.totalDeductions || 0) + Math.round((selectedSalary.basicSalary || 0) * 0.05) + (selectedSalary.lateDeduction || 0) + (selectedSalary.absentDeduction || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* النتيجة النهائية */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">النتيجة النهائية</h3>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">الراتب الصافي</p>
                  <p className="text-3xl font-bold text-blue-600">{(selectedSalary.netSalary || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* معلومات الدفع */}
              {selectedSalary.paymentStatus && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">معلومات الدفع</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>الحالة:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedSalary.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        selectedSalary.paymentStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedSalary.paymentStatus === 'paid' ? 'مدفوعة' :
                         selectedSalary.paymentStatus === 'cancelled' ? 'ملغية' :
                         'في الانتظار'}
                      </span>
                    </div>
                    {selectedSalary.paymentDate && (
                      <div className="flex justify-between">
                        <span>تاريخ الدفع:</span>
                        <span className="font-medium">{selectedSalary.paymentDate}</span>
                      </div>
                    )}
                    {selectedSalary.paymentMethod && (
                      <div className="flex justify-between">
                        <span>طريقة الدفع:</span>
                        <span className="font-medium">{selectedSalary.paymentMethod}</span>
                      </div>
                    )}
                    {selectedSalary.paymentReference && (
                      <div className="flex justify-between">
                        <span>رقم المرجع:</span>
                        <span className="font-medium">{selectedSalary.paymentReference}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCalcForm(false);
                  setSelectedSalary(null);
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

export default SalaryManagement;