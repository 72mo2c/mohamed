// ======================================
// Compact Sidebar - شريط جانبي مصغر ومميز
// ======================================

import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTab } from '../../contexts/TabContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaWarehouse, 
  FaShoppingCart, 
  FaMoneyBillWave, 
  FaUsers, 
  FaTruck, 
  FaBell, 
  FaCog,
  FaChevronRight,
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

const Sidebar = ({ isOpen, closeSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { openNewTabWithPath, hasMultipleTabs } = useTab();
  const [activeMenu, setActiveMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const sidebarRef = useRef(null);
  const contextMenuRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Close submenu when clicking outside or when location changes
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) &&
          contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close active menu when route changes and auto-activate relevant menu
  useEffect(() => {
    const currentPath = location.pathname;
    
    // البحث عن القائمة الفرعية التي تحتوي على المسار الحالي
    const foundActiveMenu = menuItems.find(item => 
      item.subItems && item.subItems.some(subItem => currentPath === subItem.path)
    );
    
    if (foundActiveMenu) {
      setActiveMenu(foundActiveMenu.id);
    } else {
      // إذا لم يكن المسار الحالي في أي قائمة فرعية، قم بإلغاء التفعيل
      setActiveMenu(null);
    }
  }, [location.pathname]);

  // Check if current path matches any menu item
  const isMenuActive = (menuItem) => {
    // إذا كان العنصر الرئيسي له مسار مباشر ويتطابق مع المسار الحالي
    if (menuItem.path && location.pathname === menuItem.path) {
      return true;
    }
    
    // إذا كان العنصر يحتوي على قائمة فرعية وأحد عناصرها يتطابق مع المسار الحالي
    if (menuItem.subItems) {
      return menuItem.subItems.some(subItem => 
        subItem.path && location.pathname === subItem.path
      );
    }
    
    return false;
  };

  const menuItems = [
    {
      id: 'dashboard',
      title: 'لوحة التحكم',
      icon: <FaHome />,
      path: '/dashboard',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'warehouses',
      title: 'المخازن',
      icon: <FaWarehouse />,
      color: 'from-purple-500 to-purple-600',
      subItems: [
        { title: 'إضافة بضاعة', icon: <FaPlus />, path: '/warehouses/add-product' },
        { title: 'إدارة البضائع', icon: <FaBox />, path: '/warehouses/manage-products' },
        { title: 'إضافة مخزن', icon: <FaWarehouse />, path: '/warehouses/add-warehouse' },
        { title: 'إدارة الفئات', icon: <FaTags />, path: '/warehouses/manage-categories' },
        { title: 'تحويل', icon: <FaExchangeAlt />, path: '/warehouses/transfer' },
        { title: 'الجرد', icon: <FaList />, path: '/warehouses/inventory' },
        { title: 'الضبط', icon: <FaCog />, path: '/warehouses/manage' },
      ]
    },
    {
      id: 'purchases',
      title: 'المشتريات',
      icon: <FaShoppingCart />,
      color: 'from-green-500 to-green-600',
      subItems: [
        { title: 'فاتورة جديدة', icon: <FaPlus />, path: '/purchases/new-invoice' },
        { title: 'سجل الفواتير', icon: <FaList />, path: '/purchases/invoices' },
        { title: 'إدارة الفواتير', icon: <FaFileInvoice />, path: '/purchases/manage' },
        { title: 'مرتجعات المشتريات', icon: <FaUndo />, path: '/purchases/returns' },
      ]
    },
    {
      id: 'sales',
      title: 'المبيعات',
      icon: <FaChartLine />,
      color: 'from-orange-500 to-orange-600',
      subItems: [
        { title: 'فاتورة جديدة', icon: <FaPlus />, path: '/sales/new-invoice' },
        { title: 'سجل الفواتير', icon: <FaList />, path: '/sales/invoices' },
        { title: 'إدارة الفواتير', icon: <FaFileInvoice />, path: '/sales/manage' },
        { title: 'مرتجعات المبيعات', icon: <FaUndo />, path: '/sales/returns' },
        { title: 'فواتير المبيعات الخارجية', icon: <FaLink />, path: '/sales/external' },
      ]
    },
    {
      id: 'suppliers',
      title: 'الموردين',
      icon: <FaTruck />,
      color: 'from-cyan-500 to-cyan-600',
      subItems: [
        { title: 'إضافة مورد', icon: <FaPlus />, path: '/suppliers/add' },
        { title: 'إدارة الموردين', icon: <FaList />, path: '/suppliers/manage' },
      ]
    },
    {
      id: 'customers',
      title: 'العملاء',
      icon: <FaUsers />,
      color: 'from-pink-500 to-pink-600',
      subItems: [
        { title: 'إضافة عميل', icon: <FaUserPlus />, path: '/customers/add' },
        { title: 'إدارة العملاء', icon: <FaList />, path: '/customers/manage' },
      ]
    },
    {
      id: 'treasury',
      title: 'الخزينة والادارة العامة' ,
      icon: <FaMoneyBillWave />,
      color: 'from-yellow-500 to-yellow-600',
      subItems: [
        { title: 'إذن استلام نقدي', icon: <FaPlus />, path: '/treasury/receipt/new' },
        { title: 'إيصالات الاستلام', icon: <FaList />, path: '/treasury/receipts' },
        { title: 'إذن صرف نقدي', icon: <FaPlus />, path: '/treasury/disbursement/new' },
        { title: 'إيصالات الصرف', icon: <FaList />, path: '/treasury/disbursements' },
        { title: 'حركة الخزينة', icon: <FaChartLine />, path: '/treasury/movement' },
        { title: 'أرصدة العملاء', icon: <FaUsers />, path: '/treasury/customer-balances' },
        { title: 'أرصدة الموردين', icon: <FaTruck />, path: '/treasury/supplier-balances' },
        { title: 'دليل الحسابات', icon: <FaBookOpen />, path: '/accounting/chart-of-accounts' },
        { title: 'القيود اليومية', icon: <FaFileInvoice />, path: '/accounting/journal-entry' },
        { title: 'إدارة الموظفين', icon: <FaUserPlus />, path: '/hr/employees' },
        { title: 'إدارة الأقسام', icon: <FaBuilding />, path: '/hr/organization' },
        { title: 'الحضور والانصراف', icon: <FaClock />, path: '/hr/attendance' },
        { title: 'إدارة الإجازات', icon: <FaCalendarAlt />, path: '/hr/leaves' },
        { title: 'الرواتب', icon: <FaMoneyBillWave />, path: '/hr/payroll' },
      ]
    },
    {
      id: 'production',
      title: 'نظام الإنتاج',
      icon: <FaIndustry />,
      color: 'from-orange-500 to-red-600',
      subItems: [
        { title: 'لوحة الإنتاجية', icon: <FaTachometerAlt />, path: '/production/dashboard' },
        { title: 'إدارة أوامر الإنتاج', icon: <FaClipboardList />, path: '/production/orders' },
        { title: 'تخطيط الإنتاج', icon: <FaCogs />, path: '/production/planning' },
        { title: 'تتبع المواد الخام', icon: <FaBoxes />, path: '/production/materials' },
        { title: 'مراقبة الجودة', icon: <FaCheckCircle />, path: '/production/quality' },
      ]
    },
    {
      id: 'fixed-assets',
      title: 'الأصول الثابتة',
      icon: <FaBuilding />,
      color: 'from-indigo-500 to-indigo-600',
      subItems: [
        { title: 'لوحة التحكم', icon: <FaTachometerAlt />, path: '/fixed-assets/dashboard' },
        { title: 'إدارة الأصول', icon: <FaBoxes />, path: '/fixed-assets/management' },
        { title: 'إدارة الإهلاك', icon: <FaChartLine />, path: '/fixed-assets/depreciation' },
        { title: 'جدولة الصيانة', icon: <FaClock />, path: '/fixed-assets/maintenance' },
        { title: 'جرد وتقييم', icon: <FaList />, path: '/fixed-assets/inventory' },
        { title: 'التصرف في الأصول', icon: <FaExchangeAlt />, path: '/fixed-assets/disposal' },
      ]
    },
    {
      id: 'reports',
      title: 'التقارير',
      icon: <FaClipboardList />,
      color: 'from-teal-500 to-teal-600',
      subItems: [
        { title: 'المخزون', icon: <FaBoxes />, path: '/reports/inventory' },
        { title: 'المخزون المنخفض', icon: <FaChartLine />, path: '/reports/low-stock' },
        { title: 'حركة المنتجات', icon: <FaExchangeAlt />, path: '/reports/product-movement' },
        { title: 'تقارير المبيعات', icon: <FaChartBar />, path: '/reports/sales' },
        { title: 'المبيعات حسب العملاء', icon: <FaUsers />, path: '/reports/sales-by-customer' },
        { title: 'المنتجات الأكثر مبيعاً', icon: <FaChartPie />, path: '/reports/top-selling' },
        { title: 'تقارير المشتريات', icon: <FaShoppingCart />, path: '/reports/purchases' },
        { title: 'المشتريات حسب الموردين', icon: <FaTruck />, path: '/reports/purchases-by-supplier' },
        { title: 'تقرير الخزينة', icon: <FaMoneyBillWave />, path: '/reports/treasury' },
        { title: 'التدفق النقدي', icon: <FaCashRegister />, path: '/reports/cash-flow' },
        { title: 'الأرباح والخسائر', icon: <FaDollarSign />, path: '/reports/profit-loss' },
      ]
    },
    {
      id: 'adjustments',
      title: 'التسويات',
      icon: <FaTools />,
      color: 'from-amber-500 to-amber-600',
      subItems: [
        { title: 'تسوية الكميات', icon: <FaBoxes />, path: '/adjustments/quantity' },
        { title: 'تسوية القيمة', icon: <FaDollarSign />, path: '/adjustments/value' },
        { title: 'شطب تالف', icon: <FaExclamationTriangle />, path: '/adjustments/damaged' },
        { title: 'تسوية أرصدة العملاء', icon: <FaUsers />, path: '/adjustments/customer-balance' },
        { title: 'تسوية أرصدة الموردين', icon: <FaTruck />, path: '/adjustments/supplier-balance' },
        { title: 'تسويات الخزينة', icon: <FaMoneyBillWave />, path: '/adjustments/treasury' },
        { title: 'قيود التسوية', icon: <FaFileInvoice />, path: '/adjustments/entries' },
        { title: 'سجل التسويات', icon: <FaList />, path: '/adjustments/history' },
      ]
    },
    
    {
      id: 'notifications',
      title: 'الإشعارات',
      icon: <FaBell />,
      path: '/notifications',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'integrations',
      title: 'الربط والتكامل',
      icon: <FaLink />,
      color: 'from-indigo-500 to-indigo-600',
      subItems: [
        { title: 'منصات الربط الخارجية', icon: <FaBuilding />, path: '/integrations/external-platforms' },
        { title: 'واتساب الأعمال', icon: <FaWhatsapp />, path: '/integrations/whatsapp-business' },
      ]
    },
    ...(isAdmin() ? [{
      id: 'settings',
      title: 'الإعدادات',
      icon: <FaCog />,
      color: 'from-gray-500 to-gray-600',
      subItems: [
        { title: 'إضافة مستخدم', icon: <FaUserPlus />, path: '/settings/add-user' },
        { title: 'الصلاحيات', icon: <FaCog />, path: '/settings/permissions' },
        { title: 'خدمة العملاء', icon: <FaUsers />, path: '/settings/support' },
        { title: 'إعدادات النظام', icon: <FaCog />, path: '/settings/system' },
      ]
    }] : []),
  ];

  // دالة التنقل الذكي - تختار بين التبويب الحالي أو فتح تبويب جديد
  const smartNavigation = (path, title = null) => {
    // إذا لم تكن موجودة أو كان هناك تبويبات متعددة، افتح تبويب جديد
    if (!hasMultipleTabs || location.pathname !== path) {
      openNewTabWithPath(path, title);
    } else {
      // إذا كان نفس التبويب الحالي، لا تفعل شيء
      navigate(path);
    }
    
    // إغلاق الشريط الجانبي على الشاشات الصغيرة
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  const handleMenuClick = (menuId, event, hasSubItems, itemPath) => {
    // إذا كان العنصر لا يحتوي على قائمة فرعية وله مسار مباشر
    if (!hasSubItems && itemPath) {
      setActiveMenu(null);
      smartNavigation(itemPath);
      return;
    }

    // إذا كان العنصر يحتوي على قائمة فرعية
    if (hasSubItems) {
      // Calculate position for the context menu
      const buttonRect = event.currentTarget.getBoundingClientRect();
      const subItems = menuItems.find(item => item.id === menuId)?.subItems || [];
      const menuHeight = subItems.length * 40 + 60;
      
      let top = buttonRect.top;
      
      // Adjust position if menu would go below screen
      const maxBottom = window.innerHeight - 20;
      if (top + menuHeight > maxBottom) {
        top = maxBottom - menuHeight;
      }
      
      // Ensure menu doesn't go above screen
      if (top < 20) {
        top = 20;
      }
      
      setMenuPosition({
        top: top,
        left: buttonRect.left - 8
      });
      
      // تبديل حالة القائمة الفرعية (فتح/إغلاق)
      setActiveMenu(activeMenu === menuId ? null : menuId);
    }
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = (e) => {
    if (!isOpen) {
      const relatedTarget = e.relatedTarget;
      if (!sidebarRef.current?.contains(relatedTarget) && 
          !contextMenuRef.current?.contains(relatedTarget)) {
        hoverTimeoutRef.current = setTimeout(() => {
          setIsHovered(false);
          setActiveMenu(null); // إغلاق القوائم الفرعية أيضاً
        }, 300);
      }
    }
  };

  const handleSubItemClick = (path, title) => {
    // إغلاق القائمة الفرعية فوراً عند النقر على عنصر داخلي
    setActiveMenu(null);
    setIsHovered(false);
    smartNavigation(path, title);
  };

  // إغلاق القائمة الفرعية عند تغيير المسار
  useEffect(() => {
    setActiveMenu(null);
  }, [location.pathname]);

  // Determine if sidebar should be expanded
  const isExpanded = isOpen || isHovered;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar Container */}
      <div className="flex relative" ref={sidebarRef}>
        {/* Main Sidebar */}
        <aside
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`
            fixed z-40 transition-all duration-300 overflow-hidden
            bg-white/95 backdrop-blur-md border-l border-orange-100/50 shadow-lg
            top-[40px] h-[calc(100vh-40px)]
            ${isExpanded ? 'w-56' : 'w-14'}
            ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}
          style={{ right: 0 }}
        >
          <nav className="h-full overflow-y-auto py-2 px-1.5">
            {menuItems.map((item) => (
              <div key={item.id} className="mb-1 relative">
                {item.subItems ? (
                  // Menu with submenu
                  <div>
                    <button
                      onClick={(e) => handleMenuClick(item.id, e, true, item.path)}
                      className={`
                        w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all group relative
                        ${(isMenuActive(item) || activeMenu === item.id) 
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-md' 
                          : 'hover:bg-orange-50'
                        }
                      `}
                      title={!isExpanded ? item.title : ''}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        (isMenuActive(item) || activeMenu === item.id)
                          ? 'bg-white/20 text-white' 
                          : `bg-gradient-to-br ${item.color} text-white shadow-sm`
                      }`}>
                        <span className="text-sm">{item.icon}</span>
                      </div>
                      {isExpanded && (
                        <>
                          <span className={`flex-1 text-xs font-semibold text-right truncate ${
                            (isMenuActive(item) || activeMenu === item.id) ? 'text-white' : 'text-gray-700'
                          }`}>
                            {item.title}
                          </span>
                          <FaChevronRight 
                            className={`text-xs transition-transform ${
                              (isMenuActive(item) || activeMenu === item.id) ? 'text-white/80' : 'text-gray-400'
                            } ${activeMenu === item.id ? 'rotate-90' : ''}`}
                          />
                        </>
                      )}
                      
                      {/* Active indicator for collapsed state */}
                      {!isExpanded && (isMenuActive(item) || activeMenu === item.id) && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-full" />
                      )}
                    </button>
                  </div>
                ) : (
                  // Simple menu item
                  <button
                    onClick={() => {
                      setActiveMenu(null);
                      smartNavigation(item.path, item.title);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all group relative ${
                      location.pathname === item.path
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-md'
                        : 'hover:bg-orange-50'
                    }`}
                    title={!isExpanded ? item.title : ''}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      location.pathname === item.path
                        ? 'bg-white/20 text-white' 
                        : `bg-gradient-to-br ${item.color} text-white shadow-sm`
                    }`}>
                      <span className="text-sm">{item.icon}</span>
                    </div>
                    {isExpanded && (
                      <span className={`flex-1 text-xs font-semibold text-right truncate ${
                        location.pathname === item.path ? 'text-white' : 'text-gray-700'
                      }`}>
                        {item.title}
                      </span>
                    )}
                    
                    {/* Active indicator for collapsed state */}
                    {!isExpanded && location.pathname === item.path && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-full" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </nav>

          {/* Hover Indicator */}
          {!isExpanded && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-orange-400 to-orange-600 rounded-r-full opacity-50" />
          )}
        </aside>

        {/* Context Menu - appears next to clicked item */}
        {activeMenu && (
          <div 
            ref={contextMenuRef}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
            }}
            onMouseLeave={handleMouseLeave}
            className="fixed z-50 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-orange-100/50 py-2 w-56"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              transform: 'translateX(-100%)',
              maxHeight: 'calc(100vh - 60px)'
            }}
          >
            <div className="px-3 py-2 border-b border-orange-100/50 mb-1">
              <h3 className="text-xs font-bold text-orange-600 text-center">
                {menuItems.find(item => item.id === activeMenu)?.title}
              </h3>
            </div>
            
            <div className="overflow-visible">
              {menuItems.find(item => item.id === activeMenu)?.subItems?.map((subItem, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubItemClick(subItem.path, subItem.title)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all hover:bg-orange-50 hover:text-orange-600 group ${
                    location.pathname === subItem.path
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="text-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                    {subItem.icon}
                  </span>
                  <span className="truncate font-medium text-xs">{subItem.title}</span>
                </button>
              ))}
            </div>
            
            {/* Arrow indicator pointing to the menu item */}
            <div 
              className="absolute top-4 -right-2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-white"
            />
          </div>
        )}
      </div>
      
      {/* تذكير للمستخدم حول الآلية الجديدة */}
      <div className="px-3 py-2 border-t border-orange-100/50 mt-2">
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-blue-600 text-xs font-semibold">تنبيه جديد</span>
            <span className="text-blue-500 text-xs">⚡</span>
          </div>
          <p className="text-blue-700 text-xs leading-relaxed">
            اضغط على أي واجهة مباشرة من القائمة 
            <br />
            <strong>لتفتح في تبويب جديد فوراً!</strong>
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;