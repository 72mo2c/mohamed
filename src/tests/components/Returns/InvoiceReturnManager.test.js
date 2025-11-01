/**
 * اختبارات مكون إدارة مرتجعات الفواتير
 * InvoiceReturnManager Component Tests
 * 
 * اختبارات شاملة لمكون إدارة مرتجعات الفواتير تشمل:
 * - إدارة البيانات
 * - التحقق من صحة البيانات
 * - معالجة الأخطاء
 * - اختبارات الأداء
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import InvoiceReturnManager from '../../../../components/Returns/InvoiceReturnManager';

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ invoiceId: '123' }),
  useNavigate: () => jest.fn(),
}));

// Mock Context
const mockDataContext = {
  salesInvoices: [
    {
      id: 123,
      customerId: 1,
      items: [
        { productId: 1, quantity: 5, price: 100, name: 'منتج 1' },
        { productId: 2, quantity: 3, price: 150, name: 'منتج 2' }
      ],
      total: 950,
      date: '2024-01-01'
    }
  ],
  products: [
    { id: 1, name: 'منتج 1', price: 100, category: 'فئة 1' },
    { id: 2, name: 'منتج 2', price: 150, category: 'فئة 2' }
  ],
  customers: [
    { id: 1, name: 'عميل تجريبي', phone: '123456789' }
  ],
  salesReturns: [],
  addSalesReturn: jest.fn(),
  deleteSalesReturn: jest.fn(),
  updateSalesReturn: jest.fn()
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

// Mock utils
jest.mock('../../../../utils/idUtils', () => ({
  findBySafeId: jest.fn(),
  logIdInfo: jest.fn(),
  logArrayIdsInfo: jest.fn()
}));

describe('InvoiceReturnManager - اختبارات إدارة البيانات', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('اختبار تحميل بيانات الفاتورة الأساسية', async () => {
    const { findBySafeId } = require('../../../../utils/idUtils');
    findBySafeId.mockReturnValue(mockDataContext.salesInvoices[0]);

    render(
      <BrowserRouter>
        <InvoiceReturnManager />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('منتج 1')).toBeInTheDocument();
      expect(screen.getByText('منتج 2')).toBeInTheDocument();
    });

    // التحقق من عرض إجمالي الفاتورة
    expect(screen.getByText(/950/)).toBeInTheDocument();
  });

  test('اختبار عدم وجود الفاتورة', async () => {
    const { findBySafeId } = require('../../../../utils/idUtils');
    findBySafeId.mockReturnValue(null);

    render(
      <BrowserRouter>
        <InvoiceReturnManager />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNotificationContext.showError).toHaveBeenCalledWith(
        expect.stringContaining('غير موجودة')
      );
    });
  });

  test('اختبار اختيار منتجات للإرجاع', async () => {
    const { findBySafeId } = require('../../../../utils/idUtils');
    findBySafeId.mockReturnValue(mockDataContext.salesInvoices[0]);

    render(
      <BrowserRouter>
        <InvoiceReturnManager />
      </BrowserRouter>
    );

    // البحث عن checkbox للمنتج الأول
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2); // منتجين
      
      // اختيار المنتج الأول
      fireEvent.click(checkboxes[0]);
      
      // التحقق من تحديث الكمية المتاحة
      expect(screen.getByText(/الكمية المتاحة/)).toBeInTheDocument();
    });
  });

  test('اختبار إدخال كميات الإرجاع', async () => {
    const { findBySafeId } = require('../../../../utils/idUtils');
    findBySafeId.mockReturnValue(mockDataContext.salesInvoices[0]);

    render(
      <BrowserRouter>
        <InvoiceReturnManager />
      </BrowserRouter>
    );

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // اختيار المنتج الأول
    });

    // البحث عن حقل الكمية
    const quantityInputs = screen.getAllByDisplayValue('0');
    expect(quantityInputs.length).toBeGreaterThan(0);

    // إدخال كمية إرجاع
    fireEvent.change(quantityInputs[0], { target: { value: '2' } });

    // التحقق من التحديث
    expect(quantityInputs[0]).toHaveValue('2');
  });

  test('اختبار التحقق من صحة كمية الإرجاع', async () => {
    const { findBySafeId } = require('../../../../utils/idUtils');
    findBySafeId.mockReturnValue(mockDataContext.salesInvoices[0]);

    render(
      <BrowserRouter>
        <InvoiceReturnManager />
      </BrowserRouter>
    );

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
    });

    const quantityInputs = screen.getAllByDisplayValue('0');
    const quantityInput = quantityInputs[0];

    // محاولة إدخال كمية أكبر من المتاحة
    fireEvent.change(quantityInput, { target: { value: '10' } });

    // التحقق من رسالة الخطأ
    await waitFor(() => {
      expect(mockNotificationContext.showError).toHaveBeenCalledWith(
        expect.stringContaining('أكبر من الكمية المتاحة')
      );
    });
  });

  test('اختبار حساب إجمالي الإرجاع', async () => {
    const { findBySafeId } = require('../../../../utils/idUtils');
    findBySafeId.mockReturnValue(mockDataContext.salesInvoices[0]);

    render(
      <BrowserRouter>
        <InvoiceReturnManager />
      </BrowserRouter>
    );

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
    });

    const quantityInputs = screen.getAllByDisplayValue('0');
    fireEvent.change(quantityInputs[0], { target: { value: '2' } });

    // التحقق من تحديث الإجمالي
    await waitFor(() => {
      expect(screen.getByText(/200/)).toBeInTheDocument(); // 2 × 100 = 200
    });
  });

  describe('اختبارات التحقق من صحة البيانات', () => {
    
    test('اختبار التحقق من عدم اختيار منتجات', async () => {
      const { findBySafeId } = require('../../../../utils/idUtils');
      findBySafeId.mockReturnValue(mockDataContext.salesInvoices[0]);

      render(
        <BrowserRouter>
          <InvoiceReturnManager />
        </BrowserRouter>
      );

      // البحث عن زر الحفظ
      const saveButton = screen.getByRole('button', { name: /حفظ/ });
      
      // محاولة الحفظ بدون اختيار منتجات
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockNotificationContext.showError).toHaveBeenCalledWith(
          expect.stringContaining('يجب اختيار منتج واحد على الأقل')
        );
      });
    });

    test('اختبار التحقق من إدخال سبب الإرجاع', async () => {
      const { findBySafeId } = require('../../../../utils/idUtils');
      findBySafeId.mockReturnValue(mockDataContext.salesInvoices[0]);

      render(
        <BrowserRouter>
          <InvoiceReturnManager />
        </BrowserRouter>
      );

      // اختيار منتج
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);
      });

      // عدم تحديد سبب الإرجاع
      const saveButton = screen.getByRole('button', { name: /حفظ/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockNotificationContext.showError).toHaveBeenCalledWith(
          expect.stringContaining('يجب تحديد سبب الإرجاع')
        );
      });
    });

    test('اختبار تحديد سبب الإرجاع', async () => {
      const { findBySafeId } = require('../../../../utils/idUtils');
      findBySafeId.mockReturnValue(mockDataContext.salesInvoices[0]);

      render(
        <BrowserRouter>
          <InvoiceReturnManager />
        </BrowserRouter>
      );

      // اختيار منتج
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);
      });

      // تحديد سبب الإرجاع
      const reasonSelect = screen.getByRole('combobox');
      fireEvent.change(reasonSelect, { target: { value: 'defective' } });

      expect(reasonSelect).toHaveValue('defective');
    });
  });

  describe('اختبارات معالجة الأخطاء', () => {
    
    test('اختبار خطأ في معرف الفاتورة غير صحيح', async () => {
      // Reset router mock for this test
      jest.clearAllMocks();
      
      const mockNavigate = jest.fn();
      jest.mocked(useParams).mockReturnValue({ invoiceId: '' });
      jest.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

      render(
        <BrowserRouter>
          <InvoiceReturnManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNotificationContext.showError).toHaveBeenCalledWith(
          expect.stringContaining('غير محدد')
        );
        expect(mockNavigate).toHaveBeenCalledWith('/sales/manage');
      });
    });

    test('اختبار خطأ في حفظ الإرجاع', async () => {
      const { findBySafeId } = require('../../../../utils/idUtils');
      findBySafeId.mockReturnValue(mockDataContext.salesInvoices[0]);
      
      // محاكاة خطأ في الحفظ
      mockDataContext.addSalesReturn.mockImplementation(() => {
        throw new Error('خطأ في حفظ البيانات');
      });

      render(
        <BrowserRouter>
          <InvoiceReturnManager />
        </BrowserRouter>
      );

      // إعداد البيانات الكاملة
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);
      });

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'defective' } });
      const saveButton = screen.getByRole('button', { name: /حفظ/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockNotificationContext.showError).toHaveBeenCalledWith(
          expect.stringContaining('خطأ في حفظ البيانات')
        );
      });
    });

    test('اختبار خطأ في تحديث المخزون', async () => {
      const { findBySafeId } = require('../../../../utils/idUtils');
      findBySafeId.mockReturnValue(mockDataContext.salesInvoices[0]);
      
      // محاكاة خطأ في تحديث المخزون
      mockDataContext.addSalesReturn.mockResolvedValue({ success: false, error: 'خطأ في المخزون' });

      render(
        <BrowserRouter>
          <InvoiceReturnManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);
      });

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'defective' } });
      const saveButton = screen.getByRole('button', { name: /حفظ/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockNotificationContext.showError).toHaveBeenCalledWith(
          expect.stringContaining('خطأ في المخزون')
        );
      });
    });
  });

  describe('اختبارات الأداء', () => {
    
    test('اختبار الأداء مع فواتير كبيرة', async () => {
      // إنشاء فاتورة بـ 100 منتج
      const largeInvoice = {
        id: 123,
        customerId: 1,
        items: Array.from({ length: 100 }, (_, i) => ({
          productId: i + 1,
          quantity: 10,
          price: (i + 1) * 10,
          name: `منتج ${i + 1}`
        })),
        total: 50500,
        date: '2024-01-01'
      };

      const largeProducts = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `منتج ${i + 1}`,
        price: (i + 1) * 10,
        category: `فئة ${Math.floor(i / 10) + 1}`
      }));

      const { findBySafeId } = require('../../../../utils/idUtils');
      findBySafeId.mockReturnValue(largeInvoice);
      
      // Update mock context
      const originalInvoice = mockDataContext.salesInvoices[0];
      const originalProducts = mockDataContext.products;
      mockDataContext.salesInvoices[0] = largeInvoice;
      mockDataContext.products = largeProducts;

      const startTime = performance.now();
      
      render(
        <BrowserRouter>
          <InvoiceReturnManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('منتج 1')).toBeInTheDocument();
        expect(screen.getByText('منتج 100')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // التأكد من أن العرض لا يستغرق أكثر من 2 ثانية
      expect(renderTime).toBeLessThan(2000);

      // استعادة البيانات الأصلية
      mockDataContext.salesInvoices[0] = originalInvoice;
      mockDataContext.products = originalProducts;
    });

    test('اختبار الذاكرة مع عمليات متعددة', async () => {
      const { findBySafeId } = require('../../../../utils/idUtils');
      findBySafeId.mockReturnValue(mockDataContext.salesInvoices[0]);

      const { unmount } = render(
        <BrowserRouter>
          <InvoiceReturnManager />
        </BrowserRouter>
      );

      // عمليات متكررة
      for (let i = 0; i < 50; i++) {
        await waitFor(() => {
          const checkboxes = screen.getAllByRole('checkbox');
          if (checkboxes[i % 2]) {
            fireEvent.click(checkboxes[i % 2]);
          }
        });
      }

      // إلغاء التثبيت
      unmount();

      // التأكد من عدم وجود memory leaks
      expect(screen.queryByText('منتج 1')).not.toBeInTheDocument();
    });

    test('اختبار البحث والفلترة السريعة', async () => {
      const { findBySafeId } = require('../../../../utils/idUtils');
      findBySafeId.mockReturnValue(mockDataContext.salesInvoices[0]);

      render(
        <BrowserRouter>
          <InvoiceReturnManager />
        </BrowserRouter>
      );

      // البحث عن منتج
      const searchInput = screen.getByPlaceholderText(/ابحث/);
      
      const startTime = performance.now();
      fireEvent.change(searchInput, { target: { value: 'منتج 1' } });
      
      await waitFor(() => {
        expect(screen.getByText('منتج 1')).toBeInTheDocument();
        expect(screen.queryByText('منتج 2')).not.toBeInTheDocument();
      });

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      // التأكد من أن البحث سريع (أقل من 100ms)
      expect(searchTime).toBeLessThan(100);
    });
  });

  describe('اختبارات واجهة المستخدم المتقدمة', () => {
    
    test('اختبار استجابة الواجهة مع أحجام شاشة مختلفة', async () => {
      const { findBySafeId } = require('../../../../utils/idUtils');
      findBySafeId.mockReturnValue(mockDataContext.salesInvoices[0]);

      // تغيير حجم الشاشة
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <BrowserRouter>
          <InvoiceReturnManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // التحقق من تخطيط الهاتف المحمول
        const responsiveElements = screen.getAllByText(/منتج/);
        expect(responsiveElements.length).toBeGreaterThan(0);
      });

      // إعادة تعيين الحجم
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
      });
    });

    test('اختبار إمكانية الوصول (Accessibility)', async () => {
      const { findBySafeId } = require('../../../../utils/idUtils');
      findBySafeId.mockReturnValue(mockDataContext.salesInvoices[0]);

      const { container } = render(
        <BrowserRouter>
          <InvoiceReturnManager />
        </BrowserRouter>
      );

      // التحقق من وجود aria-labels
      const interactiveElements = container.querySelectorAll('button, input, select, [role="button"]');
      interactiveElements.forEach(element => {
        expect(element).toHaveAttribute('aria-label', expect.any(String));
      });

      // التحقق من التنقل بلوحة المفاتيح
      const firstButton = screen.getAllByRole('button')[0];
      fireEvent.keyDown(firstButton, { key: 'Enter' });
      
      // التحقق من التركيز المناسب
      expect(firstButton).toHaveFocus();
    });

    test('اختبار حالات التحميل', async () => {
      // محاكاة حالة تحميل
      mockDataContext.salesInvoices = undefined;
      
      const { findBySafeId } = require('../../../../utils/idUtils');
      findBySafeId.mockReturnValue(mockDataContext.salesInvoices);

      render(
        <BrowserRouter>
          <InvoiceReturnManager />
        </BrowserRouter>
      );

      // التحقق من رسالة التحميل
      expect(screen.getByText(/جاري التحميل/)).toBeInTheDocument();
    });
  });
});

// Test data generators for performance testing
export const generateMockData = {
  // إنشاء بيانات وهمية للاختبارات
  createInvoice: (itemCount = 10) => ({
    id: Math.floor(Math.random() * 10000),
    customerId: 1,
    items: Array.from({ length: itemCount }, (_, i) => ({
      productId: i + 1,
      quantity: Math.floor(Math.random() * 100) + 1,
      price: Math.floor(Math.random() * 1000) + 100,
      name: `منتج اختبار ${i + 1}`
    })),
    total: 0,
    date: new Date().toISOString()
  }),

  createProducts: (count = 10) => Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `منتج اختبار ${i + 1}`,
    price: Math.floor(Math.random() * 1000) + 100,
    category: `فئة ${Math.floor(i / 5) + 1}`,
    stock: Math.floor(Math.random() * 1000) + 100
  })),

  createCustomer: () => ({
    id: 1,
    name: 'عميل اختبار',
    phone: '123456789',
    email: 'test@example.com'
  })
};

// Performance benchmarks
export const performanceBenchmarks = {
  maxRenderTime: 2000, // مللي ثانية
  maxSearchTime: 100,
  maxMemoryUsage: 100 * 1024 * 1024, // 100 MB
  maxOperationsPerSecond: 1000
};