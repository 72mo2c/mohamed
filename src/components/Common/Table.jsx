// ======================================
// Table Component - مكون الجدول
// ======================================

import React, { useState } from 'react';
import { FaFileInvoice, FaUndo, FaPrint, FaEdit, FaTrash, FaEye, FaFilter, FaSort, FaExclamationTriangle, FaCheckCircle, FaClock } from 'react-icons/fa';

const Table = ({ 
  columns, 
  data, 
  onEdit, 
  onDelete, 
  onView, 
  onReturn, 
  onPrint, 
  actions = true,
  loading = false,
  error = null,
  sortable = false,
  filterable = false,
  pagination = false,
  onSort,
  onFilter,
  pageSize = 10,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  returnConfig = null
}) => {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterValues, setFilterValues] = useState({});

  // دالة الترتيب
  const handleSort = (column) => {
    if (!sortable || !onSort) return;
    
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    onSort(column, newDirection);
  };

  // دالة التصفية
  const handleFilter = (column, value) => {
    const newFilters = { ...filterValues, [column]: value };
    setFilterValues(newFilters);
    if (onFilter) {
      onFilter(newFilters);
    }
  };

  // دالة الحصول على أيقونة الترتيب
  const getSortIcon = (column) => {
    if (sortColumn !== column) {
      return <FaSort className="text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <FaSort className="text-blue-500 transform rotate-180" /> : 
      <FaSort className="text-blue-500" />;
  };

  // دالة الحصول على أيقونة حالة الإرجاع
  const getReturnStatusIcon = (returnStatus) => {
    switch (returnStatus) {
      case 'completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'rejected':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return null;
    }
  };

  // دالة الحصول على لون حالة الإرجاع
  const getReturnStatusColor = (returnStatus) => {
    switch (returnStatus) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* شريط أدوات الجدول */}
      {(filterable || sortable) && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {filterable && (
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-500" />
                  <span className="text-sm text-gray-600">تصفية:</span>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {loading && <span className="animate-spin">⏳</span>}
              {data && data.length > 0 && !loading && (
                <span>{data.length} عنصر</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* رسالة الخطأ */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center text-red-700">
            <FaExclamationTriangle className="ml-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              {columns.map((column, index) => (
                <th key={index} className="px-4 py-3 text-right text-xs font-semibold text-gray-700 border-l border-gray-200 first:border-l-0">
                  <div className="flex items-center justify-between">
                    <span>{column.header}</span>
                    <div className="flex items-center gap-1">
                      {sortable && column.sortable !== false && (
                        <button
                          onClick={() => handleSort(column.accessor)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {getSortIcon(column.accessor)}
                        </button>
                      )}
                      {filterable && column.filterable !== false && (
                        <input
                          type="text"
                          placeholder="تصفية..."
                          value={filterValues[column.accessor] || ''}
                          onChange={(e) => handleFilter(column.accessor, e.target.value)}
                          className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                        />
                      )}
                    </div>
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">الإجراءات</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td 
                  colSpan={columns.length + (actions ? 1 : 0)} 
                  className="px-4 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                    <p className="text-lg font-medium">جاري التحميل...</p>
                  </div>
                </td>
              </tr>
            ) : data && data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-4 py-3 border-l border-gray-100 first:border-l-0">
                      <div className="flex items-center">
                        {column.render ? (
                          column.render(row, { 
                            getReturnStatusIcon, 
                            getReturnStatusColor,
                            returnConfig 
                          })
                        ) : (
                          <span>{row[column.accessor]}</span>
                        )}
                        
                        {/* عرض حالة الإرجاع إذا كان متوفر */}
                        {column.accessor === 'returnStatus' && row[column.accessor] && (
                          <div className="flex items-center gap-2">
                            {getReturnStatusIcon(row[column.accessor])}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReturnStatusColor(row[column.accessor])}`}>
                              {row[column.accessor] === 'completed' ? 'مكتمل' :
                               row[column.accessor] === 'pending' ? 'في الانتظار' :
                               row[column.accessor] === 'rejected' ? 'مرفوض' : row[column.accessor]}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="عرض التفاصيل"
                          >
                            <FaEye size={12} />
                          </button>
                        )}
                        {onReturn && (
                          <button
                            onClick={() => onReturn(row)}
                            className={`p-2 rounded-md transition-colors ${
                              row.returnStatus === 'completed' 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-orange-600 hover:bg-orange-50'
                            }`}
                            title={row.returnStatus === 'completed' ? 'تم إرجاع الفاتورة بالفعل' : 'إرجاع الفاتورة'}
                            disabled={row.returnStatus === 'completed'}
                          >
                            <FaUndo size={12} />
                          </button>
                        )}
                        {onPrint && (
                          <button
                            onClick={() => onPrint(row)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="طباعة الفاتورة"
                          >
                            <FaPrint size={12} />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className={`p-2 rounded-md transition-colors ${
                              row.returnStatus === 'completed' 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                            title={row.returnStatus === 'completed' ? 'لا يمكن تعديل فاتورة مُرجعة' : 'تعديل الفاتورة'}
                            disabled={row.returnStatus === 'completed'}
                          >
                            <FaEdit size={12} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className={`p-2 rounded-md transition-colors ${
                              row.returnStatus === 'completed' 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            title={row.returnStatus === 'completed' ? 'لا يمكن حذف فاتورة مُرجعة' : 'حذف الفاتورة'}
                            disabled={row.returnStatus === 'completed'}
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={columns.length + (actions ? 1 : 0)} 
                  className="px-4 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center">
                    <FaFileInvoice className="mb-3 text-4xl text-gray-300" />
                    <p className="text-lg font-medium">لا توجد بيانات للعرض</p>
                    <p className="text-sm text-gray-400">
                      {Object.keys(filterValues).some(key => filterValues[key]) 
                        ? 'لم يتم العثور على بيانات مطابقة للتصفية' 
                        : 'لم يتم العثور على أي بيانات'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* تذييل الجدول والتنقل */}
      {pagination && totalPages > 1 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-600">
                صفحة {currentPage} من {totalPages}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                السابق
              </button>
              
              {/* أرقام الصفحات */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (page > totalPages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      page === currentPage 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
