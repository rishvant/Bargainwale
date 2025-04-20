import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// api services
import { getBookings } from "@/services/bookingService";

// icons
import { CheckCircle, Clock, IndianRupeeIcon, ShoppingBag } from "lucide-react";

// components
import StatCard from "@/components/common/StatCard";
import DailyBookings from "@/components/bookings/DailyBookings";
import BookingDistribution from "@/components/bookings/BookingDistribution";
import BookingTable from "@/components/bookings/BookingTable";

const BookingAnalytics = () => {
  const [bookings, setBookings] = useState([]);
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
  });
  const [bookingStatusData, setBookingStatusData] = useState([]);
  const [dailyBookingsData, setDailyBookingsData] = useState([]);

  const fetchBookings = async () => {
    try {
      const response = await getBookings();
      setBookings(response);

      // Calculate total stats
      const totalBookings = response.length;
      const pendingBookings = response.filter(
        (booking) => booking.status === "created"
      ).length;
      const completedBookings = response.filter(
        (booking) => booking.status === "fully sold"
      ).length;
      const totalRevenue = response?.reduce(
        (sum, booking) => sum + (booking.total || 0),
        0
      );

      setBookingStats({
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue,
      });

      // Calculate order status distribution
      const statusCounts = response?.reduce(
        (acc, booking) => {
          acc[booking.status] = (acc[booking.status] || 0) + 1;
          return acc;
        },
        { created: 0, "partially sold": 0, paid: 0 }
      );

      const formattedData = [
        { name: "Created", value: statusCounts.created || 0 },
        {
          name: "Partially Sold",
          value: statusCounts["partially sold"] || 0,
        },
        { name: "Fully Sold", value: statusCounts.paid || 0 },
      ];

      setBookingStatusData(formattedData);

      // Generate daily orders data for the past 7 days
      const today = new Date();
      const last7DaysData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const count = response.filter(
          (booking) => booking.createdAt.split("T")[0] === dateStr
        ).length;

        return { date: dateStr, bookings: count };
      }).reverse();

      setDailyBookingsData(last7DaysData);
    } catch (err) {
      console.log("Error:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  let totalBookingValue = bookings?.reduce((total, booking) => {
    const bookingTotal = booking?.items?.reduce(
      (sum, item) => sum + (item.taxableAmount || 0),
      0
    );
    return total + bookingTotal;
  }, 0);
  totalBookingValue = totalBookingValue.toFixed(2);

  return (
    <div className="flex-1 relative top-5 z-10 overflow-auto">
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            name="Total Bookings"
            icon={ShoppingBag}
            value={bookingStats.totalBookings.toLocaleString()}
            color="#6366F1"
          />
          <StatCard
            name="Pending Bookings"
            icon={Clock}
            value={bookingStats.pendingBookings.toLocaleString()}
            color="#F59E0B"
          />
          <StatCard
            name="Sold Bookings"
            icon={CheckCircle}
            value={bookingStats.completedBookings.toLocaleString()}
            color="#10B981"
          />
          <StatCard
            name="Total Revenue"
            icon={IndianRupeeIcon}
            value={`₹${totalBookingValue}`}
            color="#EF4444"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <DailyBookings data={dailyBookingsData} />
          <BookingDistribution bookingStatusData={bookingStatusData} />
        </div>

        <BookingTable bookingData={bookings} />
      </main>
    </div>
  );
};
export default BookingAnalytics;
