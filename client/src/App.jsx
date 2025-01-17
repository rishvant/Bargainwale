import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import CreatePurchase from "./pages/purchase/CreatePurchase";
import { DashboardNavbar } from "./widgets/layout";
import SecondNavbar from "./widgets/layout/SecNavbar";
import CreateOrder from "./pages/orders/CreateOrder";
import Master from "./pages/dashboard/Master";
import Inventory from "./pages/inventory/InventoryManagement";
import { OrderHistory } from "./pages/orders/OrderHistory";
import OrderAnalytics from "./pages/orders/OrderAnalytics";
import BookingAnalytics from "./pages/booking/BookingAnalytics";
import CreateBooking from "./pages/booking/CreateBooking";
import { BookingHistory } from "./pages/booking/BookingHistory";
import PurchaseHistory from "./pages/purchase/PurchaseHistory";
import PurchaseAnalytics from "./pages/purchase/PurchaseAnalytics";
import CreateSales from "./pages/sales/CreateSales";
import SalesHistory from "./pages/sales/SalesHistory";
import SalesAnalytics from "./pages/sales/SalesAnalytics";
import Home from "./pages/dashboard/home";
import SignIn from "./pages/auth/SignIn";
import BuyersList from "./pages/sales/BuyersList";
import CreateOrganizationPage from "./pages/auth/CreateOrganization";
import largeScreen from "./assets/large-screen.png";
import { useUser } from "@clerk/clerk-react";
import Documentation from "@/components/documentation/Documentation"; // Import the Documentation component
import DiscountApprovalPage from "./pages/booking/DiscountApproval";
import "react-phone-number-input/style.css";
import Timeline from "./components/inventory/Timeline";
import CreateCN from "./pages/creditNote/CreateCN";
import { CNHistory } from "@/pages/creditNote/CNHistory";

const App = () => {
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1250);
  const { isSignedIn } = useUser();
  const location = useLocation();
  const hideNavbars = location.pathname === "/auth/create-organization";

  useEffect(() => {
    function handleResize() {
      setIsLargeScreen(window.innerWidth >= 1250);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isLargeScreen) {
    return (
      <div className="flex flex-col p-4 gap-4 bg-[#38454A] items-center justify-center h-screen text-center">
        <img
          src={largeScreen}
          className="w-14 md:w-24"
          alt="large screen required"
        />
        <p className="text-[1.3rem] md:text-[1.5rem] flex flex-col font-semibold text-white">
          Please use a larger screen to access the dashboard.
          <span className="text-[0.9rem] md:text-[1.2rem] font-normal text-white">
            (Device width {">"} 1200px)
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-gray-50/50 flex flex-col">
      {isSignedIn ? (
        <>
          {!hideNavbars && <DashboardNavbar />}
          {!hideNavbars && <SecondNavbar />}
          <div className={`flex flex-1 ${!hideNavbars && "mt-28"}`}>
            <div className="flex-1">
              <Routes>
                <Route path="/auth/sign-in" element={<SignIn />} />
                <Route
                  path="/auth/create-organization"
                  element={<CreateOrganizationPage />}
                />
                <Route path="/docs" element={<Documentation />} />
                <Route path="/dashboard" element={<Home />} />
                <Route path="/master" element={<Master />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/:id/:inventory" element={<Timeline />} />
                <Route path="/:id/:inventory/:pickup" element={<Timeline />} />
                <Route path="/orders/create" element={<CreateOrder />} />
                <Route path="/orders/history" element={<OrderHistory />} />
                <Route path="/orders/analytics" element={<OrderAnalytics />} />
                <Route path="/bookings/create" element={<CreateBooking />} />
                <Route path="/bookings/history" element={<BookingHistory />} />
                <Route
                  path="/bookings/analytics"
                  element={<BookingAnalytics />}
                />
                <Route path="/purchase/create" element={<CreatePurchase />} />
                <Route path="/purchase/history" element={<PurchaseHistory />} />
                <Route
                  path="/purchase/analytics"
                  element={<PurchaseAnalytics />}
                />
                <Route path="/sales/create" element={<BuyersList />} />
                <Route path="/sales/create/:id" element={<CreateSales />} />
                <Route path="/sales/history" element={<SalesHistory />} />
                <Route path="/sales/analytics" element={<SalesAnalytics />} />
                <Route path="/discount" element={<DiscountApprovalPage />} />
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/credit-note/create" element={<CreateCN />} />
                <Route path="/credit-note/history" element={<CNHistory />} />
              </Routes>
            </div>
          </div>
        </>
      ) : (
        <Routes>
          <Route path="/auth/sign-in" element={<SignIn />} />
          <Route
            path="/auth/create-organization"
            element={<CreateOrganizationPage />}
          />
          <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
        </Routes>
      )}
    </div>
  );
};

export default App;
