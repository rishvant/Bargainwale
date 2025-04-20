import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { toast } from "sonner";

// api services
import { getSales } from "@/services/salesService";

// icons
import {
  CreditCard,
  IndianRupeeIcon,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

// components
import StatCard from "@/components/common/StatCard";

const PICKUP_COLORS = {
  rack: "#4CAF50",
  depot: "#2196F3",
  plant: "#FF9800",
};

const SalesAnalytics = () => {
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    averageOrderValue: 0,
    salesGrowth: "0%",
  });
  const [pickupData, setPickupData] = useState([]);
  const [dailySalesData, setDailySalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const calculateSalesStats = (salesData) => {
    const totalSales = salesData.length;
    const totalAmount = salesData.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );
    const averageOrderValue = totalSales > 0 ? totalAmount / totalSales : 0;

    const today = new Date();
    const lastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate()
    );

    const currentPeriodSales = salesData.filter(
      (sale) => new Date(sale.createdAt) >= lastMonth
    ).length;

    const previousPeriodSales = salesData.filter(
      (sale) => new Date(sale.createdAt) < lastMonth
    ).length;

    const salesGrowth =
      previousPeriodSales > 0
        ? (
            ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) *
            100
          ).toFixed(1)
        : "0";

    return {
      totalSales,
      totalAmount: totalAmount.toFixed(2),
      averageOrderValue: averageOrderValue.toFixed(2),
      salesGrowth: `${salesGrowth}%`,
    };
  };

  const calculatePickupDistribution = (salesData) => {
    const pickupCount = { rack: 0, depot: 0, plant: 0 };
    salesData.forEach((sale) => {
      sale.sales.forEach((individualSale) => {
        individualSale.items.forEach((item) => {
          pickupCount[item.pickup] =
            (pickupCount[item.pickup] || 0) + item.quantity;
        });
      });
    });

    return Object.entries(pickupCount).map(([pickup, value]) => ({
      name: pickup.charAt(0).toUpperCase() + pickup.slice(1),
      value,
    }));
  };

  const calculateCategoryDistribution = (salesData) => {
    const categoryCount = {};
    salesData.forEach((sale) => {
      sale.sales.forEach((individualSale) => {
        individualSale.items.forEach((item) => {
          if (item.itemId?.category) {
            categoryCount[item.itemId.category] =
              (categoryCount[item.itemId.category] || 0) + item.quantity;
          }
        });
      });
    });

    return Object.entries(categoryCount).map(([category, value]) => ({
      name: category,
      value,
    }));
  };

  const calculateDailyTrend = (salesData) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return format(date, "yyyy-MM-dd");
    }).reverse();

    return last7Days.map((date) => {
      const daySales = salesData.filter(
        (sale) => format(new Date(sale.createdAt), "yyyy-MM-dd") === date
      );

      return {
        date: format(new Date(date), "MMM dd"),
        sales: daySales.length,
        amount: daySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      };
    });
  };

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const response = await getSales();
      const salesData = response.data;

      setSalesStats(calculateSalesStats(salesData));
      setPickupData(calculatePickupDistribution(salesData));
      setCategoryData(calculateCategoryDistribution(salesData));
      setDailySalesData(calculateDailyTrend(salesData));
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to fetch sales data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">Loading...</div>
    );
  }

  return (
    <div className="flex-1 top-5 overflow-auto relative z-10">
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            name="Total Sales"
            icon={ShoppingCart}
            value={salesStats.totalSales}
            color="#6366F1"
          />
          <StatCard
            name="Total Revenue"
            icon={IndianRupeeIcon}
            value={`₹${salesStats.totalAmount}`}
            color="#10B981"
          />
          <StatCard
            name="Avg. Order Value"
            icon={CreditCard}
            value={`₹${salesStats.averageOrderValue}`}
            color="#F59E0B"
          />
          <StatCard
            name="Sales Growth"
            icon={TrendingUp}
            value={salesStats.salesGrowth}
            color="#EF4444"
          />
        </motion.div>

        {/* Daily Sales Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-semibold mb-4">Daily Sales Trend</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="sales"
                  stroke="#8884d8"
                  name="Number of Sales"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="amount"
                  stroke="#82ca9d"
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-8">
          {/* Pickup Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Pickup Distribution</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pickupData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {pickupData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PICKUP_COLORS[entry.name.toLowerCase()]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SalesAnalytics;
