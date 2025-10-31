import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';

const WarehouseTransfersReport = () => {
  const { transfers, warehouses, products } = useData();
  const [selectedFromWarehouse, setSelectedFromWarehouse] = useState('all');
  const [selectedToWarehouse, setSelectedToWarehouse] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [stats, setStats] = useState({
    totalTransfers: 0,
    totalQuantity: 0,
    totalValue: 0,
    mostTransferredProduct: '',
    mostActiveWarehouse: '',
  });

  useEffect(() => {
    generateReport();
  }, [transfers, selectedFromWarehouse, selectedToWarehouse, startDate, endDate]);

  const generateReport = () => {
    let data = [];
    
    transfers?.forEach((transfer) => {
      // تصفية بالتاريخ
      const transferDate = new Date(transfer.date);
      if (startDate && transferDate < new Date(startDate)) return;
      if (endDate && transferDate > new Date(endDate)) return;

      // تصفية بالمخزن المصدر
      if (selectedFromWarehouse !== 'all' && transfer.fromWarehouseId !== parseInt(selectedFromWarehouse)) return;
      
      // تصفية بالمخزن المستهدف
      if (selectedToWarehouse !== 'all' && transfer.toWarehouseId !== parseInt(selectedToWarehouse)) return;

      const fromWarehouse = warehouses.find((w) => w.id === transfer.fromWarehouseId);
      const toWarehouse = warehouses.find((w) => w.id === transfer.toWarehouseId);
      const product = products.find((p) => p.id === transfer.productId);

      data.push({
        ...transfer,
        fromWarehouseName: fromWarehouse?.name || 'غير معروف',
        toWarehouseName: toWarehouse?.name || 'غير معروف',
        productName: product?.name || transfer.productName || 'غير معروف',
        productPrice: product?.price || 0,
      });
    });

    // ترتيب البيانات حسب التاريخ
    data.sort((a, b) => new Date(b.date) - new Date(a.date));

    // حساب الإحصائيات
    const totalTransfers = data.length;
    const totalQuantity = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalValue = data.reduce((sum, item) => sum + ((item.quantity || 0) * (item.productPrice || 0)), 0);

    // المنتج الأكثر تحويلاً
    const productCounts = {};
    data.forEach(item => {
      productCounts[item.productName] = (productCounts[item.productName] || 0) + item.quantity;
    });
    const mostTransferredProduct = Object.keys(productCounts).reduce((a, b) => 
      productCounts[a] > productCounts[b] ? a : b, 'لا يوجد'
    );

    // المخزن الأكثر نشاطاً
    const warehouseCounts = {};
    data.forEach(item => {
      warehouseCounts[item.fromWarehouseName] = (warehouseCounts[item.fromWarehouseName] || 0) + item.quantity;
      warehouseCounts[item.toWarehouseName] = (warehouseCounts[item.toWarehouseName] || 0) + item.quantity;
    });
    const mostActiveWarehouse = Object.keys(warehouseCounts).reduce((a, b) => 
      warehouseCounts[a] > warehouseCounts[b] ? a : b, 'لا يوجد'
    );

    setReportData(data);
    setStats({
      totalTransfers,
      totalQuantity,
      totalValue,
      mostTransferredProduct,
      mostActiveWarehouse,
    });
  };

  const printReport = () => {
    window.print();
  };

  const exportToExcel = () => {
    const headers = ['التاريخ', 'المنتج', 'الكمية', 'السعر', 'القيمة', 'من', 'إلى', 'ملاحظات'];
    const csvData = reportData.map((item) => [
      new Date(item.date).toLocaleDateString('ar-SA'),
      item.productName,
      item.quantity,
      item.productPrice,
      (item.quantity * item.productPrice).toFixed(2),
      item.fromWarehouseName,
      item.toWarehouseName,
      item.notes || '-',
    ]);

    let csv = headers.join(',') + '\n';
    csvData.forEach((row) => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `warehouse_transfers_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <PageHeader 
          title="تقرير التحويلات بين المخازن" 
          subtitle="تقرير شامل لحركة التحويلات بين المخازن"
        />

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المخزن المصدر</label>
              <select
                value={selectedFromWarehouse}
                onChange={(e) => setSelectedFromWarehouse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">جميع المخازن</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المخزن المستهدف</label>
              <select
                value={selectedToWarehouse}
                onChange={(e) => setSelectedToWarehouse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">جميع المخازن</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSelectedFromWarehouse('all');
                  setSelectedToWarehouse('all');
                }}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                إعادة تعيين
              </button>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalTransfers}</div>
            <div className="text-gray-600">إجمالي التحويلات</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalQuantity}</div>
            <div className="text-gray-600">إجمالي الكميات</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalValue.toFixed(2)}</div>
            <div className="text-gray-600">القيمة الإجمالية</div>
          </Card>
          <Card className="text-center">
            <div className="text-lg font-bold text-orange-600">{stats.mostTransferredProduct}</div>
            <div className="text-gray-600">المنتج الأكثر تحويلاً</div>
          </Card>
          <Card className="text-center">
            <div className="text-lg font-bold text-red-600">{stats.mostActiveWarehouse}</div>
            <div className="text-gray-600">المخزن الأكثر نشاطاً</div>
          </Card>
        </div>

        {/* Actions */}
        <Card className="mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={printReport}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              طباعة التقرير
            </button>
            <button
              onClick={exportToExcel}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              تصدير CSV
            </button>
          </div>
        </Card>

        {/* Report Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-900">التاريخ</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-900">المنتج</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-900">الكمية</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-900">السعر</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-900">القيمة</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-900">من</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-900">إلى</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-900">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      لا توجد بيانات للتحويلات
                    </td>
                  </tr>
                ) : (
                  reportData.map((transfer, index) => (
                    <tr key={transfer.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(transfer.date).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {transfer.productName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {transfer.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {transfer.productPrice?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {(transfer.quantity * transfer.productPrice)?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {transfer.fromWarehouseName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {transfer.toWarehouseName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {transfer.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default WarehouseTransfersReport;