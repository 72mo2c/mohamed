// ======================================
// SyncStatusIndicator - مؤشر حالة المزامنة
// ======================================

import React from 'react';
import { FaSync, FaWifi, FaWifiOff, FaExclamationTriangle, FaCheckCircle, FaClock } from 'react-icons/fa';
import { useSaaS } from '../../context/SaaSContext';

const SyncStatusIndicator = ({ position = 'top-right', showDetails = false }) => {
  const {
    isOnline,
    dataMode,
    syncStatus,
    hasPendingSync,
    isSyncInProgress,
    canSync,
    currentTenant
  } = useSaaS();

  if (!currentTenant) return null;

  // تحديد الحالة والأيقونة واللون
  const getStatusInfo = () => {
    if (isSyncInProgress) {
      return {
        icon: <FaSync className="animate-spin" />,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        message: 'جاري المزامنة...'
      };
    }

    if (!isOnline) {
      return {
        icon: <FaWifiOff />,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        message: 'غير متصل'
      };
    }

    if (dataMode === 'offline') {
      return {
        icon: <FaClock />,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        message: 'وضع عدم الاتصال'
      };
    }

    if (hasPendingSync) {
      return {
        icon: <FaExclamationTriangle />,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        message: `${syncStatus.pending} عنصر لم يتم مزامنته`
      };
    }

    return {
      icon: <FaCheckCircle />,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      message: 'محدث'
    };
  };

  const statusInfo = getStatusInfo();

  // تحديد موضع العرض
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm transition-all duration-300
        ${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.color}
        hover:shadow-md cursor-pointer
      `}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {statusInfo.icon}
          </span>
          {showDetails && (
            <div className="flex flex-col">
              <span className="text-xs font-medium">
                {statusInfo.message}
              </span>
              {syncStatus.lastSync && (
                <span className="text-xs opacity-75">
                  آخر مزامنة: {new Date(syncStatus.lastSync).toLocaleTimeString('ar-SA')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* أيقونة إضافية لحالة الاتصال */}
        <div className="ml-2">
          {isOnline ? (
            <FaWifi className="text-xs" />
          ) : (
            <FaWifiOff className="text-xs" />
          )}
        </div>

        {/* مؤشر المزامنة */}
        {isSyncInProgress && (
          <div className="ml-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncStatusIndicator;