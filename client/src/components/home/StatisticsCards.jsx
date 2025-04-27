import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// api services
import { getBookings } from "@/services/bookingService";
import { getOrders } from "@/services/orderService";

export default function StatisticsCards() {
  const [statisticsCardsData, setStatisticsCardsData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      const data = await getOrders();
      setOrders(data);
    };
    const fetchBookings = async () => {
      const data = await getBookings();
      setBookings(data);
    };
    fetchOrders();
    fetchBookings();
  }, []);

  let totalOrderValue = orders?.reduce((total, order) => {
    const orderTotal = order?.items?.reduce(
      (sum, item) => sum + (item.taxableAmount || 0),
      0
    );
    return total + orderTotal;
  }, 0);

  let totalBookingValue = bookings?.reduce((total, booking) => {
    const bookingTotal = booking?.items?.reduce(
      (sum, item) => sum + (item.taxpaidAmount || 0),
      0
    );
    return total + bookingTotal;
  }, 0);

  totalOrderValue = totalOrderValue?.toFixed(2);
  totalBookingValue = totalBookingValue?.toFixed(2);

  useEffect(() => {
    const data = [
      {
        title: "No. of Active Orders",
        value: orders?.length,
        percentageColor: "text-green-500",
        footerLabel: "View Orders History",
        onClick: () => navigate("/orders/history"),
      },
      {
        title: "No. of Active Bookings",
        value: bookings?.length,
        percentageColor: "text-red-500",
        footerLabel: "View all bookings",
        onClick: () => navigate("/bookings/history"),
      },
      {
        title: "Total Order Value",
        value: `₹${totalOrderValue}`,
        percentageColor: "text-green-500",
        onClick: () => navigate("/orders/history"),
      },
      {
        title: "Total Booking Value",
        value: `₹${totalBookingValue}`,
        percentageColor: "text-gray-500",
        onClick: () => navigate("/bookings/history"),
      },
    ];
    setStatisticsCardsData(data);
  }, [orders, bookings]);

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {statisticsCardsData.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow p-4 flex flex-col justify-between"
          style={{ borderRadius: "10px" }}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium text-gray-600">{card.title}</h2>
            <span className={`${card.percentageColor} text-sm font-semibold`}>
              {card.percentage}
            </span>
          </div>
          <h3 className="text-2xl font-bold">{card.value}</h3>
          <p
            className="text-blue-500 text-sm cursor-pointer hover:underline"
            onClick={card.onClick} // Call onClick function if available
          >
            {card.footerLabel}
          </p>
        </div>
      ))}
    </div>
  );
}
