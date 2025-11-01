// ======================================
// Table Component - مكون الجدول
// ======================================

import React from 'react';
import { FaFileInvoice, FaUndo, FaPrint, FaEdit, FaTrash } from 'react-icons/fa';

const Table = ({ columns, data, onEdit, onDelete, onView, onReturn, onPrint, actions = true }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              {columns.map((column, index) => (
                <th key={index} className="px-4 py-3 text-right text-xs font-semibold text-gray-700 border-l border-gray-200 first:border-l-0">
                  {column.header}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">الإجراءات</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data && data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-4 py-3 border-l border-gray-100 first:border-l-0">
                      {column.render ? column.render(row) : row[column.accessor]}
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
                            <FaFileInvoice size={12} />
                          </button>
                        )}
                        {onReturn && (
                          <button
                            onClick={() => onReturn(row)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                            title="إرجاع الفاتورة"
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
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                            title="تعديل الفاتورة"
                          >
                            <FaEdit size={12} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="حذف الفاتورة"
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
                    <p className="text-sm text-gray-400">لم يتم العثور على أي بيانات مطابقة للبحث</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
