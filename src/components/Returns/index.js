/**
 * ملف تصدير مكونات نظام الإرجاع
 * مركز تصدير جميع المكونات المتعلقة بإدارة الإرجاع
 */

export { default as InvoiceReturnManager } from './InvoiceReturnManager';
export { useInvoiceReturnManager } from './InvoiceReturnManager';

export { default as ReturnWorkflow } from './ReturnWorkflow';

export { default as ReturnValidator } from './ReturnValidator';
export { useReturnValidator, ValidationResults } from './ReturnValidator';

/**
 * أمثلة على الاستخدام
 * 
 * // استخدام محرك إدارة الإرجاع
 * import { useInvoiceReturnManager } from './Returns';
 * 
 * const MyComponent = () => {
 *   const { state, loadInvoice, selectProduct } = useInvoiceReturnManager();
 *   // ... باقي الكود
 * };
 * 
 * // استخدام مكون مسار العمل
 * import { ReturnWorkflow } from './Returns';
 * 
 * const ReturnPage = () => {
 *   return (
 *     <ReturnWorkflow 
 *       onComplete={(result) => console.log('Return completed:', result)}
 *       onCancel={() => console.log('Return cancelled')}
 *       initialData={{ invoiceNumber: 'INV-001' }}
 *     />
 *   );
 * };
 * 
 * // استخدام نظام التحقق
 * import { useReturnValidator, ValidationResults } from './Returns';
 * 
 * const MyValidationComponent = () => {
 *   const { validateData, validationResult } = useReturnValidator();
 *   
 *   const handleValidation = async () => {
 *     const result = await validateData(data, 'my-context');
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={handleValidation}>Validate</button>
 *       <ValidationResults result={validationResult} />
 *     </div>
 *   );
 * };
 */