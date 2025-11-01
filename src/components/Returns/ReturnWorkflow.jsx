import React, { useState, useEffect, useCallback } from 'react';
import { useInvoiceReturnManager } from './InvoiceReturnManager';
import { toast } from 'react-hot-toast';
import Loading from '../Common/Loading';

/**
 * مكون مسار عمل الإرجاع المتقدم
 * واجهة مستخدم شاملة لإدارة عمليات إرجاع الفواتير
 */
const ReturnWorkflow = ({ onComplete, onCancel, initialData = null }) => {
  const {
    state,
    loadInvoice,
    selectProduct,
    removeProduct,
    updateReturnDetails,
    nextStep,
    previousStep,
    goToStep,
    completeReturn,
    getReturnSummary
  } = useInvoiceReturnManager();

  const [localState, setLocalState] = useState({
    searchValue: '',
    selectedProducts: new Set(),
    draftNotes: ''
  });

  const [isCompleting, setIsCompleting] = useState(false);

  // تحميل البيانات الأولية
  useEffect(() => {
    if (initialData?.invoiceNumber) {
      handleLoadInvoice(initialData.invoiceNumber);
    }
  }, [initialData]);

  /**
   * معالجة تحميل الفاتورة
   */
  const handleLoadInvoice = async (invoiceNumber) => {
    try {
      await loadInvoice(invoiceNumber);
      toast.success('تم تحميل الفاتورة بنجاح');
    } catch (error) {
      toast.error('فشل في تحميل الفاتورة');
    }
  };

  /**
   * معالجة اختيار المنتج
   */
  const handleProductSelection = (product, quantity = 1) => {
    selectProduct(product.id, quantity);
    setLocalState(prev => ({
      ...prev,
      selectedProducts: new Set([...prev.selectedProducts, product.id])
    }));
  };

  /**
   * معالجة إزالة المنتج
   */
  const handleRemoveProduct = (productId) => {
    removeProduct(productId);
    setLocalState(prev => ({
      ...prev,
      selectedProducts: new Set([...prev.selectedProducts].filter(id => id !== productId))
    }));
  };

  /**
   * معالجة تحديث تفاصيل الإرجاع
   */
  const handleUpdateDetails = (field, value) => {
    updateReturnDetails({ [field]: value });
    setLocalState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * معالجة الانتقال للخطوة التالية
   */
  const handleNextStep = async () => {
    const success = nextStep();
    if (success) {
      toast.success(`تمت الانتقال للخطوة ${state.currentStep + 1}`);
    }
  };

  /**
   * معالجة العودة للخطوة السابقة
   */
  const handlePreviousStep = () => {
    previousStep();
    toast.info(`تم العودة للخطوة ${state.currentStep - 1}`);
  };

  /**
   * معالجة إكمال عملية الإرجاع
   */
  const handleCompleteReturn = async () => {
    try {
      setIsCompleting(true);
      const result = await completeReturn();
      
      toast.success(result.message);
      
      // استدعاء callback الإكمال
      if (onComplete) {
        onComplete(result);
      }

    } catch (error) {
      toast.error('فشل في إكمال عملية الإرجاع');
    } finally {
      setIsCompleting(false);
    }
  };

  /**
   * معالجة إلغاء العملية
   */
  const handleCancel = () => {
    if (window.confirm('هل أنت متأكد من إلغاء عملية الإرجاع؟ سيتم فقدان جميع البيانات غير المحفوظة.')) {
      if (onCancel) {
        onCancel();
      }
    }
  };

  // مكونات الخطوات
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div 
            className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer
              transition-all duration-300 hover:scale-110
              ${step <= state.currentStep 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'bg-gray-100 border-gray-300 text-gray-400'
              }
              ${step === state.currentStep ? 'ring-4 ring-green-200' : ''}
            `}
            onClick={() => goToStep(step)}
          >
            {step < state.currentStep ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              step
            )}
          </div>
          {step < 4 && (
            <div className={`w-16 h-1 mx-2 ${step < state.currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderInvoiceSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">اختيار الفاتورة</h2>
        <p className="text-gray-600">أدخل رقم الفاتورة التي تريد إرجاع منتجاتها</p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="flex gap-2">
          <input
            type="text"
            value={localState.searchValue}
            onChange={(e) => setLocalState(prev => ({ ...prev, searchValue: e.target.value }))}
            placeholder="رقم الفاتورة"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleLoadInvoice(localState.searchValue)}
          />
          <button
            onClick={() => handleLoadInvoice(localState.searchValue)}
            disabled={!localState.searchValue.trim() || state.loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {state.loading ? 'جاري التحميل...' : 'تحميل'}
          </button>
        </div>
      </div>

      {state.invoiceData && (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">بيانات الفاتورة</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">رقم الفاتورة:</span>
              <span className="ml-2">{state.invoiceData.number}</span>
            </div>
            <div>
              <span className="font-medium">التاريخ:</span>
              <span className="ml-2">{state.invoiceData.date}</span>
            </div>
            <div>
              <span className="font-medium">العميل:</span>
              <span className="ml-2">{state.invoiceData.customer.name}</span>
            </div>
            <div>
              <span className="font-medium">المبلغ الإجمالي:</span>
              <span className="ml-2 text-green-600 font-semibold">{state.invoiceData.total} ريال</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderProductSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">اختيار المنتجات</h2>
        <p className="text-gray-600">اختر المنتجات التي تريد إرجاعها من الفاتورة</p>
      </div>

      {state.invoiceData && (
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-4">
            {state.invoiceData.products.map((product) => {
              const selectedProduct = state.selectedProducts.find(p => p.id === product.id);
              const isSelected = !!selectedProduct;

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-lg shadow-md border-2 transition-all duration-300 ${
                    isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                        <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">الكمية الأصلية:</span>
                            <span className="ml-2">{product.quantity}</span>
                          </div>
                          <div>
                            <span className="font-medium">السعر:</span>
                            <span className="ml-2">{product.price} ريال</span>
                          </div>
                          <div>
                            <span className="font-medium">المجموع:</span>
                            <span className="ml-2">{product.total} ريال</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {!isSelected ? (
                          <button
                            onClick={() => handleProductSelection(product, 1)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            إضافة للإرجاع
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const newQty = Math.max(1, selectedProduct.returnQuantity - 1);
                                handleProductSelection(product, newQty);
                              }}
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium">{selectedProduct.returnQuantity}</span>
                            <button
                              onClick={() => {
                                const newQty = Math.min(product.quantity, selectedProduct.returnQuantity + 1);
                                handleProductSelection(product, newQty);
                              }}
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleRemoveProduct(product.id)}
                              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              إزالة
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-4 p-4 bg-green-100 rounded-lg border border-green-200">
                        <div className="text-sm text-green-800">
                          <span className="font-medium">مبلغ الإرجاع: </span>
                          <span className="text-lg font-bold">{selectedProduct.returnTotal} ريال</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {state.selectedProducts.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">ملخص المنتجات المختارة</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>عدد المنتجات:</span>
                  <span className="font-semibold">{state.selectedProducts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>الكمية الإجمالية:</span>
                  <span className="font-semibold">
                    {state.selectedProducts.reduce((sum, p) => sum + p.returnQuantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-bold">المبلغ الإجمالي للإرجاع:</span>
                  <span className="font-bold text-green-600">
                    {state.selectedProducts.reduce((sum, p) => sum + p.returnTotal, 0)} ريال
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderReturnDetails = () => {
    const summary = getReturnSummary();

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">تفاصيل الإرجاع</h2>
          <p className="text-gray-600">حدد سبب ونوع الإرجاع وطريقة الاسترداد</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* نوع الإرجاع */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">نوع الإرجاع</h3>
            <div className="space-y-3">
              {[
                { value: 'partial', label: 'إرجاع جزئي', desc: 'إرجاع بعض المنتجات من الفاتورة' },
                { value: 'full', label: 'إرجاع كامل', desc: 'إرجاع كامل للفاتورة' }
              ].map((option) => (
                <label key={option.value} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="returnType"
                    value={option.value}
                    checked={state.returnDetails.type === option.value}
                    onChange={(e) => handleUpdateDetails('type', e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="mr-3">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* طريقة الاسترداد */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">طريقة الاسترداد</h3>
            <div className="space-y-3">
              {[
                { value: 'original', label: 'الطريقة الأصلية', desc: 'استرداد بنفس طريقة الدفع الأصلية' },
                { value: 'store_credit', label: 'رصيد المتجر', desc: 'إضافة الرصيد لحساب المتجر' },
                { value: 'cash', label: 'نقدي', desc: 'استرداد نقدي' }
              ].map((option) => (
                <label key={option.value} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="refundMethod"
                    value={option.value}
                    checked={state.returnDetails.refundMethod === option.value}
                    onChange={(e) => handleUpdateDetails('refundMethod', e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="mr-3">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* سبب الإرجاع */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">سبب الإرجاع</h3>
            <textarea
              value={state.returnDetails.reason}
              onChange={(e) => handleUpdateDetails('reason', e.target.value)}
              placeholder="اذكر سبب إرجاع المنتجات (مطلوب - 10 أحرف على الأقل)"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="mt-2 text-sm text-gray-500">
              {state.returnDetails.reason.length}/10 حرف مطلوب
            </div>
          </div>

          {/* ملاحظات إضافية */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">ملاحظات إضافية</h3>
            <textarea
              value={state.returnDetails.notes}
              onChange={(e) => handleUpdateDetails('notes', e.target.value)}
              placeholder="أي ملاحظات إضافية (اختياري)"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="mt-2 text-sm text-gray-500">
              {state.returnDetails.notes.length}/500 حرف
            </div>
          </div>

          {/* ملخص الإرجاع */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-4">ملخص الإرجاع</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>عدد المنتجات:</span>
                <span className="font-semibold">{summary.productCount}</span>
              </div>
              <div className="flex justify-between">
                <span>الكمية الإجمالية:</span>
                <span className="font-semibold">{summary.totalQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span>المبلغ الإجمالي:</span>
                <span className="font-semibold text-green-600">{summary.totalAmount} ريال</span>
              </div>
              <div className="flex justify-between">
                <span>نوع الإرجاع:</span>
                <span className="font-semibold">
                  {summary.returnType === 'full' ? 'كامل' : 'جزئي'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>طريقة الاسترداد:</span>
                <span className="font-semibold">
                  {summary.refundMethod === 'original' ? 'الطريقة الأصلية' : 
                   summary.refundMethod === 'store_credit' ? 'رصيد المتجر' : 'نقدي'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReviewAndConfirm = () => {
    const summary = getReturnSummary();

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">المراجعة والتأكيد</h2>
          <p className="text-gray-600">راجع جميع البيانات قبل تأكيد عملية الإرجاع</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* بيانات الفاتورة */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">بيانات الفاتورة</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">رقم الفاتورة:</span>
                <span className="ml-2">{state.invoiceData?.number}</span>
              </div>
              <div>
                <span className="font-medium">التاريخ:</span>
                <span className="ml-2">{state.invoiceData?.date}</span>
              </div>
              <div>
                <span className="font-medium">العميل:</span>
                <span className="ml-2">{state.invoiceData?.customer.name}</span>
              </div>
              <div>
                <span className="font-medium">رقم الهاتف:</span>
                <span className="ml-2">{state.invoiceData?.customer.phone}</span>
              </div>
            </div>
          </div>

          {/* المنتجات المرجعة */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">المنتجات المرجعة</h3>
            <div className="space-y-4">
              {state.selectedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{product.name}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      الكمية: {product.returnQuantity} × {product.price} ريال
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    {product.returnTotal} ريال
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>المبلغ الإجمالي للإرجاع:</span>
                <span className="text-green-600">{summary.totalAmount} ريال</span>
              </div>
            </div>
          </div>

          {/* تفاصيل الإرجاع */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">تفاصيل الإرجاع</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">نوع الإرجاع:</span>
                <span className="ml-2">
                  {state.returnDetails.type === 'full' ? 'إرجاع كامل' : 'إرجاع جزئي'}
                </span>
              </div>
              <div>
                <span className="font-medium">طريقة الاسترداد:</span>
                <span className="ml-2">
                  {state.returnDetails.refundMethod === 'original' ? 'الطريقة الأصلية' : 
                   state.returnDetails.refundMethod === 'store_credit' ? 'رصيد المتجر' : 'نقدي'}
                </span>
              </div>
              <div>
                <span className="font-medium">سبب الإرجاع:</span>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  {state.returnDetails.reason}
                </div>
              </div>
              {state.returnDetails.notes && (
                <div>
                  <span className="font-medium">ملاحظات إضافية:</span>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {state.returnDetails.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* تأكيد الإرجاع */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">تأكيد العملية</h3>
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="confirmReturn"
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="confirmReturn" className="text-sm text-blue-800">
                أنا أؤكد أن جميع البيانات المدخلة صحيحة وأوافق على إجراء عملية الإرجاع
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // عرض رسالة التحميل
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading message="جاري تحميل بيانات الفاتورة..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* رأس الصفحة */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة إرجاع الفواتير</h1>
          <p className="text-gray-600">نظام متقدم لإدارة عمليات إرجاع المنتجات</p>
        </div>

        {/* مؤشر الخطوات */}
        {renderStepIndicator()}

        {/* محتوى الخطوة الحالية */}
        <div className="bg-white rounded-lg shadow-lg min-h-[600px] p-8">
          {state.currentStep === 1 && renderInvoiceSelection()}
          {state.currentStep === 2 && renderProductSelection()}
          {state.currentStep === 3 && renderReturnDetails()}
          {state.currentStep === 4 && renderReviewAndConfirm()}
        </div>

        {/* أزرار التنقل */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            إلغاء
          </button>

          <div className="flex gap-4">
            {state.currentStep > 1 && (
              <button
                onClick={handlePreviousStep}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                السابق
              </button>
            )}

            {state.currentStep < 4 ? (
              <button
                onClick={handleNextStep}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                التالي
              </button>
            ) : (
              <button
                onClick={handleCompleteReturn}
                disabled={isCompleting}
                className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {isCompleting ? 'جاري الإكمال...' : 'تأكيد الإرجاع'}
              </button>
            )}
          </div>
        </div>

        {/* رسالة الخطأ */}
        {state.validationErrors.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold mb-2">يرجى تصحيح الأخطاء التالية:</h3>
            <ul className="text-red-700 text-sm space-y-1">
              {state.validationErrors.map((error, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* رسالة الحفظ التلقائي */}
        {state.lastSaved && (
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-500">
              آخر حفظ تلقائي: {new Date(state.lastSaved).toLocaleString('ar-SA')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnWorkflow;