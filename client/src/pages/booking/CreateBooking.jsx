import { Button, Spinner, Tooltip } from "@material-tailwind/react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import Select from "react-select";

// api services
import { getBuyer, getItems } from "@/services/masterService";
import { getWarehouses } from "@/services/warehouseService";
import { createBooking } from "@/services/bookingService";
import { getPricesById } from "@/services/itemService";

// icons
import { FaPlus } from "react-icons/fa";
import { TbTriangleInvertedFilled } from "react-icons/tb";
import { LuAsterisk } from "react-icons/lu";
import { MdDeleteOutline } from "react-icons/md";

import CustomTooltip from "../../components/CustomToolTip";

const CreateBooking = () => {
  const [loading, setLoading] = useState(false);
  const [itemsOptions, setItemsOptions] = useState([]);
  const [selectItemsOptions, setSelectItemsOptions] = useState([]);
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [selectBuyerOptions, setSelectBuyerOptions] = useState([]);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [selectWarehouseOptions, setSelectWarehouseOptions] = useState([]);
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [approval, setApproval] = useState(false);

  const [form, setForm] = useState({
    items: [],
    BargainNo: "",
    BargainDate: "",
    buyer: "",
    description: "",
    warehouse: "",
    deliveryOption: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
    paymentDays: "",
    organization: localStorage.getItem("organizationId"),
  });

  const fetchItemsOptions = async () => {
    try {
      const response = await getItems();
      setItemsOptions(response?.filter((item) => item.isActive));
      const formattedOptions = response
        ?.filter((item) => item.isActive)
        ?.map((item) => ({
          value: item._id,
          label: item.materialdescription,
        }));
      setSelectItemsOptions(formattedOptions);
    } catch (error) {
      toast.error("Error fetching items!");
      console.error(error);
    }
  };

  const fetchBuyerOptions = async () => {
    try {
      const response = await getBuyer();
      setBuyerOptions(response?.filter((buyer) => buyer.isActive));
      const formattedOptions = response
        ?.filter((buyer) => buyer.isActive)
        ?.map((buyer) => ({
          value: buyer._id,
          label: buyer.buyer,
        }));
      setSelectBuyerOptions(formattedOptions);
    } catch (error) {
      toast.error("Error fetching buyers!");
      console.error(error);
    }
  };

  const fetchWarehouseOptions = async () => {
    try {
      const response = await getWarehouses();
      setWarehouseOptions(response?.filter((warehouse) => warehouse.isActive));
      const formattedOptions = response
        ?.filter((warehouse) => warehouse.isActive)
        ?.map((warehouse) => ({
          value: warehouse._id,
          label: warehouse.name,
        }));
      setSelectWarehouseOptions(formattedOptions);
    } catch (error) {
      toast.error("Error fetching warehouses!");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchItemsOptions();
    fetchBuyerOptions();
    fetchWarehouseOptions();
  }, []);

  const calculateDaysDifference = (date1, date2) => {
    const diffTime = Math.abs(new Date(date2) - new Date(date1));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (form.items.length === 0) {
      toast.error("Please add at least one item before creating the order!");
      setLoading(false);
      return;
    }

    try {
      const paymentDays = calculateDaysDifference(
        form.BargainDate,
        form.paymentDays
      );

      const updatedForm = {
        items: form.items,
        BargainNo: form.BargainNo,
        BargainDate: form.BargainDate,
        buyer: form.buyer,
        description: form.description,
        warehouse: form.warehouse,
        deliveryOption: form.deliveryOption,
        deliveryAddress: {
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          pinCode: form.pinCode,
        },
        paymentDays,
        organization: form.organization,
        totalAmount: calculateTotalAmount(),
      };

      if (isDefaultAddress) {
        const buyer = buyerOptions.find((buyer) => buyer._id === form.buyer);
        updatedForm.deliveryAddress = {
          addressLine1: buyer.buyerdeliveryAddress.addressLine1,
          addressLine2: buyer.buyerdeliveryAddress.addressLine2,
          city: buyer.buyerdeliveryAddress.city,
          state: buyer.buyerdeliveryAddress.state,
          pinCode: buyer.buyerdeliveryAddress.pinCode,
        };
      }
      const response = await createBooking(updatedForm);
      if (response?.status === 201) {
        toast.success("Booking created successfully!");
        setForm({
          items: [],
          BargainNo: "",
          BargainDate: "",
          buyer: "",
          description: "",
          warehouse: "",
          deliveryOption: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          pinCode: "",
          paymentDays: "",
          organization: localStorage.getItem("organizationId"),
        });
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
    } else if (
      fieldName === "warehouse" ||
      fieldName === "buyer" ||
      fieldName === "deliveryOption"
    ) {
      setForm((prevForm) => ({
        ...prevForm,
        [fieldName]: value.value || "",
      }));
    } else if (fieldName === "BargainDate" || fieldName === "paymentDays") {
      const formattedDate = value.split("T")[0];
      setForm((prevData) => ({
        ...prevData,
        [fieldName]: formattedDate,
      }));
    } else {
      setForm((prevData) => ({
        ...prevData,
        [fieldName]: value,
      }));
    }
  };

  const handleAddItem = () => {
    setForm((prevData) => ({
      ...prevData,
      items: [
        ...prevData.items,
        {
          item: "",
          quantity: null,
          pickup: "",
          basePrice: null,
          baseRate: null,
          discount: 0,
          taxpaidAmount: null,
          taxableAmount: null,
          contNumber: null,
          gst: null,
          gstAmount: null,
        },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    const updatedItems = form.items.filter((_, i) => i !== index);
    setForm((prevData) => ({
      ...prevData,
      items: updatedItems,
    }));
  };

  const handleItemChange = async (index, field, value) => {
    if (!form.warehouse) {
      toast.error("Please select a warehouse first");
      return;
    }

    const updatedItems = [...form.items];

    if (value === "" || value === null) {
      value = null;
    }

    if (["quantity", "basePrice", "discount", "contNumber"].includes(field)) {
      value = Number(value) || null;
      if (value < 0) {
        toast.error(
          `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } cannot be negative.`
        );
        return;
      }

      if (field === "discount" && value < 0) {
        toast.error("Discount cannot be negative.");
        return;
      }

      // if (["quantity", "contNumber"].includes(field) && value <= 0) {
      //   toast.error(
      //     `${
      //       field.charAt(0).toUpperCase() + field.slice(1)
      //     } must be greater than zero.`
      //   );
      //   return;
      // }
    }

    if (field === "item" || field === "pickup") {
      updatedItems[index] = { ...updatedItems[index], [field]: value.value };
    } else {
      updatedItems[index] = { ...updatedItems[index], [field]: value };
    }

    if (["item", "pickup", "basePrice"].includes(field)) {
      const { item, pickup } = updatedItems[index];

      if (item && pickup && form.warehouse) {
        try {
          const response = await getPricesById(item, form.warehouse);
          if (response.status === 200) {
            const apiPrice = response.data.price[`${pickup}Price`];
            updatedItems[index].baseRate = apiPrice;

            if (
              field === "basePrice" &&
              updatedItems[index].basePrice < apiPrice
            ) {
              toast.error(
                `Base price cannot be lower than ${formatCurrency(apiPrice)}`
              );
              updatedItems[index].basePrice = baseRate;
              return;
            }

            // Update base price if it's not set or if it's incorrect
            if (
              !updatedItems[index].basePrice ||
              updatedItems[index].basePrice !== apiPrice
            ) {
              updatedItems[index].basePrice = apiPrice;
            }
          }
        } catch (err) {
          if (err.response && err.response.status === 404) {
            toast.error("Item price not found for the selected warehouse.");
          }
        }
      }
    }

    if (["quantity", "basePrice", "discount", "basePrice"].includes(field)) {
      const quantity = updatedItems[index].quantity || 0;
      const basePrice = updatedItems[index].basePrice || 0;
      const discount = updatedItems[index].discount || 0;
      setApproval(discount > 0);
      updatedItems[index].taxableAmount =
        quantity * (basePrice - (discount * basePrice) / 100);
      updatedItems[index].gstAmount =
        (basePrice * updatedItems[index].gst * quantity) / 100;
      updatedItems[index].taxpaidAmount =
        updatedItems[index].taxableAmount +
        (updatedItems[index].taxableAmount * updatedItems[index].gst) / 100;
    }

    if (field === "item") {
      const selectedItem = itemsOptions?.find(
        (option) => option._id === value.value
      );
      if (selectedItem) {
        const gst = selectedItem.gst;
        updatedItems[index].gst = gst;
      }
    }

    if (field === "basePrice") {
      updatedItems[index] = { ...updatedItems[index], [field]: value };
    }

    setForm((prevData) => ({
      ...prevData,
      items: updatedItems,
    }));
  };

  const selectRefs = useRef([]);
  const discountRefs = useRef([]);

  const setSelectRef = (index, ref) => {
    selectRefs.current[index] = ref;
  };

  const setDiscountRef = (index, ref) => {
    discountRefs.current[index] = ref;
  };

  const handleTabKey = (e, index) => {
    if (e.key === "Tab") {
      e.preventDefault();

      if (index === form.items.length - 1) {
        handleAddItem();
        setTimeout(() => {
          selectRefs.current[index + 1]?.focus();
        }, 0);
      } else {
        discountRefs.current[index + 1]?.focus();
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculateTotalQuantity = () => {
    return form.items.reduce((total, item) => {
      return total + (Number(item.quantity) || 0);
    }, 0);
  };

  const calculateTotalAmount = () => {
    return form.items.reduce((total, item) => {
      return total + (Number(item.taxpaidAmount) || 0);
    }, 0);
  };

  return (
    <div className="w-[99vw] h-full mt-8 mb-8 flex flex-col gap-12">
      <div className="px-7">
        <div className="flex flex-row justify-between">
          <div>
            {/* <button
              onClick={handleDownloadExcel}
              className="w-fit bg-[#185C37] py-2 text-white text-[1rem] font-medium rounded-lg px-8 flex flex-row items-center justify-center border-2 border-[#999999] gap-1"
            >
              <img className="w-5" src={excel} />
              Download as Excel
            </button> */}
          </div>
          {/* <div className="flex flex-row gap-4">
            <button className="w-fit bg-[#FF0000] text-white text-[1rem] font-medium rounded-lg px-8 py-2 flex flex-row items-center justify-center border-2 border-black gap-1">
              Delete
            </button>
            <button className="w-fit bg-[#38454A] text-white text-[1rem] font-medium rounded-lg px-8 py-2 flex flex-row items-center justify-center border-2 border-black gap-1">
              Edit
            </button>
            <button className="w-fit bg-[#DCDCDC] text-black text-[1rem] font-medium rounded-lg px-8 py-2 flex flex-row items-center justify-center border-2 border-black gap-1">
              PUBLISH
            </button>
          </div> */}
        </div>

        <div className="w-full">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 mt-4 mb-5 bg-white p-5 bg-white shadow-md border-2 border-[#CBCDCE] rounded-md"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-x-16 gap-y-5">
                <div className="w-fit flex gap-5 items-center">
                  <label
                    htmlFor="BargainNo"
                    className="flex text-[#38454A] text-[1rem]"
                  >
                    Bargain No.
                    <LuAsterisk className="text-[#FF0000] text-[0.7rem]" />
                  </label>
                  <input
                    name="BargainNo"
                    type="text"
                    value={form.BargainNo}
                    onChange={(e) =>
                      handleFormChange(0, "BargainNo", e.target.value)
                    }
                    required
                    placeholder="Bargain No."
                    className="border-2 border-[#CBCDCE] px-2 py-1 rounded-md placeholder-[#737373]"
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <label
                    htmlFor="warehouse"
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
                        (option) => option.value === form.warehouse
                      ) || null
                    }
                    onChange={(selectedOption) =>
                      handleFormChange(0, "warehouse", selectedOption)
                    }
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <label
                    htmlFor="buyer"
                    className="flex text-[#38454A] text-[1rem]"
                  >
                    Buyer
                    <LuAsterisk className="text-[#FF0000] text-[0.7rem]" />
                  </label>
                  <Select
                    className="relative w-[180px]"
                    options={selectBuyerOptions}
                    value={
                      selectBuyerOptions.find(
                        (option) => option.value === form.buyer
                      ) || null
                    }
                    onChange={(selectedOption) =>
                      handleFormChange(0, "buyer", selectedOption)
                    }
                  />
                </div>

                <div className="w-fit flex gap-2 items-center">
                  <label
                    htmlFor="BargainDate"
                    className="flex text-[#38454A] text-[1rem]"
                  >
                    Bargain Date
                    <LuAsterisk className="text-[#FF0000] text-[0.7rem]" />
                  </label>
                  <input
                    name="BargainDate"
                    type="date"
                    value={form.BargainDate}
                    onChange={(e) =>
                      handleFormChange(0, "BargainDate", e.target.value)
                    }
                    required
                    className="border-2 border-[#CBCDCE] px-2 py-1 rounded-md"
                  />
                </div>

                <div className="w-fit flex gap-2 items-center">
                  <label
                    htmlFor="paymentDays"
                    className="flex text-[#38454A] text-[1rem]"
                  >
                    Payment Date
                    <LuAsterisk className="text-[#FF0000] text-[0.7rem]" />
                  </label>
                  <input
                    name="paymentDays"
                    type="date"
                    value={form.paymentDays}
                    onChange={(e) =>
                      handleFormChange(0, "paymentDays", e.target.value)
                    }
                    required
                    className="border-2 border-[#CBCDCE] px-2 py-1 rounded-md"
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <label
                    htmlFor="deliveryOption"
                    className="flex text-[#38454A] text-[1rem]"
                  >
                    Delivery Option
                    <LuAsterisk className="text-[#FF0000] text-[0.7rem]" />
                  </label>
                  <Select
                    className="relative w-[180px]"
                    options={[
                      { value: "Delivery", label: "Delivery" },
                      { value: "Pickup", label: "Pickup" },
                    ]}
                    value={
                      [
                        { value: "Delivery", label: "Delivery" },
                        { value: "Pickup", label: "Pickup" },
                      ].find(
                        (option) => option.value === form.deliveryOption
                      ) || null
                    }
                    onChange={(selectedOption) => {
                      handleFormChange(0, "deliveryOption", selectedOption);
                      if (selectedOption.value === "Pickup") {
                        setForm((prev) => ({
                          ...prev,
                          addressLine1: "",
                          addressLine2: "",
                          city: "",
                          state: "",
                          pinCode: "",
                        }));
                      }
                    }}
                  />
                </div>

                {form.deliveryOption === "Delivery" && (
                  <div className="w-fit flex gap-2 items-center">
                    <label
                      htmlFor="isDefault"
                      className="text-[#38454A] text-[1rem]"
                    >
                      Use buyer's default address
                    </label>
                    <input
                      name="isDefault"
                      type="checkbox"
                      value={isDefaultAddress}
                      onChange={() => setIsDefaultAddress(!isDefaultAddress)}
                      className="w-4 h-4 border-2 border-[#CBCDCE] cursor-pointer"
                      placeholder="Description"
                    />
                  </div>
                )}

                <div className="w-fit flex gap-2 items-center">
                  <label
                    htmlFor="description"
                    className="text-[#38454A] text-[1rem]"
                  >
                    Description
                  </label>
                  <input
                    name="description"
                    type="text"
                    value={form.description}
                    onChange={(e) =>
                      handleFormChange(0, "description", e.target.value)
                    }
                    className="border-2 border-[#CBCDCE] px-2 py-1 rounded-md placeholder-[#737373]"
                    placeholder="Description"
                  />
                </div>
              </div>

              {/* Delivery Address Fields */}
              {form.deliveryOption === "Delivery" && !isDefaultAddress && (
                <div className="flex flex-col">
                  <p className="text-[1.1rem] text-[#38454A] font-semibold mt-4">
                    Delivery Address:
                  </p>
                  <div className="flex flex-wrap gap-x-16 gap-y-5 mt-2">
                    <div className="flex gap-2 items-center">
                      <label
                        htmlFor="addressLine1"
                        className="text-[#38454A] text-[1rem]"
                      >
                        Address Line 1
                      </label>
                      <input
                        name="addressLine1"
                        type="text"
                        value={form.addressLine1}
                        onChange={(e) =>
                          handleFormChange(0, "addressLine1", e.target.value)
                        }
                        className="border-2 border-[#CBCDCE] px-2 py-1 rounded-md placeholder-[#737373]"
                        placeholder="Address Line 1"
                      />
                    </div>

                    <div className="flex gap-2 items-center">
                      <label
                        htmlFor="addressLine2"
                        className="text-[#38454A] text-[1rem]"
                      >
                        Address Line 2
                      </label>
                      <input
                        name="addressLine2"
                        type="text"
                        value={form.addressLine2}
                        onChange={(e) =>
                          handleFormChange(0, "addressLine2", e.target.value)
                        }
                        className="border-2 border-[#CBCDCE] px-2 py-1 rounded-md placeholder-[#737373]"
                        placeholder="Address Line 2"
                      />
                    </div>

                    <div className="flex gap-2 items-center">
                      <label
                        htmlFor="city"
                        className="text-[#38454A] text-[1rem]"
                      >
                        City
                      </label>
                      <input
                        name="city"
                        type="text"
                        value={form.city}
                        onChange={(e) =>
                          handleFormChange(0, "city", e.target.value)
                        }
                        className="border-2 border-[#CBCDCE] px-2 py-1 rounded-md placeholder-[#737373]"
                        placeholder="City"
                      />
                    </div>

                    <div className="flex gap-2 items-center">
                      <label
                        htmlFor="state"
                        className="text-[#38454A] text-[1rem]"
                      >
                        State
                      </label>
                      <input
                        name="state"
                        type="text"
                        value={form.state}
                        onChange={(e) =>
                          handleFormChange(0, "state", e.target.value)
                        }
                        className="border-2 border-[#CBCDCE] px-2 py-1 rounded-md placeholder-[#737373]"
                        placeholder="State"
                      />
                    </div>

                    <div className="flex gap-2 items-center">
                      <label
                        htmlFor="pinCode"
                        className="text-[#38454A] text-[1rem]"
                      >
                        Pin Code
                      </label>
                      <input
                        name="pinCode"
                        type="text"
                        value={form.pinCode}
                        onChange={(e) =>
                          handleFormChange(0, "pinCode", e.target.value)
                        }
                        className="border-2 border-[#CBCDCE] px-2 py-1 rounded-md placeholder-[#737373]"
                        placeholder="Pin Code"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  color="green"
                  type="button"
                  onClick={handleAddItem}
                  className="w-[140px] flex flex-row gap-2 items-center justify-center"
                >
                  <FaPlus /> Add Item
                </Button>

                <Button
                  color="blue"
                  type="submit"
                  className="w-fit flex items-center justify-center"
                >
                  {loading ? (
                    <Spinner />
                  ) : approval ? (
                    <span>Send for approval</span>
                  ) : (
                    <span>Create Booking</span>
                  )}
                </Button>
              </div>
            </div>
          </form>

          <div className="fixed bottom-0 left-0 right-0 bg-[#E4E4E4] shadow-md z-[10]">
            <div className="flex justify-between items-center px-10 py-2">
              <div className="w-full flex flex-row justify-between text-[1rem] font-medium">
                <span>Total Qty: {calculateTotalQuantity()}</span>
                {/* <span>Total Gross Weight:</span>
                <span>Total Net Weight:</span> */}
                <span>
                  Total Amount: {formatCurrency(calculateTotalAmount())}
                </span>
              </div>
            </div>
            <div className="bg-white text-[1rem] flex justify-between items-center px-4 py-1">
              <p>2024 @Bargainwale</p>
              <p>Design and Developed by Reduxcorporation</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-4 mb-5 bg-white shadow-md">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full table-auto border-2 border-[#CBCDCE] rounded-md ">
                <thead>
                  <tr>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      CBN
                      <CustomTooltip
                        title="CBN"
                        description="Company Bargain Number: A unique identifier for tracking the company's bargain."
                        learnMoreLink="/company-bargain-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      CBD
                      <CustomTooltip
                        title="CBD"
                        description="Company Bargain Date: The date when the bargain was finalized with the company."
                        learnMoreLink="/company-bargain-date-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      Item
                      <CustomTooltip
                        title="Item"
                        description="Select the item involved in the order. Each item has unique properties."
                        learnMoreLink="/item-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      Pickup
                      <CustomTooltip
                        title="Pickup Location"
                        description="Location from where the item will be picked up for delivery."
                        learnMoreLink="/pickup-info"
                      />
                    </th>
                    {/* <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      Cont. No.
                      <CustomTooltip
                        title="Container Number"
                        description="A unique number assigned to the container holding the item."
                        learnMoreLink="/container-info"
                      />
                    </th> */}
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      Quantity
                      <CustomTooltip
                        title="Quantity"
                        description="Number of units of the item in this order."
                        learnMoreLink="/quantity-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      Base Rate
                      <CustomTooltip
                        title="Base Rate"
                        description="Basic cost per unit of the item before taxes."
                        learnMoreLink="/base-rate-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      Discount %
                      <CustomTooltip
                        title="Discount Percentage"
                        description="Percentage discount applied to the base rate of the item."
                        learnMoreLink="/discount-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      Taxable Amt
                      <CustomTooltip
                        title="Taxable Amount"
                        description="Portion of the amount subject to tax after applying discounts."
                        learnMoreLink="/taxable-amount-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      GST %
                      <CustomTooltip
                        title="GST Percentage"
                        description="The Goods and Services Tax percentage applied to the item."
                        learnMoreLink="/taxable-amount-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      GST Amt.
                      <CustomTooltip
                        title="GST Amount"
                        description="The tax amount calculated based on the GST percentage."
                        learnMoreLink="/taxable-amount-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      Total Amt
                      <CustomTooltip
                        title="Total Amount with Tax"
                        description="Total cost including base rate and applicable taxes."
                        learnMoreLink="/total-amount-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      Payment Date
                      <CustomTooltip
                        title="Payment Date"
                        description="Date by which payment is expected to be completed."
                        learnMoreLink="/payment-date-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      Action
                      <CustomTooltip
                        title="Actions"
                        description="Options for managing the item, such as removing it from the order."
                        learnMoreLink="/actions-info"
                      />
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {form.items?.map((item, index) => (
                    <tr key={index} className="border-t-2 border-t-[#898989]">
                      <td className="py-4 px-2 text-center">
                        {form.BargainNo}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {form.BargainDate}
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div className="relative w-[500px] text-[0.9rem]">
                          <Select
                            ref={(ref) => setSelectRef(index, ref)}
                            className="relative w-[500px]"
                            options={selectItemsOptions}
                            value={
                              selectItemsOptions.find(
                                (option) => option.value === item.item
                              ) || null
                            }
                            onChange={(selectedOption) =>
                              handleItemChange(index, "item", selectedOption)
                            }
                            menuPortalTarget={document.body}
                            styles={{
                              menuPortal: (base) => ({ ...base, zIndex: 10 }),
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div className="relative w-[150px]">
                          <Select
                            className="relative w-[150px]"
                            options={[
                              { value: "rack", label: "Rack" },
                              { value: "depot", label: "Depot" },
                              { value: "plant", label: "Plant" },
                              { value: "company", label: "Company" },
                            ]}
                            value={
                              [
                                { value: "rack", label: "Rack" },
                                { value: "depot", label: "Depot" },
                                { value: "plant", label: "Plant" },
                                { value: "company", label: "Company" },
                              ].find(
                                (option) => option.value === item.pickup
                              ) || null
                            }
                            onChange={(selectedOption) =>
                              handleItemChange(index, "pickup", selectedOption)
                            }
                            menuPortalTarget={document.body}
                            styles={{
                              menuPortal: (base) => ({ ...base, zIndex: 10 }),
                            }}
                          />
                        </div>
                      </td>
                      {/* <td className="py-4 px-2 text-center">
                        <input
                          type="number"
                          name="contNumber"
                          value={item.contNumber}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "contNumber",
                              e.target.value
                            )
                          }
                          required
                          placeholder="Cont. No."
                          className="w-[150px] border-2 border-[#CBCDCE] px-2 py-1 rounded-md placeholder-[#737373]"
                        />
                      </td> */}
                      <td className="py-4 px-2 text-center">
                        <input
                          type="number"
                          name="quantity"
                          value={form.warehouse ? item.quantity : ""}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                          required
                          placeholder="Quantity"
                          className="w-[150px] border-2 border-[#CBCDCE] px-2 py-1 rounded-md placeholder-[#737373]"
                        />
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div className="flex gap-2 items-center w-[250px]">
                          <input
                            type="number"
                            name="basePrice"
                            value={item.basePrice}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "basePrice",
                                e.target.value
                              )
                            }
                            required
                            placeholder="Base Rate"
                            className="w-[150px] border-2 border-[#CBCDCE] px-2 py-1 rounded-md placeholder-[#737373]"
                          />
                          <span className="text-[0.8rem]">
                            (From Daily Price: {formatCurrency(item.baseRate)})
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <input
                          ref={(ref) => setDiscountRef(index, ref)}
                          type="number"
                          name="discount"
                          value={item.discount}
                          onChange={(e) =>
                            handleItemChange(index, "discount", e.target.value)
                          }
                          onKeyDown={(e) => {
                            handleTabKey(e, index);
                          }}
                          required
                          placeholder="Discount %"
                          className="w-[150px] border-2 border-[#CBCDCE] px-2 py-1 rounded-md placeholder-[#737373]"
                        />
                      </td>
                      <td className="py-4 px-2 text-center">
                        {item.taxableAmount
                          ? formatCurrency(item.taxableAmount)
                          : "₹0.00"}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {warehouseOptions?.find(
                          (warehouse) => warehouse._id === form?.warehouse
                        )?.location?.state ===
                        buyerOptions?.find((buyer) => buyer._id === form?.buyer)
                          ?.buyerdeliveryAddress.state ? (
                          <>
                            <span>
                              {itemsOptions?.find(
                                (option) => option._id === item?.item
                              )?.gst / 2 || "N/A"}
                              {"% "}
                              (CGST) +{" "}
                              {itemsOptions?.find(
                                (option) => option._id === item?.item
                              )?.gst / 2 || "N/A"}
                              {"% "}
                              (SGST)
                            </span>
                          </>
                        ) : (
                          <>
                            <span>
                              {itemsOptions?.find(
                                (option) => option._id === item?.item
                              )?.gst || "N/A"}
                              {"% "}
                              (IGST)
                            </span>
                          </>
                        )}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {item.gstAmount
                          ? formatCurrency(item.gstAmount)
                          : "₹0.00"}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {item.taxpaidAmount
                          ? formatCurrency(item.taxpaidAmount)
                          : "₹0.00"}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {form.paymentDays}
                      </td>
                      {/* <td className="py-4 px-2 text-center">{form.description}</td> */}
                      <td className="py-4 px-2 flex justify-center">
                        <Tooltip content="Remove Item">
                          <span className="w-fit h-fit">
                            <MdDeleteOutline
                              onClick={() => handleRemoveItem(index)}
                              className="text-[2rem] text-red-700 border border-2 border-red-700 rounded-md hover:bg-red-700 hover:text-white transition-all cursor-pointer"
                            />
                          </span>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBooking;
