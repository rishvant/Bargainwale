import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Home,
  Settings,
  Package,
  ShoppingCart,
  ClipboardList,
  Book,
  LineChart,
  Bell,
  Plus,
  History,
  BarChart,
  ChevronDown,
  Percent,
  Receipt,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const NavItem = ({ label, links, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);

  const isActive = links.some((link) => link.to === location.pathname);
  const hasDropdownLinks = links.length > 1;

  const handleMouseEnter = () => {
    if (hasDropdownLinks) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {hasDropdownLinks ? (
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            isActive
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{label}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-[350ms] ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      ) : (
        <NavLink
          to={links[0].to}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-50"
            }`
          }
        >
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{label}</span>
        </NavLink>
      )}

      <AnimatePresence>
        {isOpen && hasDropdownLinks && (
          <motion.div
            className="absolute"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative top-2 left-0 mt w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 text-sm transition-colors duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`
                  }
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  <span>{link.name}</span>
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ModernNavbar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  const navItems = [
    {
      label: "Home",
      links: [{ name: "Home", to: "/dashboard" }],
      icon: Home,
    },
    {
      label: "Master",
      links: [{ name: "Master", to: "/master" }],
      icon: Settings,
    },
    {
      label: "Inventory",
      links: [{ name: "Inventory", to: "/inventory" }],
      icon: Package,
    },
    {
      label: "Orders",
      links: [
        { name: "Create Order", to: "/orders/create", icon: Plus },
        { name: "Order History", to: "/orders/history", icon: History },
        { name: "Order Analytics", to: "/orders/analytics", icon: BarChart },
      ],
      icon: ClipboardList,
    },
    {
      label: "Bookings",
      links: [
        { name: "Create Booking", to: "/bookings/create", icon: Plus },
        { name: "Booking History", to: "/bookings/history", icon: History },
        {
          name: "Booking Analytics",
          to: "/bookings/analytics",
          icon: BarChart,
        },
        { name: "Discount Approval", to: "/discount", icon: Percent },
      ],
      icon: Book,
    },
    {
      label: "Purchase",
      links: [
        { name: "Create Purchase", to: "/purchase/create", icon: Plus },
        { name: "Purchase History", to: "/purchase/history", icon: History },
        {
          name: "Purchase Analytics",
          to: "/purchase/analytics",
          icon: BarChart,
        },
      ],
      icon: ShoppingCart,
    },
    {
      label: "Sales",
      links: [
        { name: "Create Sales", to: "/sales/create", icon: Plus },
        { name: "Sales History", to: "/sales/history", icon: History },
        { name: "Sales Analytics", to: "/sales/analytics", icon: BarChart },
      ],
      icon: LineChart,
    },
    {
      label: "Credit Note",
      links: [
        { name: "Create CN", to: "/credit-note/create", icon: Plus },
        { name: "CN History", to: "/credit-note/history", icon: History },
      ],
      icon: Receipt,
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setIsDrawerOpen(false);
      }
    };

    if (isDrawerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDrawerOpen]);

  return (
    <div className="fixed top-[4.5rem] w-full z-40 bg-white border-b border-gray-200">
      <div className="max-w-1xl mx-auto px-4 py-1">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <NavItem
                key={item.label}
                label={item.label}
                links={item.links}
                icon={item.icon}
              />
            ))}
          </div>

          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div
            ref={drawerRef}
            className="fixed top-16 right-0 w-80 h-[calc(100vh-4rem)] bg-white shadow-lg z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h2>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">No new notifications</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ModernNavbar;
