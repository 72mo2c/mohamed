// ======================================
// Sales Invoices List - سجل فواتير المبيعات
// ======================================

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../../components/Common/Card';
import Table from '../../components/Common/Table';
import Input from '../../components/Common/Input';
import { FaList, FaSearch, FaPrint } from 'react-icons/fa';
import { printInvoiceDirectly } from '../../utils/printUtils';

const SalesInvoices = () => {
  const { salesInvoices, customers, products, warehouses } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  // تصفية الفواتير
  const filteredInvoices = salesInvoices.filter(invoice => {
    const customer = customers.find(c => c.id === parseInt(invoice.customerId));
    const customerName = customer ? customer.name : '';
    return customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           invoice.id.toString().includes(searchQuery);
  });

  const columns = [
    {
      header: 'رقم الفاتورة',
      accessor: 'id',
      render: (row) => `#${row.id}`
    },
    {
      header: 'العميل',
      accessor: 'customerId',
      render: (row) => {
        const customer = customers.find(c => c.id === parseInt(row.customerId));
        return customer ? customer.name : '-';
      }
    },
    {
      header: 'التاريخ',
      accessor: 'date',
      render: (row) => new Date(row.date).toLocaleDateString('ar-EG')
    },
    {
      header: 'نوع الدفع',
      accessor: 'paymentType',
      render: (row) => {
        const types = {
          'cash': 'نقدي',
          'deferred': 'آجل',
          'partial': 'جزئي'
        };
        return types[row.paymentType] || row.paymentType;
      }
    },
    {
      header: 'المجموع',
      accessor: 'total',
      render: (row) => `${(row.total || 0).toFixed(2)} د.ع`
    },
    {
      header: 'الحالة',
      accessor: 'status',
      render: (row) => (
        <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs">
          مكتملة
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: 'actions',
      render: (row) => (
        <button
          onClick={() => {
            const invoiceData = {
              formData: row,
              items: row.items || [],
              total: row.total || 0,
              suppliers: [],
              customers,
              products,
              warehouses,
              paymentTypes: [
                { value: 'cash', label: 'نقدي' },
                { value: 'deferred', label: 'آجل' },
                { value: 'partial', label: 'جزئي' }
              ],
              type: 'sales'
            };
            printInvoiceDirectly(invoiceData, 'sales');
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition-colors"
          title="طباعة فورية"
        >
          <FaPrint /> طباعة
        </button>
      )
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">سجل فواتير المبيعات</h1>

      <Card icon={<FaList />}>
        <div className="mb-6">
          <Input
            label="بحث"
            name="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم العميل أو رقم الفاتورة..."
            icon={<FaSearch />}
          />
        </div>

        <Table
          columns={columns}
          data={filteredInvoices}
        />
      </Card>
    </div>
  );
};

export default SalesInvoices;