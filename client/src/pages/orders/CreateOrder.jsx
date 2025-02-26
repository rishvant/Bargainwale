import { Button, Spinner, Tooltip } from "@material-tailwind/react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import Select from "react-select";

// api services
import { getItems, getManufacturer } from "@/services/masterService";
import { getWarehouses } from "@/services/warehouseService";
import { createOrder } from "@/services/orderService";

// icons
import { FaPlus } from "react-icons/fa";
import { LuAsterisk } from "react-icons/lu";
import { MdDeleteOutline } from "react-icons/md";

// components
import CustomTooltip from "../../components/CustomToolTip";

const CreateOrder = () => {
  const [loading, setLoading] = useState(false);
  const [itemsOptions, setItemsOptions] = useState([]);
  const [selectItemsOptions, setSelectItemsOptions] = useState([]);
  const [manufacturerOptions, setManufacturerOptions] = useState([]);
  const [selectManufacturerOptions, setSelectManufacturerOptions] = useState(
    []
  );
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [selectWarehouseOptions, setSelectWarehouseOptions] = useState([]);

  const [form, setForm] = useState({
    items: [],
    inco: "",
    companyBargainNo: "",
    companyBargainDate: "",
    manufacturer: "",
    paymentDays: "",
    description: "",
    warehouse: "",
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

  const fetchManufacturerOptions = async () => {
    try {
      const response = await getManufacturer();
      setManufacturerOptions(
        response?.filter((manufacturer) => manufacturer.isActive)
      );
      const formattedOptions = response
        ?.filter((manufacturer) => manufacturer.isActive)
        ?.map((manufacturer) => ({
          value: manufacturer._id,
          label: manufacturer.manufacturer,
        }));
      setSelectManufacturerOptions(formattedOptions);
    } catch (error) {
      toast.error("Error fetching manufacturers!");
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
    fetchManufacturerOptions();
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
        form.companyBargainDate,
        form.paymentDays
      );

      const updatedForm = {
        ...form,
        paymentDays,
      };

      const response = await createOrder(updatedForm);

      if (response?.status === 201) {
        toast.success("Order created successfully!");
      } else {
        toast.error(`Unexpected status code: ${response?.status}`);
        console.error("Unexpected response:", response);
      }
      setForm({
        items: [],
        inco: "",
        companyBargainNo: "",
        companyBargainDate: "",
        manufacturer: "",
        paymentDays: "",
        description: "",
        warehouse: "",
        organization: localStorage.getItem("organizationId"),
      });
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
      fieldName === "manufacturer" ||
      fieldName === "inco"
    ) {
      setForm((prevForm) => ({
        ...prevForm,
        [fieldName]: value.value || "",
      }));
    } else if (
      fieldName === "companyBargainDate" ||
      fieldName === "paymentDays"
    ) {
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
    // Check if the item with the same rack and name already exists
    // const isDuplicate = form.items.some(
    //   (item) => item.itemId === "" && item.pickup === ""
    // );

    // if (isDuplicate) {
    //   toast.error("An item with the same rack and name already exists!");
    //   return;
    // }

    setForm((prevData) => ({
      ...prevData,
      items: [
        ...prevData.items,
        {
          itemId: "",
          quantity: null,
          pickup: "",
          baseRate: null,
          taxpaidAmount: null,
          taxableAmount: null,
          gstAmount: null,
          contNumber: null,
          gst: null,
          cgst: null,
          sgst: null,
          igst: null,
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

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...form.items];
    if (field === "quantity" || field === "baseRate") {
      value = Number(value) || null;
    }

    if (field === "itemId" || field === "pickup") {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value.value || "",
      };

      // Validation for duplicate item
      // const isDuplicate = updatedItems.some(
      //   (item, idx) =>
      //     idx !== index &&
      //     item.itemId === updatedItems[index].itemId &&
      //     item.pickup === updatedItems[index].pickup
      // );

      // if (isDuplicate) {
      //   toast.error(
      //     "Duplicate item with the same pickup and name is not allowed!"
      //   );
      //   return;
      // }
    } else {
      updatedItems[index] = { ...updatedItems[index], [field]: value };
    }

    // Additional logic for updating GST and tax amounts
    if (field === "itemId") {
      const selectedItem = itemsOptions?.find(
        (option) => option._id === value.value
      );
      if (selectedItem) {
        const gst = selectedItem.gst;
        const warehouseState = warehouseOptions?.find(
          (warehouse) => warehouse._id === form?.warehouse
        )?.state;
        const manufacturerState = manufacturerOptions?.find(
          (man) => man._id === form?.manufacturer
        )?.manufacturerdeliveryAddress.state;
        updatedItems[index].gst = gst;

        if (warehouseState === manufacturerState) {
          updatedItems[index].cgst = gst / 2;
          updatedItems[index].sgst = gst / 2;
          updatedItems[index].igst = null;
        } else {
          updatedItems[index].igst = gst;
          updatedItems[index].cgst = null;
          updatedItems[index].sgst = null;
        }
      }
    }

    if (field === "quantity" || field === "baseRate") {
      const quantity = updatedItems[index].quantity || 0;
      const baseRate = updatedItems[index].baseRate || 0;
      updatedItems[index].taxableAmount = quantity * baseRate;
      updatedItems[index].gstAmount =
        (baseRate * updatedItems[index].gst * quantity) / 100;
      updatedItems[index].taxpaidAmount =
        updatedItems[index].taxableAmount +
        (updatedItems[index].taxableAmount * updatedItems[index].gst) / 100;
    }

    setForm((prevData) => ({
      ...prevData,
      items: updatedItems,
    }));
  };

  const selectRefs = useRef([]);
  const baseRateRefs = useRef([]);

  const setSelectRef = (index, ref) => {
    selectRefs.current[index] = ref;
  };

  const setBaseRateRef = (index, ref) => {
    baseRateRefs.current[index] = ref;
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
        baseRateRefs.current[index + 1]?.focus();
      }
    }
  };

  const calculateTotalQuantity = () => {
    return form?.items?.reduce((total, item) => {
      return total + (Number(item.quantity) || 0);
    }, 0);
  };

  const calculateTotalAmount = () => {
    return form?.items?.reduce((total, item) => {
      return total + (Number(item.taxpaidAmount) || 0);
    }, 0);
  };

  const calculateTotalGrossWeight = () => {
    return form?.items?.reduce((total, item) => {
      return (
        total +
        (Number(
          itemsOptions.find((it) => it._id === item.itemId)?.grossweight
        ) || 0) *
          (Number(item.quantity) || 0)
      );
    }, 0);
  };

  return (
    <div className="w-[99vw] h-full mt-8 mb-8 flex flex-col gap-12 px-7">
      <div className="">
        <div className="flex flex-row justify-between">
          <div></div>
        </div>

        <div className="w-full">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 mt-4 mb-5 bg-white p-5 bg-white shadow-md border-2 border-[#CBCDCE] rounded-md"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-x-16 gap-y-5">
                <div className="w-fit flex gap-2 items-center">
                  <label
                    htmlFor="companyBargainNo"
                    className="flex text-[#38454A] text-[1rem]"
                  >
                    Company Bargain No.
                    <LuAsterisk className="text-[#FF0000] text-[0.7rem]" />
                  </label>
                  <input
                    name="companyBargainNo"
                    type="text"
                    value={form.companyBargainNo}
                    onChange={(e) =>
                      handleFormChange(0, "companyBargainNo", e.target.value)
                    }
                    required
                    placeholder="Company Bargain No."
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
                    htmlFor="manufacturer"
                    className="flex text-[#38454A] text-[1rem]"
                  >
                    Manufacturer
                    <LuAsterisk className="text-[#FF0000] text-[0.7rem]" />
                  </label>
                  <Select
                    className="relative w-[180px]"
                    options={selectManufacturerOptions}
                    value={
                      selectManufacturerOptions.find(
                        (option) => option.value === form.manufacturer
                      ) || null
                    }
                    onChange={(selectedOption) =>
                      handleFormChange(0, "manufacturer", selectedOption)
                    }
                  />
                </div>

                <div className="w-fit flex gap-2 items-center">
                  <label
                    htmlFor="companyBargainDate"
                    className="flex text-[#38454A] text-[1rem]"
                  >
                    Company Bargain Date
                    <LuAsterisk className="text-[#FF0000] text-[0.7rem]" />
                  </label>
                  <input
                    name="companyBargainDate"
                    type="date"
                    value={form.companyBargainDate}
                    onChange={(e) =>
                      handleFormChange(0, "companyBargainDate", e.target.value)
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
                    htmlFor="inco"
                    className="flex text-[#38454A] text-[1rem]"
                  >
                    Inco
                    <LuAsterisk className="text-[#FF0000] text-[0.7rem]" />
                  </label>
                  <Select
                    className="relative w-[180px]"
                    options={[
                      { value: "EXW", label: "EXW" },
                      { value: "FOR", label: "FOR" },
                    ]}
                    value={
                      [
                        { value: "EXW", label: "EXW" },
                        { value: "FOR", label: "FOR" },
                      ].find((option) => option.value === form.inco) || null
                    }
                    onChange={(selectedOption) =>
                      handleFormChange(0, "inco", selectedOption)
                    }
                  />
                </div>

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
                  className="w-[140px] flex items-center justify-center"
                >
                  {loading ? <Spinner /> : <span>Create Order</span>}
                </Button>
              </div>
            </div>
          </form>

          <div className="fixed bottom-0 left-0 right-0 bg-[#E4E4E4] shadow-md z-[10] ">
            <div className="flex justify-between items-center px-10 py-2">
              <div className="w-full flex flex-row justify-between text-[1rem] font-medium">
                <span>Total Qty: {calculateTotalQuantity()}</span>
                <span>Total Gross Weight: {calculateTotalGrossWeight()}</span>
                <span>
                  Total Amount: ₹{calculateTotalAmount().toLocaleString()}
                </span>
              </div>
            </div>
            <div className="bg-white text-[1rem] flex justify-between items-center px-4 py-1">
              <p>2024 @bargainwale</p>
              <p>Design and developed by Reduxcorporation</p>
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
                        title="Company Bargain Number"
                        description="This unique identifier helps in tracking the bargain associated with the company."
                        learnMoreLink="/company-bargain-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      CBD
                      <CustomTooltip
                        title="Company Bargain Date"
                        description="The date on which the bargain was finalized with the company. Useful for scheduling."
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
                        description="The location from where the item will be picked up for delivery."
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
                        description="The number of units of the item in this order."
                        learnMoreLink="/quantity-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      Base Rate
                      <CustomTooltip
                        title="Base Rate"
                        description="The basic cost per unit of the item before taxes."
                        learnMoreLink="/base-rate-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      Taxable Amt.
                      <CustomTooltip
                        title="Taxable Amount"
                        description="The portion of the amount that is subject to tax."
                        learnMoreLink="/taxable-amount-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[200px] font-medium">
                      GST %
                      <CustomTooltip
                        title="GST Percentage"
                        description="The Goods and Services Tax percentage applied to the item."
                        learnMoreLink="/gst-percentage-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[200px] font-medium">
                      GST Amt.
                      <CustomTooltip
                        title="GST Amount"
                        description="The tax amount calculated based on the GST percentage."
                        learnMoreLink="/gst-amount-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[150px] font-medium">
                      Total Amt.
                      <CustomTooltip
                        title="Total Amount with Tax"
                        description="The total cost including the base rate and applicable taxes."
                        learnMoreLink="/total-amount-info"
                      />
                    </th>
                    <th className="py-4 px-2 text-center min-w-[200px] font-medium">
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
                      <td className="break-all py-4 px-2 text-center font-medium">
                        {form.companyBargainNo}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {form.companyBargainDate}
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div className="relative w-[500px]">
                          <Select
                            ref={(ref) => setSelectRef(index, ref)}
                            className="relative w-[500px] text-[0.9rem]"
                            options={selectItemsOptions}
                            value={
                              selectItemsOptions.find(
                                (option) => option.value === item.itemId
                              ) || null
                            }
                            onChange={(selectedOption) =>
                              handleItemChange(index, "itemId", selectedOption)
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
                            ]}
                            value={
                              [
                                { value: "rack", label: "Rack" },
                                { value: "depot", label: "Depot" },
                                { value: "plant", label: "Plant" },
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
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value >= 0) {
                              handleItemChange(index, "contNumber", value);
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
                          required
                          placeholder="Cont. No."
                          className="w-[150px] border-2 border-[#CBCDCE] px-2 py-1 rounded-md placeholder-[#737373]"
                        />
                      </td> */}
                      <td className="py-4 px-2 text-center">
                        <input
                          type="number"
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value >= 0) {
                              handleItemChange(index, "quantity", value);
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
                          required
                          placeholder="Quantity"
                          className="w-[150px] border-2 border-[#CBCDCE] px-2 py-1 rounded-md placeholder-[#737373]"
                        />
                      </td>
                      <td className="py-4 px-2 text-center">
                        <input
                          ref={(ref) => setBaseRateRef(index, ref)}
                          type="number"
                          name="baseRate"
                          value={item.baseRate}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value >= 0) {
                              handleItemChange(index, "baseRate", value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (
                              e.key === "e" ||
                              e.key === "-" ||
                              e.key === "+"
                            ) {
                              e.preventDefault();
                            }
                            handleTabKey(e, index);
                          }}
                          required
                          placeholder="Base Rate"
                          className="w-[150px] border-2 border-[#CBCDCE] px-2 py-1 rounded-md placeholder-[#737373]"
                        />
                      </td>
                      <td className="py-4 px-2 text-center">
                        ₹{item.taxableAmount?.toLocaleString()}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {warehouseOptions?.find(
                          (warehouse) => warehouse._id === form?.warehouse
                        )?.location?.state ===
                        manufacturerOptions?.find(
                          (man) => man._id === form?.manufacturer
                        )?.manufacturerdeliveryAddress.state ? (
                          <>
                            <span>
                              {itemsOptions?.find(
                                (option) => option._id === item?.itemId
                              )?.gst / 2 || "N/A"}
                              {"% "}
                              (CGST) +{" "}
                              {itemsOptions?.find(
                                (option) => option._id === item?.itemId
                              )?.gst / 2 || "N/A"}
                              {"% "}
                              (SGST)
                            </span>
                          </>
                        ) : (
                          <>
                            <span>
                              {itemsOptions?.find(
                                (option) => option._id === item?.itemId
                              )?.gst || "N/A"}
                              {"% "}
                              (IGST)
                            </span>
                          </>
                        )}
                      </td>
                      <td className="py-4 px-2 text-center">
                        ₹{item.gstAmount}
                      </td>
                      <td className="py-4 px-2 text-center">
                        ₹{item.taxpaidAmount?.toLocaleString()}
                      </td>
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

export default CreateOrder;
