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
import { getPurchases } from "@/services/purchaseService";

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

const PurchaseAnalytics = () => {
  const [purchaseStats, setPurchaseStats] = useState({
    totalPurchases: 0,
    totalAmount: 0,
    averageOrderValue: 0,
    purchaseGrowth: "0%",
  });
  const [pickupData, setPickupData] = useState([]);
  const [dailyPurchaseData, setDailyPurchaseData] = useState([]);
  const [loading, setLoading] = useState(true);

  const calculatePurchaseStats = (purchaseData) => {
    const totalPurchases = purchaseData.length;
    const totalAmount = purchaseData.reduce((sum, purchase) => {
      const purchaseTotal = purchase.items.reduce(
        (itemSum, item) => itemSum + item.quantity,
        0
      );
      return sum + purchaseTotal;
    }, 0);

    const averageOrderValue =
      totalPurchases > 0 ? totalAmount / totalPurchases : 0;

    const today = new Date();
    const lastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate()
    );

    const currentPeriodPurchases = purchaseData.filter(
      (purchase) => new Date(purchase.createdAt) >= lastMonth
    ).length;

    const previousPeriodPurchases = purchaseData.filter(
      (purchase) => new Date(purchase.createdAt) < lastMonth
    ).length;

    const purchaseGrowth =
      previousPeriodPurchases > 0
        ? (
            ((currentPeriodPurchases - previousPeriodPurchases) /
              previousPeriodPurchases) *
            100
          ).toFixed(1)
        : "0";

    return {
      totalPurchases,
      totalAmount: totalAmount.toFixed(2),
      averageOrderValue: averageOrderValue.toFixed(2),
      purchaseGrowth: `${purchaseGrowth}%`,
    };
  };

  const calculatePickupData = (purchaseData) => {
    const pickupCount = { rack: 0, depot: 0, plant: 0 };
    purchaseData.forEach((purchase) => {
      purchase.items.forEach((item) => {
        pickupCount[item.pickup] =
          (pickupCount[item.pickup] || 0) + item.quantity;
      });
    });

    return Object.entries(pickupCount).map(([pickup, value]) => ({
      name: pickup.charAt(0).toUpperCase() + pickup.slice(1),
      value,
    }));
  };

  const calculateCategoryData = (purchaseData) => {
    const categoryCount = {};
    purchaseData.forEach((purchase) => {
      purchase.items.forEach((item) => {
        if (item.itemId?.category) {
          categoryCount[item.itemId.category] =
            (categoryCount[item.itemId.category] || 0) + item.quantity;
        }
      });
    });

    return Object.entries(categoryCount).map(([category, value]) => ({
      name: category,
      value,
    }));
  };

  const calculateDailyTrend = (purchaseData) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return format(date, "yyyy-MM-dd");
    }).reverse();

    return last7Days.map((date) => {
      const dayPurchases = purchaseData.filter(
        (purchase) =>
          format(new Date(purchase.createdAt), "yyyy-MM-dd") === date
      );

      return {
        date: format(new Date(date), "MMM dd"),
        purchases: dayPurchases.length,
        items: dayPurchases.reduce(
          (sum, purchase) =>
            sum +
            purchase.items.reduce((iSum, item) => iSum + item.quantity, 0),
          0
        ),
      };
    });
  };

  const fetchPurchaseData = async () => {
    try {
      setLoading(true);
      const response = await getPurchases();
      const purchaseData = response.data;

      setPurchaseStats(calculatePurchaseStats(purchaseData));
      setPickupData(calculatePickupData(purchaseData));
      setDailyPurchaseData(calculateDailyTrend(purchaseData));
    } catch (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Failed to fetch purchase data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseData();
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
            name="Total Purchases"
            icon={ShoppingCart}
            value={purchaseStats.totalPurchases}
            color="#6366F1"
          />
          <StatCard
            name="Total Amount"
            icon={IndianRupeeIcon}
            value={`₹${purchaseStats.totalAmount}`}
            color="#10B981"
          />
          <StatCard
            name="Avg. Purchase Value"
            icon={CreditCard}
            value={`₹${purchaseStats.averageOrderValue}`}
            color="#F59E0B"
          />
          <StatCard
            name="Purchase Growth"
            icon={TrendingUp}
            value={purchaseStats.purchaseGrowth}
            color="#EF4444"
          />
        </motion.div>

        {/* Daily Purchase Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-semibold mb-4">Daily Purchase Trend</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyPurchaseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="purchases"
                  stroke="#8884d8"
                  name="Purchases"
                />
                <Line
                  type="monotone"
                  dataKey="items"
                  stroke="#82ca9d"
                  name="Items"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-8">
          {/* Pickup Distribution Chart */}
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

export default PurchaseAnalytics;
