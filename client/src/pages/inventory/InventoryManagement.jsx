import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// api services
import { getWarehouseById, getWarehouses } from "@/services/warehouseService";

// icons
import { ChevronDown } from "lucide-react";

const InventoryTable = ({
  selectedTab,
  data,
  type,
  onItemClick,
  itemHistory,
}) => {
  if (!data?.length) {
    return (
      <div className="text-gray-500 p-8 text-center">
        No items in {type} inventory.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Item ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Item Name
            </th>
            {selectedTab !== "billed" && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Pickup
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            {type === "booked" && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Virtual Quantity
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <React.Fragment key={index}>
              <tr
                className="hover:bg-gray-50 cursor-pointer transition-colors group"
                // onClick={() => onItemClick(item.item?._id)}
              >
                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">
                  {item.item?._id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.item?.materialdescription}
                </td>
                {selectedTab !== "billed" && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {String(item.pickup)?.charAt(0).toUpperCase() +
                      String(item.pickup).slice(1)}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.quantity}
                </td>
                {type === "booked" && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.virtualQuantity}
                  </td>
                )}
                <td>
                  <Link
                    to={`/${item.item?._id}/${
                      selectedTab === "booked" ? "sold" : selectedTab
                    }${
                      selectedTab === "virtual" || selectedTab === "booked"
                        ? `/${item.pickup}`
                        : ""
                    }`}
                    className="relative right-6 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    View History
                  </Link>
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export function Inventory() {
  const [currentWarehouse, setCurrentWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("virtual");
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [pickupFilter, setPickupFilter] = useState("all");
  const [itemHistory, setItemHistory] = useState([]);
  const [cityFilter, setCityFilter] = useState("all");
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const warehousesData = await getWarehouses();
        setWarehouses(warehousesData.filter((warehouse) => warehouse.isActive));

        const uniqueCities = [
          ...new Set(
            warehousesData.map((warehouse) => warehouse.location?.city)
          ),
        ];
        setCities(uniqueCities);

        if (
          warehousesData.filter((warehouse) => warehouse.isActive).length > 0
        ) {
          setSelectedWarehouse(
            warehousesData.filter((warehouse) => warehouse.isActive)[0]._id
          );
          const warehouse = await getWarehouseById(warehousesData[0]._id);
          setCurrentWarehouse(warehouse);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchWarehouseData = async () => {
      if (selectedWarehouse) {
        try {
          const warehouse = await getWarehouseById(selectedWarehouse);
          setCurrentWarehouse(warehouse);
        } catch (err) {
          console.error(err);
        }
      }
    };

    fetchWarehouseData();
  }, [selectedWarehouse]);

  const getFilteredInventory = (type) => {
    if (!currentWarehouse) return [];

    const inventory =
      type === "virtual"
        ? currentWarehouse.virtualInventory
        : type === "billed"
        ? currentWarehouse.billedInventory
        : currentWarehouse.soldInventory;

    return pickupFilter === "all"
      ? inventory
      : inventory.filter((item) => item.pickup === pickupFilter);
  };

  const filteredWarehouses =
    cityFilter === "all"
      ? warehouses
      : warehouses.filter(
          (warehouse) => warehouse.location?.city === cityFilter
        );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 p-4 bg-white border-r border-gray-200 mt-5">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Select city
          </h2>
          <div className="space-y-2">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="all">All Cities</option>
              {cities?.map((city, index) => (
                <option key={index} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Warehouses</h2>
          <div className="space-y-2">
            {filteredWarehouses?.map((warehouse) => (
              <button
                key={warehouse._id}
                onClick={() => setSelectedWarehouse(warehouse._id)}
                className={`w-full px-3 py-2 text-left rounded-md shadow-sm ${
                  selectedWarehouse === warehouse._id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {warehouse.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between px-4">
              <div className="flex space-x-4">
                {["virtual", "billed", "booked"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`py-4 px-4 text-sm font-medium border-b-2 ${
                      selectedTab === tab
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {selectedTab !== "billed" && (
                <div className="relative">
                  <select
                    value={pickupFilter}
                    onChange={(e) => setPickupFilter(e.target.value)}
                    className="appearance-none w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Pickups</option>
                    <option value="rack">Rack</option>
                    <option value="depot">Depot</option>
                    <option value="plant">Plant</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : !currentWarehouse ? (
              <div className="text-center text-gray-500 py-12">
                Please select a warehouse to view inventory
              </div>
            ) : (
              <div className="overflow-hidden">
                <InventoryTable
                  selectedTab={selectedTab}
                  data={getFilteredInventory(selectedTab)}
                  type={selectedTab}
                  // onItemClick={handleItemClick}
                  // expandedItem={expandedItem}
                  itemHistory={itemHistory}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inventory;
