import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';

const LowStockReport = () => {
  const { products, warehouses } = useData();
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    generateReport();
  }, [products, selectedWarehouse]);

  const generateReport = () => {
    let data = [];

    products.forEach((product) => {
      if (selectedWarehouse === 'all') {
        warehouses.forEach((warehouse) => {
          const stock = product.stock?.[warehouse.id] || 0;
          const minStock = product.minStock || 0;
          if (stock <= minStock) {
            data.push({
              ...product,
              currentStock: stock,
              warehouse: warehouse.name,
              deficit: minStock - stock,
            });
          }
        });
      } else {
        const stock = product.stock?.[selectedWarehouse] || 0;
        const minStock = product.minStock || 0;
        if (stock <= minStock) {
          const warehouse = warehouses.find((w) => w.id === selectedWarehouse);
          data.push({
            ...product,
            currentStock: stock,
            warehouse: warehouse?.name || '',
            deficit: minStock - stock,
          });
        }
      }
    });

    setReportData(data);
  };

  const printReport = () => {
    window.print();
  };

  const exportToExcel = () => {
    const headers = ['الباركود', 'اسم الصنف', 'المخزن', 'الكمية الحالية', 'حد الطلب', 'النقص'];
    const csvData = reportData.map((item) => [
      item.barcode || '-',
      item.name,
      item.warehouse,
      item.currentStock,
      item.minStock || 0,
      item.deficit,
    ]);

    let csv = headers.join(',') + '\n';
    csvData.forEach((row) => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `low_stock_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .printable, .printable * {
            visibility: visible;
          }
          
          .printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white;
          }
          
          /* Header Styles */
          .print-header {
            display: block !important;
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .print-header .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .print-header .report-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 5px;
          }
          
          .print-header .report-subtitle {
            font-size: 14px;
            color: #666;
          }
          
          .print-header .print-date {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
          
          /* Hide non-essential elements */
          .no-print {
            display: none !important;
          }
          
          /* Table Styles */
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
          }
          
          .print-table th {
            background: #333 !important;
            color: white !important;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #333;
          }
          
          .print-table td {
            padding: 8px;
            text-align: center;
            border: 1px solid #ddd;
            vertical-align: middle;
          }
          
          .print-table tbody tr:nth-child(even) {
            background: #f9f9f9 !important;
          }
          
          .print-table .deficit {
            background: #ffebee !important;
            color: #c62828 !important;
            font-weight: bold;
          }
          
          /* Page Breaks */
          .page-break {
            page-break-after: always;
          }
          
          .no-page-break {
            page-break-inside: avoid;
          }
          
          /* Footer */
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: #333;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            font-size: 10px;
          }
          
          .print-only {
            display: block !important;
          }
          
          .screen-only {
            display: block;
          }
          
          .print-only {
            display: none;
          }
        }
        
        @page {
          margin: 1in;
          size: A4;
        }
        
        @page :first {
          margin-top: 1.5in;
        }
      `}</style>
      
      <div className="p-6 max-w-7xl mx-auto printable">
        {/* Print Header */}
        <div className="print-header no-print">
          <div className="company-name">شركة بero لإدارة المخازن</div>
          <div className="report-title">تقرير الأصناف الأقل من حد الطلب</div>
          <div className="report-subtitle">عرض الأصناف التي وصلت لحد الطلب أو أقل</div>
          <div className="print-date">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</div>
        </div>

        <PageHeader
          title="تقرير الأصناف الأقل من حد الطلب"
          subtitle="عرض الأصناف التي وصلت لحد الطلب أو أقل"
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          actions={[
            {
              label: 'طباعة',
              onClick: printReport,
              variant: 'secondary',
            },
            {
              label: 'تصدير Excel',
              onClick: exportToExcel,
              variant: 'primary',
            },
          ]}
        />

      <Card className="mt-6 no-print">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            المخزن
          </label>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">جميع المخازن</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="mt-6 overflow-x-auto no-page-break">
        <table className="min-w-full divide-y divide-gray-200 print-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                الباركود
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                اسم الصنف
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                المخزن
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                الكمية الحالية
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                حد الطلب
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                النقص
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {item.barcode || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                  {item.warehouse}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {item.currentStock}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {item.minStock || 0}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium deficit">
                  {item.deficit}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {item.currentStock === 0 ? (
                    <>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-600 text-white no-print">
                        نفذت الكمية
                      </span>
                      <span className="print-only deficit">نفذت الكمية</span>
                    </>
                  ) : (
                    <>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 no-print">
                        أقل من الحد
                      </span>
                      <span className="print-only">أقل من الحد</span>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reportData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>لا توجد أصناف أقل من حد الطلب</p>
          </div>
        )}
      </Card>

      {/* Print Footer */}
      <div className="print-footer no-print">
        <span>شركة بero لإدارة المخازن</span>
        <span>صفحة 1 من 1</span>
      </div>
    </div>
  );
};

export default LowStockReport;