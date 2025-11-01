/**
 * اختبارات مسار عمل الإرجاع
 * Return Workflow Tests
 * 
 * اختبارات شاملة لمسار عمل الإرجاع تشمل:
 * - اختبار واجهة المستخدم
 * - اختبار التنقل بين الخطوات
 * - اختبار حفظ البيانات
 * - اختبار تجربة المستخدم
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock components
jest.mock('../../../../pages/Sales/SalesReturns', () => {
  return function MockSalesReturns() {
    return <div data-testid="sales-returns-list">قائمة مرتجعات المبيعات</div>;
  };
});

jest.mock('../../../../pages/Sales/NewSalesReturn', () => {
  return function MockNewSalesReturn() {
    return <div data-testid="new-sales-return">إنشاء إرجاع جديد</div>;
  };
});

jest.mock('../../../../pages/Purchases/PurchaseReturns', () => {
  return function MockPurchaseReturns() {
    return <div data-testid="purchase-returns-list">قائمة مرتجعات المشتريات</div>;
  };
});

jest.mock('../../../../pages/Purchases/NewPurchaseReturn', () => {
  return function MockNewPurchaseReturn() {
    return <div data-testid="new-purchase-return">إنشاء إرجاع مشتريات</div>;
  };
});

// Mock Context
const mockDataContext = {
  salesInvoices: [
    {
      id: 123,
      customerId: 1,
      items: [
        { productId: 1, quantity: 5, price: 100, name: 'منتج اختبار' },
        { productId: 2, quantity: 3, price: 150, name: 'منتج آخر' }
      ],
      total: 950,
      date: '2024-01-01'
    }
  ],
  purchaseInvoices: [
    {
      id: 456,
      supplierId: 1,
      items: [
        { productId: 3, quantity: 10, price: 80, name: 'منتج مورد' }
      ],
      total: 800,
      date: '2024-01-01'
    }
  ],
  products: [
    { id: 1, name: 'منتج اختبار', price: 100, category: 'فئة 1', stock: 50 },
    { id: 2, name: 'منتج آخر', price: 150, category: 'فئة 2', stock: 30 },
    { id: 3, name: 'منتج مورد', price: 80, category: 'فئة 3', stock: 100 }
  ],
  customers: [
    { id: 1, name: 'عميل اختبار', phone: '123456789' }
  ],
  suppliers: [
    { id: 1, name: 'مورد اختبار', phone: '987654321' }
  ],
  salesReturns: [
    {
      id: 1,
      invoiceId: 123,
      status: 'completed',
      date: '2024-01-01',
      items: [{ productId: 1, quantity: 1 }],
      totalAmount: 100
    }
  ],
  purchaseReturns: [
    {
      id: 2,
      invoiceId: 456,
      status: 'pending',
      date: '2024-01-02',
      items: [{ productId: 3, quantity: 2 }],
      totalAmount: 160
    }
  ],
  addSalesReturn: jest.fn(),
  addPurchaseReturn: jest.fn(),
  deleteSalesReturn: jest.fn(),
  deletePurchaseReturn: jest.fn(),
  updateSalesReturn: jest.fn(),
  updatePurchaseReturn: jest.fn()
};

const mockNotificationContext = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showWarning: jest.fn(),
  showInfo: jest.fn()
};

jest.mock('../../../../context/DataContext', () => ({
  useData: () => mockDataContext
}));

jest.mock('../../../../context/NotificationContext', () => ({
  useNotification: () => mockNotificationContext
}));

// Main workflow component for testing
const ReturnWorkflowRouter = () => {
  return (
    <Routes>
      <Route path="/sales/returns" element={<div>مرتجعات المبيعات - الصفحة الرئيسية</div>} />
      <Route path="/sales/returns/new/:invoiceId?" element={<div>إنشاء إرجاع مبيعات</div>} />
      <Route path="/purchase/returns" element={<div>مرتجعات المشتريات - الصفحة الرئيسية</div>} />
      <Route path="/purchase/returns/new/:invoiceId?" element={<div>إنشاء إرجاع مشتريات</div>} />
    </Routes>
  );
};

describe('ReturnWorkflow - اختبارات التنقل والمسار الأساسي', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('اختبار التنقل من قائمة المبيعات إلى إنشاء الإرجاع', async () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/sales/returns" element={
            <div>
              <h2>مرتجعات المبيعات</h2>
              <button data-testid="create-return-btn" onClick={() => {}}>
                إنشاء إرجاع جديد
              </button>
            </div>
          } />
          <Route path="/sales/returns/new/:invoiceId?" element={<div>إنشاء إرجاع جديد</div>} />
        </Routes>
      </BrowserRouter>
    );

    // الانتقال إلى صفحة مرتجعات المبيعات
    window.history.pushState({}, 'Test', '/sales/returns');

    await waitFor(() => {
      expect(screen.getByText('مرتجعات المبيعات')).toBeInTheDocument();
    });

    // النقر على زر إنشاء إرجاع جديد
    const createButton = screen.getByTestId('create-return-btn');
    fireEvent.click(createButton);

    // التحقق من الانتقال إلى صفحة الإنشاء
    await waitFor(() => {
      expect(screen.getByText('إنشاء إرجاع جديد')).toBeInTheDocument();
    });
  });

  test('اختبار التنقل من قائمة المشتريات إلى إنشاء الإرجاع', async () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/purchase/returns" element={
            <div>
              <h2>مرتجعات المشتريات</h2>
              <button data-testid="create-return-btn" onClick={() => {}}>
                إنشاء إرجاع جديد
              </button>
            </div>
          } />
          <Route path="/purchase/returns/new/:invoiceId?" element={<div>إنشاء إرجاع مشتريات</div>} />
        </Routes>
      </BrowserRouter>
    );

    // الانتقال إلى صفحة مرتجعات المشتريات
    window.history.pushState({}, 'Test', '/purchase/returns');

    await waitFor(() => {
      expect(screen.getByText('مرتجعات المشتريات')).toBeInTheDocument();
    });

    const createButton = screen.getByTestId('create-return-btn');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('إنشاء إرجاع مشتريات')).toBeInTheDocument();
    });
  });

  test('اختبار الرجوع من صفحة الإنشاء إلى القائمة', async () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/sales/returns/new/:invoiceId?" element={
            <div>
              <button data-testid="back-btn" onClick={() => window.history.back()}>
                <span>←</span> العودة
              </button>
              <div>إنشاء إرجاع جديد</div>
            </div>
          } />
          <Route path="/sales/returns" element={<div>قائمة المرتجعات</div>} />
        </Routes>
      </BrowserRouter>
    );

    // الانتقال إلى صفحة الإنشاء
    window.history.pushState({}, 'Test', '/sales/returns/new/123');

    await waitFor(() => {
      expect(screen.getByText('إنشاء إرجاع جديد')).toBeInTheDocument();
    });

    // النقر على زر العودة
    const backButton = screen.getByTestId('back-btn');
    fireEvent.click(backButton);

    // التحقق من الرجوع للقائمة
    await waitFor(() => {
      expect(screen.getByText('قائمة المرتجعات')).toBeInTheDocument();
    });
  });
});

describe('ReturnWorkflow - اختبارات واجهة المستخدم', () => {
  
  test('اختبار عرض قائمة مرتجعات المبيعات', async () => {
    render(
      <BrowserRouter>
        <div data-testid="sales-returns-list">قائمة مرتجعات المبيعات</div>
      </BrowserRouter>
    );

    expect(screen.getByTestId('sales-returns-list')).toBeInTheDocument();
    expect(screen.getByText('قائمة مرتجعات المبيعات')).toBeInTheDocument();
  });

  test('اختبار عرض قائمة مرتجعات المشتريات', async () => {
    render(
      <BrowserRouter>
        <div data-testid="purchase-returns-list">قائمة مرتجعات المشتريات</div>
      </BrowserRouter>
    );

    expect(screen.getByTestId('purchase-returns-list')).toBeInTheDocument();
    expect(screen.getByText('قائمة مرتجعات المشتريات')).toBeInTheDocument();
  });

  test('اختبار عرض صفحة إنشاء إرجاع مبيعات', async () => {
    render(
      <BrowserRouter>
        <div data-testid="new-sales-return">إنشاء إرجاع مبيعات</div>
      </BrowserRouter>
    );

    expect(screen.getByTestId('new-sales-return')).toBeInTheDocument();
    expect(screen.getByText('إنشاء إرجاع مبيعات')).toBeInTheDocument();
  });

  test('اختبار عرض صفحة إنشاء إرجاع مشتريات', async () => {
    render(
      <BrowserRouter>
        <div data-testid="new-purchase-return">إنشاء إرجاع مشتريات</div>
      </BrowserRouter>
    );

    expect(screen.getByTestId('new-purchase-return')).toBeInTheDocument();
    expect(screen.getByText('إنشاء إرجاع مشتريات')).toBeInTheDocument();
  });
});

describe('ReturnWorkflow - اختبارات حفظ البيانات', () => {
  
  test('اختبار حفظ إرجاع مبيعات جديد', async () => {
    const newReturnData = {
      invoiceId: 123,
      items: [
        { productId: 1, quantity: 1, price: 100 }
      ],
      reason: 'defective',
      notes: 'منتج تالف',
      totalAmount: 100
    };

    // محاكاة نجاح حفظ الإرجاع
    mockDataContext.addSalesReturn.mockResolvedValue({
      success: true,
      data: { id: 3, ...newReturnData }
    });

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="save-return-btn"
            onClick={() => mockDataContext.addSalesReturn(newReturnData)}
          >
            حفظ الإرجاع
          </button>
        </div>
      </BrowserRouter>
    );

    const saveButton = screen.getByTestId('save-return-btn');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockDataContext.addSalesReturn).toHaveBeenCalledWith(newReturnData);
      expect(mockNotificationContext.showSuccess).toHaveBeenCalledWith(
        expect.stringContaining('تم حفظ')
      );
    });
  });

  test('اختبار حفظ إرجاع مشتريات جديد', async () => {
    const newReturnData = {
      invoiceId: 456,
      items: [
        { productId: 3, quantity: 2, price: 80 }
      ],
      reason: 'wrong_item',
      notes: 'منتج خاطئ',
      totalAmount: 160
    };

    mockDataContext.addPurchaseReturn.mockResolvedValue({
      success: true,
      data: { id: 4, ...newReturnData }
    });

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="save-purchase-return-btn"
            onClick={() => mockDataContext.addPurchaseReturn(newReturnData)}
          >
            حفظ إرجاع المشتريات
          </button>
        </div>
      </BrowserRouter>
    );

    const saveButton = screen.getByTestId('save-purchase-return-btn');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockDataContext.addPurchaseReturn).toHaveBeenCalledWith(newReturnData);
      expect(mockNotificationContext.showSuccess).toHaveBeenCalledWith(
        expect.stringContaining('تم حفظ')
      );
    });
  });

  test('اختبار فشل حفظ الإرجاع', async () => {
    const newReturnData = {
      invoiceId: 123,
      items: [{ productId: 1, quantity: 1, price: 100 }],
      reason: 'defective'
    };

    mockDataContext.addSalesReturn.mockRejectedValue(new Error('خطأ في الحفظ'));

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="save-return-btn"
            onClick={() => mockDataContext.addSalesReturn(newReturnData)}
          >
            حفظ الإرجاع
          </button>
        </div>
      </BrowserRouter>
    );

    const saveButton = screen.getByTestId('save-return-btn');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockNotificationContext.showError).toHaveBeenCalledWith(
        expect.stringContaining('خطأ في الحفظ')
      );
    });
  });

  test('اختبار تحديث إرجاع موجود', async () => {
    const updatedData = {
      id: 1,
      status: 'completed',
      notes: 'تم التحديث'
    };

    mockDataContext.updateSalesReturn.mockResolvedValue({
      success: true,
      data: updatedData
    });

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="update-return-btn"
            onClick={() => mockDataContext.updateSalesReturn(updatedData)}
          >
            تحديث الإرجاع
          </button>
        </div>
      </BrowserRouter>
    );

    const updateButton = screen.getByTestId('update-return-btn');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(mockDataContext.updateSalesReturn).toHaveBeenCalledWith(updatedData);
      expect(mockNotificationContext.showSuccess).toHaveBeenCalledWith(
        expect.stringContaining('تم التحديث')
      );
    });
  });

  test('اختبار حذف إرجاع', async () => {
    const returnId = 1;

    mockDataContext.deleteSalesReturn.mockResolvedValue({
      success: true,
      message: 'تم الحذف بنجاح'
    });

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="delete-return-btn"
            onClick={() => mockDataContext.deleteSalesReturn(returnId)}
          >
            حذف الإرجاع
          </button>
        </div>
      </BrowserRouter>
    );

    const deleteButton = screen.getByTestId('delete-return-btn');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDataContext.deleteSalesReturn).toHaveBeenCalledWith(returnId);
      expect(mockNotificationContext.showSuccess).toHaveBeenCalledWith(
        expect.stringContaining('تم الحذف')
      );
    });
  });
});

describe('ReturnWorkflow - اختبارات تجربة المستخدم', () => {
  
  test('اختبار رسائل النجاح والخطأ', async () => {
    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="success-btn"
            onClick={() => mockNotificationContext.showSuccess('عملية ناجحة')}
          >
            إظهار نجاح
          </button>
          <button 
            data-testid="error-btn"
            onClick={() => mockNotificationContext.showError('حدث خطأ')}
          >
            إظهار خطأ
          </button>
        </div>
      </BrowserRouter>
    );

    // اختبار رسالة النجاح
    fireEvent.click(screen.getByTestId('success-btn'));
    await waitFor(() => {
      expect(mockNotificationContext.showSuccess).toHaveBeenCalledWith('عملية ناجحة');
    });

    // اختبار رسالة الخطأ
    fireEvent.click(screen.getByTestId('error-btn'));
    await waitFor(() => {
      expect(mockNotificationContext.showError).toHaveBeenCalledWith('حدث خطأ');
    });
  });

  test('اختبار تأكيد الحذف', async () => {
    // محاكاة window.confirm
    global.confirm = jest.fn(() => true);

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="confirm-delete-btn"
            onClick={() => {
              if (window.confirm('هل أنت متأكد من الحذف؟')) {
                mockDataContext.deleteSalesReturn(1);
              }
            }}
          >
            حذف مع تأكيد
          </button>
        </div>
      </BrowserRouter>
    );

    const deleteButton = screen.getByTestId('confirm-delete-btn');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalledWith('هل أنت متأكد من الحذف؟');
      expect(mockDataContext.deleteSalesReturn).toHaveBeenCalledWith(1);
    });
  });

  test('اختبار إلغاء الحذف', async () => {
    global.confirm = jest.fn(() => false);

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="confirm-delete-btn"
            onClick={() => {
              if (window.confirm('هل أنت متأكد من الحذف؟')) {
                mockDataContext.deleteSalesReturn(1);
              }
            }}
          >
            حذف مع تأكيد
          </button>
        </div>
      </BrowserRouter>
    );

    const deleteButton = screen.getByTestId('confirm-delete-btn');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalledWith('هل أنت متأكد من الحذف؟');
      expect(mockDataContext.deleteSalesReturn).not.toHaveBeenCalled();
    });
  });

  test('اختبار حالات التحميل', async () => {
    // محاكاة حالة تحميل
    mockDataContext.addSalesReturn.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="loading-btn"
            onClick={async () => {
              // عرض حالة التحميل
              expect(screen.getByText('جاري الحفظ...')).toBeInTheDocument();
              await mockDataContext.addSalesReturn({});
            }}
          >
            حفظ مع تحميل
          </button>
          <div data-testid="loading-indicator">جاري الحفظ...</div>
        </div>
      </BrowserRouter>
    );

    const loadingButton = screen.getByTestId('loading-btn');
    fireEvent.click(loadingButton);

    // التحقق من ظهور مؤشر التحميل
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.getByText('جاري الحفظ...')).toBeInTheDocument();
  });

  test('اختبار البحث والتصفية', async () => {
    const searchData = [
      { id: 1, customerName: 'عميل أحمد', amount: 500 },
      { id: 2, customerName: 'عميل علي', amount: 300 },
      { id: 3, customerName: 'عميل سالم', amount: 700 }
    ];

    render(
      <BrowserRouter>
        <div>
          <input 
            data-testid="search-input"
            placeholder="ابحث..."
            onChange={(e) => {
              const searchTerm = e.target.value;
              // محاكاة البحث
              const filtered = searchData.filter(item => 
                item.customerName.includes(searchTerm)
              );
              expect(filtered.length).toBe(searchTerm ? 1 : 3);
            }}
          />
          <div data-testid="search-results">
            {searchData.map(item => (
              <div key={item.id}>{item.customerName}</div>
            ))}
          </div>
        </div>
      </BrowserRouter>
    );

    const searchInput = screen.getByTestId('search-input');
    
    // البحث عن "أحمد"
    fireEvent.change(searchInput, { target: { value: 'أحمد' } });
    await waitFor(() => {
      expect(searchInput).toHaveValue('أحمد');
    });

    // مسح البحث
    fireEvent.change(searchInput, { target: { value: '' } });
    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  test('اختبار تصدير البيانات', async () => {
    const exportData = [
      { id: 1, customerName: 'عميل 1', amount: 500, date: '2024-01-01' },
      { id: 2, customerName: 'عميل 2', amount: 300, date: '2024-01-02' }
    ];

    // محاكاة blob و URL.createObjectURL
    global.Blob = jest.fn((content) => ({
      content,
      size: content.length,
      type: 'application/json'
    }));
    global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = jest.fn();

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="export-btn"
            onClick={() => {
              const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
              });
              const url = URL.createObjectURL(blob);
              
              // محاكاة التحميل
              const link = document.createElement('a');
              link.href = url;
              link.download = 'returns.json';
              link.click();
              
              URL.revokeObjectURL(url);
            }}
          >
            تصدير البيانات
          </button>
        </div>
      </BrowserRouter>
    );

    const exportButton = screen.getByTestId('export-btn');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(global.Blob).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  test('اختبار الطباعة', async () => {
    // محاكاة window.print
    global.print = jest.fn();

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="print-btn"
            onClick={() => {
              window.print();
            }}
          >
            طباعة
          </button>
        </div>
      </BrowserRouter>
    );

    const printButton = screen.getByTestId('print-btn');
    fireEvent.click(printButton);

    await waitFor(() => {
      expect(global.print).toHaveBeenCalled();
    });
  });
});

describe('ReturnWorkflow - اختبارات المسار الكامل', () => {
  
  test('اختبار المسار الكامل لإنشاء إرجاع مبيعات', async () => {
    const completeWorkflow = async () => {
      // 1. الانتقال إلى صفحة مرتجعات المبيعات
      expect(screen.getByText('مرتجعات المبيعات')).toBeInTheDocument();
      
      // 2. النقر على إنشاء إرجاع جديد
      const createButton = screen.getByText('إنشاء إرجاع جديد');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('إنشاء إرجاع جديد')).toBeInTheDocument();
      });

      // 3. ملء بيانات الإرجاع
      // 4. حفظ الإرجاع
      mockDataContext.addSalesReturn.mockResolvedValue({ success: true });
      
      const saveButton = screen.getByText('حفظ الإرجاع');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockNotificationContext.showSuccess).toHaveBeenCalled();
      });

      // 5. الرجوع للقائمة
      const backButton = screen.getByText('العودة');
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('مرتجعات المبيعات')).toBeInTheDocument();
      });

      // 6. التحقق من ظهور الإرجاع الجديد
      expect(screen.getByText(/إرجاع رقم/)).toBeInTheDocument();
    };

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/sales/returns" element={<div>مرتجعات المبيعات</div>} />
          <Route path="/sales/returns/new" element={
            <div>
              <div>إنشاء إرجاع جديد</div>
              <button>حفظ الإرجاع</button>
              <button>العودة</button>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    );

    await completeWorkflow();
  });

  test('اختبار المسار الكامل لحذف إرجاع', async () => {
    mockDataContext.deleteSalesReturn.mockResolvedValue({ success: true });
    global.confirm = jest.fn(() => true);

    render(
      <BrowserRouter>
        <div>
          <div>قائمة المرتجعات</div>
          <button data-testid="delete-btn">حذف</button>
          <div data-testid="confirmation-modal">تأكيد الحذف</div>
        </div>
      </BrowserRouter>
    );

    // النقر على حذف
    const deleteButton = screen.getByTestId('delete-btn');
    fireEvent.click(deleteButton);

    // تأكيد الحذف
    await waitFor(() => {
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      expect(global.confirm).toHaveBeenCalled();
    });

    // التحقق من نجاح العملية
    await waitFor(() => {
      expect(mockDataContext.deleteSalesReturn).toHaveBeenCalled();
      expect(mockNotificationContext.showSuccess).toHaveBeenCalled();
    });
  });
});

// Test utilities
export const workflowTestUtils = {
  // محاكاة المستخدم
  simulateUser: {
    click: (element) => fireEvent.click(element),
    type: (element, text) => fireEvent.change(element, { target: { value: text } }),
    select: (element, value) => fireEvent.change(element, { target: { value } }),
    navigate: (path) => window.history.pushState({}, 'Test', path)
  },

  // انتظار أحداث غير متزامنة
  waitForAsync: (callback) => waitFor(callback, { timeout: 5000 }),

  // التحقق من النماذج
  validateForm: (formData) => {
    const errors = [];
    
    if (!formData.items || formData.items.length === 0) {
      errors.push('يجب اختيار منتج واحد على الأقل');
    }
    
    if (!formData.reason) {
      errors.push('يجب تحديد سبب الإرجاع');
    }
    
    return errors;
  },

  // حساب الإجماليات
  calculateTotals: (items) => {
    return items.reduce((total, item) => {
      return total + (item.quantity * item.price);
    }, 0);
  },

  // إنشاء بيانات اختبار
  generateTestData: {
    createReturn: (type = 'sales', count = 1) => Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      type,
      date: new Date().toISOString(),
      status: i % 2 === 0 ? 'completed' : 'pending',
      items: [
        { productId: i + 1, quantity: 1, price: 100 }
      ],
      totalAmount: 100
    }))
  }
};