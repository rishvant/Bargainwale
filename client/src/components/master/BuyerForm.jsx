import {
  Button,
  Input,
  Spinner,
  Typography,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
<<<<<<< HEAD
import * as XLSX from "xlsx";
=======
import * as XLSX from "xlsx"; // Import SheetJS library for Excel
>>>>>>> d4bbbb806ef75a47bdbd8bd865857422cb735666
import {
  createBuyer,
  deleteBuyer,
  getBuyer,
  updateBuyer,
} from "@/services/masterService";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";

const BuyerForm = () => {
  const [loading, setLoading] = useState(false);
  const [buyers, setBuyers] = useState([]);
  const [form, setForm] = useState({
    buyer: "",
    buyerCompany: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
    buyerContact: "",
    buyerEmail: "",
    buyerGstno: "",
    buyerGooglemaps: "",
    organization: localStorage.getItem("organizationId"),
  });
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
<<<<<<< HEAD
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [buyerToDelete, setBuyerToDelete] = useState(null);
  const [confirmBuyerName, setConfirmBuyerName] = useState("");
=======
>>>>>>> d4bbbb806ef75a47bdbd8bd865857422cb735666

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      const response = await getBuyer();
      setBuyers(response || []);
    } catch (error) {
      toast.error("Error fetching buyers!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newBuyer = {
        buyer: form.buyer,
        buyerCompany: form.buyerCompany,
        buyerdeliveryAddress: {
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          pinCode: form.pinCode,
        },
        buyerContact: form.buyerContact,
        buyerEmail: form.buyerEmail,
        buyerGstno: form.buyerGstno,
        buyerGooglemaps: form.buyerGooglemaps,
        organization: form.organization,
      };

      await createBuyer(newBuyer);
      toast.success("Buyer added successfully!");
      setForm({
        buyer: "",
        buyerCompany: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pinCode: "",
        buyerContact: "",
        buyerEmail: "",
        buyerGstno: "",
        buyerGooglemaps: "",
        organization: localStorage.getItem("organizationId"),
      });
      fetchBuyers();
<<<<<<< HEAD
      setAddModalOpen(false);
=======
      setAddModalOpen(false); // Close the Add Buyer modal
>>>>>>> d4bbbb806ef75a47bdbd8bd865857422cb735666
    } catch (error) {
      toast.error("Error adding buyer!");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    setLoading(true);
<<<<<<< HEAD
    try {
      await updateBuyer(editingBuyer, editingBuyer._id);
      toast.success("Buyer updated successfully!");
      setEditModalOpen(false);
      fetchBuyers();
    } catch (error) {
      toast.error("Error updating buyer!");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (buyer) => {
    setBuyerToDelete(buyer);
    setDeleteModalOpen(true);
    setConfirmBuyerName("");
  };

  const handleConfirmDelete = async () => {
    if (confirmBuyerName === buyerToDelete.buyer) {
      try {
        await deleteBuyer(buyerToDelete._id);
        toast.success("Buyer deleted successfully!");
        fetchBuyers();
        setDeleteModalOpen(false);
        setBuyerToDelete(null);
        setConfirmBuyerName("");
      } catch (error) {
        toast.error("Error deleting buyer!");
      }
    }
  };

=======
    try {
      await updateBuyer(editingBuyer, editingBuyer._id);
      toast.success("Buyer updated successfully!");
      setEditModalOpen(false); // Close the Edit Buyer modal
      fetchBuyers();
    } catch (error) {
      toast.error("Error updating buyer!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBuyer(id);
      toast.success("Buyer deleted successfully!");
      fetchBuyers();
    } catch (error) {
      toast.error("Error deleting buyer!");
    }
  };

>>>>>>> d4bbbb806ef75a47bdbd8bd865857422cb735666
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openEditModal = (buyer) => {
    setEditingBuyer({ ...buyer });
    setEditModalOpen(true);
  };

<<<<<<< HEAD
=======
  // Handle Excel Download
>>>>>>> d4bbbb806ef75a47bdbd8bd865857422cb735666
  const handleExcelDownload = () => {
    if (buyers.length === 0) {
      toast.error("No buyers available to download!");
      return;
    }

    const data = buyers.map((buyer) => ({
      Name: buyer.buyer,
      Company: buyer.buyerCompany,
      "Address Line 1": buyer.buyerdeliveryAddress?.addressLine1 || "",
      "Address Line 2": buyer.buyerdeliveryAddress?.addressLine2 || "",
      City: buyer.buyerdeliveryAddress?.city || "",
      State: buyer.buyerdeliveryAddress?.state || "",
      Pincode: buyer.buyerdeliveryAddress?.pinCode || "",
      Contact: buyer.buyerContact,
      Email: buyer.buyerEmail,
      "GST Number": buyer.buyerGstno,
      "Google Maps": buyer.buyerGooglemaps,
    }));

<<<<<<< HEAD
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Buyers");
=======
    // Create a new workbook and add data
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Buyers");

    // Generate Excel file and trigger download
>>>>>>> d4bbbb806ef75a47bdbd8bd865857422cb735666
    XLSX.writeFile(workbook, "Buyers_List.xlsx");
    toast.success("Buyers list downloaded successfully!");
  };

  return (
    <div className="container mx-auto p-6">
<<<<<<< HEAD
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <Typography variant="h4" className="font-bold">
            Buyers
          </Typography>
          <div className="flex gap-4">
=======
      {/* Buyers List */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
            <Typography variant="h4" className="font-bold">
              Buyers
            </Typography>
            <div className="flex gap-4">
>>>>>>> d4bbbb806ef75a47bdbd8bd865857422cb735666
            <Button
              color="green"
              onClick={handleExcelDownload}
              className="flex items-center gap-2"
            >
              Download Excel
            </Button>
<<<<<<< HEAD
            <Button
              color="blue"
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-2"
            >
              + Add Buyer
            </Button>
          </div>
=======
        
          <Button
            color="blue"
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2"
          >
            + Add Buyer
          </Button>
        </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {buyers.map((buyer) => (
            <div
              key={buyer._id}
              className="bg-white shadow-md rounded-md p-4 border"
            >
              <Typography variant="h6" className="font-bold">
                {buyer.buyer}
              </Typography>
              <Typography className="text-sm text-gray-600">
                Company: {buyer.buyerCompany}
              </Typography>
              <Typography className="text-sm text-gray-600">
                Contact: {buyer.buyerContact}
              </Typography>
              <Typography className="text-sm text-gray-600">
                Email: {buyer.buyerEmail}
              </Typography>
              <Typography className="text-sm text-gray-600">
                GST: {buyer.buyerGstno}
              </Typography>
              <Typography className="text-sm text-gray-600">
                Address: {buyer.buyerdeliveryAddress?.addressLine1},{" "}
                {buyer.buyerdeliveryAddress?.addressLine2},{" "}
                {buyer.buyerdeliveryAddress?.city},{" "}
                {buyer.buyerdeliveryAddress?.state},{" "}
                {buyer.buyerdeliveryAddress?.pinCode}
              </Typography>
              <div className="mt-4 flex gap-2">
                <Button
                  color="blue"
                  size="sm"
                  onClick={() => openEditModal(buyer)}
                  className="flex items-center gap-1"
                >
                  <AiOutlineEdit /> Edit
                </Button>
                <Button
                  color="red"
                  size="sm"
                  onClick={() => handleDelete(buyer._id)}
                  className="flex items-center gap-1"
                >
                  <AiOutlineDelete /> Delete
                </Button>
              </div>
            </div>
          ))}
>>>>>>> d4bbbb806ef75a47bdbd8bd865857422cb735666
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {buyers.map((buyer) => (
            <div
              key={buyer._id}
              className="bg-white shadow-md rounded-md p-4 border"
            >
              <Typography variant="h6" className="font-bold">
                {buyer.buyer}
              </Typography>
              <Typography className="text-sm text-gray-600">
                Company: {buyer.buyerCompany}
              </Typography>
              <Typography className="text-sm text-gray-600">
                Contact: {buyer.buyerContact}
              </Typography>
              <Typography className="text-sm text-gray-600">
                Email: {buyer.buyerEmail}
              </Typography>
              <Typography className="text-sm text-gray-600">
                GST: {buyer.buyerGstno}
              </Typography>
              <Typography className="text-sm text-gray-600">
                Address: {buyer.buyerdeliveryAddress?.addressLine1},{" "}
                {buyer.buyerdeliveryAddress?.addressLine2},{" "}
                {buyer.buyerdeliveryAddress?.city},{" "}
                {buyer.buyerdeliveryAddress?.state},{" "}
                {buyer.buyerdeliveryAddress?.pinCode}
              </Typography>
              <div className="mt-4 flex gap-2">
                <Button
                  color="blue"
                  size="sm"
                  onClick={() => openEditModal(buyer)}
                  className="flex items-center gap-1"
                >
                  <AiOutlineEdit /> Edit
                </Button>
                <Button
                  color="red"
                  size="sm"
                  onClick={() => handleDeleteClick(buyer)}
                  className="flex items-center gap-1"
                >
                  <AiOutlineDelete /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Buyer Modal */}
      <Dialog open={addModalOpen} handler={() => setAddModalOpen(false)}>
        <DialogHeader>Add Buyer</DialogHeader>
        <DialogBody divider>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Input
              name="buyer"
              label="Buyer Name"
              value={form.buyer}
              onChange={handleInputChange}
              required
            />
            <Input
              name="buyerCompany"
              label="Company Name"
              value={form.buyerCompany}
              onChange={handleInputChange}
              required
            />
            <Input
              name="addressLine1"
              label="Address Line 1"
              value={form.addressLine1}
              onChange={handleInputChange}
              required
            />
            <Input
              name="addressLine2"
              label="Address Line 2"
              value={form.addressLine2}
              onChange={handleInputChange}
            />
            <Input
              name="city"
              label="City"
              value={form.city}
              onChange={handleInputChange}
              required
            />
            <Input
              name="state"
              label="State"
              value={form.state}
              onChange={handleInputChange}
              required
            />
            <Input
              name="pinCode"
              label="Pin Code"
              value={form.pinCode}
              onChange={handleInputChange}
              required
            />
            <Input
              name="buyerContact"
              label="Contact"
              value={form.buyerContact}
              onChange={handleInputChange}
              required
            />
            <Input
              name="buyerEmail"
              label="Email"
              type="email"
              value={form.buyerEmail}
              onChange={handleInputChange}
              required
            />
            <Input
              name="buyerGstno"
              label="GST Number"
              value={form.buyerGstno}
              onChange={handleInputChange}
            />
            <Input
              name="buyerGooglemaps"
              label="Google Maps Link"
              value={form.buyerGooglemaps}
              onChange={handleInputChange}
            />
          </form>
        </DialogBody>
        <DialogFooter>
          <Button color="blue" onClick={handleSubmit} disabled={loading}>
            {loading ? <Spinner /> : "Add Buyer"}
          </Button>
          <Button color="gray" onClick={() => setAddModalOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Buyer Modal */}
      {editingBuyer && (
        <Dialog open={editModalOpen} handler={() => setEditModalOpen(false)}>
          <DialogHeader>Edit Buyer</DialogHeader>
          <DialogBody divider>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="buyer"
                label="Buyer Name"
                value={editingBuyer.buyer}
                onChange={(e) =>
                  setEditingBuyer((prev) => ({
                    ...prev,
                    buyer: e.target.value,
                  }))
                }
                required
              />
              <Input
                name="buyerCompany"
                label="Company Name"
                value={editingBuyer.buyerCompany}
                onChange={(e) =>
                  setEditingBuyer((prev) => ({
                    ...prev,
                    buyerCompany: e.target.value,
                  }))
                }
                required
              />
              <Input
                name="buyerGstno"
                label="GST Number"
                value={editingBuyer.buyerGstno}
                onChange={(e) =>
                  setEditingBuyer((prev) => ({
                    ...prev,
                    buyerGstno: e.target.value,
                  }))
                }
                required
              />
              <Input
                name="addressLine1"
                label="Address Line 1"
                value={editingBuyer.buyerdeliveryAddress?.addressLine1}
                onChange={(e) =>
                  setEditingBuyer((prev) => ({
                    ...prev,
                    buyerdeliveryAddress: {
                      ...prev.buyerdeliveryAddress,
                      addressLine1: e.target.value,
                    },
                  }))
                }
              />
              <Input
                name="addressLine2"
                label="Address Line 2"
                value={editingBuyer.buyerdeliveryAddress?.addressLine2}
                onChange={(e) =>
                  setEditingBuyer((prev) => ({
                    ...prev,
                    buyerdeliveryAddress: {
                      ...prev.buyerdeliveryAddress,
                      addressLine2: e.target.value,
                    },
                  }))
                }
              />
              <Input
                name="city"
                label="City"
                value={editingBuyer.buyerdeliveryAddress?.city}
                onChange={(e) =>
                  setEditingBuyer((prev) => ({
                    ...prev,
                    buyerdeliveryAddress: {
                      ...prev.buyerdeliveryAddress,
                      city: e.target.value,
                    },
                  }))
                }
              />
              <Input
                name="state"
                label="State"
                value={editingBuyer.buyerdeliveryAddress?.state}
                onChange={(e) =>
                  setEditingBuyer((prev) => ({
                    ...prev,
                    buyerdeliveryAddress: {
                      ...prev.buyerdeliveryAddress,
                      state: e.target.value,
                    },
                  }))
                }
              />
              <Input
                name="pinCode"
                label="Pin Code"
                value={editingBuyer.buyerdeliveryAddress?.pinCode}
                onChange={(e) =>
                  setEditingBuyer((prev) => ({
                    ...prev,
                    buyerdeliveryAddress: {
                      ...prev.buyerdeliveryAddress,
                      pinCode: e.target.value,
                    },
                  }))
                }
              />
            </form>
          </DialogBody>
          <DialogFooter>
            <Button color="blue" onClick={handleEdit} disabled={loading}>
              {loading ? <Spinner /> : "Save Changes"}
            </Button>
            <Button color="gray" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </Dialog>
      )}
<<<<<<< HEAD

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} handler={() => setDeleteModalOpen(false)}>
        <DialogHeader className="text-red-500">Confirm Deletion</DialogHeader>
        <DialogBody divider>
          <div className="space-y-4">
            <Typography className="font-bold text-lg">
              Are you sure you want to delete this buyer?
            </Typography>
            
            <Typography className="text-red-500 font-semibold">
              Warning: The following items will be permanently deleted:
            </Typography>
            
            <ul className="list-disc pl-6 space-y-2">
              <li>Buyer profile and contact information</li>
              <li>All associated purchase records</li>
              <li>Sales history and transactions</li>
              <li>Book orders and delivery details</li>
              <li>Payment records and invoices</li>
              <li>Custom price agreements</li>
              <li>All historical communication records</li>
              <li>Shipping addresses and preferences</li>
              <li>Associated documents and contracts</li>
            </ul>

            <Typography className="mt-4 font-medium">
              To confirm deletion, please type the buyer name exactly:
              <span className="font-bold text-red-500">
                {" "}
                {buyerToDelete?.buyer}
              </span>
            </Typography>

            <Input
              type="text"
              label="Type buyer name to confirm"
              value={confirmBuyerName}
              onChange={(e) => setConfirmBuyerName(e.target.value)}
              className="mt-2"
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            color="red"
            onClick={handleConfirmDelete}
            disabled={confirmBuyerName !== buyerToDelete?.buyer}
            className="mr-2"
          >
            Delete Buyer
          </Button>
          <Button
            color="gray"
            onClick={() => {
              setDeleteModalOpen(false);
              setBuyerToDelete(null);
              setConfirmBuyerName("");
            }}
          >
            Cancel
          </Button>
        </DialogFooter>
      </Dialog>
=======
>>>>>>> d4bbbb806ef75a47bdbd8bd865857422cb735666
    </div>
  );
};

export default BuyerForm;