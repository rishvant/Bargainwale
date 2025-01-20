import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  IconButton,
  Tooltip,
  Card,
} from "@material-tailwind/react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import Datepicker from "react-tailwindcss-datepicker";
import * as XLSX from "xlsx";
import { MdDeleteOutline } from "react-icons/md";
import { HiOutlineDocumentDownload } from "react-icons/hi";
import excel from "../../assets/excel.svg";
import { deleteBooking, getBookings } from "@/services/bookingService";
import { getSales } from "@/services/salesService";
import { FaFilter, FaDownload } from "react-icons/fa";
import SalesInvoice from "@/components/sales/SalesInvoice";

export default function PurchaseHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSale, setOpenSale] = useState(null);
  const [timePeriod, setTimePeriod] = useState("All");
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [warehouseFilter, setWarehouseFilter] = useState("All");
  const [transporterFilter, setTransporterFilter] = useState("All");
  const [itemFilter, setItemFilter] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);

  const invoiceRef = useRef();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    // const hours = date.getHours();
    // const minutes = date.getMinutes().toString().padStart(2, "0");
    // const ampm = hours >= 12 ? "PM" : "AM";
    // const formattedHours = hours % 12 || 12;
    // const dayWithSuffix =
    //   day +
    //   ["th", "st", "nd", "rd"][
    //     day % 10 > 3 || ~~(day / 10) === 1 ? 0 : day % 10
    //   ];
    return `${day} ${month} ${year}`;
  };

  const formatDateWithTime = (dateString) => {
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

  function formatTimestamp(isoTimestamp) {
    const date = new Date(isoTimestamp);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  const fetchSales = async () => {
    try {
      const response = await getSales();
      const sortedData = response.data?.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setSales(sortedData);
    } catch (error) {
      setError("Failed to fetch sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const warehouses = [
    "All",
    ...new Set(sales.map((sale) => sale.warehouseId?.name).filter(Boolean)),
  ];

  const transporters = [
    "All",
    ...new Set(
      sales.map((sale) => sale.transporterId?.transport).filter(Boolean)
    ),
  ];

  const filteredSales = sales.filter((sale) => {
    const matchesWarehouse =
      warehouseFilter === "All" || sale.warehouseId?.name === warehouseFilter;
    const matchesTransporter =
      transporterFilter === "All" ||
      sale.transporterId?.transport === transporterFilter;
    const matchesDateRange =
      (!dateRange.startDate ||
        new Date(sale.invoiceDate) >= new Date(dateRange.startDate)) &&
      (!dateRange.endDate ||
        new Date(sale.invoiceDate) <= new Date(dateRange.endDate));
    const matchesItem =
      !itemFilter ||
      sale.items.some((item) =>
        item.itemId?.materialdescription
          ?.toLowerCase()
          .includes(itemFilter.toLowerCase())
      );

    return (
      matchesWarehouse && matchesTransporter && matchesDateRange && matchesItem
    );
  });

  const handleDownloadExcel = () => {
    const formattedSales = filteredSales.map((sale) => ({
      "Invoice Date": formatDate(sale.invoiceDate),
      "Invoice Number": sale.invoiceNumber,
      "Buyer Name": sale.buyer?.name,
      Warehouse: sale.warehouseId?.name,
      Transporter: sale.transporterId?.transport,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedSales);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales History");
    XLSX.writeFile(workbook, "Sales_History.xlsx");
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this sale?"
    );
    if (!confirmDelete) return;

    try {
      await deleteBooking(id);
      fetchSales();
      toast.error("Sale deleted");
    } catch (err) {
      console.log("Error:", err);
    }
  };

  const handleToggleSale = (saleId) => {
    setOpenSale(openSale === saleId ? null : saleId);
  };

  const handleDownloadClick = (sale) => {
    setShowInvoice(true);
    if (invoiceRef.current) {
      invoiceRef.current.handleDownloadPDF(sale._id);
    }
    setShowInvoice(false);
  };

  return (
    <div className="mt-8 mb-8 flex flex-col gap-8 px-7">
      <Card className="p-6 shadow-lg rounded-lg bg-white border">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 mb-4">
            <FaFilter className="text-xl text-gray-700" />
            <Typography variant="h5" className="text-gray-700 font-semibold">
              Filter Sales
            </Typography>
          </div>
          <button
            onClick={handleDownloadExcel}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            <img src={excel} alt="Download as Excel" className="w-5 mr-2" />
            Download Excel
          </button>
        </div>

        <div className="flex flex-wrap gap-6 mb-6">
          <div className="w-full md:w-1/3">
            <label className="block mb-2 text-gray-600">Time Period</label>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="border-2 border-gray-300 rounded px-4 py-2 w-full text-gray-700 focus:outline-none shadow-sm"
            >
              <option value="All">All Time</option>
              <option value="last7Days">Last 7 Days</option>
              <option value="last30Days">Last 30 Days</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="w-full md:w-1/3">
            <label className="block mb-2 text-gray-600">Transporter</label>
            <select
              value={transporterFilter}
              onChange={(e) => setTransporterFilter(e.target.value)}
              className="border-2 border-gray-300 rounded px-4 py-2 w-full text-gray-700 focus:outline-none shadow-sm"
            >
              {transporters.map((transporter) => (
                <option key={transporter} value={transporter}>
                  {transporter}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/3">
            <label className="block mb-2 text-gray-600">Warehouse</label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="border-2 border-gray-300 rounded px-4 py-2 w-full text-gray-700 focus:outline-none shadow-sm"
            >
              {warehouses.map((warehouse) => (
                <option key={warehouse} value={warehouse}>
                  {warehouse}
                </option>
              ))}
            </select>
          </div>

          {timePeriod === "custom" && (
            <div className="w-full md:w-1/3">
              <label className="block mb-2 text-gray-600">Date Range</label>
              <Datepicker
                value={dateRange}
                onChange={(newValue) => setDateRange(newValue)}
                showShortcuts
                className="w-full shadow-md"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Sales Table */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg mt-6">
        {loading ? (
          <Typography className="text-center text-blue-gray-600">
            Loading...
          </Typography>
        ) : error ? (
          <Typography className="text-center text-red-600">{error}</Typography>
        ) : filteredSales.length > 0 ? (
          <div className="shadow overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gradient-to-r from-blue-100 to-green-100 border-b border-gray-300">
                <tr>
                  {[
                    "Sale Id",
                    "Invoice Date",
                    "Created At",
                    "Total Amount",
                    "Sales Details",
                  ].map((header) => (
                    <th
                      key={header}
                      className="py-4 text-center text-gray-800 font-semibold"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const isOpen = openSale === sale._id;
                  return (
                    <React.Fragment key={sale._id}>
                      <tr className="hover:bg-gray-50 border-b">
                        <td className="px-4 py-2 text-center">{sale._id}</td>
                        <td className="px-4 py-2 text-center">
                          {formatDate(sale.invoiceDate)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {formatDateWithTime(sale.createdAt)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          ₹{sale.totalAmount}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex justify-center gap-4">
                            <Tooltip
                              content={
                                isOpen ? "Hide Details" : "View Sales Details"
                              }
                            >
                              <IconButton
                                variant="text"
                                onClick={() => handleToggleSale(sale._id)}
                              >
                                {isOpen ? (
                                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                                ) : (
                                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                                )}
                              </IconButton>
                            </Tooltip>
                            <Tooltip content="Download Invoice">
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() => handleDownloadClick(sale)}
                                >
                                  <FaDownload className="text-[1.2rem]" />
                                </button>
                                <div
                                  style={{
                                    visibility: "hidden",
                                    position: "absolute",
                                    top: "-9999px",
                                    left: "-9999px",
                                  }}
                                >
                                  <SalesInvoice ref={invoiceRef} sale={sale} />
                                </div>
                              </div>
                            </Tooltip>
                          </div>
                        </td>
                        {/* <td className="px-4 py-2 text-center">
                          <Tooltip content="Delete Sale">
                            <span>
                              <MdDeleteOutline
                                onClick={() => handleDelete(sale._id)}
                                className="text-2xl text-red-600 hover:text-white hover:bg-red-600 p-1 rounded transition"
                              />
                            </span>
                          </Tooltip>
                        </td> */}
                      </tr>

                      {isOpen && (
                        <tr className="bg-gray-100">
                          <td colSpan="5" className="p-4">
                            <table className="min-w-full bg-gray-50">
                              <thead className="bg-gray-200">
                                <tr>
                                  {[
                                    "Booking ID",
                                    "Item ID",
                                    "Pickup",
                                    "Quantity",
                                  ].map((header) => (
                                    <th
                                      key={header}
                                      className="px-2 py-1 font-semibold text-gray-700"
                                    >
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {sale.sales.map((saleItem) => (
                                  <React.Fragment key={saleItem._id}>
                                    {saleItem.items.map((item) => (
                                      <tr
                                        key={item._id}
                                        className="hover:bg-gray-100"
                                      >
                                        <td className="px-2 py-1 text-center">
                                          {saleItem.bookingId.BargainNo}
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                          {item.itemId._id}
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                          {String(item.pickup)
                                            .charAt(0)
                                            .toUpperCase() +
                                            String(item.pickup).slice(1)}
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                          {item.quantity}
                                        </td>
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Typography className="text-center text-gray-500 py-8">
            No Sales found
          </Typography>
        )}
      </div>
    </div>
  );
}
