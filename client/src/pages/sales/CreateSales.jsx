import {
  Button,
  Chip,
  IconButton,
  Spinner,
  Tooltip,
} from "@material-tailwind/react";
import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import axios from "axios";
import Select from "react-select";
import { useParams } from "react-router-dom";

// API services
import { getTransport } from "@/services/masterService";
import { getWarehouses } from "@/services/warehouseService";
import { getBookings } from "@/services/bookingService";
import { API_BASE_URL } from "@/services/api";

// Icons
import { LuAsterisk } from "react-icons/lu";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { AiOutlineSearch } from "react-icons/ai";

const CreateSales = () => {
  const [loading, setLoading] = useState(false);
  const [selectTransportOptions, setSelectTransportOptions] = useState([]);
  const [selectWarehouseOptions, setSelectWarehouseOptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [quantityInputs, setQuantityInputs] = useState([]);
  const [salesIds, setSalesIds] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { id } = useParams();

  const [form, setForm] = useState({
    warehouseId: "",
    transporterId: "",
    invoiceNumber: "",
    invoiceDate: "",
    organization: localStorage.getItem("organizationId"),
  });

  const fetchOrders = async () => {
    try {
      const response = await getBookings();
      const filteredOrders = response;
      filteredOrders.sort((a, b) => {
        const bargainDateComparison =
          new Date(b.companyBargainDate) - new Date(a.companyBargainDate);
        if (bargainDateComparison !== 0) {
          return bargainDateComparison;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setOrders(filteredOrders.filter((order) => order.buyer?._id === id));
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchWarehouseOptions = async () => {
    try {
      const response = await getWarehouses();
      const formattedOptions = response
        ?.filter((warehouse) => warehouse.isActive)
        ?.map((item) => ({
          value: item._id,
          label: item.name,
        }));
      setSelectWarehouseOptions(formattedOptions);
    } catch (error) {
      toast.error("Error fetching warehouses!");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchTransportOptions();
    fetchWarehouseOptions();
  }, []);

  const handleFormChange = (fieldName, value) => {
    if (fieldName === "invoiceDate") {
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

  const handleToggleOrder = (orderId) => {
    setOpenOrders((prevOpenOrders) =>
      prevOpenOrders.includes(orderId)
        ? prevOpenOrders.filter((id) => id !== orderId)
        : [...prevOpenOrders, orderId]
    );
  };

  const handleOrderSelect = async (orderId) => {
    const { warehouseId, invoiceNumber, invoiceDate, transporterId } = form;

    if (!warehouseId || !invoiceNumber || !invoiceDate || !transporterId) {
      toast.error(
        "Please fill in all the required fields: Warehouse, Invoice Number, Invoice Date, and Transporter."
      );
      return;
    }

    const allItemsHaveQuantity = quantityInputs.some(
      (booking) =>
        booking.bookingId === orderId &&
        booking.items.every((item) => item.quantity > 0)
    );

    if (!allItemsHaveQuantity) {
      toast.error("Please enter a quantity for all items in the booking.");
      return;
    }

    const isAlreadySelected = selectedOrder.includes(orderId);

    if (isAlreadySelected) {
      setSelectedOrder((prevSelected) =>
        prevSelected.filter((id) => id !== orderId)
      );
    } else {
      try {
        const response = await handleCreateSale(
          orderId,
          orders.find((order) => order._id === orderId).buyer?._id,
          orders.find((order) => order._id === orderId).items
        );
        if (response?.status === 200 || response?.status === 201) {
          setSelectedOrder((prevSelected) => [...prevSelected, orderId]);
        } else {
          console.error("Unexpected response status:", response?.status);
        }
      } catch (error) {
        console.error("Failed to create sale:", error);
        toast.error(
          error.response?.data?.message ||
            "Failed to create sale. Please resolve the issue and try again."
        );
      }
    }
  };

  const handleCreateSale = async (bookingId, buyerId, orderItems) => {
    const {
      warehouseId,
      transporterId,
      organization,
      invoiceNumber,
      invoiceDate,
    } = form;

    const saleItems = orderItems.map((item) => ({
      itemId: item.item._id,
      quantity:
        quantityInputs
          .find((booking) => booking.bookingId === bookingId)
          ?.items.find((q) => q.itemId === item.item._id)?.quantity || 0,
      pickup: item.pickup,
    }));

    try {
      const saleResponse = await axios.post(`${API_BASE_URL}/sale`, {
        warehouseId,
        bookingId,
        transporterId,
        organization,
        buyerId,
        items: saleItems,
        invoiceNumber,
        invoiceDate,
      });
      if (saleResponse.status === 201) {
        const newSaleId = saleResponse.data.data?._id;
        setSalesIds((prevSales) => [...prevSales, newSaleId]);
        toast.success("Sale added successfully!");
      } else {
        toast.error("Failed to create sale. Please try again.");
      }
      return saleResponse;
    } catch (error) {
      console.error("Error creating sale:", error);
      toast.error(
        error.response?.data?.message ||
          "An unexpected error occurred. Please try again."
      );
      return error;
    }
  };

  const handleFinalizeSales = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (salesIds.length === 0) {
      toast.error("Please select a booking before submitting.");
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/totalsales`, {
        saleIds: salesIds,
        organization: form.organization,
        totalAmount: totalAmount,
      });
      setLoading(false);
      toast.success("Sales created successfully!");
    } catch (error) {
      console.error("Error finalizing sales:", error);
    }
  };

  const handleQuantityChange = (
    itemId,
    bookingId,
    newQuantity,
    taxpaidAmount,
    bookedQuantity,
    soldQuantity
  ) => {
    if (Number(newQuantity) > bookedQuantity - soldQuantity) {
      toast.error(
        `Quantity cannot exceed the available quantity of ${
          bookedQuantity - soldQuantity
        }`
      );
      return;
    }

    setQuantityInputs((prevInputs) => {
      const existingBookingIndex = prevInputs.findIndex(
        (booking) => booking.bookingId === bookingId
      );

      if (existingBookingIndex !== -1) {
        const existingItemIndex = prevInputs[
          existingBookingIndex
        ].items.findIndex((item) => item.itemId === itemId);

        if (existingItemIndex !== -1) {
          return prevInputs.map((booking, bookingIndex) => {
            if (bookingIndex === existingBookingIndex) {
              return {
                ...booking,
                items: booking.items.map((item, itemIndex) => {
                  if (itemIndex === existingItemIndex) {
                    return { ...item, quantity: newQuantity };
                  }
                  return item;
                }),
              };
            }
            return booking;
          });
        } else {
          return prevInputs.map((booking, bookingIndex) => {
            if (bookingIndex === existingBookingIndex) {
              return {
                ...booking,
                items: [...booking.items, { itemId, quantity: newQuantity }],
              };
            }
            return booking;
          });
        }
      } else {
        return [
          ...prevInputs,
          {
            bookingId,
            items: [{ itemId, quantity: newQuantity }],
          },
        ];
      }
    });

    if (newQuantity === "") {
      setTotalAmount((prevAmount) => prevAmount * 0);
    } else {
      setTotalAmount(
        (prevAmount) => prevAmount + taxpaidAmount * Number(newQuantity)
      );
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesBargainNo = order.BargainNo.toLowerCase().includes(
        searchQuery.toLowerCase()
      );
      const matchesItemName = order.items.some((item) =>
        item.item.materialdescription
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );

      return matchesBargainNo || matchesItemName;
    });
  }, [orders, searchQuery]);

  return (
    <div className="w-full mt-8 mb-8 flex flex-col gap-12">
      <div className="px-7">
        <div className="flex flex-row justify-between">
          <div>{/* Additional buttons or actions can be added here */}</div>
        </div>

        <div className="w-full">
          <form
            onSubmit={handleFinalizeSales}
            className="flex flex-col gap-6 mt-4 mb-5 bg-white border-[2px] border-[#737373] p-6 rounded-lg shadow-md"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex gap-2 items-center">
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
                    handleFormChange("warehouseId", selectedOption)
                  }
                />
              </div>

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
                    handleFormChange("invoiceNumber", e.target.value)
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
                    handleFormChange("invoiceDate", e.target.value)
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
                    handleFormChange("transporterId", selectedOption)
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-4">
              <Button
                color="blue"
                type="submit"
                className="w-fit flex items-center justify-center"
                disabled={loading}
              >
                {loading ? <Spinner /> : <span>Finalize Sales</span>}
              </Button>
            </div>
          </form>

          <div className="relative w-full max-w-lg mb-6">
            <AiOutlineSearch className="absolute top-3 left-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookings by Bargain No. or Item name"
              className="w-full pl-10 pr-4 py-2 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <div className="overflow-x-scroll px-0 pt-0 pb-2 mt-2">
            {filteredOrders?.length > 0 ? (
              <div className="flex flex-col gap-4 mt-4 mb-5 bg-white border-[2px] border-[#737373] rounded-lg shadow-md">
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        {[
                          "Bargain No",
                          "Bargain Date",
                          "Buyer Name",
                          "Buyer Company",
                          "Buyer Contact",
                          "Status",
                          "Delivery Option",
                          "Actions",
                        ].map((el) => (
                          <th
                            key={el}
                            className="py-4 px-6 text-center w-[200px] font-semibold text-gray-700"
                          >
                            {el}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders?.map((order) => {
                        const isOpen = openOrders.includes(order._id);
                        const isChecked = selectedOrder.includes(order._id);
                        const isSoldOut = order.status === "fully sold";
                        return (
                          <React.Fragment key={order._id}>
                            <tr className="border-t">
                              <td className="py-4 px-6 text-center">
                                {order.BargainNo}
                              </td>
                              <td className="py-4 px-6 text-center">
                                {formatDate(order.BargainDate)}
                              </td>
                              <td className="py-4 px-6 text-center">
                                {order.buyer?.buyer}
                              </td>
                              <td className="py-4 px-6 text-center">
                                {order.buyer?.buyerCompany}
                              </td>
                              <td className="py-4 px-6 text-center">
                                {order.buyer?.buyerContact}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <Chip
                                  variant="ghost"
                                  value={order.status}
                                  color={
                                    order.status === "created"
                                      ? "blue"
                                      : order.status === "partially paid"
                                      ? "yellow"
                                      : order.status === "billed"
                                      ? "green"
                                      : "red"
                                  }
                                />
                              </td>
                              <td className="py-4 px-6 text-center">
                                {order.deliveryOption}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex justify-center items-center gap-4">
                                  <IconButton
                                    variant="text"
                                    onClick={() => handleToggleOrder(order._id)}
                                    className="bg-gray-300 hover:bg-gray-400"
                                  >
                                    {isOpen ? (
                                      <ChevronUpIcon className="h-5 w-5" />
                                    ) : (
                                      <ChevronDownIcon className="h-5 w-5" />
                                    )}
                                  </IconButton>
                                  <Tooltip
                                    content={
                                      isSoldOut
                                        ? "Booking fully sold"
                                        : "Select Booking"
                                    }
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() =>
                                        handleOrderSelect(order._id)
                                      }
                                      className="form-checkbox h-5 w-5 cursor-pointer"
                                      disabled={isSoldOut}
                                    />
                                  </Tooltip>
                                </div>
                              </td>
                            </tr>
                            {isOpen && (
                              <tr className="bg-gray-50">
                                <td colSpan="11">
                                  <div className="p-4">
                                    <table className="min-w-full table-auto border-collapse">
                                      <thead>
                                        <tr className="bg-gray-100">
                                          {[
                                            "Item Name",
                                            "Packaging",
                                            "Weight",
                                            "Base Price",
                                            "Booked Quantity",
                                            "Quantity Available to Sales",
                                            "Quantity to Sales",
                                          ].map((header) => (
                                            <th
                                              key={header}
                                              className="py-3 px-4 text-center font-semibold text-gray-700"
                                            >
                                              {header}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {order.items.map((item) => (
                                          <tr
                                            key={item._id}
                                            className="border-t"
                                          >
                                            <td className="py-3 px-4 text-center">
                                              {item.item.materialdescription}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                              {String(item.item.packaging)
                                                .charAt(0)
                                                .toUpperCase() +
                                                String(
                                                  item.item.packaging
                                                ).slice(1)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                              {item.item.netweight}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                              ₹{item.basePrice}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                              {item.quantity}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                              {item.quantity -
                                                item.soldQuantity}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                              <input
                                                type="number"
                                                value={
                                                  quantityInputs
                                                    .find(
                                                      (booking) =>
                                                        booking.bookingId ===
                                                        order._id
                                                    )
                                                    ?.items.find(
                                                      (q) =>
                                                        q.itemId ===
                                                        item.item._id
                                                    )?.quantity || ""
                                                }
                                                onChange={(e) => {
                                                  const newQuantity =
                                                    e.target.value === ""
                                                      ? ""
                                                      : Number(e.target.value);
                                                  handleQuantityChange(
                                                    item.item._id,
                                                    order._id,
                                                    newQuantity,
                                                    item.taxpaidAmount,
                                                    item.quantity,
                                                    item.soldQuantity
                                                  );
                                                }}
                                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter quantity"
                                              />
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
              </div>
            ) : (
              <p className="text-center text-[1.2rem] text-blue-gray-600 mt-20">
                No bookings found!
              </p>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-[#E4E4E4] border-t-2 border-t-[#A6A6A6] shadow-md z-[10]">
            <div className="text-[1rem] flex justify-between items-center px-4 py-1">
              <p>2024 © Bargainwale</p>
              <p>Designed and Developed by Reduxcorporation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSales;
