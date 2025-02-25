import { Button, Spinner } from "@material-tailwind/react";
import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import Select from "react-select";

// api services
import { getTransport } from "@/services/masterService";
import { getSales } from "@/services/salesService";
import { createCN } from "@/services/creditNoteService";

// icons
import { LuAsterisk } from "react-icons/lu";
import { AiOutlineSearch } from "react-icons/ai";

const CreateCN = () => {
  const [loading, setLoading] = useState(false);
  const [selectTransportOptions, setSelectTransportOptions] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState({});
  const [quantityInputs, setQuantityInputs] = useState([]);
  const [inputQuantityInputs, setInputQuantityInputs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    transporterId: "",
    invoiceNumber: "",
    invoiceDate: "",
    items: [],
    organization: localStorage.getItem("clerk_active_org"),
  });

  const fetchSales = async () => {
    try {
      const response = await getSales();
      const salesData = response.data;
      setSales(salesData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesBargainNo = sale.companyBargainNo
        ?.toLowerCase()
        ?.includes(searchQuery.toLowerCase());
      const matchesItemName = sale.items?.some((item) =>
        item.item?.materialdescription
          ?.toLowerCase()
          ?.includes(searchQuery.toLowerCase())
      );

      return matchesBargainNo || matchesItemName;
    });
  }, [sales, searchQuery]);

  const fetchTransportOptions = async () => {
    try {
      const response = await getTransport();
      const formattedOptions = response
        ?.filter((transport) => transport.isActive)
        ?.map((item) => ({
          value: item._id,
          label: item.transport,
        }));
      setSelectTransportOptions(formattedOptions);
    } catch (error) {
      toast.error("Error fetching transports!");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchTransportOptions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedSale) {
        toast.error("Please select an item before submitting.");
        setLoading(false);
        return;
      }

      if (
        quantityInputs.length === 0 ||
        quantityInputs.some(
          (input) => input.quantity === null || input.reason === ""
        )
      ) {
        toast.error(
          "Please enter quantity and reason for at least one item in the selected order."
        );
        setLoading(false);
        return;
      }

      const updatedForm = {
        ...form,
        totalSaleId: selectedSale._id,
        items: quantityInputs.map((input) => ({
          itemId: input.itemId,
          quantity: input.quantity,
          reason: input.reason,
        })),
      };

      const response = await createCN(updatedForm);
      if (response?.status === 201) {
        toast.success("Purchase created successfully!");
        setForm({
          warehouseId: "",
          transporterId: "",
          invoiceNumber: "",
          invoiceDate: "",
          items: [],
          organization: localStorage.getItem("clerk_active_org"),
        });
        setQuantityInputs([]);
        setInputQuantityInputs([]);
        setSelectedSale({});
        fetchSales();
      } else {
        toast.error(`Unexpected status code: ${response?.status}`);
        console.error("Unexpected response:", response);
      }
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 400) {
          toast.error(data.error?.message || data.message);
        } else if (status === 401) {
          toast.error("Unauthorized: Please log in again.");
        } else if (status === 500) {
          toast.error("Internal server error: Please try again later.");
        } else {
          toast.error(`Error: ${data?.message || "Something went wrong!"}`);
        }
        console.error("Server-side error:", error.response);
      } else if (error.request) {
        toast.error("Network error: Unable to reach the server.");
        console.error("Network error:", error.request);
      } else {
        toast.error("Error: Something went wrong!");
        console.error("Error:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (index, fieldName, value) => {
    if (fieldName === "items") {
      const updatedItems = [...form.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [fieldName]: value,
      };
      setForm((prevData) => ({
        ...prevData,
        items: updatedItems,
      }));
    } else if (fieldName === "invoiceDate") {
      const formattedDate = value.split("T")[0];
      setForm((prevData) => ({
        ...prevData,
        [fieldName]: formattedDate,
      }));
    } else {
      if (fieldName === "warehouseId" || fieldName === "transporterId") {
        setForm((prevData) => ({
          ...prevData,
          [fieldName]: value.value,
        }));
      } else {
        setForm((prevData) => ({
          ...prevData,
          [fieldName]: value,
        }));
      }
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error("Invalid date");
    }
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleSaleSelect = (sale) => {
    if (selectedSale._id === sale._id) {
      setSelectedSale({});
    } else {
      setSelectedSale(sale);
      setQuantityInputs([]);
      setInputQuantityInputs([]);
    }
  };

  const handleQuantityChange = (item, value, pickup, field) => {
    const uniqueKey = `${item._id}-${pickup}`;

    setQuantityInputs((prevInputs) => {
      const existingItem = prevInputs.find((input) => input.key === uniqueKey);

      const updatedInputs = existingItem
        ? prevInputs.map((input) =>
            input.key === uniqueKey
              ? {
                  ...input,
                  [field]: field === "quantity" ? Number(value) : value,
                }
              : input
          )
        : [
            ...prevInputs,
            {
              key: uniqueKey,
              itemId: item.itemId._id,
              pickup,
              quantity: field === "quantity" ? Number(value) : null,
              reason: field === "reason" ? value : "",
            },
          ];

      return updatedInputs;
    });

    setInputQuantityInputs((prevInputs) => {
      const existingItem = prevInputs.find((input) => input.key === uniqueKey);

      const updatedInputs = existingItem
        ? prevInputs.map((input) =>
            input.key === uniqueKey
              ? {
                  ...input,
                  [field]: field === "quantity" ? Number(value) : value,
                }
              : input
          )
        : [
            ...prevInputs,
            {
              key: uniqueKey,
              itemId: item._id,
              pickup,
              quantity: field === "quantity" ? Number(value) : null,
              reason: field === "reason" ? value : "",
            },
          ];
      return updatedInputs;
    });
  };

  return (
    <div className="w-full mt-8 mb-8 flex flex-col gap-12">
      <div className="px-7">
        <div className="w-full">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 mt-4 mb-5 bg-white border-[2px] border-[#737373] p-5 bg-white shadow-md"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-x-16 gap-y-5">
                {/* <div className="flex gap-2 items-center">
                  <label
                    htmlFor="warehouseId"
                    className="flex text-[#38454A] text-[1rem]"
                  >
                    Warehouse
                    <LuAsterisk className="text-[#FF0000] text-[0.7rem]" />
                  </label>
                  <Select
                    className="relative w-[180px]"
                    options={selectWarehouseOptions}
                    value={
                      selectWarehouseOptions.find(
                        (option) => option.value === form.warehouseId
                      ) || null
                    }
                    onChange={(selectedOption) =>
                      handleFormChange(0, "warehouseId", selectedOption)
                    }
                  />
                </div> */}

                <div className="w-fit flex gap-2 items-center">
                  <label
                    htmlFor="invoiceNumber"
                    className="flex text-[#38454A] text-[1rem]"
                  >
                    Invoice No.
                    <LuAsterisk className="text-[#FF0000] text-[0.7rem]" />
                  </label>
                  <input
                    name="invoiceNumber"
                    type="text"
                    value={form.invoiceNumber}
                    onChange={(e) =>
                      handleFormChange(0, "invoiceNumber", e.target.value)
                    }
                    required
                    placeholder="Invoice No."
                    className="border-2 border-[#CBCDCE] px-2 py-1 rounded-md placeholder-[#737373]"
                  />
                </div>

                <div className="w-fit flex gap-2 items-center">
                  <label
                    htmlFor="invoiceDate"
                    className="flex text-[#38454A] text-[1rem]"
                  >
                    Invoice Date
                    <LuAsterisk className="text-[#FF0000] text-[0.7rem]" />
                  </label>
                  <input
                    name="invoiceDate"
                    type="date"
                    value={form.invoiceDate}
                    onChange={(e) =>
                      handleFormChange(0, "invoiceDate", e.target.value)
                    }
                    required
                    className="border-2 border-[#CBCDCE] px-2 py-1 rounded-md"
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <label
                    htmlFor="transporterId"
                    className="flex text-[#38454A] text-[1rem]"
                  >
                    Transport
                    <LuAsterisk className="text-[#FF0000] text-[0.7rem]" />
                  </label>
                  <Select
                    className="relative w-[180px]"
                    options={selectTransportOptions}
                    value={
                      selectTransportOptions.find(
                        (option) => option.value === form.transporterId
                      ) || null
                    }
                    onChange={(selectedOption) =>
                      handleFormChange(0, "transporterId", selectedOption)
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  color="blue"
                  type="submit"
                  className="w-fit flex items-center justify-center"
                >
                  {loading ? <Spinner /> : <span>Create Purchase</span>}
                </Button>
              </div>
            </div>
          </form>

          <div className="relative w-full max-w-lg mb-6">
            <AiOutlineSearch className="absolute top-3 left-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookings by Company Bargain No. or Item name"
              className="w-full pl-10 pr-4 py-2 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <div className="overflow-x-scroll px-0 pt-0 pb-2 mt-2">
            {sales.length > 0 ? (
              <div className="flex flex-col gap-4 mt-4 mb-5 bg-white border-[2px] border-[#737373] shadow-md">
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse">
                    <thead>
                      <tr>
                        {[
                          "Created At",
                          "Invoice Date",
                          "Total Amount",
                          "Select Sale",
                        ].map((el) => (
                          <th key={el} className="py-4 text-center w-[200px]">
                            {el}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => {
                        const isOpen = selectedSale._id === sale._id;
                        const isChecked = selectedSale._id === sale._id;

                        return (
                          <React.Fragment key={sale._id}>
                            <tr className={`border-t-2 border-t-[#898989]`}>
                              <td className="py-4 text-center">
                                {sale.createdAt}
                              </td>
                              <td className="py-4 text-center">
                                {formatDate(sale.invoiceDate)}
                              </td>
                              <td className="py-4 text-center">
                                {sale.totalAmount}
                              </td>
                              <td className="py-4 text-center">
                                <div className="flex justify-center items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleSaleSelect(sale)}
                                    className="form-checkbox h-5 w-5 cursor-pointer"
                                  />
                                </div>
                              </td>
                            </tr>
                            {isOpen && (
                              <tr className="bg-gray-100 border-t-2 border-t-[#898989]">
                                <td colSpan="11">
                                  <div className="p-4 border-t border-blue-gray-200">
                                    <table className="min-w-full table-auto border-collapse">
                                      <thead>
                                        <tr>
                                          {[
                                            "Booking ID",
                                            "Item ID",
                                            "Pickup",
                                            "Quantity Booked",
                                            "Quantity to CN",
                                            "Reason",
                                          ].map((header) => (
                                            <th
                                              key={header}
                                              className="py-4 text-center w-[200px]"
                                            >
                                              {header}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sale.sales.map((order) => (
                                          <React.Fragment key={order._id}>
                                            {order.items.map((item) => (
                                              <tr
                                                key={item._id}
                                                className="border-t-2 border-t-[#898989]"
                                              >
                                                <td className="py-4 text-center">
                                                  {order.bookingId?.BargainNo}
                                                </td>
                                                <td className="py-4 text-center">
                                                  {item.itemId?._id}
                                                </td>
                                                <td className="py-4 text-center">
                                                  {String(item.pickup)
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    String(item.pickup).slice(
                                                      1
                                                    )}
                                                </td>
                                                <td className="py-4 text-center">
                                                  {item.quantity}
                                                </td>
                                                <td className="py-4 text-center">
                                                  <input
                                                    type="number"
                                                    value={
                                                      inputQuantityInputs.find(
                                                        (q) =>
                                                          q.key ===
                                                          `${item.itemId._id}-${item.pickup}`
                                                      )?.quantity || null
                                                    }
                                                    onChange={(e) => {
                                                      const value =
                                                        e.target.value;
                                                      if (
                                                        value === "" ||
                                                        Number(value) >= 0
                                                      ) {
                                                        handleQuantityChange(
                                                          item,
                                                          value,
                                                          item.pickup,
                                                          "quantity"
                                                        );
                                                      }
                                                    }}
                                                    onKeyDown={(e) => {
                                                      if (
                                                        e.key === "e" ||
                                                        e.key === "-" ||
                                                        e.key === "+" ||
                                                        e.key === "."
                                                      ) {
                                                        e.preventDefault();
                                                      }
                                                    }}
                                                    className="w-[100px] p-2 border rounded"
                                                    placeholder="Enter Qty"
                                                  />
                                                </td>
                                                <td className="py-4 text-center">
                                                  <input
                                                    type="text"
                                                    value={
                                                      inputQuantityInputs.find(
                                                        (q) =>
                                                          q.key ===
                                                          `${item._id}-${item.pickup}`
                                                      )?.reason || ""
                                                    }
                                                    onChange={(e) => {
                                                      const value =
                                                        e.target.value;
                                                      handleQuantityChange(
                                                        item,
                                                        value,
                                                        item.pickup,
                                                        "reason"
                                                      );
                                                    }}
                                                    className="w-[300px] p-2 border rounded"
                                                    placeholder="Enter reason"
                                                  />
                                                </td>
                                              </tr>
                                            ))}
                                          </React.Fragment>
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
              </div>
            ) : (
              <p className="text-center text-[1.2rem] text-blue-gray-600 mt-20">
                No sales found!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCN;
