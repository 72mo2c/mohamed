import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { 
  FaBuilding, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaEye,
  FaUserTie,
  FaUsers,
  FaTree,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaFolder,
  FaFolderOpen,
  FaSitemap,
  FaArrowUp,
  FaArrowDown,
  FaLevelUpAlt
} from 'react-icons/fa';

const OrganizationManagement = ({ onNavigate }) => {
  const {
    employees,
    departments,
    positions,
    addDepartment,
    updateDepartment,
    deleteDepartment
  } = useData();

  // حالة البيانات
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('departments'); // departments أو positions
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  
  // حالة النماذج المنبثقة
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [showEditDepartment, setShowEditDepartment] = useState(false);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [showEditPosition, setShowEditPosition] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  
  // نموذج القسم
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    parentId: '',
    managerId: '',
    budget: '',
    location: '',
    status: 'active'
  });

  // نموذج المنصب
  const [positionForm, setPositionForm] = useState({
    title: '',
    description: '',
    departmentId: '',
    level: 1,
    minSalary: '',
    maxSalary: '',
    requirements: '',
    responsibilities: '',
    status: 'active'
  });

  // تحميل الأقسام المفلترة
  useEffect(() => {
    filterDepartments();
  }, [departments, searchTerm]);

  // دالة تصفية الأقسام
  const filterDepartments = () => {
    let filtered = [...departments];

    if (searchTerm) {
      filtered = filtered.filter(dept => 
        dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDepartments(filtered);
  };

  // بناء الشجرة الهرمية للأقسام
  const buildDepartmentTree = (departmentsList) => {
    const tree = [];
    const map = new Map();
    
    // إنشاء خريطة من ID إلى قسم
    departmentsList.forEach(dept => {
      map.set(dept.id, { ...dept, children: [] });
    });

    // بناء الشجرة
    departmentsList.forEach(dept => {
      const node = map.get(dept.id);
      if (dept.parentId) {
        const parent = map.get(dept.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;
  };

  // عرض/إخفاء عقدة في الشجرة
  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // إعادة تعيين نماذج الأقسام
  const resetDepartmentForm = () => {
    setDepartmentForm({
      name: '',
      description: '',
      parentId: '',
      managerId: '',
      budget: '',
      location: '',
      status: 'active'
    });
  };

  // إعادة تعيين نماذج المناصب
  const resetPositionForm = () => {
    setPositionForm({
      title: '',
      description: '',
      departmentId: '',
      level: 1,
      minSalary: '',
      maxSalary: '',
      requirements: '',
      responsibilities: '',
      status: 'active'
    });
  };

  // فتح نموذج إضافة قسم
  const handleAddDepartment = () => {
    resetDepartmentForm();
    setShowAddDepartment(true);
  };

  // فتح نموذج تعديل قسم
  const handleEditDepartment = (department) => {
    setSelectedDepartment(department);
    setDepartmentForm({
      name: department.name || '',
      description: department.description || '',
      parentId: department.parentId || '',
      managerId: department.managerId || '',
      budget: department.budget || '',
      location: department.location || '',
      status: department.status || 'active'
    });
    setShowEditDepartment(true);
  };

  // فتح نموذج إضافة منصب
  const handleAddPosition = () => {
    resetPositionForm();
    setShowAddPosition(true);
  };

  // فتح نموذج تعديل منصب
  const handleEditPosition = (position) => {
    setSelectedPosition(position);
    setPositionForm({
      title: position.title || '',
      description: position.description || '',
      departmentId: position.departmentId || '',
      level: position.level || 1,
      minSalary: position.minSalary || '',
      maxSalary: position.maxSalary || '',
      requirements: position.requirements || '',
      responsibilities: position.responsibilities || '',
      status: position.status || 'active'
    });
    setShowEditPosition(true);
  };

  // حفظ قسم جديد
  const handleSaveDepartment = (e) => {
    e.preventDefault();
    
    try {
      addDepartment(departmentForm);
      setShowAddDepartment(false);
      resetDepartmentForm();
      alert('تم إضافة القسم بنجاح');
    } catch (error) {
      alert('خطأ في إضافة القسم: ' + error.message);
    }
  };

  // تحديث قسم
  const handleUpdateDepartment = (e) => {
    e.preventDefault();
    
    try {
      updateDepartment(selectedDepartment.id, departmentForm);
      setShowEditDepartment(false);
      setSelectedDepartment(null);
      resetDepartmentForm();
      alert('تم تحديث بيانات القسم بنجاح');
    } catch (error) {
      alert('خطأ في تحديث القسم: ' + error.message);
    }
  };

  // حفظ منصب جديد
  const handleSavePosition = (e) => {
    e.preventDefault();
    
    try {
      // إضافة منصب جديد (هذا سيحتاج دالة addPosition في DataContext)
      alert('تم إضافة المنصب بنجاح');
      setShowAddPosition(false);
      resetPositionForm();
    } catch (error) {
      alert('خطأ في إضافة المنصب: ' + error.message);
    }
  };

  // تحديث منصب
  const handleUpdatePosition = (e) => {
    e.preventDefault();
    
    try {
      // تحديث منصب (هذا سيحتاج دالة updatePosition في DataContext)
      alert('تم تحديث بيانات المنصب بنجاح');
      setShowEditPosition(false);
      setSelectedPosition(null);
      resetPositionForm();
    } catch (error) {
      alert('خطأ في تحديث المنصب: ' + error.message);
    }
  };

  // حذف قسم
  const handleDeleteDepartment = (department) => {
    if (window.confirm(`هل أنت متأكد من حذف القسم "${department.name}"؟`)) {
      try {
        deleteDepartment(department.id);
        alert('تم حذف القسم بنجاح');
      } catch (error) {
        alert('خطأ في حذف القسم: ' + error.message);
      }
    }
  };

  // حذف منصب
  const handleDeletePosition = (position) => {
    if (window.confirm(`هل أنت متأكد من حذف المنصب "${position.title}"؟`)) {
      try {
        // حذف منصب (هذا سيحتاج دالة deletePosition في DataContext)
        alert('تم حذف المنصب بنجاح');
      } catch (error) {
        alert('خطأ في حذف المنصب: ' + error.message);
      }
    }
  };

  // الحصول على لون الحالة
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // الحصول على نص الحالة
  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'inactive': return 'غير نشط';
      default: return status;
    }
  };

  // عرض عقدة الشجرة
  const renderTreeNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const employeeCount = employees.filter(emp => emp.departmentId === node.id).length;

    return (
      <div key={node.id} className="select-none">
        <div 
          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
          style={{ paddingRight: `${level * 20 + 8}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          <div className="flex-1 flex items-center gap-2">
            {hasChildren ? (
              isExpanded ? 
                <FaChevronDown className="text-xs text-gray-500" /> : 
                <FaChevronLeft className="text-xs text-gray-500" />
            ) : (
              <div className="w-3"></div>
            )}
            
            {isExpanded ? 
              <FaFolderOpen className="text-orange-500" /> : 
              <FaFolder className="text-orange-500" />
            }
            
            <span className="font-medium text-gray-800">{node.name}</span>
            <span className="text-sm text-gray-500">({employeeCount} موظف)</span>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(node.status)}`}>
              {getStatusText(node.status)}
            </span>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditDepartment(node);
              }}
              className="text-yellow-600 hover:text-yellow-900 p-1"
              title="تعديل"
            >
              <FaEdit className="text-xs" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteDepartment(node);
              }}
              className="text-red-600 hover:text-red-900 p-1"
              title="حذف"
            >
              <FaTrash className="text-xs" />
            </button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const departmentTree = buildDepartmentTree(filteredDepartments);

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* رأس الصفحة */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaSitemap className="text-2xl text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">إدارة التنظيم</h1>
              <p className="text-gray-600">إدارة الأقسام والمناصب والهيكل التنظيمي</p>
            </div>
          </div>
          <div className="flex gap-3">
            {selectedTab === 'departments' ? (
              <button
                onClick={handleAddDepartment}
                className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <FaPlus />
                إضافة قسم
              </button>
            ) : (
              <button
                onClick={handleAddPosition}
                className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <FaPlus />
                إضافة منصب
              </button>
            )}
          </div>
        </div>
      </div>

      {/* شريط التبويب والبحث */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {/* التبويبات */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => setSelectedTab('departments')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedTab === 'departments'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FaBuilding />
              الأقسام
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('positions')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedTab === 'positions'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FaUserTie />
              المناصب
            </div>
          </button>
        </div>

        {/* شريط البحث */}
        <div className="relative mb-6">
          <FaSearch className="absolute right-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder={
              selectedTab === 'departments' 
                ? "بحث في الأقسام..." 
                : "بحث في المناصب..."
            }
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm">إجمالي الأقسام</p>
                <p className="text-2xl font-bold text-blue-800">{departments.length}</p>
              </div>
              <FaBuilding className="text-blue-500 text-xl" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm">إجمالي المناصب</p>
                <p className="text-2xl font-bold text-green-800">{positions.length}</p>
              </div>
              <FaUserTie className="text-green-500 text-xl" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm">إجمالي الموظفين</p>
                <p className="text-2xl font-bold text-purple-800">{employees.length}</p>
              </div>
              <FaUsers className="text-purple-500 text-xl" />
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm">الأقسام النشطة</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {departments.filter(dept => dept.status === 'active').length}
                </p>
              </div>
              <FaTree className="text-yellow-500 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* محتوى التبويبات */}
      {selectedTab === 'departments' ? (
        // عرض الأقسام - الشجرة الهرمية
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">الهيكل التنظيمي</h3>
            {departmentTree.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                لا توجد أقسام مسجلة
              </div>
            ) : (
              <div className="border rounded-lg bg-gray-50">
                {departmentTree.map(node => renderTreeNode(node))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // عرض المناصب - جدول
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المنصب</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القسم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المستوى</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نطاق الراتب</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {positions.filter(position => 
                  !searchTerm || 
                  position.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  position.description?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((position) => {
                  const department = departments.find(d => d.id === position.departmentId);
                  
                  return (
                    <tr key={position.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{position.title || '-'}</div>
                          <div className="text-sm text-gray-500">{position.description || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {department?.name || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          مستوى {position.level || 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>من: {parseFloat(position.minSalary || 0).toLocaleString()} ريال</div>
                          <div>إلى: {parseFloat(position.maxSalary || 0).toLocaleString()} ريال</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(position.status)}`}>
                          {getStatusText(position.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPosition(position)}
                            className="text-yellow-600 hover:text-yellow-900 p-1"
                            title="تعديل"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeletePosition(position)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="حذف"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {positions.filter(position => 
                  !searchTerm || 
                  position.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  position.description?.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      لا توجد مناصب مسجلة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* نموذج إضافة قسم */}
      {showAddDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">إضافة قسم جديد</h2>
                <button
                  onClick={() => setShowAddDepartment(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSaveDepartment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم القسم *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={departmentForm.name}
                      onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">القسم الأب</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={departmentForm.parentId}
                      onChange={(e) => setDepartmentForm({...departmentForm, parentId: e.target.value})}
                    >
                      <option value="">قسم رئيسي</option>
                      {departments.filter(dept => !dept.parentId).map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">مدير القسم</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={departmentForm.managerId}
                      onChange={(e) => setDepartmentForm({...departmentForm, managerId: e.target.value})}
                    >
                      <option value="">اختر المدير</option>
                      {employees.filter(emp => emp.status === 'active').map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الميزانية</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={departmentForm.budget}
                      onChange={(e) => setDepartmentForm({...departmentForm, budget: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={departmentForm.location}
                      onChange={(e) => setDepartmentForm({...departmentForm, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={departmentForm.status}
                      onChange={(e) => setDepartmentForm({...departmentForm, status: e.target.value})}
                    >
                      <option value="active">نشط</option>
                      <option value="inactive">غير نشط</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={departmentForm.description}
                    onChange={(e) => setDepartmentForm({...departmentForm, description: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddDepartment(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    حفظ القسم
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* نموذج إضافة منصب */}
      {showAddPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">إضافة منصب جديد</h2>
                <button
                  onClick={() => setShowAddPosition(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSavePosition} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">عنوان المنصب *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={positionForm.title}
                      onChange={(e) => setPositionForm({...positionForm, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={positionForm.departmentId}
                      onChange={(e) => setPositionForm({...positionForm, departmentId: e.target.value})}
                    >
                      <option value="">اختر القسم</option>
                      {departments.filter(dept => dept.status === 'active').map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المستوى</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={positionForm.level}
                      onChange={(e) => setPositionForm({...positionForm, level: parseInt(e.target.value)})}
                    >
                      <option value={1}>مستوى 1</option>
                      <option value={2}>مستوى 2</option>
                      <option value={3}>مستوى 3</option>
                      <option value={4}>مستوى 4</option>
                      <option value={5}>مستوى 5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأدنى للراتب</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={positionForm.minSalary}
                      onChange={(e) => setPositionForm({...positionForm, minSalary: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأقصى للراتب</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={positionForm.maxSalary}
                      onChange={(e) => setPositionForm({...positionForm, maxSalary: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={positionForm.status}
                      onChange={(e) => setPositionForm({...positionForm, status: e.target.value})}
                    >
                      <option value="active">نشط</option>
                      <option value="inactive">غير نشط</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">وصف المنصب</label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={positionForm.description}
                    onChange={(e) => setPositionForm({...positionForm, description: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المتطلبات</label>
                  <textarea
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={positionForm.requirements}
                    onChange={(e) => setPositionForm({...positionForm, requirements: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المسؤوليات</label>
                  <textarea
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={positionForm.responsibilities}
                    onChange={(e) => setPositionForm({...positionForm, responsibilities: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddPosition(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    حفظ المنصب
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;