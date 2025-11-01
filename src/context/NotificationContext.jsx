// ======================================
// Notification Context - إدارة الإشعارات
// ======================================

import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

// Hook لاستخدام Notification Context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState(null);

  // إضافة إشعار جديد
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // حفظ في LocalStorage
    const stored = localStorage.getItem('bero_notifications');
    const allNotifications = stored ? JSON.parse(stored) : [];
    allNotifications.unshift(newNotification);
    localStorage.setItem('bero_notifications', JSON.stringify(allNotifications.slice(0, 100))); // حفظ آخر 100 إشعار
  }, []);

  // عرض toast يشبه iOS
  const showToast = useCallback((notification) => {
    const toastId = Date.now();
    const toastNotification = {
      id: toastId,
      timestamp: new Date().toISOString(),
      ...notification
    };

    setActiveToast(toastNotification);

    // إخفاء التوست تلقائياً بعد 5 ثواني
    setTimeout(() => {
      setActiveToast(null);
    }, 5000);
  }, []);

  // إضافة إشعار نجاح
  const showSuccess = useCallback((message) => {
    const notification = {
      type: 'success',
      title: 'نجاح',
      message,
      icon: '✓'
    };
    
    addNotification(notification);
    showToast(notification);
  }, [addNotification, showToast]);

  // إضافة إشعار خطأ
  const showError = useCallback((message) => {
    const notification = {
      type: 'error',
      title: 'خطأ',
      message,
      icon: '⚠️'
    };
    
    addNotification(notification);
    showToast(notification);
  }, [addNotification, showToast]);

  // إضافة إشعار تحذير
  const showWarning = useCallback((message) => {
    const notification = {
      type: 'warning',
      title: 'تحذير',
      message,
      icon: '⚠️'
    };
    
    addNotification(notification);
    showToast(notification);
  }, [addNotification, showToast]);

  // إضافة إشعار معلومات
  const showInfo = useCallback((message) => {
    const notification = {
      type: 'info',
      title: 'معلومة',
      message,
      icon: 'ℹ️'
    };
    
    addNotification(notification);
    showToast(notification);
  }, [addNotification, showToast]);

  // وضع إشعار كمقروء
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // وضع جميع الإشعارات كمقروءة
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // حذف إشعار
  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(notif => notif.id !== id);
    });
  }, []);

  // حذف جميع الإشعارات
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('bero_notifications');
  }, []);

  // إغلاق التوست يدوياً
  const closeToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const value = {
    notifications,
    unreadCount,
    activeToast,
    addNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    closeToast,
    showToast
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* iOS-style Toast Notification */}
      {activeToast && (
        <div style={styles.toastContainer}>
          <div style={{
            ...styles.toast,
            ...getToastStyle(activeToast.type)
          }}>
            <div style={styles.toastContent}>
              <span style={styles.toastIcon}>{activeToast.icon}</span>
              <div style={styles.toastText}>
                <div style={styles.toastTitle}>{activeToast.title}</div>
                <div style={styles.toastMessage}>{activeToast.message}</div>
              </div>
              <button 
                onClick={closeToast}
                style={styles.closeButton}
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>
            <div 
              style={{
                ...styles.progressBar,
                ...getProgressBarStyle(activeToast.type)
              }} 
            />
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

// الأنماط الخاصة بالتوست
const styles = {
  toastContainer: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    left: '20px',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none'
  },
  toast: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '14px',
    padding: '16px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    pointerEvents: 'auto',
    overflow: 'hidden'
  },
  toastContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px'
  },
  toastIcon: {
    fontSize: '18px',
    marginTop: '2px'
  },
  toastText: {
    flex: 1
  },
  toastTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '2px',
    color: '#000'
  },
  toastMessage: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.4'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px',
    color: '#999',
    borderRadius: '4px'
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '3px',
    width: '100%',
    transform: 'scaleX(1)',
    transformOrigin: 'left',
    animation: 'progress 5s linear forwards'
  }
};

// الحصول على الأنماط حسب نوع الإشعار
const getToastStyle = (type) => {
  const styles = {
    success: {
      borderLeft: '4px solid #34C759'
    },
    error: {
      borderLeft: '4px solid #FF3B30'
    },
    warning: {
      borderLeft: '4px solid #FF9500'
    },
    info: {
      borderLeft: '4px solid #007AFF'
    }
  };
  return styles[type] || styles.info;
};

const getProgressBarStyle = (type) => {
  const styles = {
    success: {
      backgroundColor: '#34C759'
    },
    error: {
      backgroundColor: '#FF3B30'
    },
    warning: {
      backgroundColor: '#FF9500'
    },
    info: {
      backgroundColor: '#007AFF'
    }
  };
  return styles[type] || styles.info;
};

// إضافة أنيميشن للتقدم
const styleSheet = document.styleSheets[0];
const keyframes = `
@keyframes progress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}
`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);