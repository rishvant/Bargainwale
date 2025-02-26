import { Button, Chip, Spinner } from "@material-tailwind/react";
import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import Select from "react-select";

// api services
import { getTransport } from "@/services/masterService";
import { getWarehouses } from "@/services/warehouseService";
import { getOrders } from "@/services/orderService";
import { createPurchase } from "@/services/purchaseService";

// icons
import { LuAsterisk } from "react-icons/lu";
import { AiOutlineSearch } from "react-icons/ai";

const CreatePurchase = () => {
  const [loading, setLoading] = useState(false);
  const [selectTransportOptions, setSelectTransportOptions] = useState([]);
  const [selectWarehouseOptions, setSelectWarehouseOptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [quantityInputs, setQuantityInputs] = useState([]);
  const [inputQuantityInputs, setInputQuantityInputs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    warehouseId: "",
    transporterId: "",
    orderId: "",
    invoiceNumber: "",
    invoiceDate: "",
    items: [],
    organization: localStorage.getItem("organizationId"),
  });

  const fetchOrders = async () => {
    try {
      const response = await getOrders();
      const ordersData = response;
      ordersData.sort((a, b) => {
        const bargainDateComparison =
          new Date(b.companyBargainDate) - new Date(a.companyBargainDate);
        if (bargainDateComparison !== 0) {
          return bargainDateComparison;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setOrders(ordersData);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesBargainNo = order.companyBargainNo
        ?.toLowerCase()
        ?.includes(searchQuery.toLowerCase());
      const matchesItemName = order.items?.some((item) =>
        item.item?.materialdescription
          ?.toLowerCase()
          ?.includes(searchQuery.toLowerCase())
      );

      return matchesBargainNo || matchesItemName;
    });
  }, [orders, searchQuery]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedOrder) {
        toast.error("Please select an order before submitting.");
        setLoading(false);
        return;
      }

      if (
        quantityInputs.length === 0 ||
        quantityInputs.some((input) => input.quantity === null)
      ) {
        toast.error(
          "Please enter quantities for all items in the selected order."
        );
        setLoading(false);
        return;
      }

      const updatedForm = {
        ...form,
        orderId: selectedOrder,
        items: quantityInputs,
      };

      const response = await createPurchase(updatedForm);
      if (response?.status === 201) {
        toast.success("Purchase created successfully!");
        setForm({
          warehouseId: "",
          transporterId: "",
          orderId: "",
          invoiceNumber: "",
          invoiceDate: "",
          items: [],
          organization: localStorage.getItem("organizationId"),
        });
        setQuantityInputs([]);
        setInputQuantityInputs([]);
        setSelectedOrder(null);
        fetchOrders();
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

  const handleOrderSelect = (orderId) => {
    if (selectedOrder === orderId) {
      setSelectedOrder(null);
    } else {
      setSelectedOrder(orderId);
      setQuantityInputs([]);
      setInputQuantityInputs([]);
    }
  };

  const handleQuantityChange = (item, newQuantity, pickup) => {
    const quantity = Number(newQuantity);
    const uniqueKey = `${item._id}-${pickup}`;

    setQuantityInputs((prevInputs) => {
      const existingItem = prevInputs.find((item) => item.key === uniqueKey);

      if (existingItem) {
        return prevInputs.map((item) =>
          item.key === uniqueKey ? { ...item, quantity: quantity } : item
        );
      } else {
        return [
          ...prevInputs,
          { key: uniqueKey, itemId: item.item._id, pickup, quantity },
        ];
      }
    });

    setInputQuantityInputs((prevInputs) => {
      const existingItem = prevInputs.find((item) => item.key === uniqueKey);

      if (existingItem) {
        return prevInputs.map((item) =>
          item.key === uniqueKey ? { ...item, quantity: quantity } : item
        );
      } else {
        return [
          ...prevInputs,
          { key: uniqueKey, itemId: item._id, pickup, quantity },
        ];
      }
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
                      handleFormChange(0, "warehouseId", selectedOption)
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
            {orders.length > 0 ? (
              <div className="flex flex-col gap-4 mt-4 mb-5 bg-white border-[2px] border-[#737373] shadow-md">
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse">
                    <thead>
                      <tr>
                        {[
                          "Company Bargain No",
                          "Company Bargain Date",
                          "Manufacturer Name",
                          "Manufacturer Company",
                          "Manufacturer Contact",
                          "Status",
                          "Select Order",
                        ].map((el) => (
                          <th key={el} className="py-4 text-center w-[200px]">
                            {el}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const isOpen = selectedOrder === order._id;
                        const isChecked = selectedOrder === order._id;
                        const isBilled = order.status === "billed"; // Check if "billed"

                        return (
                          <React.Fragment key={order._id}>
                            <tr
                              className={`border-t-2 border-t-[#898989] ${
                                isBilled ? "bg-gray-300 text-gray-500" : ""
                              }`}
                            >
                              <td className="py-4 text-center">
                                {order.companyBargainNo}
                              </td>
                              <td className="py-4 text-center">
                                {formatDate(order.companyBargainDate)}
                              </td>
                              <td className="py-4 text-center">
                                {order.manufacturer?.manufacturer}
                              </td>
                              <td className="py-4 text-center">
                                {order.manufacturer?.manufacturerCompany}
                              </td>
                              <td className="py-4 text-center">
                                {order.manufacturer?.manufacturerContact}
                              </td>
                              <td className="py-4 text-center flex items-center justify-center">
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
                                  className="w-[150px]"
                                />
                              </td>
                              <td className="py-4 text-center">
                                <div className="flex justify-center items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() =>
                                      handleOrderSelect(order._id)
                                    }
                                    className="form-checkbox h-5 w-5 cursor-pointer"
                                    disabled={isBilled} // Disabled for "billed"
                                  />
                                  {isBilled && (
                                    <span className="italic text-sm">
                                      Billed
                                    </span>
                                  )}
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
                                            "Item Name",
                                            "Pickup",
                                            "Base Price",
                                            "Packaging",
                                            "Weight",
                                            "Ordered Quantity",
                                            "Quantity Available to Purchase",
                                            "Quantity to Purchase",
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
                                        {order.items.map((item) => (
                                          <tr
                                            key={item._id}
                                            className="border-t-2 border-t-[#898989]"
                                          >
                                            <td className="py-4 text-center">
                                              {item.item.materialdescription}
                                            </td>
                                            <td className="py-4 text-center">
                                              {String(item.pickup)
                                                ?.charAt(0)
                                                .toUpperCase() +
                                                String(item.pickup).slice(1)}
                                            </td>
                                            <td className="py-4 text-center">
                                              ₹{item.baseRate}
                                            </td>
                                            <td className="py-4 text-center">
                                              {String(item.item.packaging)
                                                ?.charAt(0)
                                                .toUpperCase() +
                                                String(
                                                  item.item.packaging
                                                ).slice(1)}
                                            </td>
                                            <td className="py-4 text-center">
                                              {item.item.netweight}
                                            </td>
                                            <td className="py-4 text-center">
                                              {item.quantity}
                                            </td>
                                            <td className="py-4 text-center">
                                              {item.quantity -
                                                item.purchaseQuantity}
                                            </td>
                                            <td className="py-4 text-center">
                                              {isBilled ? (
                                                <span className="italic text-gray-500">
                                                  View Only
                                                </span>
                                              ) : (
                                                <input
                                                  type="number"
                                                  value={
                                                    inputQuantityInputs.find(
                                                      (q) =>
                                                        q.key ===
                                                        `${item._id}-${item.pickup}`
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
                                                        item.pickup
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
                                                  className="w-[150px] p-2 border rounded"
                                                  placeholder="Enter new qty"
                                                />
                                              )}
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
                No orders found!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchase;
