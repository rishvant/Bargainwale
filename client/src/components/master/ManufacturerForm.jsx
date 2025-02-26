import {
  Button,
  Input,
  Typography,
  Spinner,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Switch,
} from "@material-tailwind/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { utils, writeFile } from "xlsx";
import {
  createManufacturer,
  deleteManufacturer,
  getManufacturer,
  updateManufacturer,
} from "@/services/masterService";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import PhoneInput from "react-phone-number-input";
import excel from "../../assets/excel.svg";
import manufacturerImage from "../../assets/manufacturer.png";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";
import FileUploadModal from "./FileUploadModal";

const requiredColumns = [
  "Manufacturer",
  "ManufacturerCompany",
  "ManufacturerContact",
  "ManufacturerEmail",
  "ManufacturerGstno",
  "AddressLine1",
  "AddressLine2",
  "City",
  "State",
  "PinCode",
  "ManufacturerGooglemaps",
];

const ManufacturerForm = () => {
  const [loading, setLoading] = useState(false);
  const [manufacturer, setManufacturer] = useState([]);
  const [form, setForm] = useState({
    manufacturer: "",
    manufacturerCompany: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
    manufacturerContact: "",
    manufacturerEmail: "",
    manufacturerGstno: "",
    organization: localStorage.getItem("organizationId"),
  });
  const [editingManufacturer, setEditingManufacturer] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [manufacturerToDelete, setManufacturerToDelete] = useState(null);
  const [confirmationName, setConfirmationName] = useState("");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const fetchManufacturers = async () => {
    try {
      const response = await getManufacturer();
      setManufacturer(response || []);
    } catch (error) {
      toast.error("Error fetching manufacturers!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.manufacturer ||
      !form.manufacturerCompany ||
      !form.addressLine1 ||
      !form.city ||
      !form.state ||
      !form.pinCode ||
      !form.manufacturerContact ||
      !form.manufacturerEmail
    ) {
      toast.error("Please fill out all required fields!");
      return;
    }
    setLoading(true);
    try {
      const newManufacturer = {
        manufacturer: form.manufacturer,
        manufacturerCompany: form.manufacturerCompany,
        manufacturerdeliveryAddress: {
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          pinCode: form.pinCode,
        },
        manufacturerContact: form.manufacturerContact,
        manufacturerEmail: form.manufacturerEmail,
        manufacturerGstno: form.manufacturerGstno,
        organization: form.organization,
      };

      await createManufacturer(newManufacturer);
      toast.success("Manufacturer added successfully!");
      setForm({
        manufacturer: "",
        manufacturerCompany: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pinCode: "",
        manufacturerContact: "",
        manufacturerEmail: "",
        manufacturerGstno: "",
        organization: localStorage.getItem("organizationId"),
      });
      fetchManufacturers();
      setAddModalOpen(false);
    } catch (error) {
      toast.error("Error adding manufacturer!");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateManufacturer(editingManufacturer, editingManufacturer._id);
      toast.success("Manufacturer updated successfully!");
      setEditModalOpen(false);
      fetchManufacturers();
    } catch (error) {
      toast.error("Error updating manufacturer!");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (isActive, id) => {
    try {
      const response = await updateManufacturer({ isActive: !isActive }, id);
      fetchManufacturers();
    } catch (error) {
      console.error("Error updating manufacturer status:", error);
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
        `${API_BASE_URL}/upload/manufacturer`,
        formData
      );

      if (response.status === 200) {
        setProgress(100);
        toast.success("File uploaded successfully");
        setFile(null);
        fetchManufacturers();
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

  // Modified delete handling
  const openDeleteModal = (man) => {
    setManufacturerToDelete(man);
    setConfirmationName("");
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteManufacturer(manufacturerToDelete._id);
      toast.success("Manufacturer deleted successfully!");
      setDeleteModalOpen(false);
      setManufacturerToDelete(null);
      setConfirmationName("");
      fetchManufacturers();
    } catch (error) {
      toast.error("Error deleting manufacturer!");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openEditModal = (manufacturer) => {
    setEditingManufacturer({ ...manufacturer });
    setEditModalOpen(true);
  };

  const handleDownloadExcel = () => {
    if (manufacturer.length === 0) {
      toast.error("No manufacturers available to download!");
      return;
    }

    const excelData = manufacturer.map((man) => ({
      Name: man.manufacturer,
      Company: man.manufacturerCompany,
      Address: [
        man.manufacturerdeliveryAddress?.addressLine1,
        man.manufacturerdeliveryAddress?.addressLine2,
        man.manufacturerdeliveryAddress?.city,
        man.manufacturerdeliveryAddress?.state,
        man.manufacturerdeliveryAddress?.pinCode,
      ]
        .filter(Boolean)
        .join(", "),
      Contact: man.manufacturerContact,
      Email: man.manufacturerEmail,
      "GST Number": man.manufacturerGstno,
      "Google Maps Link": man.manufacturerGooglemaps,
    }));

    const ws = utils.json_to_sheet(excelData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Manufacturers");

    writeFile(wb, "Manufacturers_List.xlsx");
    toast.success("Manufacturers list downloaded successfully!");
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold">
          Manufacturers
        </Typography>
        <div className="flex gap-4">
          <Button
            color="green"
            onClick={handleDownloadExcel}
            className="flex items-center gap-2"
          >
            Download Excel
          </Button>
          <Button
            color="blue"
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2"
          >
            + Add Manufacturer
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
        image={manufacturerImage}
      />

      {/* Manufacturers List */}
      <div className="flex flex-col">
        <h3 className="text-[1.2rem] font-[500]">Active Manufacturers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {manufacturer?.filter((man) => man.isActive)?.length > 0 ? (
            manufacturer
              ?.filter((man) => man.isActive)
              ?.map((man) => (
                <div
                  key={man._id}
                  className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl transition duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Typography
                      variant="h6"
                      className="font-bold text-lg text-gray-800 tracking-wide"
                    >
                      {man.manufacturer}
                    </Typography>
                    <Switch
                      checked={man.isActive}
                      onChange={() => toggleStatus(man.isActive, man._id)}
                      color="green"
                      className="transform scale-125"
                    />
                  </div>
                  <Typography className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-600">
                      Company:
                    </span>{" "}
                    {man.manufacturerCompany}
                  </Typography>
                  <Typography className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-600">
                      Address:
                    </span>{" "}
                    {[
                      man.manufacturerdeliveryAddress?.addressLine1,
                      man.manufacturerdeliveryAddress?.addressLine2,
                      man.manufacturerdeliveryAddress?.city,
                      man.manufacturerdeliveryAddress?.state,
                      man.manufacturerdeliveryAddress?.pinCode,
                    ]
                      .filter((part) => part)
                      .join(", ")}
                  </Typography>
                  <Typography className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-600">
                      Contact:
                    </span>{" "}
                    {man.manufacturerContact}
                  </Typography>
                  <Typography className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-600">Email:</span>{" "}
                    {man.manufacturerEmail}
                  </Typography>
                  <Typography className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-600">GST:</span>{" "}
                    {man.manufacturerGstno}
                  </Typography>
                  <div className="mt-5 flex gap-4">
                    <Button
                      color="blue"
                      size="sm"
                      onClick={() => openEditModal(man)}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
                    >
                      <AiOutlineEdit /> Edit
                    </Button>
                    {/* <Button
                      color="red"
                      size="sm"
                      onClick={() => openDeleteModal(man)}
                      className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                    >
                      <AiOutlineDelete /> Delete
                    </Button> */}
                  </div>
                </div>
              ))
          ) : (
            <p className="text-center text-gray-600 text-[1.1rem] col-span-full">
              No manufacturers available.
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col mt-14">
        <h3 className="text-[1.2rem] font-[500]">Deactive Manufacturers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {manufacturer?.filter((man) => !man.isActive)?.length > 0 ? (
            manufacturer
              ?.filter((man) => !man.isActive)
              ?.map((man) => (
                <div
                  key={man._id}
                  className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl opacity-50 hover:opacity-100 transition-opacity duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Typography
                      variant="h6"
                      className="font-bold text-lg text-gray-800 tracking-wide"
                    >
                      {man.manufacturer}
                    </Typography>
                    <Switch
                      checked={man.isActive}
                      onChange={() => toggleStatus(man.isActive, man._id)}
                      color="green"
                      className="transform scale-125"
                    />
                  </div>
                  <Typography className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-600">
                      Company:
                    </span>{" "}
                    {man.manufacturerCompany}
                  </Typography>
                  <Typography className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-600">
                      Address:
                    </span>{" "}
                    {man.manufacturerdeliveryAddress?.addressLine1},{" "}
                    {man.manufacturerdeliveryAddress?.addressLine2},{" "}
                    {man.manufacturerdeliveryAddress?.city},{" "}
                    {man.manufacturerdeliveryAddress?.state},{" "}
                    {man.manufacturerdeliveryAddress?.pinCode}
                  </Typography>
                  <Typography className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-600">
                      Contact:
                    </span>{" "}
                    {man.manufacturerContact}
                  </Typography>
                  <Typography className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-600">Email:</span>{" "}
                    {man.manufacturerEmail}
                  </Typography>
                  <Typography className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-600">GST:</span>{" "}
                    {man.manufacturerGstno}
                  </Typography>
                  <div className="mt-5 flex gap-4">
                    <Button
                      color="blue"
                      size="sm"
                      onClick={() => openEditModal(man)}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
                    >
                      <AiOutlineEdit /> Edit
                    </Button>
                    {/* <Button
                      color="red"
                      size="sm"
                      onClick={() => openDeleteModal(man)}
                      className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                    >
                      <AiOutlineDelete /> Delete
                    </Button> */}
                  </div>
                </div>
              ))
          ) : (
            <p className="text-center text-gray-600 text-[1.1rem] col-span-full">
              No manufacturers available.
            </p>
          )}
        </div>
      </div>

      {/* Add Manufacturer Modal */}
      <Dialog open={addModalOpen} handler={() => setAddModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>Add Manufacturer</DialogHeader>
          <DialogBody divider>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="manufacturer"
                label="Manufacturer Name"
                value={form.manufacturer}
                onChange={handleInputChange}
                required
              />
              <Input
                name="manufacturerCompany"
                label="Company Name"
                value={form.manufacturerCompany}
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
                name="manufacturerContact"
                label="Contact"
                value={form.manufacturerContact}
                onChange={(value) =>
                  handleInputChange({
                    target: { name: "manufacturerContact", value },
                  })
                }
                required
                international
                defaultCountry="IN"
              />
              <Input
                name="manufacturerEmail"
                label="Email"
                type="email"
                value={form.manufacturerEmail}
                onChange={handleInputChange}
                required
              />
              <Input
                name="manufacturerGstno"
                label="GST Number"
                value={form.manufacturerGstno}
                onChange={handleInputChange}
              />
              <Input
                name="manufacturerGooglemaps"
                label="Google Maps Link"
                value={form.manufacturerGooglemaps}
                onChange={handleInputChange}
              />
            </div>
          </DialogBody>
          <DialogFooter className="flex gap-2">
            <Button color="blue" type="submit" disabled={loading}>
              {loading ? <Spinner /> : "Add Manufacturer"}
            </Button>
            <Button color="gray" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Manufacturer Modal */}
      {editingManufacturer && (
        <Dialog open={editModalOpen} handler={() => setEditModalOpen(false)}>
          <form onSubmit={handleEdit}>
            <DialogHeader>Edit Manufacturer</DialogHeader>
            <DialogBody divider>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="manufacturer"
                  label="Manufacturer Name"
                  value={editingManufacturer.manufacturer}
                  onChange={(e) =>
                    setEditingManufacturer((prev) => ({
                      ...prev,
                      manufacturer: e.target.value,
                    }))
                  }
                  required
                />
                <Input
                  name="manufacturerCompany"
                  label="Company Name"
                  value={editingManufacturer.manufacturerCompany}
                  onChange={(e) =>
                    setEditingManufacturer((prev) => ({
                      ...prev,
                      manufacturerCompany: e.target.value,
                    }))
                  }
                  required
                />
                <Input
                  name="addressLine1"
                  label="Address Line 1"
                  value={
                    editingManufacturer.manufacturerdeliveryAddress
                      ?.addressLine1
                  }
                  onChange={(e) =>
                    setEditingManufacturer((prev) => ({
                      ...prev,
                      manufacturerdeliveryAddress: {
                        ...prev.manufacturerdeliveryAddress,
                        addressLine1: e.target.value,
                      },
                    }))
                  }
                />
                <Input
                  name="addressLine2"
                  label="Address Line 2"
                  value={
                    editingManufacturer.manufacturerdeliveryAddress
                      ?.addressLine2
                  }
                  onChange={(e) =>
                    setEditingManufacturer((prev) => ({
                      ...prev,
                      manufacturerdeliveryAddress: {
                        ...prev.manufacturerdeliveryAddress,
                        addressLine2: e.target.value,
                      },
                    }))
                  }
                />
                <Input
                  name="city"
                  label="City"
                  value={editingManufacturer.manufacturerdeliveryAddress?.city}
                  onChange={(e) =>
                    setEditingManufacturer((prev) => ({
                      ...prev,
                      manufacturerdeliveryAddress: {
                        ...prev.manufacturerdeliveryAddress,
                        city: e.target.value,
                      },
                    }))
                  }
                />
                <Input
                  name="state"
                  label="State"
                  value={editingManufacturer.manufacturerdeliveryAddress?.state}
                  onChange={(e) =>
                    setEditingManufacturer((prev) => ({
                      ...prev,
                      manufacturerdeliveryAddress: {
                        ...prev.manufacturerdeliveryAddress,
                        state: e.target.value,
                      },
                    }))
                  }
                />
                <Input
                  name="pinCode"
                  label="Pin Code"
                  value={
                    editingManufacturer.manufacturerdeliveryAddress?.pinCode
                  }
                  onChange={(e) =>
                    setEditingManufacturer((prev) => ({
                      ...prev,
                      manufacturerdeliveryAddress: {
                        ...prev.manufacturerdeliveryAddress,
                        pinCode: e.target.value,
                      },
                    }))
                  }
                />
                <PhoneInput
                  name="manufacturerContact"
                  label="Contact"
                  value={form.manufacturerContact}
                  onChange={(value) =>
                    setEditingManufacturer((prev) => ({
                      ...prev,
                      manufacturerContact: value,
                    }))
                  }
                  required
                  international
                  defaultCountry="IN"
                />
                <Input
                  name="manufacturerEmail"
                  label="Email"
                  value={editingManufacturer.manufacturerEmail}
                  onChange={(e) =>
                    setEditingManufacturer((prev) => ({
                      ...prev,
                      manufacturerEmail: e.target.value,
                    }))
                  }
                />
                <Input
                  name="manufacturerGstno"
                  label="GST Number"
                  value={editingManufacturer.manufacturerGstno}
                  onChange={(e) =>
                    setEditingManufacturer((prev) => ({
                      ...prev,
                      manufacturerGstno: e.target.value,
                    }))
                  }
                />
                <Input
                  name="manufacturerGooglemaps"
                  label="Google Maps Link"
                  value={editingManufacturer.manufacturerGooglemaps}
                  onChange={(e) =>
                    setEditingManufacturer((prev) => ({
                      ...prev,
                      manufacturerGooglemaps: e.target.value,
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

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} handler={() => setDeleteModalOpen(false)}>
        <DialogHeader className="text-red-500">
          Confirm Manufacturer Deletion
        </DialogHeader>
        <DialogBody divider>
          <div className="space-y-4">
            <Typography className="text-gray-800 font-medium">
              Are you sure you want to delete this manufacturer?
            </Typography>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <Typography className="text-yellow-700 font-medium mb-2">
                Warning: The following data will be permanently deleted:
              </Typography>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                <li>Manufacturer profile and contact information</li>
                <li>All associated purchase orders and history</li>
                <li>Related inventory records</li>
                <li>Payment and transaction records</li>
                <li>Product associations and specifications</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <Typography className="text-gray-700 mb-2">
                To confirm deletion, please type the manufacturer name:
                <span className="font-bold text-red-500">
                  {" "}
                  {manufacturerToDelete?.manufacturer}
                </span>
              </Typography>
              <Input
                type="text"
                label="Type manufacturer name to confirm"
                value={confirmationName}
                onChange={(e) => setConfirmationName(e.target.value)}
                className="mt-2"
                color="red"
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="space-x-2">
          <Button
            color="red"
            onClick={handleDelete}
            disabled={confirmationName !== manufacturerToDelete?.manufacturer}
            className="flex items-center gap-2"
          >
            {loading ? <Spinner /> : "Delete Permanently"}
          </Button>
          <Button
            color="gray"
            onClick={() => {
              setDeleteModalOpen(false);
              setConfirmationName("");
              setManufacturerToDelete(null);
            }}
          >
            Cancel
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default ManufacturerForm;
