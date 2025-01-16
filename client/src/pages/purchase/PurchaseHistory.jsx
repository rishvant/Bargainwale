import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  IconButton,
  Tooltip,
  Card,
} from "@material-tailwind/react";
import Datepicker from "react-tailwindcss-datepicker";
import * as XLSX from "xlsx";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useOrganization } from "@clerk/clerk-react";

// utils
import PurchaseInvoice from "@/components/purchase/PurchaseInvoice";
import Invoice from "@/components/purchase/Invoice";

// api services
import { getPurchases } from "@/services/purchaseService";

// icons
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { FaDownload, FaFileExcel, FaFilter } from "react-icons/fa";
import excel from "../../assets/excel.svg";

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openPurchase, setOpenPurchase] = useState(null);
  const [timePeriod, setTimePeriod] = useState("All");
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [selectedTransporter, setSelectedTransporter] = useState("All");
  const [selectedWarehouse, setSelectedWarehouse] = useState("All");
  const [showInvoice, setShowInvoice] = useState(false);

  const invoiceRef = useRef();

  const fetchPurchases = async () => {
    try {
      const response = await getPurchases();
      const purchasesData = response.data;
      purchasesData?.sort((a, b) => {
        const invoiceDateComparison =
          new Date(b.invoiceDate) - new Date(a.invoiceDate);
        if (invoiceDateComparison !== 0) {
          return invoiceDateComparison;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setPurchases(purchasesData);
      setFilteredPurchases(purchasesData);
    } catch (error) {
      console.log(error);
      setError("Failed to fetch purchases");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadClick = (purchase) => {
    setShowInvoice(true);
    if (invoiceRef.current) {
      invoiceRef.current.handleDownloadPDF(purchase._id);
    }
    setShowInvoice(false);
  };

  const applyFilters = () => {
    let filtered = [...purchases];
    if (selectedTransporter !== "All") {
      filtered = filtered.filter(
        (purchase) => purchase.transporterId?.transport === selectedTransporter
      );
    }
    if (selectedWarehouse !== "All") {
      filtered = filtered.filter(
        (purchase) => purchase.warehouseId?.name === selectedWarehouse
      );
    }
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      filtered = filtered.filter((purchase) => {
        const purchaseDate = new Date(purchase.invoiceDate);
        return purchaseDate >= start && purchaseDate <= end;
      });
    }
    setFilteredPurchases(filtered);
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedTransporter, selectedWarehouse, dateRange]);

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getFullYear()}`;
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

  const handleTogglePurchase = (purchaseId) => {
    setOpenPurchase(openPurchase === purchaseId ? null : purchaseId);
  };

  const { organization } = useOrganization();

  const handleDownloadExcel = () => {
    const formattedInvoices = purchases.flatMap((purchase) =>
      purchase.items.map((item) => ({
        "Invoice Number": purchase.invoiceNumber,
        "Invoice Date": formatDate(purchase.invoiceDate),
        "Order Number": purchase.orderId?.companyBargainNo || "",
        "Order Date": formatDate(purchase.orderId?.companyBargainDate || ""),
        "Transport Agency": purchase.transporterId?.transportAgency || "",
        "Transport Type": purchase.transporterId?.transportType || "",
        "Transport Contact": purchase.transporterId?.transportContact || "",
        "Warehouse Name": purchase.warehouseId?.name || "",
        "Warehouse Location": [
          purchase.warehouseId?.location?.addressLine1,
          purchase.warehouseId?.location?.addressLine2,
          purchase.warehouseId?.location?.city,
          purchase.warehouseId?.location?.state,
          purchase.warehouseId?.location?.pinCode,
        ]
          .filter(Boolean)
          .join(", "),
        "Item Material": item.itemId?.material || "",
        "Item Description": item.itemId?.materialdescription || "",
        "Item Flavor": item.itemId?.flavor || "",
        "Item Net Weight": item.itemId?.netweight || "",
        "Pickup Location": item.pickup || "",
        "Item Quantity": item.quantity,
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(formattedInvoices);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Purchases");
    XLSX.writeFile(workbook, "Purchases.xlsx");
    toast.success("Purchase history downloaded successfully!");
  };

  const uniqueTransporters = [
    ...new Set(purchases.map((p) => p.transporterId?.transport)),
  ];

  const uniqueWarehouses = [
    ...new Set(purchases.map((p) => p.warehouseId?.name)),
  ];

  return (
    <div className="mt-8 mb-8 flex flex-col gap-8 px-8">
      <Card className="p-6 shadow-lg rounded-lg bg-white border">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 mb-4">
            <FaFilter className="text-xl text-gray-700" />
            <Typography variant="h5" className="text-gray-700 font-semibold">
              Filter Purchases
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
              value={selectedTransporter}
              onChange={(e) => setSelectedTransporter(e.target.value)}
              className="border-2 border-gray-300 rounded px-4 py-2 w-full text-gray-700 focus:outline-none shadow-sm"
            >
              <option value="All">All Transporters</option>
              {uniqueTransporters.map((transporter) => (
                <option key={transporter} value={transporter}>
                  {transporter}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/3">
            <label className="block mb-2 text-gray-600">Warehouse</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="border-2 border-gray-300 rounded px-4 py-2 w-full text-gray-700 focus:outline-none shadow-sm"
            >
              <option value="All">All Warehouses</option>
              {uniqueWarehouses.map((warehouse) => (
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

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg mt-6">
        {loading ? (
          <Typography className="text-center text-gray-500 py-8">
            Loading...
          </Typography>
        ) : error ? (
          <Typography className="text-center text-red-600 py-8">
            {error}
          </Typography>
        ) : filteredPurchases?.length > 0 ? (
          <div className="shadow overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gradient-to-r from-blue-100 to-green-100 border-b border-gray-300">
                <tr>
                  {[
                    "Created At",
                    "Invoice Number",
                    "Invoice Date",
                    "Order Company Bargain No.",
                    "Warehouse",
                    "Transporter",
                    "Actions",
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
                {filteredPurchases.map((purchase) => {
                  const isOpen = openPurchase === purchase._id;
                  return (
                    <React.Fragment key={purchase._id}>
                      <tr className="hover:bg-gray-50 border-b">
                        <td className="px-4 py-2 text-center">
                          {formatTimestamp(purchase.createdAt)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {purchase.invoiceNumber}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {formatDate(purchase.invoiceDate)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {purchase.orderId?.companyBargainNo}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {purchase.warehouseId?.name}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {purchase.transporterId?.transport}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex justify-center gap-4">
                            <Tooltip
                              content={isOpen ? "Hide Details" : "View Details"}
                            >
                              <IconButton
                                variant="text"
                                onClick={() =>
                                  handleTogglePurchase(purchase._id)
                                }
                              >
                                {isOpen ? (
                                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                                ) : (
                                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                                )}
                              </IconButton>
                            </Tooltip>
                            <Tooltip content="Download Invoice">
                              {/* <PDFDownloadLink
                              document={
                                <PurchaseInvoice
                                  purchase={purchase}
                                  organization={organization.name}
                                />
                              }
                              fileName={`invoice_${purchase._id}.pdf`}
                            >
                              <FaDownload className="text-[1.4rem] cursor-pointer text-gray-600 hover:text-gray-800 transition duration-200" />
                            </PDFDownloadLink> */}
                              {/* <PDFDownloadLink
                              document={
                                <Invoice
                                  purchase={purchase}
                                  organization={organization}
                                />
                              }
                              fileName={`invoice_${purchase._id}.pdf`}
                            >
                              <FaDownload className="icon-class" />
                            </PDFDownloadLink>  */}
                              <div className="flex items-center justify-center">
                                <button onClick={()=> handleDownloadClick(purchase)}>
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
                                  <Invoice
                                    ref={invoiceRef}
                                    purchase={purchase}
                                    organization={organization}
                                  />
                                </div>
                              </div>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-gray-100">
                          <td colSpan="7" className="p-4">
                            <table className="min-w-full bg-gray-50">
                              <thead className="bg-gray-200">
                                <tr>
                                  {["Item Name", "Quantity", "Pickup"].map(
                                    (header) => (
                                      <th
                                        key={header}
                                        className="px-2 py-1 font-semibold text-gray-700"
                                      >
                                        {header}
                                      </th>
                                    )
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {purchase.items.map((item) => (
                                  <tr
                                    key={item._id}
                                    className="hover:bg-gray-100"
                                  >
                                    <td className="px-2 py-1 text-center">
                                      {item.itemId?.materialdescription}
                                    </td>
                                    <td className="px-2 py-1 text-center">
                                      {item.quantity}
                                    </td>
                                    <td className="px-2 py-1 text-center">
                                      {String(item.pickup)
                                        ?.charAt(0)
                                        .toUpperCase() +
                                        String(item.pickup).slice(1)}
                                    </td>
                                  </tr>
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
            No Purchases Found
          </Typography>
        )}
      </div>
    </div>
  );
}
