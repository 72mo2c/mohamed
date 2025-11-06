// ======================================
// مكون القيود اليومية (Journal Entry)
// ======================================

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { FaPlus, FaTrash, FaFileAlt } from 'react-icons/fa';

const JournalEntry = () => {
  const { accounts, journalEntries, createJournalEntry } = useData();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    entries: []
  });

  // سطور القيد الجديدة
  const [entryLine, setEntryLine] = useState({
    accountId: '',
    description: '',
    debit: '',
    credit: ''
  });

  // إضافة سطر جديد للقيد
  const addEntryLine = () => {
    if (!entryLine.accountId || (!entryLine.debit && !entryLine.credit)) {
      alert('يرجى اختيار الحساب وإدخال مبلغ');
      return;
    }

    if (entryLine.debit && entryLine.credit) {
      alert('لا يمكن إدخال مدين ودائن في نفس السطر');
      return;
    }

    const newLine = {
      id: Date.now(),
      accountId: parseInt(entryLine.accountId),
      description: entryLine.description,
      debit: parseFloat(entryLine.debit) || 0,
      credit: parseFloat(entryLine.credit) || 0,
      accountName: accounts.find(acc => acc.id === parseInt(entryLine.accountId))?.name || ''
    };

    setFormData({
      ...formData,
      entries: [...formData.entries, newLine]
    });

    // إعادة تعيين النموذج
    setEntryLine({
      accountId: '',
      description: '',
      debit: '',
      credit: ''
    });
  };

  // حذف سطر من القيد
  const removeEntryLine = (lineId) => {
    setFormData({
      ...formData,
      entries: formData.entries.filter(line => line.id !== lineId)
    });
  };

  // حساب إجمالي المدين والدائن
  const totalDebit = formData.entries.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = formData.entries.reduce((sum, line) => sum + (line.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  // حفظ القيد
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isBalanced) {
      alert('القيد غير متوازن: إجمالي المدين يجب أن يساوي إجمالي الدائن');
      return;
    }

    if (formData.entries.length < 2) {
      alert('يجب أن يحتوي القيد على سطرين على الأقل');
      return;
    }

    try {
      const entryData = {
        date: formData.date,
        description: formData.description,
        reference: formData.reference,
        entries: formData.entries.map(line => ({
          accountId: line.accountId,
          description: line.description,
          debit: line.debit,
          credit: line.credit
        })),
        totalDebit: totalDebit,
        totalCredit: totalCredit
      };

      createJournalEntry(entryData);
      
      // إعادة تعيين النموذج
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        entries: []
      });
      
      setShowModal(false);
      alert('تم حفظ القيد بنجاح');
    } catch (error) {
      alert('خطأ: ' + error.message);
    }
  };

  // حساب الرصيد التراكمي لحساب معين
  const getAccountRunningBalance = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return 0;
    
    const accountEntries = formData.entries.filter(line => line.accountId === accountId);
    let runningBalance = account.balance || 0;
    
    accountEntries.forEach(line => {
      if (line.debit > 0) {
        if (account.nature === 'debit') {
          runningBalance += line.debit;
        } else {
          runningBalance -= line.debit;
        }
      }
      if (line.credit > 0) {
        if (account.nature === 'credit') {
          runningBalance += line.credit;
        } else {
          runningBalance -= line.credit;
        }
      }
    });
    
    return runningBalance;
  };

  // نسخ سجل قيد موجود
  const copyEntry = (entry) => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: `نسخ من القيد رقم ${entry.entryNumber}`,
      reference: '',
      entries: entry.entries.map(line => ({
        ...line,
        id: Date.now() + Math.random()
      }))
    });
    setShowModal(true);
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">القيود اليومية</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center"
        >
          <FaPlus className="w-4 h-4 ml-2" />
          قيد جديد
        </button>
      </div>

      {/* قائمة القيود الموجودة */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="bg-orange-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">القيود المحاسبية</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم القيد
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الوصف
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المدين
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدائن
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العمليات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {journalEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{entry.entryNumber}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(entry.date).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div className="max-w-xs truncate" title={entry.description}>
                      {entry.description}
                    </div>
                    {entry.reference && (
                      <div className="text-xs text-gray-400">
                        مرجع: {entry.reference}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-left">
                    {entry.totalDebit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-left">
                    {entry.totalCredit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      entry.status === 'posted' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {entry.status === 'posted' ? 'مُرحل' : 'مسودة'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => copyEntry(entry)}
                      className="text-orange-600 hover:text-orange-900 ml-3"
                      title="نسخ القيد"
                    >
                      <FaFileAlt className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {journalEntries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا توجد قيود محاسبية
          </div>
        )}
      </div>

      {/* نافذة إضافة قيد جديد */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">قيد يومي جديد</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* بيانات أساسية */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تاريخ القيد *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الوصف *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="وصف القيد المحاسبي"
                    required
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المرجع
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="رقم الفاتورة أو المرجع"
                  />
                </div>
              </div>

              {/* إضافة سطر جديد */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">إضافة سطر جديد للقيد</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="md:col-span-2">
                    <select
                      value={entryLine.accountId}
                      onChange={(e) => setEntryLine({...entryLine, accountId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">اختر الحساب</option>
                      {accounts.filter(acc => acc.isActive && acc.allowPosting).map(account => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={entryLine.description}
                      onChange={(e) => setEntryLine({...entryLine, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      placeholder="الوصف"
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      step="0.01"
                      value={entryLine.debit}
                      onChange={(e) => setEntryLine({
                        ...entryLine, 
                        debit: e.target.value, 
                        credit: e.target.value && parseFloat(e.target.value) > 0 ? '' : entryLine.credit
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      placeholder="المدين"
                    />
                  </div>

                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <input
                      type="number"
                      step="0.01"
                      value={entryLine.credit}
                      onChange={(e) => setEntryLine({
                        ...entryLine, 
                        credit: e.target.value,
                        debit: e.target.value && parseFloat(e.target.value) > 0 ? '' : entryLine.debit
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      placeholder="الدائن"
                    />
                    <button
                      type="button"
                      onClick={addEntryLine}
                      className="bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600"
                      title="إضافة سطر"
                    >
                      <FaPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* جدول سطور القيد */}
              {formData.entries.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                      <div>الحساب</div>
                      <div>الوصف</div>
                      <div>المدين</div>
                      <div>الدائن</div>
                      <div>الرصيد</div>
                      <div>العمليات</div>
                    </div>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    {formData.entries.map((line, index) => (
                      <div key={line.id} className={`grid grid-cols-6 gap-4 px-4 py-2 text-sm ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}>
                        <div className="text-gray-900">
                          <div className="font-medium">{line.accountName}</div>
                          <div className="text-xs text-gray-500">
                            {accounts.find(acc => acc.id === line.accountId)?.code}
                          </div>
                        </div>
                        <div className="text-gray-600">{line.description}</div>
                        <div className="text-left text-gray-900">
                          {line.debit > 0 ? line.debit.toFixed(2) : '-'}
                        </div>
                        <div className="text-left text-gray-900">
                          {line.credit > 0 ? line.credit.toFixed(2) : '-'}
                        </div>
                        <div className="text-left text-gray-600">
                          {getAccountRunningBalance(line.accountId).toFixed(2)}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => removeEntryLine(line.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* إجماليات القيد */}
                  <div className="bg-gray-100 px-4 py-3 border-t border-gray-200">
                    <div className="grid grid-cols-6 gap-4">
                      <div className="col-span-2"></div>
                      <div className="text-sm font-medium text-gray-700">
                        المجموع: {totalDebit.toFixed(2)}
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        المجموع: {totalCredit.toFixed(2)}
                      </div>
                      <div className={`text-sm font-medium ${
                        isBalanced ? 'text-green-600' : 'text-red-600'
                      }`}>
                        الفرق: {Math.abs(totalDebit - totalCredit).toFixed(2)}
                      </div>
                      <div></div>
                    </div>
                  </div>
                </div>
              )}

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
                  disabled={!isBalanced || formData.entries.length < 2}
                  className={`px-4 py-2 rounded-md text-white ${
                    isBalanced && formData.entries.length >= 2
                      ? 'bg-orange-500 hover:bg-orange-600' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  حفظ القيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntry;