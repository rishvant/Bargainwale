import {
  Button,
  Input,
  Spinner,
  Typography,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Switch,
} from "@material-tailwind/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  createBuyer,
  deleteBuyer,
  getBuyer,
  updateBuyer,
} from "@/services/masterService";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import PhoneInput from "react-phone-number-input";
import excel from "../../assets/excel.svg";
import buyerImage from "../../assets/buyer.png";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";
import FileUploadModal from "./FileUploadModal";

const requiredColumns = [
  "Buyer",
  "BuyerCompany",
  "BuyerContact",
  "BuyerEmail",
  "BuyerGstno",
  "AddressLine1",
  "AddressLine2",
  "City",
  "State",
  "PinCode",
  "BuyerGooglemaps",
];

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [buyerToDelete, setBuyerToDelete] = useState(null);
  const [confirmBuyerName, setConfirmBuyerName] = useState("");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

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
    if (
      !form.buyer ||
      !form.buyerCompany ||
      !form.addressLine1 ||
      !form.city ||
      !form.state ||
      !form.pinCode ||
      !form.buyerContact ||
      !form.buyerEmail
    ) {
      toast.error("Please fill out all required fields!");
      return;
    }
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
      setAddModalOpen(false);
    } catch (error) {
      toast.error("Error adding buyer!");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
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

  const toggleStatus = async (isActive, id) => {
    try {
      const response = await updateBuyer({ isActive: !isActive }, id);
      fetchBuyers();
    } catch (error) {
      console.error("Error updating buyer status:", error);
    }
  };

  const handleFileChange = (e) => {
    setProgress(0);
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Select file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("organization", localStorage.getItem("clerk_active_org"));
    setProgress(0);

    // Simulate progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100 || prev >= 200) {
          clearInterval(interval);
          return prev >= 200 ? 200 : 100;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/upload/buyer`,
        formData
      );

      if (response.status === 200) {
        setProgress(100);
        toast.success("File uploaded successfully");
        setFile(null);
        fetchBuyers();
      } else {
        setProgress(200);
        toast.error("Error uploading file");
      }
    } catch (error) {
      setProgress(200);
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.message;

        if (errorMessage.includes("Missing required columns")) {
          toast.error(`${errorMessage}`);
        } else {
          toast.error("An error occurred during the upload");
        }
      } else {
        toast.error("An error occurred during the upload");
      }
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

  const handleExcelDownload = () => {
    if (buyers.length === 0) {
      toast.error("No buyers available to download!");
      return;
    }

    const data = buyers.map((buyer) => ({
      Name: buyer.buyer,
      Company: buyer.buyerCompany,
      Address: [
        buyer.buyerdeliveryAddress?.addressLine1,
        buyer.buyerdeliveryAddress?.addressLine2,
        buyer.buyerdeliveryAddress?.city,
        buyer.buyerdeliveryAddress?.state,
        buyer.buyerdeliveryAddress?.pinCode,
      ]
        .filter(Boolean)
        .join(", "),
      Contact: buyer.buyerContact,
      Email: buyer.buyerEmail,
      "GST Number": buyer.buyerGstno,
      "Google Maps Link": buyer.buyerGooglemaps,
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Buyers");
    XLSX.writeFile(workbook, "Buyers_List.xlsx");
    toast.success("Buyers list downloaded successfully!");
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <Typography variant="h4" className="font-bold">
            Buyers
          </Typography>
          <div className="flex gap-4">
            <Button
              color="green"
              onClick={handleExcelDownload}
              className="flex items-center gap-2"
            >
              Download Excel
            </Button>
            <Button
              color="blue"
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-2"
            >
              + Add Buyer
            </Button>
            <Button
              color="green"
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2"
            >
              <img src={excel} alt="Import from Excel" className="w-5 mr-2" />
              Import Excel
            </Button>
          </div>
        </div>

        <FileUploadModal
          open={uploadModalOpen}
          setOpen={setUploadModalOpen}
          handleFileChange={handleFileChange}
          handleUpload={handleUpload}
          file={file}
          setFile={setFile}
          progress={progress}
          setProgress={setProgress}
          columns={requiredColumns}
          image={buyerImage}
        />

        <div className="flex flex-col">
          <h3 className="text-[1.2rem] font-[500]">Active Buyers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {buyers?.filter((buyer) => buyer.isActive)?.length > 0 ? (
              buyers
                ?.filter((buyer) => buyer.isActive)
                ?.map((buyer) => (
                  <div
                    key={buyer._id}
                    className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl transition duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Typography
                        variant="h6"
                        className="font-bold text-lg text-gray-800 tracking-wide"
                      >
                        {buyer.buyer}
                      </Typography>
                      <Switch
                        checked={buyer.isActive}
                        onChange={() => toggleStatus(buyer.isActive, buyer._id)}
                        color="green"
                        className="transform scale-125"
                      />
                    </div>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Company:
                      </span>{" "}
                      {buyer.buyerCompany}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Contact:
                      </span>{" "}
                      {buyer.buyerContact}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Email:
                      </span>{" "}
                      {buyer.buyerEmail}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">GST:</span>{" "}
                      {buyer.buyerGstno}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Address:
                      </span>{" "}
                      {[
                        buyer.buyerdeliveryAddress?.addressLine1,
                        buyer.buyerdeliveryAddress?.addressLine2,
                        buyer.buyerdeliveryAddress?.city,
                        buyer.buyerdeliveryAddress?.state,
                        buyer.buyerdeliveryAddress?.pinCode,
                      ]
                        .filter((part) => part)
                        .join(", ")}
                    </Typography>
                    <div className="mt-5 flex gap-4">
                      <Button
                        color="blue"
                        size="sm"
                        onClick={() => openEditModal(buyer)}
                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
                      >
                        <AiOutlineEdit /> Edit
                      </Button>
                      {/* <Button
                        color="red"
                        size="sm"
                        onClick={() => handleDeleteClick(buyer)}
                        className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                      >
                        <AiOutlineDelete /> Delete
                      </Button> */}
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-gray-600 text-[1.1rem] col-span-full">
                No buyers available.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col mt-14">
          <h3 className="text-[1.2rem] font-[500]">Deactive Buyers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {buyers?.filter((buyer) => !buyer.isActive)?.length > 0 ? (
              buyers
                ?.filter((buyer) => !buyer.isActive)
                ?.map((buyer) => (
                  <div
                    key={buyer._id}
                    className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl opacity-50 hover:opacity-100 transition-opacity duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Typography
                        variant="h6"
                        className="font-bold text-lg text-gray-800 tracking-wide"
                      >
                        {buyer.buyer}
                      </Typography>
                      <Switch
                        checked={buyer.isActive}
                        onChange={() => toggleStatus(buyer.isActive, buyer._id)}
                        color="green"
                        className="transform scale-125"
                      />
                    </div>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Company:
                      </span>{" "}
                      {buyer.buyerCompany}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Contact:
                      </span>{" "}
                      {buyer.buyerContact}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Email:
                      </span>{" "}
                      {buyer.buyerEmail}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">GST:</span>{" "}
                      {buyer.buyerGstno}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Address:
                      </span>{" "}
                      {buyer.buyerdeliveryAddress?.addressLine1},{" "}
                      {buyer.buyerdeliveryAddress?.addressLine2},{" "}
                      {buyer.buyerdeliveryAddress?.city},{" "}
                      {buyer.buyerdeliveryAddress?.state},{" "}
                      {buyer.buyerdeliveryAddress?.pinCode}
                    </Typography>
                    <div className="mt-5 flex gap-4">
                      <Button
                        color="blue"
                        size="sm"
                        onClick={() => openEditModal(buyer)}
                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
                      >
                        <AiOutlineEdit /> Edit
                      </Button>
                      {/* <Button
                        color="red"
                        size="sm"
                        onClick={() => handleDeleteClick(buyer)}
                        className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                      >
                        <AiOutlineDelete /> Delete
                      </Button> */}
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-gray-600 text-[1.1rem] col-span-full">
                No buyers available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Buyer Modal */}
      <Dialog open={addModalOpen} handler={() => setAddModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>Add Buyer</DialogHeader>
          <DialogBody divider>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <PhoneInput
                name="buyerContact"
                label="Contact"
                value={form.buyerContact}
                onChange={(value) =>
                  handleInputChange({ target: { name: "buyerContact", value } })
                }
                required
                international
                defaultCountry="IN"
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
            </div>
          </DialogBody>
          <DialogFooter className="flex gap-2">
            <Button color="blue" type="submit" disabled={loading}>
              {loading ? <Spinner /> : "Add Buyer"}
            </Button>
            <Button color="gray" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Buyer Modal */}
      {editingBuyer && (
        <Dialog open={editModalOpen} handler={() => setEditModalOpen(false)}>
          <form onSubmit={handleEdit}>
            <DialogHeader>Edit Buyer</DialogHeader>
            <DialogBody divider>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <PhoneInput
                  name="buyerContact"
                  label="Contact"
                  value={editingBuyer.buyerContact}
                  onChange={(value) =>
                    setEditingBuyer((prev) => ({
                      ...prev,
                      buyerContact: value,
                    }))
                  }
                  required
                  international
                  defaultCountry="IN"
                />
                <Input
                  name="buyerEmail"
                  label="Email"
                  value={editingBuyer.buyerEmail}
                  onChange={(e) =>
                    setEditingBuyer((prev) => ({
                      ...prev,
                      buyerEmail: e.target.value,
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
                />
                <Input
                  name="buyerGooglemaps"
                  label="Google Maps Link"
                  value={editingBuyer.buyerGooglemaps}
                  onChange={(e) =>
                    setEditingBuyer((prev) => ({
                      ...prev,
                      buyerGooglemaps: e.target.value,
                    }))
                  }
                />
              </div>
            </DialogBody>
            <DialogFooter className="flex gap-2">
              <Button color="blue" type="submit" disabled={loading}>
                {loading ? <Spinner /> : "Save Changes"}
              </Button>
              <Button color="gray" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}

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
    </div>
  );
};

export default BuyerForm;
