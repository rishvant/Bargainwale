import React, { useState, useRef, useEffect } from "react";
import {
  FaUser,
  FaChevronDown,
  FaChevronUp,
  FaSignOutAlt,
  FaCreditCard,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const UserProfileDropdown = ({ user, handleOnClick, signOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleProfile = () => {
    console.log("Manage Profile clicked");
  };

  const handleLogout = () => {
    localStorage.removeItem("organizationId");
    localStorage.removeItem("isFirstLoad");
    signOut();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Profile Icon Button */}
      <button
        onClick={toggleDropdown}
        className="group flex items-center space-x-2 p-1 pr-2 rounded-full hover:bg-gray-200"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <img
          src={user?.imageUrl}
          alt="User Avatar"
          className="w-8 h-8 rounded-full"
        />
        <span className="hidden sm:inline text-white font-medium group-hover:text-gray-600">
          {user?.firstName}
        </span>
        {isOpen ? (
          <FaChevronUp className="w-4 h-4 text-white group-hover:text-gray-600" />
        ) : (
          <FaChevronDown className="w-4 h-4 text-white group-hover:text-gray-600" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-[350px] bg-white shadow-lg rounded-lg z-50 transition-all duration-200 ease-in-out"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu"
        >
          <div className="flex items-center p-4 border-b">
            <img
              src={user?.imageUrl}
              alt="User Avatar"
              className="w-16 h-16 rounded-full"
            />
            <div className="ml-3">
              <p className="font-semibold text-gray-900 break-all">
                {user?.fullName}
              </p>
              <p className="text-sm text-gray-600 break-all">
                {user?.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>

          <div className="py-2">
            <button
              onClick={handleOnClick}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-200 text-gray-700"
              role="menuitem"
            >
              <FaUser className="inline mr-2" />
              Manage Profile
            </button>
            <button
              onClick={() => handleLogout()}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-200 text-gray-700"
              role="menuitem"
            >
              <FaSignOutAlt className="inline mr-2" />
              Logout
            </button>
            <Link
              to="/subscriptions"
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-200 text-gray-700"
              role="menuitem"
            >
              <FaCreditCard className="inline mr-2" />
              My Subscription
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;
