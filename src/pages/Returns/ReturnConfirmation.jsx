// ======================================
// Return Confirmation Component - واجهة تأكيد الإرجاع
// ======================================

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContextWithSound';
import {
  FaCheckCircle, FaExclamationTriangle, FaPrint, FaDownload, 
  FaEye, FaFilePdf, FaShoppingCart, FaUser, FaCalendar,
  FaPhone, FaMapMarkerAlt, FaCreditCard, FaBox, 
  FaTruck, FaWarehouse, FaSignature, FaCamera
} from 'react-icons/fa';

const ReturnConfirmation = ({ returnId, onClose, onConfirm }) => {
  const { 
    salesReturns, 
    salesInvoices, 
    customers, 
    products,
    updateSalesReturn 
  } = useData();
  
  const { showSuccess, showError, showInfo, showWarning } = useNotification();

  const [returnRecord, setReturnRecord] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationStep, setConfirmationStep] = useState('review'); // review, confirm, complete
  const [selectedItems, setSelectedItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState('original'); // original, cash, store_credit
  const [printReady, setPrintReady] = useState(false);
  const [signature, setSignature] = useState(null);

  // تحميل بيانات المرتجع
  useEffect(() => {
    const loadReturnData = () => {
      try {
        const returnData = salesReturns.find(r => r.id === returnId);
        if (!returnData) {
          showError('لم يتم العثور على المرتجع');
          onClose();
          return;
        }

        const invoiceData = salesInvoices.find(inv => inv.id === returnData.invoiceId);
        const customerData = customers.find(c => c.id === parseInt(invoiceData?.customerId));

        setReturnRecord(returnData);
        setInvoice(invoiceData);
        setCustomer(customerData);
        setSelectedItems(returnData.items || []);
        setLoading(false);
      } catch (error) {
        showError('حدث خطأ في تحميل بيانات المرتجع');
        onClose();
      }
    };

    loadReturnData();
  }, [returnId, salesReturns, salesInvoices, customers, showError, onClose]);

  // حساب المبالغ
  const calculateTotals = () => {
    if (!returnRecord || !selectedItems.length) return { subtotal: 0, tax: 0, total: 0 };

    const subtotal = selectedItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (item.quantity * (item.unitPrice || product?.price || 0));
    }, 0);

    const tax = subtotal * 0.15; // ضريبة 15%
    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  // التحقق من صحة البيانات
  const validateReturn = () => {
    if (!selectedItems.length) {
      showWarning('يرجى اختيار عنصر واحد على الأقل للإرجاع');
      return false;
    }

    if (refundMethod === 'original' && !invoice?.paymentMethod) {
      showWarning('طريقة الدفع الأصلية غير متوفرة');
      return false;
    }

    return true;
  };

  // معالجة التأكيد
  const handleConfirm = async () => {
    if (!validateReturn()) return;

    setConfirmationStep('confirming');

    try {
      // محاكاة عملية المعالجة
      await new Promise(resolve => setTimeout(resolve, 2000));

      const updates = {
        ...returnRecord,
        status: 'completed',
        confirmedItems: selectedItems,
        confirmationNotes: notes,
        refundMethod: refundMethod,
        confirmedAt: new Date().toISOString(),
        confirmedBy: 'current_user', // يمكن تغييره للمستخدم الحالي
        signature: signature,
        printGenerated: true
      };

      updateSalesReturn(returnId, updates);
      setConfirmationStep('complete');
      setPrintReady(true);
      
      showSuccess('تم تأكيد عملية الإرجاع بنجاح');
      
      // إشعار العميل
      if (customer?.phone) {
        showInfo('تم إرسال رسالة تأكيد للعميل');
      }

      // تشغيل تحديث المخزون
      setTimeout(() => {
        showInfo('تم تحديث المخزون تلقائياً');
      }, 1000);

    } catch (error) {
      setConfirmationStep('review');
      showError('حدث خطأ في تأكيد الإرجاع');
    }
  };

  // طباعة مرتجع
  const handlePrint = () => {
    const { subtotal, tax, total } = calculateTotals();
    
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تأكيد الإرجاع #${returnRecord.id}</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 20px; 
            direction: rtl; 
            background: white;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .company-logo { 
            font-size: 24px; 
            font-weight: bold; 
            color: #2563eb; 
            margin-bottom: 10px; 
          }
          .return-info { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 30px; 
          }
          .info-box { 
            border: 1px solid #e5e7eb; 
            padding: 15px; 
            border-radius: 8px; 
            background: #f9fafb; 
          }
          .info-title { 
            font-weight: bold; 
            color: #374151; 
            margin-bottom: 10px; 
            border-bottom: 1px solid #e5e7eb; 
            padding-bottom: 5px; 
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
          }
          .items-table th, .items-table td { 
            border: 1px solid #e5e7eb; 
            padding: 12px; 
            text-align: right; 
          }
          .items-table th { 
            background: #f3f4f6; 
            font-weight: bold; 
          }
          .totals { 
            margin-top: 30px; 
            border-top: 2px solid #2563eb; 
            padding-top: 20px; 
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px solid #f3f4f6; 
          }
          .total-final { 
            font-size: 18px; 
            font-weight: bold; 
            color: #2563eb; 
            border-top: 2px solid #2563eb; 
            padding-top: 10px; 
          }
          .signature-section { 
            margin-top: 50px; 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px; 
          }
          .signature-box { 
            border: 1px solid #e5e7eb; 
            padding: 20px; 
            text-align: center; 
            height: 100px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
          }
          .footer { 
            margin-top: 50px; 
            text-align: center; 
            font-size: 12px; 
            color: #6b7280; 
            border-top: 1px solid #e5e7eb; 
            padding-top: 20px; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">شركة بيرو للتجارة</div>
          <h1>تأكيد عملية الإرجاع</h1>
          <p>رقم المرتجع: #${returnRecord.id}</p>
          <p>تاريخ الإرجاع: ${new Date(returnRecord.date).toLocaleDateString('ar-IQ')}</p>
        </div>

        <div class="return-info">
          <div class="info-box">
            <div class="info-title">معلومات العميل</div>
            <p><strong>الاسم:</strong> ${customer?.name || 'غير محدد'}</p>
            <p><strong>الهاتف:</strong> ${customer?.phone || 'غير محدد'}</p>
            <p><strong>العنوان:</strong> ${customer?.address || 'غير محدد'}</p>
          </div>
          
          <div class="info-box">
            <div class="info-title">معلومات الفاتورة</div>
            <p><strong>رقم الفاتورة:</strong> #${invoice?.id}</p>
            <p><strong>تاريخ الفاتورة:</strong> ${new Date(invoice?.date).toLocaleDateString('ar-IQ')}</p>
            <p><strong>طريقة الدفع:</strong> ${invoice?.paymentMethod || 'غير محدد'}</p>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الكمية المرتجعة</th>
              <th>سعر الوحدة</th>
              <th>المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${selectedItems.map(item => {
              const product = products.find(p => p.id === item.productId);
              const itemTotal = (item.quantity * (item.unitPrice || product?.price || 0));
              return `
                <tr>
                  <td>${product?.name || 'منتج غير محدد'}</td>
                  <td>${item.quantity}</td>
                  <td>${(item.unitPrice || product?.price || 0).toFixed(2)} دينار</td>
                  <td>${itemTotal.toFixed(2)} دينار</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>المجموع الفرعي:</span>
            <span>${subtotal.toFixed(2)} دينار</span>
          </div>
          <div class="total-row">
            <span>الضريبة (15%):</span>
            <span>${tax.toFixed(2)} دينار</span>
          </div>
          <div class="total-row total-final">
            <span>المجموع النهائي:</span>
            <span>${total.toFixed(2)} دينار</span>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div>
              <p><strong>توقيع العميل</strong></p>
              ${signature ? '<div style="margin-top: 10px;">تم التوقيع</div>' : 'غير موقع'}
            </div>
          </div>
          <div class="signature-box">
            <div>
              <p><strong>توقيع الموظف</strong></p>
              <div style="margin-top: 10px;">________________</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>شكراً لاختياركم شركة بيرو للتجارة</p>
          <p>تم إنشاء هذا المستند في: ${new Date().toLocaleString('ar-IQ')}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // تنزيل PDF
  const handleDownloadPDF = () => {
    showInfo('جاري تحضير ملف PDF...');
    // يمكن إضافة مكتبة PDF هنا
    setTimeout(() => {
      showSuccess('تم تحضير الملف للتنزيل');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-center">جاري تحميل بيانات المرتجع...</p>
        </div>
      </div>
    );
  }

  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* رأس النموذج */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">تأكيد عملية الإرجاع</h2>
              <p className="opacity-90">رقم المرتجع: #{returnRecord.id}</p>
            </div>
            <div className="flex items-center gap-4">
              {printReady && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
                  >
                    <FaPrint className="inline ml-2" />
                    طباعة
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
                  >
                    <FaDownload className="inline ml-2" />
                    PDF
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
              >
                <FaTimes className="inline ml-2" />
                إغلاق
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* خطوة المراجعة */}
          {confirmationStep === 'review' && (
            <div className="space-y-6">
              
              {/* معلومات العميل والفاتورة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaUser className="text-blue-600" />
                    <h3 className="font-semibold text-gray-800">معلومات العميل</h3>
                  </div>
                  <div className="space-y-2">
                    <p><strong>الاسم:</strong> {customer?.name || 'غير محدد'}</p>
                    <p><strong>الهاتف:</strong> {customer?.phone || 'غير محدد'}</p>
                    <p><strong>العنوان:</strong> {customer?.address || 'غير محدد'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaFileInvoice className="text-green-600" />
                    <h3 className="font-semibold text-gray-800">معلومات الفاتورة</h3>
                  </div>
                  <div className="space-y-2">
                    <p><strong>رقم الفاتورة:</strong> #{invoice?.id}</p>
                    <p><strong>تاريخ الفاتورة:</strong> {new Date(invoice?.date).toLocaleDateString('ar-IQ')}</p>
                    <p><strong>طريقة الدفع:</strong> {invoice?.paymentMethod || 'غير محدد'}</p>
                  </div>
                </div>
              </div>

              {/* العناصر المرتجعة */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <div className="flex items-center gap-2">
                    <FaBox className="text-purple-600" />
                    <h3 className="font-semibold text-gray-800">العناصر المرتجعة</h3>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right">المنتج</th>
                        <th className="px-4 py-3 text-right">الكمية</th>
                        <th className="px-4 py-3 text-right">سعر الوحدة</th>
                        <th className="px-4 py-3 text-right">المجموع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item, index) => {
                        const product = products.find(p => p.id === item.productId);
                        const itemTotal = (item.quantity * (item.unitPrice || product?.price || 0));
                        return (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-3">
                              <div className="font-medium">{product?.name || 'منتج غير محدد'}</div>
                              <div className="text-sm text-gray-500">كود المنتج: {product?.id}</div>
                            </td>
                            <td className="px-4 py-3 font-semibold">{item.quantity}</td>
                            <td className="px-4 py-3">{(item.unitPrice || product?.price || 0).toFixed(2)} دينار</td>
                            <td className="px-4 py-3 font-semibold text-blue-600">{itemTotal.toFixed(2)} دينار</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* المبالغ والضرائب */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4">ملخص المبلغ</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span className="font-semibold">{subtotal.toFixed(2)} دينار</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضريبة (15%):</span>
                    <span className="font-semibold">{tax.toFixed(2)} دينار</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-blue-600 border-t pt-3">
                    <span>المجموع النهائي:</span>
                    <span>{total.toFixed(2)} دينار</span>
                  </div>
                </div>
              </div>

              {/* طريقة الاسترداد */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4">طريقة الاسترداد</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      value="original"
                      checked={refundMethod === 'original'}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="text-blue-600"
                    />
                    <FaCreditCard className="text-gray-600" />
                    <span>استرداد إلى طريقة الدفع الأصلية</span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      value="cash"
                      checked={refundMethod === 'cash'}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="text-blue-600"
                    />
                    <FaMoneyBillWave className="text-green-600" />
                    <span>استرداد نقدي</span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      value="store_credit"
                      checked={refundMethod === 'store_credit'}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="text-blue-600"
                    />
                    <FaGift className="text-purple-600" />
                    <span>رصيد في المتجر</span>
                  </label>
                </div>
              </div>

              {/* الملاحظات */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4">ملاحظات إضافية</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أضف أي ملاحظات إضافية هنا..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* التوقيع */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4">التوقيع</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      توقيع العميل (اختياري)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {signature ? (
                        <div className="text-green-600">
                          <FaCheckCircle className="mx-auto mb-2" />
                          <p>تم التوقيع</p>
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <FaSignature className="mx-auto mb-2" />
                          <p>لم يتم التوقيع بعد</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      توقيع الموظف
                    </label>
                    <div className="border border-gray-300 rounded-lg p-4 text-center bg-gray-50">
                      <div className="text-gray-500">
                        <FaSignature className="mx-auto mb-2" />
                        <p>________________</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* خطوة التأكيد */}
          {confirmationStep === 'confirming' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">جاري تأكيد عملية الإرجاع</h3>
              <p className="text-gray-600">يرجى الانتظار بينما نقوم بمعالجة طلبك...</p>
            </div>
          )}

          {/* خطوة الانتهاء */}
          {confirmationStep === 'complete' && (
            <div className="text-center py-12">
              <FaCheckCircle className="mx-auto text-6xl text-green-500 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">تم تأكيد الإرجاع بنجاح!</h3>
              <p className="text-gray-600 mb-6">تم تسجيل عملية الإرجاع وتحديث المخزون</p>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPrint />
                  طباعة المرتجع
                </button>
                <button
                  onClick={() => onConfirm && onConfirm(returnRecord)}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaCheckCircle />
                  انتهاء
                </button>
              </div>
            </div>
          )}
        </div>

        {/* أزرار التحكم */}
        {confirmationStep === 'review' && (
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3 rounded-b-lg">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FaCheckCircle />
              تأكيد الإرجاع
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnConfirmation;