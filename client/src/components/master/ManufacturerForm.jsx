import {
  Button,
  Input,
  Typography,
  Spinner,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
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

  const handleEdit = async () => {
    if (
      !editingManufacturer.manufacturer ||
      !editingManufacturer.manufacturerCompany ||
      !editingManufacturer.addressLine1 ||
      !editingManufacturer.city ||
      !editingManufacturer.state ||
      !editingManufacturer.pinCode ||
      !editingManufacturer.manufacturerContact ||
      !editingManufacturer.manufacturerEmail
    ) {
      toast.error("Please fill out all required fields!");
      return;
    }
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
      Address: `${man.manufacturerdeliveryAddress?.addressLine1 || ""}, ${
        man.manufacturerdeliveryAddress?.addressLine2 || ""
      }, ${man.manufacturerdeliveryAddress?.city || ""}, ${
        man.manufacturerdeliveryAddress?.state || ""
      }, ${man.manufacturerdeliveryAddress?.pinCode || ""}`,
      Contact: man.manufacturerContact,
      Email: man.manufacturerEmail,
      GST: man.manufacturerGstno,
    }));

    const ws = utils.json_to_sheet(excelData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Manufacturers");

    writeFile(wb, "manufacturers.xlsx");
    toast.success("Excel file downloaded!");
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
        </div>
      </div>

      {/* Manufacturers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {manufacturer.length > 0 ? (
          manufacturer.map((man) => (
            <div
              key={man._id}
              className="bg-white shadow-md rounded-md p-4 border border-gray-200"
            >
              <Typography variant="h6" className="font-bold mb-2">
                {man.manufacturer}
              </Typography>
              <Typography className="text-gray-600">
                <strong>Company:</strong> {man.manufacturerCompany}
              </Typography>
              <Typography className="text-gray-600">
                <strong>Address:</strong>{" "}
                {man.manufacturerdeliveryAddress?.addressLine1},{" "}
                {man.manufacturerdeliveryAddress?.addressLine2},{" "}
                {man.manufacturerdeliveryAddress?.city},{" "}
                {man.manufacturerdeliveryAddress?.state},{" "}
                {man.manufacturerdeliveryAddress?.pinCode}
              </Typography>
              <Typography className="text-gray-600">
                <strong>Contact:</strong> {man.manufacturerContact}
              </Typography>
              <Typography className="text-gray-600">
                <strong>Email:</strong> {man.manufacturerEmail}
              </Typography>
              <Typography className="text-gray-600">
                <strong>GST:</strong> {man.manufacturerGstno}
              </Typography>
              <div className="flex justify-end mt-4 gap-2">
                <Button
                  color="blue"
                  size="sm"
                  onClick={() => openEditModal(man)}
                  className="flex items-center gap-1"
                >
                  <AiOutlineEdit /> Edit
                </Button>
                <Button
                  color="red"
                  size="sm"
                  onClick={() => openDeleteModal(man)}
                  className="flex items-center gap-1"
                >
                  <AiOutlineDelete /> Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 text-[1.1rem] col-span-full">
            No manufacturers available.
          </p>
        )}
      </div>

      {/* Add Manufacturer Modal */}
      <Dialog open={addModalOpen} handler={() => setAddModalOpen(false)}>
        <DialogHeader>Add Manufacturer</DialogHeader>
        <DialogBody divider>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Input
              name="manufacturerContact"
              label="Contact"
              value={form.manufacturerContact}
              onChange={handleInputChange}
              required
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
          </form>
        </DialogBody>
        <DialogFooter className="flex gap-2">
          <Button color="blue" onClick={handleSubmit} disabled={loading}>
            {loading ? <Spinner /> : "Add Manufacturer"}
          </Button>
          <Button color="gray" onClick={() => setAddModalOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Manufacturer Modal */}
      {editingManufacturer && (
        <Dialog open={editModalOpen} handler={() => setEditModalOpen(false)}>
          <DialogHeader>Edit Manufacturer</DialogHeader>
          <DialogBody divider>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  editingManufacturer.manufacturerdeliveryAddress?.addressLine1
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
                  editingManufacturer.manufacturerdeliveryAddress?.addressLine2
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
                value={editingManufacturer.manufacturerdeliveryAddress?.pinCode}
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
              <Input
                name="manufacturerContact"
                label="Contact"
                value={editingManufacturer.manufacturerContact}
                onChange={(e) =>
                  setEditingManufacturer((prev) => ({
                    ...prev,
                    manufacturerContact: e.target.value,
                  }))
                }
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
            </form>
          </DialogBody>
          <DialogFooter className="flex gap-2">
            <Button color="blue" onClick={handleEdit} disabled={loading}>
              {loading ? <Spinner /> : "Save Changes"}
            </Button>
            <Button color="gray" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
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
