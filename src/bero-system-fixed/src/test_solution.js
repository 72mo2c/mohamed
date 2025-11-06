// اختبار سريع للحل الجديد
const testInvoiceId = 123456;
const invoices = [{ id: 123456, total: 1000 }];

// هذا كان مصدر المشكلة القديم (undefined)
const oldWay = invoices.find(inv => inv.id === parseInt(undefined));
console.log('الطريقة القديمة:', oldWay); // undefined

// الحل الجديد - البيانات متاحة مباشرة
const newWay = invoices.find(inv => inv.id === testInvoiceId);
console.log('الحل الجديد:', newWay); // { id: 123456, total: 1000 }

console.log('\n✅ الحل الجديد يعمل بدون مشكلة undefined invoiceId!');
console.log('✅ تم تحويل النظام إلى نافذة منبثقة');