import React, { useState, useMemo, useEffect } from "react";
import {
  Package,
  Factory,
  Warehouse,
  ShoppingCart,
  User,
  ArrowRight,
  Truck,
  Clock,
  Calendar,
  Filter,
} from "lucide-react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";

const Timeline = () => {
  const [itemLoading, setItemLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedRange, setSelectedRange] = useState("all");
  const [item, setItem] = useState({});
  const [history, setHistory] = useState([]);
  const { id, inventory, pickup } = useParams();
  const orgId = localStorage.getItem("clerk_active_org");

  const fetchItem = async () => {
    setItemLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/${orgId}/items/${id}`);
      setItem(response.data);
      setItemLoading(false);
    } catch (err) {
      setItemLoading(false);
      console.log("Error:", err);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const baseUrl = `${API_BASE_URL}/${orgId}/itemhistory/${id}/${
        String(inventory).charAt(0).toUpperCase() + String(inventory).slice(1)
      }`;
      const url = pickup !== undefined ? `${baseUrl}/${pickup}` : baseUrl;
      const response = await axios.get(url);
      setHistory(
        response.data.data?.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
      );
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.log("Error:", err);
    }
  };

  useEffect(() => {
    fetchItem();
    fetchHistory();
  }, []);

  console.log(history);

  const getDateRange = (range) => {
    const end = new Date();
    const start = new Date();

    switch (range) {
      case "last7days":
        start.setDate(end.getDate() - 7);
        break;
      case "last30days":
        start.setDate(end.getDate() - 30);
        break;
      case "last90days":
        start.setDate(end.getDate() - 90);
        break;
      case "thisYear":
        start.setFullYear(end.getFullYear(), 0, 1);
        break;
      default:
        return { start: "", end: "" };
    }

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  const handleRangeChange = (e) => {
    const range = e.target.value;
    const { start, end } = getDateRange(range);
    setStartDate(start);
    setEndDate(end);
    setSelectedRange(range);
  };

  const filteredHistory = useMemo(() => {
    return history?.filter((item) => {
      const itemDate = new Date(item.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (end) {
        end.setHours(23, 59, 59, 999);
      }

      if (start && itemDate < start) return false;
      if (end && itemDate > end) return false;
      return true;
    });
  }, [history, startDate, endDate]);

  const totalQuantity = filteredHistory.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const uniqueTypes = new Set(
    filteredHistory.map((item) => item.inventoryType).filter(Boolean)
  );

  const getIcon = (model) => {
    switch (model) {
      case "Manufacturer":
        return <Factory className="w-6 h-6" />;
      case "Warehouse":
        return <Warehouse className="w-6 h-6" />;
      case "Order":
        return <ShoppingCart className="w-6 h-6" />;
      case "Booking":
        return <Package className="w-6 h-6" />;
      case "Buyer":
        return <User className="w-6 h-6" />;
      default:
        return <Package className="w-6 h-6" />;
    }
  };

  return (
    <>
      {/* Sticky Item Details Section */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : (
        item && (
          <div className="sticky w-full top-28 bg-white px-10 py-5 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium mt-4">
              Item History ({item.materialdescription})
            </h3>
            <h3 className="text-sm font-normal">
              {String(inventory).charAt(0).toUpperCase() +
                String(inventory).slice(1)}{" "}
              Inventory (
              {String(pickup).charAt(0).toUpperCase() + String(pickup).slice(1)}
              )
            </h3>
            <div className="grid grid-cols-5 mt-2">
              <div className="flex">
                <span className="text-gray-600">Item ID:</span>
                <span> {item._id}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600">Item Name:</span>
                <span> {item.materialdescription}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600">Material:</span>
                <span> {item.material}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600">Quantity:</span>
                <span> {item.quantity}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600">Packaging:</span>
                <span> {item.packaging}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600">Gross Weight:</span>
                <span> {item.grossweight} kg</span>
              </div>
              <div className="flex">
                <span className="text-gray-600">Net Weight:</span>
                <span> {item.netweight} kg</span>
              </div>
              <div className="flex">
                <span className="text-gray-600">GST:</span>
                <span> {item.gst}%</span>
              </div>
              <div className="flex">
                <span className="text-gray-600">HSN Code:</span>
                <span> {item.hsnCode}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600">Flavor:</span>
                <span> {item.flavor}</span>
              </div>
            </div>
          </div>
        )
      )}

      <div className="max-w-6xl mx-auto py-10">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Package className="w-6 h-6 text-blue-500 mr-2" />
              <h3 className="font-medium">Total Movements</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{filteredHistory.length}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <ArrowRight className="w-6 h-6 text-green-500 mr-2" />
              <h3 className="font-medium">Total Quantity</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{totalQuantity}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Package className="w-6 h-6 text-purple-500 mr-2" />
              <h3 className="font-medium">Inventory Types</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{uniqueTypes.size}</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center">
              <Filter className="w-5 h-5 text-gray-500 mr-2" />
              <span className="font-medium">Filter Timeline</span>
            </div>

            <div className="flex-1 flex flex-wrap gap-4 items-center">
              <select
                onChange={handleRangeChange}
                className="border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={selectedRange}
              >
                <option value="all">All Time</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="last90days">Last 90 Days</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom Range</option>
              </select>

              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex items-center">
                  <span className="mx-2">to</span>
                  <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.length > 0 ? (
              filteredHistory?.map((item, index) => {
                const date = new Date(item.createdAt)?.toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                );

                const time = new Date(item.createdAt)?.toLocaleTimeString(
                  "en-US",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

                return (
                  <div key={item._id} className="flex items-start mb-8">
                    <div className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          {getIcon(item.sourceModel)}
                        </div>
                        {index !== filteredHistory.length - 1 && (
                          <div className="w-0.5 h-16 bg-gray-200 my-2" />
                        )}
                      </div>
                    </div>

                    <div className="ml-6 flex-1">
                      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center text-gray-500">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>
                              {date} at {time}
                            </span>
                          </div>
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                            Quantity: {item.quantity}
                          </span>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              {getIcon(item.sourceModel)}
                              <div className="ml-3">
                                <span className="block font-medium">
                                  {item.sourceModel}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {item.sourceModel === "Manufacturer" ? (
                                    <span>{item.source?.manufacturer}</span>
                                  ) : item.sourceModel === "Order" ? (
                                    <span>{item.source?.companyBargainNo}</span>
                                  ) : item.sourceModel === "Warehouse" ? (
                                    <span>{item.source?.name}</span>
                                  ) : (
                                    <span>{item.source?.BargainNo}</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <ArrowRight className="w-6 h-6 text-gray-400 flex-shrink-0" />

                          <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              {getIcon(item.destinationModel)}
                              <div className="ml-3">
                                <span className="block font-medium">
                                  {item.destinationModel}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {item.destinationModel === "Warehouse" ? (
                                    <span>{item.destination?.name}</span>
                                  ) : (
                                    <span>{item.destination?.buyer}</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {item.pickup && (
                            <div className="flex items-center text-gray-600">
                              <Truck className="w-4 h-4 mr-2" />
                              Pickup:{" "}
                              {String(item.pickup)?.charAt(0).toUpperCase() +
                                String(item.pickup)?.slice(1)}
                            </div>
                          )}

                          {item.inventoryType && (
                            <div className="flex items-center text-gray-600">
                              <Package className="w-4 h-4 mr-2" />
                              Inventory Type: {item.inventoryType}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-lg text-gray-800 mt-20">
                No history found!
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Timeline;
