import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaTimes, 
  FaChevronRight,
  FaHome,
  FaWarehouse,
  FaShoppingCart,
  FaMoneyBillWave,
  FaUsers,
  FaTruck,
  FaBell,
  FaCog,
  FaBox,
  FaExchangeAlt,
  FaFileInvoice,
  FaList,
  FaPlus,
  FaUserPlus,
  FaBuilding,
  FaLink,
  FaWhatsapp,
  FaTags,
  FaChartLine,
  FaUndo,
  FaClipboardList,
  FaBoxes,
  FaChartBar,
  FaChartPie,
  FaDollarSign,
  FaCashRegister,
  FaTools,
  FaExclamationTriangle,
  FaCalculator,
  FaBookOpen,
  FaClock,
  FaCalendarAlt,
  FaIndustry,
  FaCogs,
  FaTachometerAlt,
  FaIndustry as FaManufacturing,
  FaCheckCircle
} from 'react-icons/fa';

const SidebarPopover = ({ 
  isOpen, 
  onClose, 
  menuItem, 
  position = { top: 0 },
  closeSidebar 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen && menuItem) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, menuItem]);

  if (!menuItem || !isOpen) return null;

  // Check if current path matches any submenu item
  const isSubmenuActive = (subItem) => {
    return location.pathname === subItem.path;
  };

  const handleSubItemClick = (path) => {
    // Close popover and sidebar on mobile
    if (window.innerWidth < 1024) {
      closeSidebar && closeSidebar();
      onClose();
    }
    // Navigate to the path
    navigate(path);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-all duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Popover Container */}
      <div 
        className={`fixed z-50 transition-all duration-500 ease-out ${
          isVisible 
            ? 'translate-x-0 opacity-100 scale-100' 
            : 'translate-x-4 opacity-0 scale-95'
        }`}
        style={{ 
          right: '280px',
          top: position.top + 40,
          maxHeight: 'calc(100vh - 120px)',
        }}
      >
        {/* Popover */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden min-w-80 max-w-96">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${menuItem.color} flex items-center justify-center text-white shadow-lg`}>
                  <span className="text-lg">{menuItem.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{menuItem.title}</h3>
                  <p className="text-sm text-gray-500">{menuItem.subItems?.length || 0} خيار متاح</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-200/80 hover:bg-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto p-2">
            <div className="space-y-1">
              {menuItem.subItems?.map((subItem, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubItemClick(subItem.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-right group ${
                    isSubmenuActive(subItem)
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-[1.02]'
                      : 'hover:bg-gray-50 hover:shadow-md text-gray-700 hover:text-orange-600'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    isSubmenuActive(subItem)
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600'
                  }`}>
                    <span className="text-sm">{subItem.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex items-center justify-between">
                    <div className="text-right">
                      <div className={`font-semibold text-sm ${
                        isSubmenuActive(subItem) ? 'text-white' : 'text-gray-800'
                      }`}>
                        {subItem.title}
                      </div>
                      {isSubmenuActive(subItem) && (
                        <div className="text-xs text-white/80 mt-0.5">
                          🟢 نشط الآن
                        </div>
                      )}
                    </div>
                    
                    <FaChevronRight 
                      className={`text-xs transition-all duration-200 ${
                        isSubmenuActive(subItem) 
                          ? 'text-white rotate-90' 
                          : 'text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1'
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200/50 px-6 py-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>🚀 نظام بيرو</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                متاح
              </span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="absolute right-[-8px] top-6 w-4 h-4 bg-white/95 rotate-45 border-r border-b border-gray-200/50 shadow-sm"></div>
      </div>
    </>
  );
};

export default SidebarPopover;