// NotificationContext.jsx - محدث
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext();

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

  // تحميل الإشعارات من localStorage عند التهيئة
  useEffect(() => {
    const stored = localStorage.getItem('bero_notifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      setNotifications(parsed);
      setUnreadCount(parsed.filter(n => !n.read).length);
    }
  }, []);

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

    // إخفاء الإشعار تلقائياً بعد 5 ثوانٍ
    setTimeout(() => {
      setActiveNotification(null);
    }, 5000);

    // حفظ في LocalStorage
    const stored = localStorage.getItem('bero_notifications');
    const allNotifications = stored ? JSON.parse(stored) : [];
    allNotifications.unshift(newNotification);
    localStorage.setItem('bero_notifications', JSON.stringify(allNotifications.slice(0, 100)));
  }, []);

  const showSuccess = useCallback((message) => {
    addNotification({
      type: 'success',
      title: 'نجاح',
      message,
      icon: 'success'
    });
  }, [addNotification]);

  const showError = useCallback((message) => {
    addNotification({
      type: 'error',
      title: 'خطأ',
      message,
      icon: 'error'
    });
  }, [addNotification]);

  const showWarning = useCallback((message) => {
    addNotification({
      type: 'warning',
      title: 'تحذير',
      message,
      icon: 'warning'
    });
  }, [addNotification]);

  const showInfo = useCallback((message) => {
    addNotification({
      type: 'info',
      title: 'معلومة',
      message,
      icon: 'info'
    });
  }, [addNotification]);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(notif => notif.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setActiveNotification(null);
    localStorage.removeItem('bero_notifications');
  }, []);

  const hideActiveNotification = useCallback(() => {
    setActiveNotification(null);
  }, []);

  const value = {
    notifications,
    unreadCount,
    activeNotification,
    addNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    hideActiveNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <OneUINotification 
        notification={activeNotification}
        onClose={hideActiveNotification}
      />
    </NotificationContext.Provider>
  );
};

// مكون الإشعار الجديد بتصميم One UI
const OneUINotification = ({ notification, onClose }) => {
  if (!notification) return null;

  const getIcon = () => {
    switch (notification.icon) {
      case 'success':
        return (
          <div className="oneui-notification-icon success">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z"/>
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="oneui-notification-icon error">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0C4.47 0 0 4.47 0 10s4.47 10 10 10 10-4.47 10-10S15.53 0 10 0zm5 13.59L13.59 15 10 11.41 6.41 15 5 13.59 8.59 10 5 6.41 6.41 5 10 8.59 13.59 5 15 6.41 11.41 10 15 13.59z"/>
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="oneui-notification-icon warning">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z"/>
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="oneui-notification-icon info">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-6h2v6zm0-8H9V5h2v2z"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="oneui-notification-container">
      <div className={`oneui-notification ${notification.type}`}>
        <div className="oneui-notification-content">
          {getIcon()}
          <div className="oneui-notification-text">
            <div className="oneui-notification-title">{notification.title}</div>
            <div className="oneui-notification-message">{notification.message}</div>
          </div>
          <button 
            className="oneui-notification-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M14 1.41L12.59 0 7 5.59 1.41 0 0 1.41 5.59 7 0 12.59 1.41 14 7 8.41 12.59 14 14 12.59 8.41 7 14 1.41z"/>
            </svg>
          </button>
        </div>
        <div className="oneui-notification-progress"></div>
      </div>
    </div>
  );
};

export default NotificationContext;