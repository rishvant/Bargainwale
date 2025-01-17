import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import StatCard from "@/components/common/StatCard";
import { CreditCard, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import PurchaseOverviewChart from "@/components/purchase/PurchaseOverviewChart";
import PurchaseByCategoryChart from "@/components/purchase/PurchasesByCategory";
import DailyPurchaseTrend from "@/components/purchase/DailyPurchaseTrend";
import { getPurchases } from "@/services/purchaseService";

const PurchaseAnalytics = () => {
  const [purchases, setPurchases] = useState([]);
  const [purchaseStats, setPurchaseStats] = useState({
    totalRevenue: 0,
    averageOrderValue: 0,
    conversionRate: "0%",
    salesGrowth: "0%",
  });
  const [categoryData, setCategoryData] = useState([]);
  const [dailyPurchaseData, setDailyPurchaseData] = useState([]);

  const fetchPurchases = async () => {
    try {
      const response = await getPurchases();
      setPurchases(response);

      // Calculate total revenue and average purchase value
      const totalRevenue = response.reduce(
        (sum, purchase) => sum + (purchase.total || 0),
        0
      );
      const averageOrderValue = totalRevenue / (response.length || 1);

      // Mock conversion rate and growth for simplicity
      const conversionRate = "3.45%";
      const salesGrowth = "12.3%";

      setPurchaseStats({
        totalRevenue: totalRevenue.toFixed(2),
        averageOrderValue: averageOrderValue.toFixed(2),
        conversionRate,
        salesGrowth,
      });

      // Category distribution data
      const categoryCounts = response.reduce((acc, purchase) => {
        purchase.items.forEach((item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
        });
        return acc;
      }, {});
      const formattedCategoryData = Object.entries(categoryCounts).map(
        ([category, count]) => ({ name: category, value: count })
      );
      setCategoryData(formattedCategoryData);

      // Daily purchase trend for the past 7 days
      const today = new Date();
      const last7DaysData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const count = response.filter(
          (purchase) => purchase.createdAt.split("T")[0] === dateStr
        ).length;

        return { date: dateStr, purchases: count };
      }).reverse();

      setDailyPurchaseData(last7DaysData);
    } catch (err) {
      console.error("Error fetching purchases:", err);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* SALES STATS */}
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            name="Total Revenue"
            icon={DollarSign}
            value={`₹${purchaseStats.totalRevenue}`}
            color="#6366F1"
          />
          <StatCard
            name="Avg. Purchase Value"
            icon={ShoppingCart}
            value={`₹${purchaseStats.averageOrderValue}`}
            color="#10B981"
          />
          <StatCard
            name="Purchase Rate"
            icon={TrendingUp}
            value={purchaseStats.conversionRate}
            color="#F59E0B"
          />
          <StatCard
            name="Purchase Growth"
            icon={CreditCard}
            value={purchaseStats.salesGrowth}
            color="#EF4444"
          />
        </motion.div>

        <PurchaseOverviewChart data={purchases} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <PurchaseByCategoryChart data={categoryData} />
          <DailyPurchaseTrend data={dailyPurchaseData} />
        </div>
      </main>
    </div>
  );
};

export default PurchaseAnalytics;
