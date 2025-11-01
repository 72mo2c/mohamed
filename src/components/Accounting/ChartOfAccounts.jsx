// ======================================
// مكون دليل الحسابات (Chart of Accounts)
// ======================================

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { 
  ChevronDownIcon, 
  ChevronLeftIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  FolderIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';

const ChartOfAccounts = () => {
  const { accounts, addAccount, updateAccount, deleteAccount } = useData();
  const [expandedAccounts, setExpandedAccounts] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // بيانات النموذج
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameEn: '',
    type: '',
    nature: 'debit',
    parentId: '',
    description: '',
    allowPosting: true,
    isActive: true
  });

  // أنواع الحسابات
  const accountTypes = [
    { value: 'asset', label: 'الأصول', color: 'bg-blue-100 text-blue-800' },
    { value: 'liability', label: 'الخصوم', color: 'bg-red-100 text-red-800' },
    { value: 'equity', label: 'حقوق الملكية', color: 'bg-green-100 text-green-800' },
    { value: 'revenue', label: 'الإيرادات', color: 'bg-purple-100 text-purple-800' },
    { value: 'expense', label: 'المصروفات', color: 'bg-orange-100 text-orange-800' },
    { value: 'gain', label: 'الأرباح', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'loss', label: 'الخسائر', color: 'bg-pink-100 text-pink-800' }
  ];

  // فلترة وترتيب الحسابات
  const filteredAccounts = accounts
    .filter(account => {
      if (filterType && account.type !== filterType) return false;
      if (searchTerm && !account.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !account.code.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  // بناء الشجرة الهرمية
  const buildAccountTree = (accounts, parentId = null, level = 0) => {
    return accounts
      .filter(account => account.parentId === parentId)
      .sort((a, b) => a.code.localeCompare(b.code))
      .map(account => ({
        ...account,
        children: buildAccountTree(accounts, account.id, level + 1)
      }));
  };

  const accountTree = buildAccountTree(filteredAccounts);

  // التحكم في توسيع/طي الفروع
  const toggleExpand = (accountId) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  // فتح نموذج إضافة/تعديل حساب
  const openAccountModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        code: account.code,
        name: account.name,
        nameEn: account.nameEn || '',
        type: account.type,
        nature: account.nature,
        parentId: account.parentId || '',
        description: account.description || '',
        allowPosting: account.allowPosting,
        isActive: account.isActive
      });
    } else {
      setEditingAccount(null);
      setFormData({
        code: '',
        name: '',
        nameEn: '',
        type: '',
        nature: 'debit',
        parentId: '',
        description: '',
        allowPosting: true,
        isActive: true
      });
    }
    setShowModal(true);
  };

  // حفظ الحساب
  const handleSubmit = (e) => {
    e.preventDefault();
    
    try {
      const accountData = {
        ...formData,
        parentId: formData.parentId ? parseInt(formData.parentId) : null,
      };

      if (editingAccount) {
        updateAccount(editingAccount.id, accountData);
      } else {
        addAccount(accountData);
      }
      
      setShowModal(false);
      setEditingAccount(null);
    } catch (error) {
      alert('خطأ: ' + error.message);
    }
  };

  // حذف الحساب
  const handleDelete = (account) => {
    if (window.confirm(`هل أنت متأكد من حذف الحساب "${account.name}"؟`)) {
      try {
        deleteAccount(account.id);
      } catch (error) {
        alert('خطأ: ' + error.message);
      }
    }
  };

  // عرض شجرة الحسابات
  const renderAccountTree = (accounts, level = 0) => {
    return accounts.map(account => (
      <div key={account.id} className="w-full">
        {/* سطر الحساب */}
        <div 
          className={`flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 ${
            level > 0 ? 'ml-' + (level * 20) : ''
          }`}
          style={{ marginRight: level * 20 }}
        >
          <div className="flex items-center flex-1">
            {/* زر التوسيع */}
            {account.children && account.children.length > 0 && (
              <button
                onClick={() => toggleExpand(account.id)}
                className="mr-2 p-1 text-gray-400 hover:text-gray-600"
              >
                {expandedAccounts.has(account.id) ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronLeftIcon className="w-4 h-4" />
                )}
              </button>
            )}
            
            {/* رمز الحساب */}
            <div className="w-20 text-sm font-medium text-gray-600 ml-3">
              {account.code}
            </div>
            
            {/* اسم الحساب */}
            <div className="flex-1 flex items-center">
              {account.children && account.children.length > 0 ? (
                expandedAccounts.has(account.id) ? (
                  <FolderOpenIcon className="w-4 h-4 text-orange-500 mr-2" />
                ) : (
                  <FolderIcon className="w-4 h-4 text-orange-500 mr-2" />
                )
              ) : (
                <div className="w-4 h-4 mr-2"></div>
              )}
              <span className="text-sm font-medium text-gray-900 ml-2">
                {account.name}
              </span>
            </div>
            
            {/* نوع الحساب */}
            <div className="ml-4">
              {accountTypes.find(t => t.value === account.type) && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  accountTypes.find(t => t.value === account.type).color
                }`}>
                  {accountTypes.find(t => t.value === account.type).label}
                </span>
              )}
            </div>
            
            {/* الرصيد */}
            <div className="w-24 text-sm text-left text-gray-600">
              {account.balance?.toFixed(2) || '0.00'}
            </div>
            
            {/* حالة الحساب */}
            <div className="w-16 text-center">
              {account.isActive ? (
                <span className="text-xs text-green-600">نشط</span>
              ) : (
                <span className="text-xs text-red-600">معطل</span>
              )}
            </div>
          </div>
          
          {/* أزرار العمليات */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => openAccountModal(account)}
              className="p-2 text-gray-400 hover:text-orange-500"
              title="تعديل"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(account)}
              className="p-2 text-gray-400 hover:text-red-500"
              title="حذف"
              disabled={account.isSystem}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* الفروع الفرعية */}
        {account.children && account.children.length > 0 && 
         expandedAccounts.has(account.id) && (
          <div>
            {renderAccountTree(account.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">دليل الحسابات</h1>
        <button
          onClick={() => openAccountModal()}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center"
        >
          <PlusIcon className="w-4 h-4 ml-2" />
          حساب جديد
        </button>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* البحث */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البحث في الحسابات
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث بالرمز أو الاسم..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          {/* فلترة النوع */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              فلترة حسب النوع
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">جميع الأنواع</option>
              {accountTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* جدول الحسابات */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* رأس الجدول */}
        <div className="bg-orange-50 px-4 py-3 border-b border-gray-200">
          <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-700">
            <div>الرمز</div>
            <div className="col-span-2">اسم الحساب</div>
            <div>النوع</div>
            <div>الرصيد</div>
            <div>الحالة</div>
            <div>العمليات</div>
          </div>
        </div>
        
        {/* محتوى الجدول */}
        <div className="max-h-96 overflow-y-auto">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد حسابات
            </div>
          ) : (
            renderAccountTree(accountTree)
          )}
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {accountTypes.map(type => {
          const count = accounts.filter(acc => acc.type === type.value).length;
          return (
            <div key={type.value} className="bg-white p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className={`text-sm ${type.color} px-2 py-1 rounded-full inline-block mt-1`}>
                {type.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* نافذة إضافة/تعديل الحساب */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAccount ? 'تعديل حساب' : 'حساب جديد'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* رمز الحساب */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رمز الحساب *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                {/* اسم الحساب */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم الحساب *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                {/* نوع الحساب */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نوع الحساب *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const selectedType = accountTypes.find(t => t.value === e.target.value);
                      setFormData({
                        ...formData, 
                        type: e.target.value,
                        nature: selectedType ? (selectedType.value === 'asset' || selectedType.value === 'expense' || selectedType.value === 'loss' ? 'debit' : 'credit') : 'debit'
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    <option value="">اختر النوع</option>
                    {accountTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* الحساب الأب */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الحساب الأب
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">بدون حساب أب</option>
                    {accounts.filter(acc => acc.level < 3).map(account => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* الطبيعة */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    طبيعة الحساب
                  </label>
                  <select
                    value={formData.nature}
                    onChange={(e) => setFormData({...formData, nature: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="debit">مدين</option>
                    <option value="credit">دائن</option>
                  </select>
                </div>

                {/* حالة النشاط */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    حالة الحساب
                  </label>
                  <div className="flex space-x-4 rtl:space-x-reverse">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isActive"
                        value="true"
                        checked={formData.isActive === true}
                        onChange={() => setFormData({...formData, isActive: true})}
                        className="ml-2"
                      />
                      نشط
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isActive"
                        value="false"
                        checked={formData.isActive === false}
                        onChange={() => setFormData({...formData, isActive: false})}
                        className="ml-2"
                      />
                      معطل
                    </label>
                  </div>
                </div>
              </div>

              {/* وصف الحساب */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  وصف الحساب
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  rows="3"
                />
              </div>

              {/* أزرار التحكم */}
              <div className="flex justify-end space-x-4 rtl:space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  {editingAccount ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;