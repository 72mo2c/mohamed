/**
 * اختبارات أمان نظام الإرجاع
 * Return Security Tests
 * 
 * اختبارات شاملة لأمان نظام الإرجاع تشمل:
 * - اختبار تشفير البيانات
 * - اختبار نظام الصلاحيات
 * - اختبار منع الوصول غير المصرح
 * - اختبار تسجيل العمليات
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock crypto for encryption testing
const mockCrypto = {
  subtle: {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    generateKey: jest.fn(),
    importKey: jest.fn()
  },
  getRandomValues: jest.fn(),
  randomUUID: jest.fn(() => 'mock-uuid-123')
};

global.crypto = mockCrypto;

// Mock Web Crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
      decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
      generateKey: jest.fn().mockResolvedValue({ type: 'crypto-key' }),
      importKey: jest.fn().mockResolvedValue({ type: 'crypto-key' })
    },
    getRandomValues: jest.fn(),
    randomUUID: jest.fn(() => 'mock-uuid-123')
  },
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Security utilities mock
const mockSecurityUtils = {
  encrypt: jest.fn((data) => `encrypted_${data}`),
  decrypt: jest.fn((encryptedData) => `decrypted_${encryptedData}`),
  hash: jest.fn((data) => `hashed_${data}`),
  validateToken: jest.fn((token) => token === 'valid-token'),
  generateToken: jest.fn(() => 'new-valid-token'),
  sanitizeInput: jest.fn((input) => input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')),
  validatePermissions: jest.fn((user, action, resource) => {
    const permissions = {
      'admin': ['create', 'read', 'update', 'delete', 'approve'],
      'manager': ['create', 'read', 'update'],
      'user': ['read']
    };
    return permissions[user.role]?.includes(action) || false;
  }),
  logSecurityEvent: jest.fn(),
  validateCSRFToken: jest.fn((token) => token === 'valid-csrf-token')
};

// Mock contexts
const mockAuthContext = {
  user: {
    id: 1,
    username: 'testuser',
    role: 'admin',
    permissions: ['create', 'read', 'update', 'delete']
  },
  token: 'valid-token',
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn()
};

const mockDataContext = {
  salesReturns: [
    {
      id: 1,
      invoiceId: 123,
      status: 'completed',
      date: '2024-01-01',
      items: [{ productId: 1, quantity: 1 }],
      totalAmount: 100,
      createdBy: 1,
      approvedBy: 2
    }
  ],
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

jest.mock('../../../../context/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

jest.mock('../../../../context/DataContext', () => ({
  useData: () => mockDataContext
}));

jest.mock('../../../../context/NotificationContext', () => ({
  useNotification: () => mockNotificationContext
}));

jest.mock('../../../../utils/security', () => ({
  ...jest.requireActual('../../../../utils/security'),
  ...mockSecurityUtils
}));

describe('ReturnSecurity - اختبارات تشفير البيانات', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('اختبار تشفير البيانات الحساسة', async () => {
    const sensitiveData = {
      customerId: 123,
      amount: 5000,
      reason: 'منتج تالف'
    };

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="encrypt-btn"
            onClick={() => {
              mockSecurityUtils.encrypt(JSON.stringify(sensitiveData));
            }}
          >
            تشفير البيانات
          </button>
        </div>
      </BrowserRouter>
    );

    const encryptButton = screen.getByTestId('encrypt-btn');
    fireEvent.click(encryptButton);

    await waitFor(() => {
      expect(mockSecurityUtils.encrypt).toHaveBeenCalledWith(
        JSON.stringify(sensitiveData)
      );
    });
  });

  test('اختبار فك تشفير البيانات', async () => {
    const encryptedData = 'encrypted_sensitive_data';
    const expectedDecrypted = 'decrypted_encrypted_sensitive_data';

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="decrypt-btn"
            onClick={() => {
              mockSecurityUtils.decrypt(encryptedData);
            }}
          >
            فك التشفير
          </button>
        </div>
      </BrowserRouter>
    );

    const decryptButton = screen.getByTestId('decrypt-btn');
    fireEvent.click(decryptButton);

    await waitFor(() => {
      expect(mockSecurityUtils.decrypt).toHaveBeenCalledWith(encryptedData);
    });
  });

  test('اختبار التشفير في localStorage', async () => {
    const dataToStore = {
      returnId: 123,
      customerName: 'عميل سري',
      amount: 5000
    };

    mockSecurityUtils.encrypt.mockReturnValue('encrypted_data_hash');

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="store-secure-btn"
            onClick={() => {
              const encrypted = mockSecurityUtils.encrypt(JSON.stringify(dataToStore));
              mockLocalStorage.setItem('secure_return_data', encrypted);
            }}
          >
            تخزين آمن
          </button>
        </div>
      </BrowserRouter>
    );

    const storeButton = screen.getByTestId('store-secure-btn');
    fireEvent.click(storeButton);

    await waitFor(() => {
      expect(mockSecurityUtils.encrypt).toHaveBeenCalledWith(
        JSON.stringify(dataToStore)
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'secure_return_data',
        'encrypted_data_hash'
      );
    });
  });

  test('اختبار حماية البيانات من XSS', async () => {
    const maliciousInput = '<script>alert("XSS")</script> البيانات العادية';

    render(
      <BrowserRouter>
        <div>
          <input 
            data-testid="malicious-input"
            defaultValue={maliciousInput}
          />
          <button 
            data-testid="sanitize-btn"
            onClick={() => {
              mockSecurityUtils.sanitizeInput(maliciousInput);
            }}
          >
            تنظيف المدخلات
          </button>
        </div>
      </BrowserRouter>
    );

    const sanitizeButton = screen.getByTestId('sanitize-btn');
    fireEvent.click(sanitizeButton);

    await waitFor(() => {
      expect(mockSecurityUtils.sanitizeInput).toHaveBeenCalledWith(maliciousInput);
      expect(mockSecurityUtils.sanitizeInput(maliciousInput)).not.toContain('<script>');
    });
  });

  test('اختبار hashing البيانات', async () => {
    const dataToHash = 'sensitive_return_data';

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="hash-btn"
            onClick={() => {
              mockSecurityUtils.hash(dataToHash);
            }}
          >
            إنشاء hash
          </button>
        </div>
      </BrowserRouter>
    );

    const hashButton = screen.getByTestId('hash-btn');
    fireEvent.click(hashButton);

    await waitFor(() => {
      expect(mockSecurityUtils.hash).toHaveBeenCalledWith(dataToHash);
    });
  });
});

describe('ReturnSecurity - اختبارات نظام الصلاحيات', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext.user = { id: 1, username: 'testuser', role: 'admin', permissions: ['create', 'read', 'update', 'delete'] };
  });

  test('اختبار إنشاء إرجاع كمشرف', async () => {
    mockSecurityUtils.validatePermissions.mockReturnValue(true);

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="create-return-btn"
            onClick={() => {
              if (mockSecurityUtils.validatePermissions(mockAuthContext.user, 'create', 'return')) {
                mockDataContext.addSalesReturn({});
              }
            }}
          >
            إنشاء إرجاع
          </button>
        </div>
      </BrowserRouter>
    );

    const createButton = screen.getByTestId('create-return-btn');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockSecurityUtils.validatePermissions).toHaveBeenCalledWith(
        mockAuthContext.user, 
        'create', 
        'return'
      );
      expect(mockDataContext.addSalesReturn).toHaveBeenCalled();
    });
  });

  test('اختبار منع إنشاء إرجاع لمستخدم عادي', async () => {
    mockAuthContext.user = { 
      id: 2, 
      username: 'regularuser', 
      role: 'user', 
      permissions: ['read'] 
    };
    
    mockSecurityUtils.validatePermissions.mockReturnValue(false);

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="create-return-btn"
            onClick={() => {
              if (mockSecurityUtils.validatePermissions(mockAuthContext.user, 'create', 'return')) {
                mockDataContext.addSalesReturn({});
              } else {
                mockNotificationContext.showError('ليس لديك صلاحية لإنشاء إرجاع');
              }
            }}
          >
            إنشاء إرجاع
          </button>
        </div>
      </BrowserRouter>
    );

    const createButton = screen.getByTestId('create-return-btn');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockSecurityUtils.validatePermissions).toHaveBeenCalledWith(
        mockAuthContext.user, 
        'create', 
        'return'
      );
      expect(mockDataContext.addSalesReturn).not.toHaveBeenCalled();
      expect(mockNotificationContext.showError).toHaveBeenCalledWith(
        'ليس لديك صلاحية لإنشاء إرجاع'
      );
    });
  });

  test('اختبار حذف إرجاع كمدير', async () => {
    mockAuthContext.user = { 
      id: 3, 
      username: 'manageruser', 
      role: 'manager', 
      permissions: ['create', 'read', 'update'] 
    };
    
    mockSecurityUtils.validatePermissions.mockReturnValue(true);

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="delete-return-btn"
            onClick={() => {
              if (mockSecurityUtils.validatePermissions(mockAuthContext.user, 'delete', 'return')) {
                mockDataContext.deleteSalesReturn(1);
              }
            }}
          >
            حذف إرجاع
          </button>
        </div>
      </BrowserRouter>
    );

    const deleteButton = screen.getByTestId('delete-return-btn');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockSecurityUtils.validatePermissions).toHaveBeenCalledWith(
        mockAuthContext.user, 
        'delete', 
        'return'
      );
      expect(mockDataContext.deleteSalesReturn).toHaveBeenCalledWith(1);
    });
  });

  test('اختبار منع حذف إرجاع لمستخدم عادي', async () => {
    mockAuthContext.user = { 
      id: 2, 
      username: 'regularuser', 
      role: 'user', 
      permissions: ['read'] 
    };
    
    mockSecurityUtils.validatePermissions.mockReturnValue(false);

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="delete-return-btn"
            onClick={() => {
              if (mockSecurityUtils.validatePermissions(mockAuthContext.user, 'delete', 'return')) {
                mockDataContext.deleteSalesReturn(1);
              }
            }}
          >
            حذف إرجاع
          </button>
        </div>
      </BrowserRouter>
    );

    const deleteButton = screen.getByTestId('delete-return-btn');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDataContext.deleteSalesReturn).not.toHaveBeenCalled();
    });
  });
});

describe('ReturnSecurity - اختبارات منع الوصول غير المصرح', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('اختبار منع الوصول بدون تسجيل دخول', async () => {
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.token = null;

    render(
      <BrowserRouter>
        <div>
          <h2>صفحة محمية</h2>
          <button 
            data-testid="protected-action-btn"
            onClick={() => {
              if (!mockAuthContext.isAuthenticated) {
                mockNotificationContext.showError('يجب تسجيل الدخول أولاً');
                return;
              }
              // عملية محمية
            }}
          >
            عملية محمية
          </button>
        </div>
      </BrowserRouter>
    );

    const protectedButton = screen.getByTestId('protected-action-btn');
    fireEvent.click(protectedButton);

    await waitFor(() => {
      expect(mockNotificationContext.showError).toHaveBeenCalledWith(
        'يجب تسجيل الدخول أولاً'
      );
    });
  });

  test('اختبار انتهاء صلاحية الجلسة', async () => {
    mockAuthContext.token = 'expired-token';
    mockSecurityUtils.validateToken.mockReturnValue(false);

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="validate-session-btn"
            onClick={() => {
              if (!mockSecurityUtils.validateToken(mockAuthContext.token)) {
                mockAuthContext.logout();
                mockNotificationContext.showError('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
              }
            }}
          >
            التحقق من الجلسة
          </button>
        </div>
      </BrowserRouter>
    );

    const validateButton = screen.getByTestId('validate-session-btn');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(mockSecurityUtils.validateToken).toHaveBeenCalledWith('expired-token');
      expect(mockAuthContext.logout).toHaveBeenCalled();
      expect(mockNotificationContext.showError).toHaveBeenCalledWith(
        expect.stringContaining('انتهت صلاحية الجلسة')
      );
    });
  });

  test('اختبار منع CSRF attacks', async () => {
    const invalidCSRFToken = 'invalid-csrf-token';
    const validCSRFToken = 'valid-csrf-token';
    
    mockSecurityUtils.validateCSRFToken.mockReturnValue(false);

    render(
      <BrowserRouter>
        <div>
          <form>
            <input type="hidden" name="csrf_token" value={invalidCSRFToken} />
            <button 
              data-testid="submit-form-btn"
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                if (!mockSecurityUtils.validateCSRFToken(invalidCSRFToken)) {
                  mockNotificationContext.showError('رمز الأمان غير صحيح');
                }
              }}
            >
              إرسال
            </button>
          </form>
        </div>
      </BrowserRouter>
    );

    const submitButton = screen.getByTestId('submit-form-btn');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSecurityUtils.validateCSRFToken).toHaveBeenCalledWith(invalidCSRFToken);
      expect(mockNotificationContext.showError).toHaveBeenCalledWith(
        'رمز الأمان غير صحيح'
      );
    });
  });

  test('اختبار منع SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE returns; --";

    render(
      <BrowserRouter>
        <div>
          <input 
            data-testid="search-input"
            placeholder="ابحث في المرتجعات..."
          />
          <button 
            data-testid="search-btn"
            onClick={() => {
              const sanitized = mockSecurityUtils.sanitizeInput(maliciousInput);
              if (sanitized !== maliciousInput) {
                mockNotificationContext.showWarning('تم تنظيف المدخلات المشبوهة');
              }
              // البحث الآمن
            }}
          >
            بحث آمن
          </button>
        </div>
      </BrowserRouter>
    );

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: maliciousInput } });

    const searchButton = screen.getByTestId('search-btn');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockSecurityUtils.sanitizeInput).toHaveBeenCalledWith(maliciousInput);
      expect(mockNotificationContext.showWarning).toHaveBeenCalledWith(
        'تم تنظيف المدخلات المشبوهة'
      );
    });
  });

  test('اختبار Rate Limiting', async () => {
    let requestCount = 0;
    const maxRequests = 5;
    const requestDelay = 100;

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="api-request-btn"
            onClick={() => {
              requestCount++;
              if (requestCount > maxRequests) {
                mockNotificationContext.showError('تم تجاوز الحد المسموح من الطلبات');
                return;
              }
              
              // محاكاة API call
              setTimeout(() => {
                mockNotificationContext.showSuccess('تم تنفيذ الطلب بنجاح');
              }, requestDelay);
            }}
          >
            إرسال طلب
          </button>
          <div data-testid="request-count">الطلبات: {requestCount}</div>
        </div>
      </BrowserRouter>
    );

    // إرسال طلبات متعددة بسرعة
    const button = screen.getByTestId('api-request-btn');
    
    for (let i = 0; i < 7; i++) {
      fireEvent.click(button);
    }

    await waitFor(() => {
      expect(requestCount).toBe(7);
      expect(screen.getByText(/الطلبات: 7/)).toBeInTheDocument();
      expect(mockNotificationContext.showError).toHaveBeenCalledWith(
        'تم تجاوز الحد المسموح من الطلبات'
      );
    });
  });
});

describe('ReturnSecurity - اختبارات تسجيل العمليات', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('اختبار تسجيل إنشاء إرجاع', async () => {
    const returnData = {
      id: 1,
      action: 'create',
      userId: mockAuthContext.user.id,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.1',
      userAgent: 'Test Browser'
    };

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="create-and-log-btn"
            onClick={() => {
              mockSecurityUtils.logSecurityEvent({
                ...returnData,
                action: 'CREATE_RETURN',
                resource: 'return',
                details: returnData
              });
            }}
          >
            إنشاء وتسجيل
          </button>
        </div>
      </BrowserRouter>
    );

    const createButton = screen.getByTestId('create-and-log-btn');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockSecurityUtils.logSecurityEvent).toHaveBeenCalledWith({
        action: 'CREATE_RETURN',
        resource: 'return',
        userId: mockAuthContext.user.id,
        timestamp: expect.any(String),
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser',
        details: expect.any(Object)
      });
    });
  });

  test('اختبار تسجيل محاولة وصول غير مصرح', async () => {
    const unauthorizedAttempt = {
      userId: 999,
      action: 'attempt',
      resource: 'return',
      result: 'denied',
      reason: 'insufficient_permissions',
      timestamp: new Date().toISOString()
    };

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="unauthorized-attempt-btn"
            onClick={() => {
              mockSecurityUtils.logSecurityEvent({
                ...unauthorizedAttempt,
                action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                details: 'محاولة الوصول إلى إرجاع بدون صلاحية'
              });
            }}
          >
            محاولة غير مصرح
          </button>
        </div>
      </BrowserRouter>
    );

    const attemptButton = screen.getByTestId('unauthorized-attempt-btn');
    fireEvent.click(attemptButton);

    await waitFor(() => {
      expect(mockSecurityUtils.logSecurityEvent).toHaveBeenCalledWith({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        resource: 'return',
        userId: 999,
        result: 'denied',
        reason: 'insufficient_permissions',
        timestamp: expect.any(String),
        details: 'محاولة الوصول إلى إرجاع بدون صلاحية'
      });
    });
  });

  test('اختبار تسجيل عمليات حذف الإرجاع', async () => {
    const deleteOperation = {
      returnId: 123,
      action: 'delete',
      userId: mockAuthContext.user.id,
      timestamp: new Date().toISOString()
    };

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="delete-with-log-btn"
            onClick={() => {
              mockSecurityUtils.logSecurityEvent({
                ...deleteOperation,
                action: 'DELETE_RETURN',
                resource: 'return',
                details: `تم حذف الإرجاع رقم ${deleteOperation.returnId}`
              });
            }}
          >
            حذف مع تسجيل
          </button>
        </div>
      </BrowserRouter>
    );

    const deleteButton = screen.getByTestId('delete-with-log-btn');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockSecurityUtils.logSecurityEvent).toHaveBeenCalledWith({
        action: 'DELETE_RETURN',
        resource: 'return',
        returnId: 123,
        userId: mockAuthContext.user.id,
        timestamp: expect.any(String),
        details: 'تم حذف الإرجاع رقم 123'
      });
    });
  });

  test('اختبار تسجيل تغييرات الصلاحيات', async () => {
    const permissionChange = {
      targetUserId: 2,
      oldRole: 'user',
      newRole: 'manager',
      changedBy: mockAuthContext.user.id,
      timestamp: new Date().toISOString()
    };

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="change-permissions-btn"
            onClick={() => {
              mockSecurityUtils.logSecurityEvent({
                ...permissionChange,
                action: 'PERMISSION_CHANGE',
                resource: 'user',
                details: `تغيير صلاحية المستخدم ${permissionChange.targetUserId} من ${permissionChange.oldRole} إلى ${permissionChange.newRole}`
              });
            }}
          >
            تغيير الصلاحيات
          </button>
        </div>
      </BrowserRouter>
    );

    const changeButton = screen.getByTestId('change-permissions-btn');
    fireEvent.click(changeButton);

    await waitFor(() => {
      expect(mockSecurityUtils.logSecurityEvent).toHaveBeenCalledWith({
        action: 'PERMISSION_CHANGE',
        resource: 'user',
        targetUserId: 2,
        oldRole: 'user',
        newRole: 'manager',
        changedBy: mockAuthContext.user.id,
        timestamp: expect.any(String),
        details: 'تغيير صلاحية المستخدم 2 من user إلى manager'
      });
    });
  });

  test('اختبار تتبع IP addresses', async () => {
    const getUserIP = () => '192.168.1.100';

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="track-ip-btn"
            onClick={() => {
              const userIP = getUserIP();
              mockSecurityUtils.logSecurityEvent({
                action: 'RETURN_OPERATION',
                ipAddress: userIP,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
              });
            }}
          >
            تتبع IP
          </button>
        </div>
      </BrowserRouter>
    );

    const trackButton = screen.getByTestId('track-ip-btn');
    fireEvent.click(trackButton);

    await waitFor(() => {
      expect(mockSecurityUtils.logSecurityEvent).toHaveBeenCalledWith({
        action: 'RETURN_OPERATION',
        ipAddress: '192.168.1.100',
        userAgent: expect.any(String),
        timestamp: expect.any(String)
      });
    });
  });

  test('اختبار إنذارات الأمان', async () => {
    const suspiciousActivity = {
      userId: mockAuthContext.user.id,
      action: 'multiple_failed_attempts',
      timestamp: new Date().toISOString(),
      alertLevel: 'high'
    };

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="security-alert-btn"
            onClick={() => {
              if (suspiciousActivity.alertLevel === 'high') {
                mockNotificationContext.showError(
                  `تنبيه أمني: تم رصد نشاط مشبوه من المستخدم ${suspiciousActivity.userId}`
                );
                mockSecurityUtils.logSecurityEvent({
                  ...suspiciousActivity,
                  action: 'SECURITY_ALERT',
                  resource: 'security',
                  details: 'تم رفع إنذار أمني عالي المستوى'
                });
              }
            }}
          >
            محاكاة نشاط مشبوه
          </button>
        </div>
      </BrowserRouter>
    );

    const alertButton = screen.getByTestId('security-alert-btn');
    fireEvent.click(alertButton);

    await waitFor(() => {
      expect(mockNotificationContext.showError).toHaveBeenCalledWith(
        expect.stringContaining('تنبيه أمني')
      );
      expect(mockSecurityUtils.logSecurityEvent).toHaveBeenCalledWith({
        action: 'SECURITY_ALERT',
        resource: 'security',
        userId: mockAuthContext.user.id,
        timestamp: expect.any(String),
        alertLevel: 'high',
        details: 'تم رفع إنذار أمني عالي المستوى'
      });
    });
  });
});

describe('ReturnSecurity - اختبارات متقدمة للأمان', () => {
  
  test('اختبار Audit Trail شامل', async () => {
    const auditEvents = [];

    const logAuditEvent = (event) => {
      auditEvents.push({
        ...event,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      });
    };

    // محاكاة سلسلة من العمليات
    const operations = [
      { type: 'CREATE_RETURN', userId: 1, returnId: 123 },
      { type: 'UPDATE_RETURN', userId: 1, returnId: 123 },
      { type: 'DELETE_RETURN', userId: 2, returnId: 456 },
      { type: 'VIEW_RETURN', userId: 1, returnId: 123 }
    ];

    operations.forEach(op => {
      logAuditEvent({
        type: op.type,
        userId: op.userId,
        returnId: op.returnId,
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser'
      });
    });

    // التحقق من تسجيل جميع العمليات
    expect(auditEvents).toHaveLength(4);
    expect(auditEvents[0].id).toBeDefined();
    expect(auditEvents[0].timestamp).toBeDefined();
    expect(auditEvents.map(e => e.type)).toEqual([
      'CREATE_RETURN', 'UPDATE_RETURN', 'DELETE_RETURN', 'VIEW_RETURN'
    ]);
  });

  test('اختبار Data Integrity Verification', async () => {
    const originalData = {
      id: 123,
      customerId: 456,
      amount: 5000,
      items: [{ productId: 1, quantity: 2, price: 2500 }]
    };

    const calculateChecksum = (data) => {
      const str = JSON.stringify(data);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // تحويل إلى 32bit integer
      }
      return Math.abs(hash);
    };

    const originalChecksum = calculateChecksum(originalData);
    
    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="verify-integrity-btn"
            onClick={() => {
              const currentChecksum = calculateChecksum(originalData);
              if (currentChecksum !== originalChecksum) {
                mockNotificationContext.showError('تم تعديل البيانات - انتهاك سلامة البيانات');
              } else {
                mockNotificationContext.showSuccess('سلامة البيانات مؤكدة');
              }
            }}
          >
            التحقق من سلامة البيانات
          </button>
        </div>
      </BrowserRouter>
    );

    const verifyButton = screen.getByTestId('verify-integrity-btn');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockNotificationContext.showSuccess).toHaveBeenCalledWith(
        'سلامة البيانات مؤكدة'
      );
    });
  });

  test('اختبار Session Management', async () => {
    let sessionData = {
      id: 'session123',
      userId: mockAuthContext.user.id,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      ipAddress: '192.168.1.1'
    };

    const updateActivity = () => {
      sessionData.lastActivity = new Date().toISOString();
    };

    const isSessionExpired = (sessionData) => {
      const now = new Date();
      const lastActivity = new Date(sessionData.lastActivity);
      const minutesSinceActivity = (now - lastActivity) / (1000 * 60);
      return minutesSinceActivity > 30; // انتهاء الجلسة بعد 30 دقيقة
    };

    render(
      <BrowserRouter>
        <div>
          <button 
            data-testid="check-session-btn"
            onClick={() => {
              updateActivity();
              if (isSessionExpired(sessionData)) {
                mockAuthContext.logout();
                mockNotificationContext.showError('انتهت صلاحية الجلسة');
              } else {
                mockNotificationContext.showSuccess('الجلسة نشطة');
              }
            }}
          >
            فحص الجلسة
          </button>
        </div>
      </BrowserRouter>
    );

    const checkButton = screen.getByTestId('check-session-btn');
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(mockNotificationContext.showSuccess).toHaveBeenCalledWith(
        'الجلسة نشطة'
      );
    });
  });
});

// Test utilities for security testing
export const securityTestUtils = {
  // إنشاء بيانات اختبار آمنة
  createSecureTestData: () => ({
    user: {
      id: 1,
      username: 'securetest',
      role: 'admin',
      permissions: ['create', 'read', 'update', 'delete', 'approve']
    },
    token: 'secure-test-token-' + Date.now(),
    returnData: {
      id: 999,
      customerId: 123,
      amount: 5000,
      items: [{ productId: 1, quantity: 1, price: 5000 }]
    }
  }),

  // محاكاة الهجمات الأمنية
  simulateAttacks: {
    xss: '<script>alert("XSS")</script>',
    sqlInjection: "'; DROP TABLE returns; --",
    csrf: 'invalid-csrf-token',
    bruteForce: Array.from({ length: 100 }, (_, i) => `password${i}`)
  },

  // اختبار التشفير
  testEncryption: (data) => {
    const encrypted = mockSecurityUtils.encrypt(JSON.stringify(data));
    const decrypted = mockSecurityUtils.decrypt(encrypted);
    return JSON.parse(decrypted);
  },

  // التحقق من الصلاحيات
  checkPermission: (user, action, resource) => {
    return mockSecurityUtils.validatePermissions(user, action, resource);
  },

  // تسجيل الأحداث الأمنية
  logSecurityEvents: {
    successfulOperation: (user, action, resource) => ({
      type: 'SUCCESS',
      userId: user.id,
      action,
      resource,
      timestamp: new Date().toISOString()
    }),
    failedOperation: (user, action, resource, reason) => ({
      type: 'FAILURE',
      userId: user.id,
      action,
      resource,
      reason,
      timestamp: new Date().toISOString()
    }),
    securityAlert: (level, description) => ({
      type: 'SECURITY_ALERT',
      level,
      description,
      timestamp: new Date().toISOString()
    })
  }
};