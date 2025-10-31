import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';
import './print-styles.css';

const AccountStatementReport = () => {
  const { 
    cashReceipts, 
    cashDisbursements, 
    salesInvoices, 
    purchaseInvoices, 
    customers, 
    suppliers,
    warehouses,
    getAllCustomerBalances,
    getAllSupplierBalances
  } = useData();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accountType, setAccountType] = useState('all'); // all, customer, supplier, general
  const [selectedAccount, setSelectedAccount] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [reportData, setReportData] = useState([]);
  const [stats, setStats] = useState({
    totalDebit: 0,
    totalCredit: 0,
    transactionCount: 0,
    finalBalance: 0,
    beginningBalance: 0,
    endingBalance: 0
  });
  const [accounts, setAccounts] = useState([]);

  // تجميع الحسابات
  useEffect(() => {
    const allAccounts = [];
    
    if (accountType === 'all' || accountType === 'customer') {
      customers.forEach(customer => {
        allAccounts.push({
          id: customer.id,
          name: customer.name,
          type: 'customer',
          balance: customer.balance || 0
        });
      });
    }
    
    if (accountType === 'all' || accountType === 'supplier') {
      suppliers.forEach(supplier => {
        allAccounts.push({
          id: supplier.id,
          name: supplier.name,
          type: 'supplier',
          balance: supplier.balance || 0
        });
      });
    }
    
    if (accountType === 'general') {
      allAccounts.push(
        {
          id: 'cash',
          name: 'النقدية',
          type: 'general',
          balance: 0
        },
        {
          id: 'bank',
          name: 'البنك',
          type: 'general',
          balance: 0
        }
      );
    }
    
    setAccounts(allAccounts);
  }, [accountType, customers, suppliers]);

  // إنتاج التقرير
  useEffect(() => {
    generateReport();
  }, [startDate, endDate, accountType, selectedAccount, warehouseFilter, cashReceipts, cashDisbursements, salesInvoices, purchaseInvoices]);

  const generateReport = () => {
    let transactions = [];
    let totalDebit = 0;
    let totalCredit = 0;
    
    // تجميع حركة النقدية (مقبوضات ومدفوعات)
    let cashTransactions = [];
    
    if (warehouseFilter === 'all') {
      cashTransactions = [
        ...cashReceipts.map(receipt => ({
          id: receipt.id,
          date: receipt.date,
          type: 'credit',
          amount: receipt.amount || 0,
          description: receipt.description || 'مقبوض',
          reference: receipt.reference || 'إيصال مقبوض',
          accountType: 'cash',
          accountName: 'النقدية',
          warehouseId: receipt.warehouseId || 'main'
        })),
        ...cashDisbursements.map(disbursement => ({
          id: disbursement.id,
          date: disbursement.date,
          type: 'debit',
          amount: disbursement.amount || 0,
          description: disbursement.description || 'مدفوع',
          reference: disbursement.reference || 'إيصال صرف',
          accountType: 'cash',
          accountName: 'النقدية',
          warehouseId: disbursement.warehouseId || 'main'
        }))
      ];
    } else {
      cashTransactions = [
        ...cashReceipts
          .filter(r => r.warehouseId === warehouseFilter)
          .map(receipt => ({
            id: receipt.id,
            date: receipt.date,
            type: 'credit',
            amount: receipt.amount || 0,
            description: receipt.description || 'مقبوض',
            reference: receipt.reference || 'إيصال مقبوض',
            accountType: 'cash',
            accountName: 'النقدية',
            warehouseId: receipt.warehouseId
          })),
        ...cashDisbursements
          .filter(d => d.warehouseId === warehouseFilter)
          .map(disbursement => ({
            id: disbursement.id,
            date: disbursement.date,
            type: 'debit',
            amount: disbursement.amount || 0,
            description: disbursement.description || 'مدفوع',
            reference: disbursement.reference || 'إيصال صرف',
            accountType: 'cash',
            accountName: 'النقدية',
            warehouseId: disbursement.warehouseId
          }))
      ];
    }
    
    transactions = [...cashTransactions];
    
    // تجميع فواتير المبيعات
    let salesTransactions = [];
    if (warehouseFilter === 'all') {
      salesTransactions = salesInvoices.map(invoice => ({
        id: invoice.id,
        date: invoice.date,
        type: 'debit',
        amount: invoice.total || 0,
        description: `بيع للعميل: ${getCustomerName(invoice.customerId)}`,
        reference: `فاتورة مبيعات رقم: ${invoice.invoiceNumber}`,
        accountType: 'customer',
        accountId: invoice.customerId,
        accountName: getCustomerName(invoice.customerId),
        warehouseId: invoice.warehouseId || 'main'
      }));
    } else {
      salesTransactions = salesInvoices
        .filter(inv => inv.warehouseId === warehouseFilter)
        .map(invoice => ({
          id: invoice.id,
          date: invoice.date,
          type: 'debit',
          amount: invoice.total || 0,
          description: `بيع للعميل: ${getCustomerName(invoice.customerId)}`,
          reference: `فاتورة مبيعات رقم: ${invoice.invoiceNumber}`,
          accountType: 'customer',
          accountId: invoice.customerId,
          accountName: getCustomerName(invoice.customerId),
          warehouseId: invoice.warehouseId
        }));
    }
    
    transactions = [...transactions, ...salesTransactions];
    
    // تجميع فواتير المشتريات
    let purchaseTransactions = [];
    if (warehouseFilter === 'all') {
      purchaseTransactions = purchaseInvoices.map(invoice => ({
        id: invoice.id,
        date: invoice.date,
        type: 'credit',
        amount: invoice.total || 0,
        description: `شراء من المورد: ${getSupplierName(invoice.supplierId)}`,
        reference: `فاتورة مشتريات رقم: ${invoice.invoiceNumber}`,
        accountType: 'supplier',
        accountId: invoice.supplierId,
        accountName: getSupplierName(invoice.supplierId),
        warehouseId: invoice.warehouseId || 'main'
      }));
    } else {
      purchaseTransactions = purchaseInvoices
        .filter(inv => inv.warehouseId === warehouseFilter)
        .map(invoice => ({
          id: invoice.id,
          date: invoice.date,
          type: 'credit',
          amount: invoice.total || 0,
          description: `شراء من المورد: ${getSupplierName(invoice.supplierId)}`,
          reference: `فاتورة مشتريات رقم: ${invoice.invoiceNumber}`,
          accountType: 'supplier',
          accountId: invoice.supplierId,
          accountName: getSupplierName(invoice.supplierId),
          warehouseId: invoice.warehouseId
        }));
    }
    
    transactions = [...transactions, ...purchaseTransactions];
    
    // تطبيق الفلاتر
    if (startDate) {
      transactions = transactions.filter(trans => new Date(trans.date) >= new Date(startDate));
    }
    
    if (endDate) {
      transactions = transactions.filter(trans => new Date(trans.date) <= new Date(endDate));
    }
    
    if (selectedAccount && selectedAccount !== 'all') {
      const [type, id] = selectedAccount.split('_');
      transactions = transactions.filter(trans => 
        trans.accountId === id || (type === 'general' && trans.accountType === type)
      );
    }
    
    // حساب الإحصائيات
    totalDebit = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    totalCredit = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    
    // ترتيب البيانات حسب التاريخ
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // حساب الرصيد التراكمي
    let cumulativeBalance = 0;
    const transactionsWithBalance = transactions.map((trans, index) => {
      if (trans.type === 'debit') {
        cumulativeBalance += trans.amount;
      } else {
        cumulativeBalance -= trans.amount;
      }
      
      return {
        ...trans,
        balance: cumulativeBalance,
        serial: transactions.length - index
      };
    });
    
    setReportData(transactionsWithBalance);
    setStats({
      totalDebit,
      totalCredit,
      transactionCount: transactions.length,
      finalBalance: cumulativeBalance,
      beginningBalance: 0,
      endingBalance: cumulativeBalance
    });
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'عميل غير محدد';
  };

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'مورد غير محدد';
  };

  const getWarehouseName = (warehouseId) => {
    if (warehouseId === 'main' || !warehouseId) return 'المخزن الرئيسي';
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'مخزن غير محدد';
  };

  const printReport = () => {
    window.print();
  };

  const exportToExcel = () => {
    const headers = [
      'الرقم',
      'التاريخ',
      'نوع الحساب',
      'اسم الحساب',
      'البيان',
      'مرجع',
      'مدين',
      'دائن',
      'الرصيد',
      'المخزن'
    ];
    
    const csvData = reportData.map((trans) => [
      trans.serial,
      new Date(trans.date).toLocaleDateString('ar-EG'),
      trans.accountType === 'customer' ? 'عميل' : 
      trans.accountType === 'supplier' ? 'مورد' : 'عام',
      trans.accountName || '-',
      trans.description || '-',
      trans.reference || '-',
      trans.type === 'debit' ? trans.amount.toFixed(2) : '0.00',
      trans.type === 'credit' ? trans.amount.toFixed(2) : '0.00',
      trans.balance.toFixed(2),
      getWarehouseName(trans.warehouseId)
    ]);

    let csv = headers.join(',') + '\n';
    csvData.forEach((row) => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `account_statement_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="تقرير كشف الحساب"
        subtitle="كشف حساب شامل يربط بين المبيعات والمصروفات والدفعات"
        icon={
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="text-center">
            <p className="text-sm opacity-90">إجمالي المدين</p>
            <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalDebit)} ج.م</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="text-center">
            <p className="text-sm opacity-90">إجمالي الدائن</p>
            <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalCredit)} ج.م</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="text-center">
            <p className="text-sm opacity-90">عدد العمليات</p>
            <p className="text-2xl font-bold mt-2">{stats.transactionCount}</p>
          </div>
        </Card>
        <Card className={`bg-gradient-to-r ${stats.finalBalance >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} text-white`}>
          <div className="text-center">
            <p className="text-sm opacity-90">الرصيد النهائي</p>
            <p className="text-2xl font-bold mt-2">{formatCurrency(Math.abs(stats.finalBalance))} {stats.finalBalance >= 0 ? 'مدين' : 'دائن'}</p>
          </div>
        </Card>
      </div>

      {/* الفلاتر */}
      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع الحساب
            </label>
            <select
              value={accountType}
              onChange={(e) => {
                setAccountType(e.target.value);
                setSelectedAccount('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الحسابات</option>
              <option value="customer">عملاء</option>
              <option value="supplier">موردين</option>
              <option value="general">حسابات عامة</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختيار حساب
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع الحسابات</option>
              {accounts.map(account => (
                <option key={`${account.type}_${account.id}`} value={`${account.type}_${account.id}`}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المخزن
            </label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع المخازن</option>
              <option value="main">المخزن الرئيسي</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              من تاريخ
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              إلى تاريخ
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* جدول التقرير */}
      <Card className="mt-6 overflow-x-auto printable">
        <table className="min-w-full divide-y divide-gray-200 print-table">
          <thead className="bg-gray-50 print-header">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الرقم
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                التاريخ
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                نوع الحساب
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                اسم الحساب
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                البيان
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                مرجع
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                مدين
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                دائن
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الرصيد
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المخزن
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.map((trans, idx) => (
              <tr key={`${trans.id}-${idx}`} className="hover:bg-gray-50 no-page-break">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {trans.serial}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(trans.date).toLocaleDateString('ar-EG')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    trans.accountType === 'customer' ? 'bg-blue-100 text-blue-800' :
                    trans.accountType === 'supplier' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {trans.accountType === 'customer' ? 'عميل' : 
                     trans.accountType === 'supplier' ? 'مورد' : 'عام'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {trans.accountName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {trans.description}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {trans.reference}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                  trans.type === 'debit' ? 'text-red-600' : 'text-gray-400'
                }`}>
                  {trans.type === 'debit' ? formatCurrency(trans.amount) : '-'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                  trans.type === 'credit' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {trans.type === 'credit' ? formatCurrency(trans.amount) : '-'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                  trans.balance >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(Math.abs(trans.balance))} {trans.balance >= 0 ? 'مدين' : 'دائن'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {getWarehouseName(trans.warehouseId)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {reportData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            لا توجد بيانات لعرضها
          </div>
        )}
        
        {/* Footer للطباعة */}
        <div className="print-footer no-print">
          <span>تقرير كشف الحساب</span>
          <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</span>
        </div>
      </Card>

      {/* ملخص التوازن */}
      {reportData.length > 0 && (
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">ملخص الرصيد</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">رصيد بداية الفترة</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(stats.beginningBalance)} ج.م</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">صافي الحركة</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(stats.totalDebit - stats.totalCredit)} ج.م
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">رصيد نهاية الفترة</p>
              <p className={`text-xl font-bold ${stats.finalBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(stats.finalBalance))} ج.م {stats.finalBalance >= 0 ? '(مدين)' : '(دائن)'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AccountStatementReport;