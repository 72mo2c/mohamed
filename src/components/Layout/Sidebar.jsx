// ======================================
// Enhanced Sidebar - شريط جانبي محسن مع قائمة منبثقة
// ======================================

import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTab } from '../../contexts/TabContext';
import { useAuth } from '../../context/AuthContext';
import SidebarPopover from './SidebarPopover';
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
  const { isAdmin } = useAuth();
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [activePopover, setActivePopover] = useState(null);
  const sidebarRef = useRef(null);

  // Track popover position
  const [popoverPosition, setPopoverPosition] = useState({ top: 0 });

  // Calculate popover position based on clicked menu item
  const calculatePopoverPosition = (element) => {
    if (!element || !sidebarRef.current) return { top: 0 };
    
    const sidebarRect = sidebarRef.current.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    return {
      top: elementRect.top - sidebarRect.top
    };
  };

  // Handle menu click - open popover or navigate to simple menu
  const handleMenuClick = (item, event) => {
    if (item.subItems && item.subItems.length > 0) {
      // Has submenu - open popover
      const position = calculatePopoverPosition(event.currentTarget);
      setPopoverPosition(position);
      setActivePopover(item);
    } else if (item.path) {
      // Simple menu item - navigate directly
      if (window.innerWidth < 1024) {
        closeSidebar();
      }
    }
  };

  // Close popover
  const closePopover = () => {
    setActivePopover(null);
  };

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activePopover && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closePopover();
      }
    };

    if (activePopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activePopover]);

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
      title: 'الخزينة',
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
      ]
    },
    {
      id: 'accounting',
      title: 'المحاسبة',
      icon: <FaCalculator />,
      color: 'from-orange-500 to-orange-600',
      subItems: [
        { title: 'دليل الحسابات', icon: <FaBookOpen />, path: '/accounting/chart-of-accounts' },
        { title: 'القيود اليومية', icon: <FaFileInvoice />, path: '/accounting/journal-entry' },
      ]
    },
    {
      id: 'hr',
      title: 'الموارد البشرية',
      icon: <FaUsers />,
      color: 'from-blue-500 to-blue-600',
      subItems: [
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
      title: 'الربط',
      icon: <FaLink />,
      color: 'from-indigo-500 to-indigo-600',
      subItems: [
        { title: 'منصات خارجية', icon: <FaBuilding />, path: '/integrations/external-platforms' },
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
  // Determine if sidebar should be expanded
  const isExpanded = isOpen || isHovered;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar Popover */}
      <SidebarPopover
        isOpen={!!activePopover}
        onClose={closePopover}
        menuItem={activePopover}
        position={popoverPosition}
        closeSidebar={closeSidebar}
      />
      
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
            <div key={item.id} className="mb-1">
              <button
                onClick={(e) => handleMenuClick(item, e)}
                className={`
                  w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all group relative
                  ${item.subItems && item.subItems.length > 0 
                    ? 'hover:bg-orange-50 cursor-pointer' 
                    : 'hover:bg-orange-50'
                  }
                `}
                title={!isExpanded ? item.title : ''}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${item.color} text-white shadow-sm`}>
                  <span className="text-sm">{item.icon}</span>
                </div>
                {isExpanded && (
                  <>
                    <span className="flex-1 text-xs font-semibold text-right truncate text-gray-700">
                      {item.title}
                    </span>
                    {item.subItems && item.subItems.length > 0 && (
                      <FaChevronRight 
                        className="text-xs text-gray-400 group-hover:text-orange-500 group-hover:rotate-90 transition-all duration-200"
                      />
                    )}
                  </>
                )}
              </button>
            </div>
          ))}
        </nav>

        {/* Hover Indicator */}
        {!isExpanded && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-orange-400 to-orange-600 rounded-r-full opacity-50" />
        )}
      </aside>
    </>
  );
};

export default Sidebar;
