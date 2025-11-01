// ======================================
// Notification Context - إدارة الإشعارات
// ======================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import './NotificationStyles.css'; // سننشئ ملف CSS منفصل للتصميم

const NotificationContext = createContext();

// Hook لاستخدام Notification Context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// مكون عرض الإشعارات
const NotificationContainer = () => {
  const { notifications, removeNotification, markAsRead } = useNotification();

  return (
    <div className="notification-wrapper">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
          onMarkAsRead={markAsRead}
        />
      ))}
    </div>
  );
};

// مكون الإشعار الفردي
const NotificationItem = ({ notification, onClose, onMarkAsRead }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={`
        notification-item 
        notification-${notification.type}
        ${notification.read ? 'read' : 'unread'}
        ${isExiting ? 'exiting' : ''}
      `}
      onClick={handleClick}
    >
      <div className="notification-content">
        <div className="notification-header">
          <div className="notification-icon">
            {notification.type === 'success' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            )}
            {notification.type === 'error' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            )}
            {notification.type === 'warning' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
            )}
            {notification.type === 'info' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            )}
          </div>
          <div className="notification-title">{notification.title}</div>
          <button className="notification-close" onClick={handleClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div className="notification-message">{notification.message}</div>
        <div className="notification-time">
          {new Date(notification.timestamp).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
      {!notification.read && <div className="notification-indicator"></div>}
    </div>
  );
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // تحميل الإشعارات من LocalStorage عند التهيئة
  React.useEffect(() => {
    const stored = localStorage.getItem('bero_notifications');
    if (stored) {
      const parsedNotifications = JSON.parse(stored);
      setNotifications(parsedNotifications);
      setUnreadCount(parsedNotifications.filter(n => !n.read).length);
    }
  }, []);

  // إضافة إشعار جديد
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 20); // آخر 20 إشعار فقط
      localStorage.setItem('bero_notifications', JSON.stringify(updated));
      return updated;
    });
    
    setUnreadCount(prev => prev + 1);
  }, []);

  // إضافة إشعار نجاح
  const showSuccess = useCallback((message) => {
    addNotification({
      type: 'success',
      title: 'نجاح',
      message,
    });
  }, [addNotification]);

  // إضافة إشعار خطأ
  const showError = useCallback((message) => {
    addNotification({
      type: 'error',
      title: 'خطأ',
      message,
    });
  }, [addNotification]);

  // إضافة إشعار تحذير
  const showWarning = useCallback((message) => {
    addNotification({
      type: 'warning',
      title: 'تحذير',
      message,
    });
  }, [addNotification]);

  // إضافة إشعار معلومات
  const showInfo = useCallback((message) => {
    addNotification({
      type: 'info',
      title: 'معلومة',
      message,
    });
  }, [addNotification]);

  // وضع إشعار كمقروء
  const markAsRead = useCallback((id) => {
    setNotifications(prev => {
      const updated = prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      );
      localStorage.setItem('bero_notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // وضع جميع الإشعارات كمقروءة
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, read: true }));
      localStorage.setItem('bero_notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(0);
  }, []);

  // حذف إشعار
  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      const updated = prev.filter(notif => notif.id !== id);
      localStorage.setItem('bero_notifications', JSON.stringify(updated));
      
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return updated;
    });
  }, []);

  // حذف جميع الإشعارات
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('bero_notifications');
  }, []);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};