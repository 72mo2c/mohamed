import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';

const ReturnsReport = () => {
  const { salesReturns, purchaseReturns, salesInvoices, purchaseInvoices, customers, suppliers, products } = useData();
  
  // States for filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'sales', 'purchases'
  
  // States for report data
  const [salesReturnData, setSalesReturnData] = useState([]);
  const [purchaseReturnData, setPurchaseReturnData] = useState([]);
  const [stats, setStats] = useState({
    salesReturns: {
      totalCount: 0,
      totalAmount: 0,
      totalRefund: 0,
      comparisonPercentage: 0
    },
    purchaseReturns: {
      totalCount: 0,
      totalAmount: 0,
      totalRefund: 0,
      comparisonPercentage: 0
    },
    combined: {
      totalReturns: 0,
      totalRefundAmount: 0
    }
  });

  useEffect(() => {
    generateReport();
  }, [salesReturns, purchaseReturns, startDate, endDate, selectedCustomer, selectedSupplier, activeTab]);

  const generateReport = () => {
    // Filter sales returns
    let salesData = salesReturns || [];
    let purchaseData = purchaseReturns || [];

    // Apply date filters
    if (startDate) {
      salesData = salesData.filter((ret) => new Date(ret.date) >= new Date(startDate));
      purchaseData = purchaseData.filter((ret) => new Date(ret.date) >= new Date(startDate));
    }

    if (endDate) {
      salesData = salesData.filter((ret) => new Date(ret.date) <= new Date(endDate));
      purchaseData = purchaseData.filter((ret) => new Date(ret.date) <= new Date(endDate));
    }

    // Apply customer/supplier filters
    if (selectedCustomer !== 'all') {
      salesData = salesData.filter((ret) => ret.customerId === selectedCustomer);
    }

    if (selectedSupplier !== 'all') {
      purchaseData = purchaseData.filter((ret) => ret.supplierId === selectedSupplier);
    }

    // Calculate sales statistics
    const salesTotalCount = salesData.length;
    const salesTotalAmount = salesData.reduce((sum, ret) => sum + (ret.total || 0), 0);
    const salesTotalRefund = salesData.reduce((sum, ret) => sum + (ret.refundAmount || 0), 0);

    // Calculate purchase statistics
    const purchaseTotalCount = purchaseData.length;
    const purchaseTotalAmount = purchaseData.reduce((sum, ret) => sum + (ret.total || 0), 0);
    const purchaseTotalRefund = purchaseData.reduce((sum, ret) => sum + (ret.refundAmount || 0), 0);

    // Calculate comparison percentages
    const totalSalesAmount = salesInvoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 1;
    const totalPurchaseAmount = purchaseInvoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 1;

    const salesComparisonPercentage = (salesTotalRefund / totalSalesAmount) * 100;
    const purchaseComparisonPercentage = (purchaseTotalRefund / totalPurchaseAmount) * 100;

    setSalesReturnData(salesData);
    setPurchaseReturnData(purchaseData);
    setStats({
      salesReturns: {
        totalCount: salesTotalCount,
        totalAmount: salesTotalAmount,
        totalRefund: salesTotalRefund,
        comparisonPercentage: salesComparisonPercentage
      },
      purchaseReturns: {
        totalCount: purchaseTotalCount,
        totalAmount: purchaseTotalAmount,
        totalRefund: purchaseTotalRefund,
        comparisonPercentage: purchaseComparisonPercentage
      },
      combined: {
        totalReturns: salesTotalCount + purchaseTotalCount,
        totalRefundAmount: salesTotalRefund + purchaseTotalRefund
      }
    });
  };

  const getCustomerName = (customerId) => {
    const customer = customers?.find((c) => c.id === customerId);
    return customer?.name || 'عميل غير مسجل';
  };

  const getSupplierName = (supplierId) => {
    const supplier = suppliers?.find((s) => s.id === supplierId);
    return supplier?.name || 'مورد غير مسجل';
  };

  const getProductName = (productId) => {
    const product = products?.find((p) => p.id === productId);
    return product?.name || 'منتج غير مسجل';
  };

  const getInvoiceNumber = (invoiceId, type) => {
    if (type === 'sales') {
      const invoice = salesInvoices?.find((inv) => inv.id === invoiceId);
      return invoice?.invoiceNumber || 'غير محدد';
    } else {
      const invoice = purchaseInvoices?.find((inv) => inv.id === invoiceId);
      return invoice?.invoiceNumber || 'غير محدد';
    }
  };

  const exportToCSV = () => {
    const csvData = [];
    
    // Sales returns header
    csvData.push(['تقرير مرتجعات المبيعات']);
    csvData.push(['التاريخ', 'رقم الفاتورة', 'العميل', 'المبلغ الإجمالي', 'المبلغ المسترد']);
    salesReturnData.forEach(ret => {
      csvData.push([
        ret.date || '',
        getInvoiceNumber(ret.invoiceId, 'sales'),
        getCustomerName(ret.customerId),
        ret.total || 0,
        ret.refundAmount || 0
      ]);
    });
    
    csvData.push([]);
    csvData.push(['تقرير مرتجعات المشتريات']);
    csvData.push(['التاريخ', 'رقم الفاتورة', 'المورد', 'المبلغ الإجمالي', 'المبلغ المسترد']);
    purchaseReturnData.forEach(ret => {
      csvData.push([
        ret.date || '',
        getInvoiceNumber(ret.invoiceId, 'purchases'),
        getSupplierName(ret.supplierId),
        ret.total || 0,
        ret.refundAmount || 0
      ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_المرتجعات_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCustomer('all');
    setSelectedSupplier('all');
    setActiveTab('all');
  };

  const filteredData = () => {
    if (activeTab === 'sales') return salesReturnData;
    if (activeTab === 'purchases') return purchaseReturnData;
    return { sales: salesReturnData, purchases: purchaseReturnData };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="تقرير المرتجعات الشامل" 
        subtitle="عرض وتحليل جميع مرتجعات المبيعات والمشتريات"
        actions={
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              تصدير CSV
            </button>
            <button
              onClick={printReport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors print:hidden"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              طباعة
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">مرتجعات المبيعات</p>
                <p className="text-3xl font-bold">{stats.salesReturns.totalCount}</p>
                <p className="text-green-100 text-xs mt-1">
                  {stats.salesReturns.comparisonPercentage.toFixed(2)}% من إجمالي المبيعات
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-green-400">
              <p className="text-green-100 text-sm">إجمالي المبلغ المسترد</p>
              <p className="text-xl font-bold">{stats.salesReturns.totalRefund.toLocaleString()} ريال</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">مرتجعات المشتريات</p>
                <p className="text-3xl font-bold">{stats.purchaseReturns.totalCount}</p>
                <p className="text-purple-100 text-xs mt-1">
                  {stats.purchaseReturns.comparisonPercentage.toFixed(2)}% من إجمالي المشتريات
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-purple-400">
              <p className="text-purple-100 text-sm">إجمالي المبلغ المسترد</p>
              <p className="text-xl font-bold">{stats.purchaseReturns.totalRefund.toLocaleString()} ريال</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">إجمالي المرتجعات</p>
                <p className="text-3xl font-bold">{stats.combined.totalReturns}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-orange-400">
              <p className="text-orange-100 text-sm">عدد الفترات المرتجعة</p>
              <p className="text-xl font-bold">إجمالي</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">إجمالي المبالغ المستردة</p>
                <p className="text-2xl font-bold">{stats.combined.totalRefundAmount.toLocaleString()} ريال</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-red-400">
              <p className="text-red-100 text-sm">من المبيعات والمشتريات</p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">الفلاتر</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">العميل</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">جميع العملاء</option>
                  {customers?.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المورد</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">جميع الموردين</option>
                  {suppliers?.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={resetFilters}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  إعادة تعيين
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'all', label: 'جميع المرتجعات', count: stats.combined.totalReturns },
                { id: 'sales', label: 'مرتجعات المبيعات', count: stats.salesReturns.totalCount },
                { id: 'purchases', label: 'مرتجعات المشتريات', count: stats.purchaseReturns.totalCount }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Sales Returns Table */}
            {activeTab === 'sales' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الفاتورة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ الإجمالي</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ المسترد</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السبب</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesReturnData.map((returnItem) => (
                      <tr key={returnItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(returnItem.date).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getInvoiceNumber(returnItem.invoiceId, 'sales')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getCustomerName(returnItem.customerId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {returnItem.total?.toLocaleString()} ريال
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {returnItem.refundAmount?.toLocaleString()} ريال
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {returnItem.reason || 'غير محدد'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {salesReturnData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد مرتجعات مبيعات في الفترة المحددة
                  </div>
                )}
              </div>
            )}

            {/* Purchase Returns Table */}
            {activeTab === 'purchases' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الفاتورة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المورد</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ الإجمالي</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ المسترد</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السبب</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchaseReturnData.map((returnItem) => (
                      <tr key={returnItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(returnItem.date).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getInvoiceNumber(returnItem.invoiceId, 'purchases')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getSupplierName(returnItem.supplierId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {returnItem.total?.toLocaleString()} ريال
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {returnItem.refundAmount?.toLocaleString()} ريال
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {returnItem.reason || 'غير محدد'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {purchaseReturnData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد مرتجعات مشتريات في الفترة المحددة
                  </div>
                )}
              </div>
            )}

            {/* All Returns Summary */}
            {activeTab === 'all' && (
              <div className="space-y-8">
                {/* Sales Returns Summary */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    مرتجعات المبيعات ({stats.salesReturns.totalCount})
                  </h4>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">عدد المرتجعات</p>
                        <p className="text-2xl font-bold text-green-600">{stats.salesReturns.totalCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">إجمالي المبلغ المسترد</p>
                        <p className="text-2xl font-bold text-green-600">{stats.salesReturns.totalRefund.toLocaleString()} ريال</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">النسبة من إجمالي المبيعات</p>
                        <p className="text-2xl font-bold text-green-600">{stats.salesReturns.comparisonPercentage.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchase Returns Summary */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    مرتجعات المشتريات ({stats.purchaseReturns.totalCount})
                  </h4>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">عدد المرتجعات</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.purchaseReturns.totalCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">إجمالي المبلغ المسترد</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.purchaseReturns.totalRefund.toLocaleString()} ريال</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">النسبة من إجمالي المشتريات</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.purchaseReturns.comparisonPercentage.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Combined Summary */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    إجمالي المرتجعات
                  </h4>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">إجمالي عدد المرتجعات</p>
                        <p className="text-3xl font-bold text-orange-600">{stats.combined.totalReturns}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">إجمالي المبالغ المستردة</p>
                        <p className="text-3xl font-bold text-orange-600">{stats.combined.totalRefundAmount.toLocaleString()} ريال</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnsReport;