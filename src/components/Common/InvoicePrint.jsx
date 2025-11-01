// ======================================
// Invoice Print Component - مكون طباعة الفاتورة
// ======================================

import React from 'react';
import { FaPrint, FaTimes } from 'react-icons/fa';
import './InvoicePrint.css';

const InvoicePrint = ({ invoiceData, type = 'purchase', onClose }) => {
  const { formData, items, total, subtotal, discountAmount, suppliers, customers, products, warehouses, paymentTypes } = invoiceData;
  
  // معلومات الشركة
  const companyInfo = {
    name: 'Bero System',
    address: 'القاهرة - مصر',
    phone: '+20 123 456 789',
    email: 'info@berosystem.com'
  };

  // إيجاد اسم المورد أو العميل
  const partnerName = type === 'purchase'
    ? suppliers.find(s => s.id === parseInt(formData.supplierId))?.name || '-'
    : customers.find(c => c.id === parseInt(formData.customerId))?.name || '-';

  const paymentTypeLabel = paymentTypes.find(p => p.value === formData.paymentType)?.label || '-';

  // حساب المعلومات المالية المتقدمة
  const calculateFinancialInfo = () => {
    const invoiceTotal = total || 0;
    const subtotalAmount = subtotal || invoiceTotal;
    const taxRate = 0.14; // 14% ضريبة القيمة المضافة
    const taxAmount = subtotalAmount * taxRate;
    
    let amountPaid = 0;
    let remainingAmount = invoiceTotal;
    
    switch (formData.paymentType) {
      case 'cash':
        amountPaid = invoiceTotal;
        remainingAmount = 0;
        break;
      case 'deferred':
        amountPaid = 0;
        remainingAmount = invoiceTotal;
        break;
      case 'partial':
        // في حالة الدفع الجزئي، نعرض المبلغ كغير محدد
        amountPaid = null;
        remainingAmount = null;
        break;
      default:
        amountPaid = invoiceTotal;
        remainingAmount = 0;
    }
    
    return {
      amountPaid,
      remainingAmount,
      taxAmount,
      taxRate: taxRate * 100
    };
  };

  const financialInfo = calculateFinancialInfo();

  // رقم الفاتورة (timestamp)
  const invoiceNumber = Date.now();

  // طباعة فورية
  const handleQuickPrint = () => {
    window.print();
  };

  return (
    <div className="print-overlay">
      <div className="print-modal">
        {/* أزرار التحكم */}
        <div className="print-controls no-print">
          <button onClick={handleQuickPrint} className="btn-print">
            <FaPrint /> طباعة
          </button>
          <button onClick={onClose} className="btn-close">
            <FaTimes /> إغلاق
          </button>
        </div>

        {/* محتوى الفاتورة */}
        <div className="invoice-container">
          {/* رأس الفاتورة */}
          <div className="invoice-header">
            <div className="company-info">
              <h1>{companyInfo.name}</h1>
              <p>{companyInfo.address}</p>
              <p>هاتف: {companyInfo.phone}</p>
              <p>بريد: {companyInfo.email}</p>
            </div>
            <div className="invoice-title">
              <h2>{type === 'purchase' ? 'فاتورة مشتريات' : 'فاتورة مبيعات'}</h2>
              <div className="invoice-number">رقم: {invoiceNumber}</div>
            </div>
          </div>

          {/* معلومات الفاتورة */}
          <div className="invoice-info">
            <div className="info-row">
              <span className="label">{type === 'purchase' ? 'المورد:' : 'العميل:'}</span>
              <span className="value">{partnerName}</span>
            </div>
            <div className="info-row">
              <span className="label">التاريخ:</span>
              <span className="value">{new Date(formData.date).toLocaleDateString('ar-EG')}</span>
            </div>
            <div className="info-row">
              <span className="label">الوقت:</span>
              <span className="value">{new Date(formData.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="info-row">
              <span className="label">نوع الدفع:</span>
              <span className="value">{paymentTypeLabel}</span>
            </div>
            {formData.notes && (
              <div className="info-row full-width">
                <span className="label">ملاحظات:</span>
                <span className="value">{formData.notes}</span>
              </div>
            )}
          </div>

          {/* جدول المنتجات */}
          <table className="invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>المنتج</th>
                <th>المخزن</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const product = products.find(p => p.id === parseInt(item.productId));
                const warehouse = warehouses.find(w => w.id === product?.warehouseId);
                const lineTotal = item.quantity * item.price;
                
                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{product?.name || '-'}</td>
                    <td>{warehouse?.name || '-'}</td>
                    <td>{item.quantity}</td>
                    <td>{parseFloat(item.price).toFixed(2)}</td>
                    <td>{lineTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* المجموع */}
          <div className="invoice-totals">
            <div className="totals-row">
              <span>المجموع الفرعي:</span>
              <span>{(subtotal || total).toFixed(2)} ج.م</span>
            </div>
            
            {/* معلومات الضرائب */}
            <div className="totals-row">
              <span>ضريبة القيمة المضافة ({financialInfo.taxRate}%):</span>
              <span>{financialInfo.taxAmount.toFixed(2)} ج.م</span>
            </div>

            {/* الخصم */}
            {discountAmount > 0 && (
              <div className="totals-row discount-row">
                <span>الخصم:</span>
                <span>-{discountAmount.toFixed(2)} ج.م</span>
              </div>
            )}

            {/* المبلغ المدفوع والمتبقي */}
            <div className="totals-row payment-info">
              <div className="payment-breakdown">
                <div className="payment-row">
                  <span>المبلغ المدفوع:</span>
                  <span className="amount-paid">
                    {financialInfo.amountPaid === null ? 'غير محدد' : `${(financialInfo.amountPaid || 0).toFixed(2)} ج.م`}
                  </span>
                </div>
                <div className="payment-row">
                  <span>المبلغ المتبقي:</span>
                  <span className="amount-remaining">
                    {financialInfo.remainingAmount === null ? 'غير محدد' : `${(financialInfo.remainingAmount || 0).toFixed(2)} ج.م`}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="totals-row total-row">
              <span>الإجمالي النهائي:</span>
              <span>{total.toFixed(2)} ج.م</span>
            </div>
          </div>

          {/* تذييل الفاتورة */}
          <div className="invoice-footer">
            <p>شكراً لتعاملكم معنا</p>
            <p className="footer-note">فاتورة رسمية من نظام Bero</p>
            <p className="print-date">طباعة: {new Date().toLocaleString('ar-EG')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrint;
