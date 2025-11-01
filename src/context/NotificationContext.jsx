// ======================================
// Notification Context - إدارة الإشعارات (مطوّر بتصميم محسن)
// ======================================

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import './NotificationStyles.css'; // سيتم إنشاء هذا الملف لاحقاً

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
  const [position, setPosition] = useState('top-right'); // top-right, top-left, bottom-right, bottom-left

  // تحميل الإشعارات من LocalStorage عند التهيئة
  useEffect(() => {
    const loadNotifications = () => {
      try {
        const stored = localStorage.getItem('bero_notifications');
        if (stored) {
          const parsedNotifications = JSON.parse(stored);
          setNotifications(parsedNotifications);
        }
      } catch (error) {
        console.error('Failed to load notifications from localStorage:', error);
        localStorage.removeItem('bero_notifications');
      }
    };

    loadNotifications();
  }, []);

  // تحديث عداد الإشعارات غير المقروءة
  useEffect(() => {
    const count = notifications.filter(notif => !notif.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // حفظ الإشعارات في LocalStorage تلقائياً عند أي تغيير
  useEffect(() => {
    const saveNotifications = () => {
      try {
        localStorage.setItem('bero_notifications', JSON.stringify(notifications.slice(0, 100)));
      } catch (error) {
        console.error('Failed to save notifications to localStorage:', error);
      }
    };

    saveNotifications();
  }, [notifications]);

  // إضافة إشعار جديد مع تحسينات الأداء
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      read: false,
      duration: 5000, // مدة العرض الافتراضية
      ...notification
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, 100);
    });

    // حذف تلقائي بعد المدة المحددة
    if (newNotification.duration !== 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
    }
  }, []);

  // إضافة إشعار نجاح
  const showSuccess = useCallback((message, options = {}) => {
    addNotification({
      type: 'success',
      title: 'نجاح',
      message,
      icon: '✓',
      ...options
    });
  }, [addNotification]);

  // إضافة إشعار خطأ
  const showError = useCallback((message, options = {}) => {
    addNotification({
      type: 'error',
      title: 'خطأ',
      message,
      icon: '✕',
      ...options
    });
  }, [addNotification]);

  // إضافة إشعار تحذير
  const showWarning = useCallback((message, options = {}) => {
    addNotification({
      type: 'warning',
      title: 'تحذير',
      message,
      icon: '⚠',
      ...options
    });
  }, [addNotification]);

  // إضافة إشعار معلومات
  const showInfo = useCallback((message, options = {}) => {
    addNotification({
      type: 'info',
      title: 'معلومة',
      message,
      icon: 'ℹ',
      ...options
    });
  }, [addNotification]);

  // وضع إشعار كمقروء
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // وضع جميع الإشعارات كمقروءة
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  // حذف إشعار
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  // حذف جميع الإشعارات
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // تغيير موضع عرض الإشعارات
  const setNotificationPosition = useCallback((newPosition) => {
    setPosition(newPosition);
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    position,
    addNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    setNotificationPosition
  }), [
    notifications,
    unreadCount,
    position,
    addNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    setNotificationPosition
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// مكون حاوية الإشعارات مع التصميم المحسن
const NotificationContainer = () => {
  const { 
    notifications, 
    unreadCount, 
    position,
    markAsRead, 
    removeNotification, 
    markAllAsRead, 
    clearAll 
  } = useNotification();

  const [isOpen, setIsOpen] = useState(false);

  if (notifications.length === 0) return null;

  return (
    <div className={`notification-container ${position} ${isOpen ? 'open' : 'closed'}`}>
      {/* زر عداد الإشعارات */}
      <div className="notification-bell" onClick={() => setIsOpen(!isOpen)}>
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </div>

      {/* لوحة الإشعارات */}
      {isOpen && (
        <div className="notification-panel">
          <div className="panel-header">
            <h3>الإشعارات</h3>
            <div className="header-actions">
              {unreadCount > 0 && (
                <button className="mark-all-btn" onClick={markAllAsRead}>
                  تعيين الكل كمقروء
                </button>
              )}
              <button className="clear-all-btn" onClick={clearAll}>
                حذف الكل
              </button>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>
          </div>

          <div className="notifications-list">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onRemove={removeNotification}
              />
            ))}
          </div>

          <div className="panel-footer">
            <span>إجمالي الإشعارات: {notifications.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// مكون عنصر الإشعار الفردي
const NotificationItem = ({ notification, onMarkAsRead, onRemove }) => {
  const { id, type, title, message, icon, read, timestamp } = notification;

  const handleMarkAsRead = () => {
    if (!read) {
      onMarkAsRead(id);
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    
    return date.toLocaleDateString('ar-SA');
  };

  return (
    <div className={`notification-item ${type} ${read ? 'read' : 'unread'}`}>
      <div className="notification-icon">{icon}</div>
      
      <div className="notification-content" onClick={handleMarkAsRead}>
        <div className="notification-header">
          <h4 className="notification-title">{title}</h4>
          <span className="notification-time">{formatTime(timestamp)}</span>
        </div>
        
        <p className="notification-message">{message}</p>
      </div>

      <div className="notification-actions">
        {!read && (
          <button 
            className="mark-read-btn" 
            onClick={handleMarkAsRead}
            title="وضع كمقروء"
          >
            •
          </button>
        )}
        <button 
          className="remove-btn" 
          onClick={() => onRemove(id)}
          title="حذف الإشعار"
        >
          ✕
        </button>
      </div>

      {!read && <div className="unread-indicator"></div>}
    </div>
  );
};