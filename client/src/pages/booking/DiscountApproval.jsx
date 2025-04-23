import React, { useEffect, useState } from "react";
import { toast } from "sonner";

// api services
import { getBookings, updateDiscount } from "@/services/bookingService";

// icons
import { MdCheck, MdClose, MdInfoOutline } from "react-icons/md";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Input,
} from "@material-tailwind/react";

const DiscountApprovalPage = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemApprovals, setItemApprovals] = useState([]);

  const openModal = (booking) => {
    setSelectedBooking(booking);
    setItemApprovals(
      booking.items
        ?.filter((item) => item.discount > 0)
        ?.map((item) => ({
          itemId: item.item._id,
          approved: null,
        }))
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setIsModalOpen(false);
    setItemApprovals([]);
    setManualDiscounts({});
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

  const fetchBookings = async () => {
    try {
      const response = await getBookings();
      let filteredBookings = response.map((booking) => {
        const isDiscounted = booking.items?.some((item) => item.discount > 0);
        return { ...booking, isDiscountRequested: isDiscounted };
      });
      setBookings(
        filteredBookings
          ?.filter((booking) => booking.isDiscountRequested)
          ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
    } catch (err) {
      console.log("Error:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const [manualDiscounts, setManualDiscounts] = useState({});

  // Update manual discounts for a specific item
  const handleManualDiscountChange = (itemId, value) => {
    setManualDiscounts((prev) => ({
      ...prev,
      [itemId]: Number(value),
    }));
  };

  const handleItemApproval = (itemId, approved, discountValue = null) => {
    setItemApprovals((prevApprovals) =>
      prevApprovals.map((item) =>
        item.itemId === itemId ? { ...item, approved } : item
      )
    );
    if (approved && discountValue !== null) {
      handleManualDiscountChange(itemId, discountValue);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBooking) return;

    const unapprovedItems = itemApprovals.some(
      (item) => item.approved === null
    );

    if (unapprovedItems) {
      toast.error(
        "Please approve or reject all discount items before submitting."
      );
      return;
    }

    const updatedItems = {
      items: itemApprovals.map((item) => ({
        item: item.itemId,
        discount: item.approved
          ? manualDiscounts[item.itemId] ||
            selectedBooking.items?.find((i) => i.item?._id === item.itemId)
              ?.discount
          : 0,
      })),
    };

    try {
      await updateDiscount(selectedBooking._id, updatedItems);
      await fetchBookings();
      closeModal();
      toast.success("Discount approval completed");
    } catch (error) {
      console.error("Error updating discount:", error);
    }
  };

  const getButtonStyles = (approved, isApproveButton) => {
    if (approved === true && isApproveButton) return "bg-green-500";
    if (approved === false && !isApproveButton) return "bg-red-500";
    return "bg-gray-500";
  };

  return (
    <div className="mt-8 mb-8 px-7">
      <h1 className="text-2xl font-bold mb-4">Discount Approval</h1>
      <div className="bg-white border-[2px] border-[#737373] shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-200">
              {[
                "Bargain Date",
                "Bargain No.",
                "Buyer Name",
                "Approval Status",
                "Delivery Type",
                "Request Date",
                "Actions",
              ].map((header) => (
                <th key={header} className="py-4 px-4 text-center">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <tr key={booking._id} className="border-t border-gray-300">
                  <td className="py-4 px-4 text-center">
                    {formatDate(booking.BargainDate)}
                  </td>
                  <td className="py-4 px-4 text-center">{booking.BargainNo}</td>
                  <td className="py-4 px-4 text-center">
                    {booking.buyer?.buyer}
                  </td>
                  <td className="py-4 px-4 text-center flex items-center justify-center">
                    <p
                      className={`w-[100px] ${
                        booking.discountStatus === "pending"
                          ? "bg-red-100"
                          : booking.discountStatus === "approved"
                          ? "bg-green-200"
                          : "bg-green-100"
                      } py-1 rounded-md`}
                    >
                      {String(booking.discountStatus).charAt(0).toUpperCase() +
                        String(booking.discountStatus).slice(1)}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {booking.deliveryOption}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {formatDate(booking.createdAt)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openModal(booking)}
                        className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600"
                        title="View Details"
                      >
                        <MdInfoOutline className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-6 text-blue-gray-600">
                  No bookings found!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Discount Details */}
      {selectedBooking && (
        <Dialog open={isModalOpen} handler={closeModal}>
          <DialogHeader>Discount booking Details</DialogHeader>
          <DialogBody divider>
            <p>
              <strong>Buyer Name:</strong> {selectedBooking.buyer?.buyer}
            </p>
            <p>
              <strong>Bargain No:</strong> {selectedBooking.BargainNo}
            </p>
            <p>
              <strong>Bargain Date:</strong>{" "}
              {formatDate(selectedBooking.BargainDate)}
            </p>
            <p>
              <strong>Delivery Type:</strong> {selectedBooking.deliveryOption}
            </p>

            {/* Item Details Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full border mt-4">
                <thead>
                  <tr>
                    <th className="border p-2 min-w-[80px]">Item Name</th>
                    <th className="border p-2 min-w-[80px]">Cont. Number</th>
                    <th className="border p-2 min-w-[80px]">GST</th>
                    <th className="border p-2 min-w-[80px]">Pickup</th>
                    <th className="border p-2 min-w-[80px]">Quantity</th>
                    <th className="border p-2 min-w-[80px]">Taxable Amount</th>
                    <th className="border p-2 min-w-[80px]">
                      Amount (with tax)
                    </th>
                    <th className="border p-2 min-w-[80px]">Base Rate</th>
                    <th className="border p-2 min-w-[100px]">
                      Discount %
                      {selectedBooking.discountStatus === "pending" ? (
                        <span> Requested</span>
                      ) : (
                        <span> Approved/Rejected</span>
                      )}
                    </th>
                    {selectedBooking.discountStatus === "pending" && (
                      <th className="border p-2 min-w-[80px]">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {selectedBooking.items?.map((item, index) => {
                    const approval = itemApprovals.find(
                      (i) => i.itemId === item.item._id
                    )?.approved;

                    return (
                      <tr key={index} className="border">
                        <td className="border p-2">
                          {item.item?.materialdescription}
                        </td>
                        <td className="border p-2">{item.contNumber}</td>
                        <td className="border p-2">{item.item?.gst}</td>
                        <td className="border p-2">{item.pickup}</td>
                        <td className="border p-2">{item.quantity}</td>
                        <td className="border p-2">{item.taxableAmount}</td>
                        <td className="border p-2">{item.taxpaidAmount}</td>
                        <td className="border p-2">₹{item?.basePrice}</td>
                        <td className="border p-2">
                          {approval === true ? (
                            <Input
                              type="number"
                              value={
                                manualDiscounts[item.item._id] !== undefined
                                  ? manualDiscounts[item.item._id]
                                  : item?.discount || ""
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                const numericValue =
                                  value === "" ? "" : Number(value);
                                setManualDiscounts((prev) => ({
                                  ...prev,
                                  [item.item._id]: numericValue,
                                }));
                              }}
                              className="border p-1 rounded"
                            />
                          ) : (
                            `${item?.discount}%`
                          )}
                        </td>
                        {selectedBooking.discountStatus === "pending" && (
                          <td className="border p-2 flex gap-2">
                            {item.discount > 0 && (
                              <>
                                <button
                                  onClick={() =>
                                    handleItemApproval(
                                      item.item._id,
                                      true,
                                      manualDiscounts[item.item._id]
                                    )
                                  }
                                  className={`text-white rounded-full p-2 hover:bg-green-700 ${getButtonStyles(
                                    approval,
                                    true
                                  )}`}
                                  title="Approve"
                                >
                                  <MdCheck className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleItemApproval(item.item._id, false)
                                  }
                                  className={`text-white rounded-full p-2 hover:bg-red-700 ${getButtonStyles(
                                    approval,
                                    false
                                  )}`}
                                  title="Reject"
                                >
                                  <MdClose className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </DialogBody>
          <DialogFooter>
            {selectedBooking.discountStatus === "pending" && (
              <Button color="green" onClick={handleSubmit} className="mr-2">
                Submit
              </Button>
            )}
            <Button color="red" onClick={closeModal}>
              Close
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
};

export default DiscountApprovalPage;
