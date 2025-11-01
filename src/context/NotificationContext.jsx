// ======================================
// Notification Context - إدارة الإشعارات
// ======================================

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

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
  const [isVisible, setIsVisible] = useState(false);
  
  const timeoutRef = useRef(null);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // إذا كان هناك إشعار نشط، نغلقه أولاً ثم نعرض الجديد
    if (activeNotification) {
      setIsVisible(false);
      
      // ننتظر حتى يختفي الإشعار الحالي ثم نعرض الجديد
      setTimeout(() => {
        setActiveNotification(newNotification);
        setIsVisible(true);
        
        // إعادة ضبط المؤقت للإشعار الجديد
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, 4000);
      }, 300);
    } else {
      // إذا لم يكن هناك إشعار نشط، نعرض مباشرة
      setActiveNotification(newNotification);
      setIsVisible(true);
      
      // ضبط مؤقت للإخفاء التلقائي
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    }

    // حفظ في LocalStorage
    const stored = localStorage.getItem('bero_notifications');
    const allNotifications = stored ? JSON.parse(stored) : [];
    allNotifications.unshift(newNotification);
    localStorage.setItem('bero_notifications', JSON.stringify(allNotifications.slice(0, 100)));
  }, [activeNotification]);

  const showSuccess = useCallback((message) => {
    addNotification({
      type: 'success',
      title: 'نجاح',
      message,
    });
  }, [addNotification]);

  const showError = useCallback((message) => {
    addNotification({
      type: 'error',
      title: 'خطأ',
      message,
    });
  }, [addNotification]);

  const showWarning = useCallback((message) => {
    addNotification({
      type: 'warning',
      title: 'تحذير',
      message,
    });
  }, [addNotification]);

  const showInfo = useCallback((message) => {
    addNotification({
      type: 'info',
      title: 'معلومة',
      message,
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
    localStorage.removeItem('bero_notifications');
  }, []);

  const closeNotification = useCallback(() => {
    setIsVisible(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleAnimationEnd = useCallback(() => {
    if (!isVisible) {
      setActiveNotification(null);
    }
  }, [isVisible]);

  const value = {
    notifications,
    unreadCount,
    activeNotification,
    isVisible,
    addNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    closeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <SamsungNotification onAnimationEnd={handleAnimationEnd} />
    </NotificationContext.Provider>
  );
};

// مكون الإشعار بتصميم سامسونج
const SamsungNotification = ({ onAnimationEnd }) => {
  const { activeNotification, isVisible, closeNotification } = useNotification();

  if (!activeNotification) return null;

  const getColor = () => {
    switch (activeNotification.type) {
      case 'success': return '#2E7D32';
      case 'error': return '#D32F2F';
      case 'warning': return '#F57C00';
      case 'info': return '#1976D2';
      default: return '#1976D2';
    }
  };

  const getIcon = () => {
    switch (activeNotification.type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return 'ℹ';
    }
  };

  return (
    <div 
      style={{
        ...styles.container,
        ...(isVisible ? styles.visible : styles.hidden)
      }}
      onAnimationEnd={onAnimationEnd}
    >
      <div style={{...styles.notification, borderLeft: `4px solid ${getColor()}`}}>
        <div style={styles.header}>
          <div style={{...styles.icon, backgroundColor: getColor()}}>
            {getIcon()}
          </div>
          <div style={styles.content}>
            <div style={styles.title}>{activeNotification.title}</div>
            <div style={styles.message}>{activeNotification.message}</div>
          </div>
          <button style={styles.closeBtn} onClick={closeNotification}>×</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: '10px',
    right: '10px',
    zIndex: 10000,
    minWidth: '300px',
    maxWidth: '400px',
    transform: 'translateX(400px)',
    opacity: 0,
  },
  visible: {
    animation: 'slideIn 0.3s ease forwards',
  },
  hidden: {
    animation: 'slideOut 0.3s ease forwards',
  },
  notification: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '16px',
    gap: '12px',
  },
  icon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px',
  },
  message: {
    fontSize: '13px',
    color: '#666',
    lineHeight: '1.4',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#999',
    cursor: 'pointer',
    padding: '0',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

// إضافة الأنيميشن
if (typeof document !== 'undefined') {
  const styleSheet = document.styleSheets[0];
  styleSheet.insertRule(`
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `, styleSheet.cssRules.length);
  
  styleSheet.insertRule(`
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `, styleSheet.cssRules.length);
}

export default NotificationContext;