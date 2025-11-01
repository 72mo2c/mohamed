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
  const [activeNotification, setActiveNotification] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

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
    setActiveNotification(newNotification);
    setIsExpanded(false);

    // عرض الإشعار بشكل مصغر أولاً ثم يتمدد بعد ثانية
    setTimeout(() => {
      setIsExpanded(true);
    }, 300);

    // إخفاء الإشعار بعد 5 ثوانٍ
    setTimeout(() => {
      setIsExpanded(false);
      setTimeout(() => {
        setActiveNotification(null);
      }, 300);
    }, 5000);

    // حفظ في LocalStorage
    const stored = localStorage.getItem('bero_notifications');
    const allNotifications = stored ? JSON.parse(stored) : [];
    allNotifications.unshift(newNotification);
    localStorage.setItem('bero_notifications', JSON.stringify(allNotifications.slice(0, 100))); // حفظ آخر 100 إشعار
  }, []);

  // إضافة إشعار نجاح
  const showSuccess = useCallback((message) => {
    addNotification({
      type: 'success',
      title: 'نجاح',
      message,
      icon: 'success'
    });
  }, [addNotification]);

  // إضافة إشعار خطأ
  const showError = useCallback((message) => {
    addNotification({
      type: 'error',
      title: 'خطأ',
      message,
      icon: 'error'
    });
  }, [addNotification]);

  // إضافة إشعار تحذير
  const showWarning = useCallback((message) => {
    addNotification({
      type: 'warning',
      title: 'تحذير',
      message,
      icon: 'warning'
    });
  }, [addNotification]);

  // إضافة إشعار معلومات
  const showInfo = useCallback((message) => {
    addNotification({
      type: 'info',
      title: 'معلومة',
      message,
      icon: 'info'
    });
  }, [addNotification]);

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

  // إغلاق الإشعار النشط
  const closeActiveNotification = useCallback(() => {
    setIsExpanded(false);
    setTimeout(() => {
      setActiveNotification(null);
    }, 300);
  }, []);

  const value = {
    notifications,
    unreadCount,
    activeNotification,
    isExpanded,
    addNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    closeActiveNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationDisplay />
    </NotificationContext.Provider>
  );
};

// مكون عرض الإشعارات الجديد
const NotificationDisplay = () => {
  const { activeNotification, isExpanded, closeActiveNotification } = useNotification();

  if (!activeNotification) return null;

  // تحديد لون الإشعار حسب النوع
  const getNotificationColor = () => {
    switch (activeNotification.type) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      default: return '#2196F3';
    }
  };

  // تحديد الأيقونة حسب النوع
  const getNotificationIcon = () => {
    switch (activeNotification.type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return 'ℹ';
    }
  };

  return (
    <div style={styles.notificationContainer}>
      <div 
        style={{
          ...styles.notification,
          ...(isExpanded ? styles.notificationExpanded : styles.notificationCollapsed),
          borderLeft: `4px solid ${getNotificationColor()}`
        }}
      >
        <div style={styles.notificationHeader}>
          <div style={styles.iconContainer}>
            <span style={{...styles.icon, backgroundColor: getNotificationColor()}}>
              {getNotificationIcon()}
            </span>
          </div>
          <div style={styles.titleContainer}>
            <h4 style={styles.title}>{activeNotification.title}</h4>
            <span style={styles.timestamp}>
              {new Date(activeNotification.timestamp).toLocaleTimeString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <button 
            style={styles.closeButton}
            onClick={closeActiveNotification}
          >
            ✕
          </button>
        </div>
        
        {isExpanded && (
          <div style={styles.notificationBody}>
            <p style={styles.message}>{activeNotification.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// الأنماط
const styles = {
  notificationContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '10px',
    pointerEvents: 'none'
  },
  notification: {
    width: '100%',
    maxWidth: '400px',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    pointerEvents: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.18)'
  },
  notificationCollapsed: {
    height: '60px',
  },
  notificationExpanded: {
    height: 'auto',
    minHeight: '120px',
  },
  notificationHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    height: '60px',
    boxSizing: 'border-box'
  },
  iconContainer: {
    marginRight: '12px'
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  titleContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  timestamp: {
    fontSize: '12px',
    color: '#666',
    marginTop: '2px'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#999',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'background-color 0.2s'
  },
  notificationBody: {
    padding: '0 16px 16px 60px'
  },
  message: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.4',
    color: '#555'
  }
};

export default NotificationContext;