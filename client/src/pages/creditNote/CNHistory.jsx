import React, { useState, useEffect } from "react";
import {
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from "@material-tailwind/react";
import { toast } from "sonner";
import Datepicker from "react-tailwindcss-datepicker";
import * as XLSX from "xlsx";

// api services
import { getCN } from "@/services/creditNoteService";
import { updateCNStatus } from "@/services/creditNoteService";

// icons
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";
import excel from "../../assets/excel.svg";

export function CNHistory() {
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCNs, setOpenCNs] = useState(new Set());
  const [timePeriod, setTimePeriod] = useState("All");
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchCreditNotes = async () => {
      try {
        const response = await getCN();
        let filteredCNs = response.data?.data;

        if (timePeriod !== "All") {
          const now = new Date();
          let filterDate;

          if (timePeriod === "last7Days") {
            filterDate = new Date(now.setDate(now.getDate() - 7));
          } else if (timePeriod === "last30Days") {
            filterDate = new Date(now.setDate(now.getDate() - 30));
          } else if (
            timePeriod === "custom" &&
            dateRange.startDate &&
            dateRange.endDate
          ) {
            filterDate = new Date(dateRange.startDate);
          }
          filteredCNs = filteredCNs.filter(
            (cn) => new Date(cn.createdAt) >= filterDate
          );
        }

        if (searchQuery) {
          filteredCNs = filteredCNs.filter((cn) =>
            cn.creditNoteNumber
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          );
        }

        setCreditNotes(
          filteredCNs.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
        );
      } catch (error) {
        setError("Failed to fetch credit notes");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCreditNotes();
  }, [timePeriod, dateRange, searchQuery]);

  const formatDate = (date) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${d.getFullYear()}`;
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

  const handleDownloadExcel = () => {
    const formattedCNs = creditNotes.flatMap((cn) =>
      cn.items.map((item) => ({
        "Credit Note Number": cn.creditNoteNumber,
        "Created At": formatTimestamp(cn.createdAt),
        "Updated At": formatTimestamp(cn.updatedAt),
        "Invoice Date": formatDate(cn.invoiceDate),
        "Booking ID": cn.totalSaleId?.sales?.[0] || "",
        "Total Amount": cn.totalSaleId?.totalAmount || 0,
        Transport: cn.transporterId?.transport || "",
        // Item Details
        "Item ID": item.itemId?.itemId || "",
        "Item Name": item.itemId?.material || "",
        "Material Description": item.itemId?.materialdescription || "",
        Flavor: item.itemId?.flavor || "",
        "Net Weight": item.itemId?.netweight || 0,
        "Gross Weight": item.itemId?.grossweight || 0,
        GST: item.itemId?.gst || 0,
        Packaging: item.itemId?.packaging || "",
        "Pack Size": item.itemId?.packsize || "",
        "Static Price": item.itemId?.staticPrice || 0,
        Quantity: item.quantity || 0,
        Status: item.status || "",
        Reason: item.reason || "",
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(formattedCNs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Credit Notes");

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = {};
    formattedCNs.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const length = Math.min(String(row[key]).length, maxWidth);
        colWidths[key] = Math.max(colWidths[key] || 0, length);
      });
    });
    worksheet["!cols"] = Object.keys(formattedCNs[0]).map((key) => ({
      wch: Math.max(key.length, colWidths[key]),
    }));

    XLSX.writeFile(workbook, "CreditNotes.xlsx");
    toast.success("Credit note history downloaded successfully!");
  };

  const toggleCN = (cnId) => {
    setOpenCNs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cnId)) {
        newSet.delete(cnId);
      } else {
        newSet.add(cnId);
      }
      return newSet;
    });
  };

  const handleSettleCN = async (cnId) => {
    try {
      const response = await updateCNStatus(cnId);
      console.log(response);
      if (response.success) {
        toast.success("Credit note settled successfully!");
        // Refresh the credit notes list
        const updatedResponse = await getCN();
        setCreditNotes(updatedResponse.data?.data || []);
      } else {
        toast.error(response.message || "Failed to settle credit note");
      }
    } catch (error) {
      toast.error("Failed to settle credit note");
      console.error(error);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={handleDownloadExcel}
          className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          <img src={excel} alt="Download as Excel" className="w-5 mr-2" />
          Download Excel
        </button>
        <div className="flex gap-4">
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="All">All Time</option>
            <option value="last7Days">Last 7 Days</option>
            <option value="last30Days">Last 30 Days</option>
            <option value="custom">Custom</option>
          </select>
          {timePeriod === "custom" && (
            <Datepicker
              value={dateRange}
              onChange={setDateRange}
              className="w-full max-w-xs"
            />
          )}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Credit Note No."
            className="w-[200px] border-2 border-[#737373] px-3 py-2 rounded-md placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <Typography className="text-center text-blue-gray-500">
          Loading...
        </Typography>
      ) : error ? (
        <Typography className="text-center text-red-500">{error}</Typography>
      ) : creditNotes.length > 0 ? (
        <div className="shadow overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                {[
                  "Created At",
                  "Credit Note No",
                  "Invoice Date",
                  "Transport",
                  "Status",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-2 border-b font-medium text-center"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {creditNotes.map((cn) => {
                const isOpen = openCNs.has(cn._id);
                return (
                  <React.Fragment key={cn._id}>
                    <tr className="hover:bg-gray-50 border-b">
                      <td className="px-4 py-2 text-center">
                        {formatTimestamp(cn.createdAt)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {cn.creditNoteNumber}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {formatDate(cn.invoiceDate)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {cn.transporterId?.transport}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Chip
                          size="sm"
                          variant="ghost"
                          value={cn.status || "issued"}
                          color={cn.status === "settled" ? "green" : "blue"}
                        />
                      </td>
                      <td className="px-4 py-2 text-center flex justify-center gap-2">
                        {cn.status !== "settled" ? (
                          <Tooltip
                            content="Settle Credit Note"
                            placement="top"
                            className="bg-gray-900 px-4 py-2 rounded-md text-white text-sm"
                            animate={{
                              mount: { scale: 1, y: 0 },
                              unmount: { scale: 0, y: 25 },
                            }}
                          >
                            <button
                              onClick={() => handleSettleCN(cn._id)}
                              className="px-3 py-1 rounded-full bg-green-100 hover:bg-green-200 text-green-600 font-medium text-sm transition-all duration-300 flex items-center gap-1 border border-green-200 hover:shadow-md"
                            >
                              <CheckIcon className="h-4 w-4" />
                              <span>Settle</span>
                            </button>
                          </Tooltip>
                        ) : (
                          <Tooltip
                            content="Credit Note Settled"
                            placement="top"
                            className="bg-gray-900 px-4 py-2 rounded-md text-white text-sm"
                            animate={{
                              mount: { scale: 1, y: 0 },
                              unmount: { scale: 0, y: 25 },
                            }}
                          >
                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium text-sm flex items-center gap-1">
                              <CheckIcon className="h-4 w-4 text-green-500" />
                              <span>Settled</span>
                            </span>
                          </Tooltip>
                        )}
                        <IconButton
                          variant="text"
                          onClick={() => toggleCN(cn._id)}
                          className="bg-gray-200 hover:bg-gray-300 transition"
                        >
                          {isOpen ? (
                            <ChevronUpIcon className="h-5 w-5 text-gray-600" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                          )}
                        </IconButton>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-gray-100">
                        <td colSpan="5" className="p-4">
                          <div className="mb-2">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-3 py-1 rounded-t-lg">
                              Booking ID: {cn.totalSaleId?.sales?.[0]}
                            </span>
                          </div>
                          <div className="bg-white rounded-b-lg border border-gray-200">
                            <table className="min-w-full">
                              <thead>
                                <tr>
                                  {[
                                    "Item Name",
                                    "Item ID",
                                    "Quantity",
                                    "Reason",
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
                                {cn.items.map((item) => (
                                  <tr
                                    key={item._id}
                                    className="hover:bg-gray-100"
                                  >
                                    <td className="px-2 py-1 text-center">
                                      {item.itemId?.material}
                                    </td>
                                    <td className="px-2 py-1 text-center">
                                      {item.itemId?._id}
                                    </td>
                                    <td className="px-2 py-1 text-center">
                                      {item.quantity}
                                    </td>
                                    <td className="px-2 py-1 text-center">
                                      {item.reason}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
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
        <p className="text-center text-lg text-gray-500 mt-20">
          No credit notes found!
        </p>
      )}
    </div>
  );
}

export default CNHistory;
