import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// api services
import { getOrders } from "@/services/orderService";

// icons
import { CheckCircle, Clock, IndianRupeeIcon, ShoppingBag } from "lucide-react";

// components
import StatCard from "@/components/common/StatCard";
import DailyOrders from "@/components/orders/DailyOrders";
import OrderDistribution from "@/components/orders/OrderDistribution";
import OrdersTable from "@/components/orders/OrderTable";

const OrderAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  });
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [dailyOrdersData, setDailyOrdersData] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await getOrders();
      setOrders(response);

      // Calculate total stats
      const totalOrders = response.length;
      const pendingOrders = response.filter(
        (order) => order.status === "created"
      ).length;
      const completedOrders = response.filter(
        (order) => order.status === "billed"
      ).length;
      const totalRevenue = response.reduce(
        (sum, order) => sum + (order.total || 0),
        0
      );

      setOrderStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
      });

      // Calculate order status distribution
      const statusCounts = response.reduce(
        (acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        },
        { created: 0, "partially paid": 0, paid: 0 }
      );

      const formattedData = [
        { name: "Created", value: statusCounts.created || 0 },
        { name: "Partially Paid", value: statusCounts["partially paid"] || 0 },
        { name: "Paid", value: statusCounts.paid || 0 },
      ];

      setOrderStatusData(formattedData);

      // Generate daily orders data for the past 7 days
      const today = new Date();
      const last7DaysData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const count = response.filter(
          (order) => order.createdAt.split("T")[0] === dateStr
        ).length;

        return { date: dateStr, orders: count };
      }).reverse();

      setDailyOrdersData(last7DaysData);
    } catch (err) {
      console.log("Error:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  let totalOrderValue = orders?.reduce((total, order) => {
    const orderTotal = order?.items?.reduce(
      (sum, item) => sum + (item.taxableAmount || 0),
      0
    );
    return total + orderTotal;
  }, 0);
  totalOrderValue = totalOrderValue.toFixed(2);

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
            name="Total Orders"
            icon={ShoppingBag}
            value={orderStats.totalOrders.toLocaleString()}
            color="#6366F1"
          />
          <StatCard
            name="Pending Orders"
            icon={Clock}
            value={orderStats.pendingOrders.toLocaleString()}
            color="#F59E0B"
          />
          <StatCard
            name="Billed Orders"
            icon={CheckCircle}
            value={orderStats.completedOrders.toLocaleString()}
            color="#10B981"
          />
          <StatCard
            name="Total Revenue"
            icon={IndianRupeeIcon}
            value={`₹${totalOrderValue}`}
            color="#EF4444"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <DailyOrders data={dailyOrdersData} />
          <OrderDistribution orderStatusData={orderStatusData} />
        </div>

        <OrdersTable orderData={orders} />
      </main>
    </div>
  );
};

export default OrderAnalytics;
