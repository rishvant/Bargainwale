import React, { useEffect, useState } from "react";
import { Spinner, Switch, Typography } from "@material-tailwind/react";
import { toast } from "sonner";
import { useOrganization } from "@clerk/clerk-react";
import * as XLSX from "xlsx";

// api services
import { getWarehouses } from "@/services/warehouseService";
import {
  getPricesByWarehouse,
  addPrice,
  getItemPriceHistoryById,
} from "@/services/itemService";

// icons
import { TbTriangleInvertedFilled } from "react-icons/tb";
import { FaLock } from "react-icons/fa";
import { FaLockOpen } from "react-icons/fa";
import excel from "../../assets/excel.svg";

// components
import StatisticsCards from "@/components/home/StatisticsCards";
import PriceChart from "@/components/home/PriceChart";
import Loader from "@/components/Loaders/MainLoader";

export default function Home() {
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedHistoryWarehouse, setSelectedHistoryWarehouse] = useState("");
  const [historyItems, setHistoryItems] = useState([]);
  const [historyItemsChart, setHistoryItemsChart] = useState([]);
  const [form, setForm] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const { organization } = useOrganization();

  const fetchWarehouseOptions = async () => {
    try {
      const response = await getWarehouses();
      const warehouses = response?.filter((warehouse) => warehouse.isActive);
      if (warehouses.length > 0) {
        setSelectedWarehouse(warehouses[0]._id);
        setSelectedHistoryWarehouse(warehouses[0]._id);
      }
      setWarehouseOptions(warehouses);
    } catch (error) {
      toast.error("Error fetching warehouses!");
      console.error(error);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchPricesForWarehouse = async (warehouseId) => {
    setLoading(true);
    try {
      const prices = await getPricesByWarehouse(warehouseId);
      const updatedItems = prices?.items
        ?.filter((item) => item.item?.isActive)
        ?.map((item) => ({
          ...item,
          originalCompanyPrice: item?.companyPrice,
          originalRackPrice: item?.rackPrice,
          originalDepotPrice: item?.depotPrice,
          originalPlantPrice: item?.plantPrice,
          locked: true,
        }));
      setForm(updatedItems);
    } catch (error) {
      console.error("Error fetching prices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPricesForHistory = async (warehouseId) => {
    try {
      const response = await getItemPriceHistoryById(warehouseId);
      setHistoryItems(
        response.priceHistory?.filter(
          (item) => item.warehouse?._id === warehouseId
        )
      );
      setHistoryItemsChart(
        response.priceHistory
          ?.filter((item) => item.warehouse?._id === warehouseId)
          .reverse()
      );
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  useEffect(() => {
    fetchWarehouseOptions();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchPricesForWarehouse(selectedWarehouse);
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    if (selectedHistoryWarehouse) {
      fetchPricesForHistory(selectedHistoryWarehouse);
    }
  }, [selectedHistoryWarehouse]);

  const handleInputChange = (index, event) => {
    const { name, value } = event.target;
    const updatedForm = [...form];
    updatedForm[index][name] = value;
    setForm(updatedForm);
  };

  const handleWarehouseChange = (event) => {
    setSelectedWarehouse(event.target.value);
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    const itemsToSubmit = form;
    const eligibleItems = form?.filter(
      (item) =>
        item.companyPrice &&
        String(item.companyPrice).trim() !== "" &&
        item.rackPrice &&
        String(item.rackPrice).trim() !== "" &&
        item.depotPrice &&
        String(item.depotPrice).trim() !== "" &&
        item.plantPrice &&
        String(item.plantPrice).trim() !== ""
    );
    if (itemsToSubmit?.length > 0) {
      if (eligibleItems.length === 0) {
        setSubmitLoading(false);
        toast.error("Fill all prices!");
        return;
      }

      const allLocked = form?.every((item) => item.locked);
      const pricesChanged = form?.some(
        (item) =>
          item.companyPrice !== item.originalCompanyPrice ||
          item.rackPrice !== item.originalRackPrice ||
          item.depotPrice !== item.originalDepotPrice ||
          item.plantPrice !== item.originalPlantPrice
      );

      if (allLocked && !pricesChanged) {
        setSubmitLoading(false);
        toast.error("Unlock items to modify prices.");
        return;
      }

      if (!pricesChanged) {
        setSubmitLoading(false);
        toast.error("Please enter new price values.");
        return;
      }
      try {
        const postData = {
          warehouseId: selectedWarehouse,
          prices: eligibleItems?.map((item) => ({
            itemId: item.item?._id,
            companyPrice: item.companyPrice,
            rackPrice: item.rackPrice,
            depotPrice: item.depotPrice,
            plantPrice: item.plantPrice,
            pricesUpdated: true,
          })),
          organization: localStorage.getItem("organizationId"),
        };
        await addPrice(postData);
        setSubmitLoading(false);
        toast.success("Prices updated successfully!");
        fetchPricesForWarehouse(selectedWarehouse);
        fetchPricesForHistory(selectedWarehouse);
      } catch (error) {
        console.error("Error updating prices:", error);
        setSubmitLoading(false);
        toast.error("Error updating prices!");
      }
    }
  };

  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedTime = currentDateTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const handleLockToggle = (index) => {
    const updatedForm = [...form];
    updatedForm[index].locked = !updatedForm[index].locked;
    setForm(updatedForm);
  };

  const handleDownloadExcel = () => {
    const formattedData = historyItems.map((item) => ({
      "Item Material": item.item?.material || "",
      "Item Flavor": item.item?.flavor || "",
      "Item ID": item._id,
      "Company Price (₹)": item.companyPrice,
      "Depot Price (₹)": item.depotPrice,
      "Plant Price (₹)": item.plantPrice,
      "Rack Price (₹)": item.rackPrice,
      "Date and Time": formatDate(item.effectiveDate),
      "Created At": formatDate(item.createdAt),
      "Updated At": formatDate(item.updatedAt),
      "Warehouse Name": item.warehouse?.name || "",
      "Warehouse Location": [
        item.warehouse?.location?.addressLine1,
        item.warehouse?.location?.addressLine2,
        item.warehouse?.location?.city,
        item.warehouse?.location?.state,
        item.warehouse?.location?.pinCode,
      ]
        .filter(Boolean)
        .join(", "),
      "Organization ID": item.organization,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(
      workbook,
      `Item Price History_${formatDate(Date.now())}.xlsx`
    );
    toast.success("Data downloaded successfully!");
  };

  if (pageLoading) {
    return <Loader />;
  }

  return (
    <div className="mt-8 px-12">
      <div className="flex justify-between items-center bg-gradient-to-r from-green-400 to-blue-500 rounded-lg shadow-lg p-6 text-white">
        <div>
          <h1 className="text-[1.5rem] font-bold">
            Welcome, {organization?.name && <span>{organization?.name}</span>}
          </h1>
          <p className="text-[1rem]">
            Here's what's happening with your organization today.
          </p>
          <div className="flex items-center gap-5 mt-3">
            <p className="text-[1.1rem]">Operations</p>
            <Switch color="green" />
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-semibold">{formattedDate}</span>
          <span className="text-xl">{formattedTime}</span>
        </div>
      </div>

      <br />
      <StatisticsCards />

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-300">
          <PriceChart data={historyItemsChart} />
        </div>

        <div className="flex flex-col bg-white rounded-lg shadow-lg border border-gray-300 p-6">
          <h1 className="text-xl font-semibold text-gray-700">
            Daily Item Price Update
          </h1>
          <div className="flex gap-5 items-center mt-3">
            <div className="relative w-full max-w-md">
              <select
                id="warehouseSelect"
                name="warehouseSelect"
                value={selectedWarehouse}
                onChange={handleWarehouseChange}
                className="appearance-none w-full bg-gray-100 border border-gray-400 text-gray-700 px-4 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <option value="">Select Warehouse</option>
                {warehouseOptions.map((option) => (
                  <option key={option._id} value={option._id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <TbTriangleInvertedFilled className="text-gray-500" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center mt-5">
              <p className="text-lg text-gray-500">Loading prices...</p>
            </div>
          ) : selectedWarehouse ? (
            <div className="mt-5">
              <table className="min-w-full bg-white border-t border-b border-gray-200 shadow">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">
                      Item Name
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">
                      Company Price
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">
                      Rack Price
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">
                      Depot Price
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">
                      Plant Price
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {form?.length > 0 &&
                    form?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-100">
                        <td className="px-4 py-2 border-t border-gray-200 break-all">
                          {item.item?.materialdescription || "Unknown Item"}
                        </td>
                        <td className="px-4 py-2 border-t border-gray-200">
                          <input
                            type="number"
                            name="companyPrice"
                            value={item.companyPrice}
                            onChange={(e) => handleInputChange(index, e)}
                            className="w-[80px] bg-gray-50 px-2 py-1 rounded-lg border border-gray-300"
                            placeholder="Company Price"
                            disabled={item.locked}
                          />
                        </td>
                        <td className="px-4 py-2 border-t border-gray-200">
                          <input
                            type="number"
                            name="rackPrice"
                            value={item.rackPrice}
                            onChange={(e) => handleInputChange(index, e)}
                            className="w-[80px] bg-gray-50 px-2 py-1 rounded-lg border border-gray-300"
                            placeholder="Rack Price"
                            disabled={item.locked}
                          />
                        </td>
                        <td className="px-4 py-2 border-t border-gray-200">
                          <input
                            type="number"
                            name="depotPrice"
                            value={item.depotPrice}
                            onChange={(e) => handleInputChange(index, e)}
                            className="w-[80px] bg-gray-50 px-2 py-1 rounded-lg border border-gray-300"
                            placeholder="Depot Price"
                            disabled={item.locked}
                          />
                        </td>
                        <td className="px-4 py-2 border-t border-gray-200">
                          <input
                            type="number"
                            name="plantPrice"
                            value={item.plantPrice}
                            onChange={(e) => handleInputChange(index, e)}
                            className="w-[80px] bg-gray-50 px-2 py-1 rounded-lg border border-gray-300"
                            placeholder="Plant Price"
                            disabled={item.locked}
                          />
                        </td>
                        <td className="px-4 py-2 border-t border-gray-200">
                          <button
                            onClick={() => handleLockToggle(index)}
                            className={`w-fit px-3 py-2 rounded-lg text-white ${
                              item.locked
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-red-500 hover:bg-red-600"
                            }`}
                          >
                            {item.locked ? (
                              <FaLock className="text-[1rem]" />
                            ) : (
                              <FaLockOpen className="text-[1rem]" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <button
                onClick={handleSubmit}
                className="mt-5 bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition"
              >
                {submitLoading ? <Spinner /> : "Save Prices"}
              </button>
            </div>
          ) : (
            <Typography className="text-center mt-6 text-lg text-gray-500">
              Select Warehouse!
            </Typography>
          )}
        </div>
      </div>

      {/* Price History Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 mt-8">
        <div className="flex items-center justify-between px-6 py-4 bg-gray-100 rounded-t-lg">
          <Typography className="text-lg font-semibold text-gray-700">
            Price History
          </Typography>
          <div className="flex items-center justify-end gap-8 w-1/2">
            <button
              onClick={handleDownloadExcel}
              className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              <img src={excel} alt="Download as Excel" className="w-5 mr-2" />
              Download Excel
            </button>
            <div className="relative w-full max-w-md">
              <select
                value={selectedHistoryWarehouse}
                onChange={(e) => setSelectedHistoryWarehouse(e.target.value)}
                className="appearance-none w-full bg-gray-100 border border-gray-400 text-gray-700 px-4 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <option value="">Select Warehouse</option>
                {warehouseOptions.map((option) => (
                  <option key={option._id} value={option._id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <TbTriangleInvertedFilled className="text-gray-500" />
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 overflow-x-auto">
          {selectedHistoryWarehouse ? (
            historyItems?.length > 0 ? (
              <table className="w-full bg-white rounded-lg shadow-md overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-center">
                    <th className="px-4 py-3">Date and Time</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Company Price</th>
                    <th className="px-4 py-3">Rack Price</th>
                    <th className="px-4 py-3">Depot Price</th>
                    <th className="px-4 py-3">Plant Price</th>
                  </tr>
                </thead>
                <tbody>
                  {historyItems?.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b last:border-0 hover:bg-blue-50 text-center transition duration-300"
                    >
                      <td className="px-4 py-3 text-gray-700">
                        {formatDate(item.effectiveDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.item?.material}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.companyPrice}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.rackPrice}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.depotPrice}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.plantPrice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Typography className="text-center mt-6 text-lg text-gray-500">
                No Items Found!
              </Typography>
            )
          ) : (
            <Typography className="text-center mt-6 text-lg text-gray-500">
              Select Warehouse!
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
}
