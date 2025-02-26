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
  createWarehouse,
  getWarehouses,
  updateWarehouse,
  deleteWarehouse,
} from "@/services/warehouseService";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import FileUploadModal from "./FileUploadModal";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";
import excel from "../../assets/excel.svg";
import warehouse from "../../assets/warehouse.png";

const requiredColumns = [
  "Name",
  "State",
  "City",
  "ManagerName",
  "ManagerEmail",
];

const WarehouseForm = () => {
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState({
    name: "",
    state: "",
    city: "",
    warehouseManagerName: "",
    warehouseManagerEmail: "",
    googleMapsLink: "",
    organization: localStorage.getItem("organizationId"),
  });
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState(null);
  const [confirmationName, setConfirmationName] = useState("");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await getWarehouses();
      setWarehouses(response || []);
    } catch (error) {
      toast.error("Error fetching warehouses!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.state || !form.city) {
      toast.error("Please fill out all required fields!");
      return;
    }
    setLoading(true);
    try {
      const newWarehouse = {
        name: form.name,
        location: {
          state: form.state,
          city: form.city,
        },
        warehouseManager: {
          name: form.warehouseManagerName,
          email: form.warehouseManagerEmail,
        },
        googleMapsLink: form.googleMapsLink,
        organization: form.organization,
      };

      await createWarehouse(newWarehouse);
      toast.success("Warehouse added successfully!");
      setForm({
        name: "",
        state: "",
        city: "",
        warehouseManagerName: "",
        warehouseManagerEmail: "",
        googleMapsLink: "",
        organization: localStorage.getItem("organizationId"),
      });
      fetchWarehouses();
      setAddModalOpen(false);
    } catch (error) {
      toast.error("Error adding warehouse!");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedData = {
        name: editingWarehouse.name,
        state: editingWarehouse.location.state,
        city: editingWarehouse.location.city,
        warehouseManager: editingWarehouse.warehouseManager,
        googleMapsLink: editingWarehouse.googleMapsLink,
      };
      await updateWarehouse(updatedData, editingWarehouse._id);
      toast.success("Warehouse updated successfully!");
      setEditModalOpen(false);
      fetchWarehouses();
    } catch (error) {
      toast.error("Error updating warehouse!");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (isActive, id) => {
    try {
      const response = await updateWarehouse({ isActive: !isActive }, id);
      fetchWarehouses();
    } catch (error) {
      console.error("Error updating warehouse status:", error);
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
        `${API_BASE_URL}/upload/warehouse`,
        formData
      );

      if (response.status === 200) {
        setProgress(100);
        toast.success("File uploaded successfully");
        setFile(null);
        fetchWarehouses();
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

  const openDeleteModal = (warehouse) => {
    setWarehouseToDelete(warehouse);
    setConfirmationName("");
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteWarehouse(warehouseToDelete._id);
      toast.success("Warehouse deleted successfully!");
      setDeleteModalOpen(false);
      setWarehouseToDelete(null);
      setConfirmationName("");
      fetchWarehouses();
    } catch (error) {
      toast.error("Error deleting warehouse!");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openEditModal = (warehouse) => {
    setEditingWarehouse({ ...warehouse });
    setEditModalOpen(true);
  };

  const handleExcelDownload = () => {
    if (warehouses.length === 0) {
      toast.error("No warehouses available to download!");
      return;
    }

    const data = warehouses.map((warehouse) => ({
      Name: warehouse.name,
      State: warehouse.location?.state || "",
      City: warehouse.location?.city || "",
      "Manager Name": warehouse.warehouseManager?.name || "",
      "Manager Email": warehouse.warehouseManager?.email || "",
      "Google Maps Link": warehouse.googleMapsLink || "",
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Warehouses");

    XLSX.writeFile(workbook, "Warehouses_List.xlsx");
    toast.success("Warehouses list downloaded successfully!");
  };

  return (
    <div className="container mx-auto p-6">
      {/* Warehouses List */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <Typography variant="h4" className="font-bold">
            Warehouses
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
              + Add Warehouse
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
          image={warehouse}
        />

        <div className="flex flex-col">
          <h3 className="text-[1.2rem] font-[500]">Active Warehouses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {warehouses?.filter((warehouse) => warehouse.isActive)?.length >
            0 ? (
              warehouses
                ?.filter((warehouse) => warehouse.isActive)
                ?.map((warehouse) => (
                  <div
                    key={warehouse._id}
                    className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl transition duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Typography
                        variant="h6"
                        className="font-bold text-lg text-gray-800 tracking-wide"
                      >
                        {warehouse.name}
                      </Typography>
                      <Switch
                        checked={warehouse.isActive}
                        onChange={() =>
                          toggleStatus(warehouse.isActive, warehouse._id)
                        }
                        color="green"
                        className="transform scale-125"
                      />
                    </div>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        State:
                      </span>{" "}
                      {warehouse.location?.state}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">City:</span>{" "}
                      {warehouse.location?.city}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Manager Name:
                      </span>{" "}
                      {warehouse.warehouseManager?.name || "N/A"}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Manager Email:
                      </span>{" "}
                      {warehouse.warehouseManager?.email || "N/A"}
                    </Typography>
                    {warehouse.googleMapsLink && (
                      <Typography className="text-sm text-gray-500 mt-2">
                        <a
                          href={warehouse.googleMapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View on Maps
                        </a>
                      </Typography>
                    )}
                    <div className="mt-5 flex gap-4">
                      <Button
                        color="blue"
                        size="sm"
                        onClick={() => openEditModal(warehouse)}
                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
                      >
                        <AiOutlineEdit /> Edit
                      </Button>
                      {/* <Button
                        color="red"
                        size="sm"
                        onClick={() => openDeleteModal(warehouse)}
                        className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                      >
                        <AiOutlineDelete /> Delete
                      </Button> */}
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-gray-600 text-[1.1rem] col-span-full">
                No warehouses available.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col mt-14">
          <h3 className="text-[1.2rem] font-[500]">Deactive Warehouses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {warehouses?.filter((warehouse) => !warehouse.isActive)?.length >
            0 ? (
              warehouses
                ?.filter((warehouse) => !warehouse.isActive)
                ?.map((warehouse) => (
                  <div
                    key={warehouse._id}
                    className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl opacity-50 hover:opacity-100 transition-opacity transition duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Typography
                        variant="h6"
                        className="font-bold text-lg text-gray-800 tracking-wide"
                      >
                        {warehouse.name}
                      </Typography>
                      <Switch
                        checked={warehouse.isActive}
                        onChange={() =>
                          toggleStatus(warehouse.isActive, warehouse._id)
                        }
                        color="green"
                        className="transform scale-125"
                      />
                    </div>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        State:
                      </span>{" "}
                      {warehouse.location?.state}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">City:</span>{" "}
                      {warehouse.location?.city}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Manager Name:
                      </span>{" "}
                      {warehouse.warehouseManager?.name || "N/A"}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Manager Email:
                      </span>{" "}
                      {warehouse.warehouseManager?.email || "N/A"}
                    </Typography>
                    {warehouse.googleMapsLink && (
                      <Typography className="text-sm text-gray-500 mt-2">
                        <a
                          href={warehouse.googleMapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View on Maps
                        </a>
                      </Typography>
                    )}
                    <div className="mt-5 flex gap-4">
                      <Button
                        color="blue"
                        size="sm"
                        onClick={() => openEditModal(warehouse)}
                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
                      >
                        <AiOutlineEdit /> Edit
                      </Button>
                      {/* <Button
                        color="red"
                        size="sm"
                        onClick={() => openDeleteModal(warehouse)}
                        className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                      >
                        <AiOutlineDelete /> Delete
                      </Button> */}
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-gray-600 text-[1.1rem] col-span-full">
                No warehouses available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Warehouse Modal */}
      <Dialog open={addModalOpen} handler={() => setAddModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>Add Warehouse</DialogHeader>
          <DialogBody divider>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="name"
                label="Warehouse Name"
                value={form.name}
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
                name="city"
                label="City"
                value={form.city}
                onChange={handleInputChange}
                required
              />
              <Input
                name="warehouseManagerName"
                label="Warehouse Manager Name"
                value={form.warehouseManagerName}
                onChange={handleInputChange}
              />
              <Input
                name="warehouseManagerEmail"
                label="Warehouse Manager Email"
                value={form.warehouseManagerEmail}
                onChange={handleInputChange}
                type="email"
              />
              <Input
                name="googleMapsLink"
                label="Google Maps Link"
                value={form.googleMapsLink}
                onChange={handleInputChange}
                className="col-span-2"
              />
            </div>
          </DialogBody>
          <DialogFooter className="flex gap-2">
            <Button color="blue" type="submit" disabled={loading}>
              {loading ? <Spinner /> : "Add Warehouse"}
            </Button>
            <Button color="gray" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Warehouse Modal */}
      {editingWarehouse && (
        <Dialog open={editModalOpen} handler={() => setEditModalOpen(false)}>
          <form onSubmit={handleEdit}>
            <DialogHeader>Edit Warehouse</DialogHeader>
            <DialogBody divider>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="name"
                  label="Warehouse Name"
                  value={editingWarehouse.name}
                  onChange={(e) =>
                    setEditingWarehouse((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  required
                />
                <Input
                  name="state"
                  label="State"
                  value={editingWarehouse.location?.state}
                  onChange={(e) =>
                    setEditingWarehouse((prev) => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        state: e.target.value,
                      },
                    }))
                  }
                  required
                />
                <Input
                  name="city"
                  label="City"
                  value={editingWarehouse.location?.city}
                  onChange={(e) =>
                    setEditingWarehouse((prev) => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        city: e.target.value,
                      },
                    }))
                  }
                  required
                />
                <Input
                  name="name"
                  label="Warehouse Manager Name"
                  value={editingWarehouse.warehouseManager.name}
                  onChange={(e) =>
                    setEditingWarehouse((prev) => ({
                      ...prev,
                      warehouseManager: {
                        ...prev.warehouseManager,
                        name: e.target.value,
                      },
                    }))
                  }
                />
                <Input
                  name="email"
                  label="Warehouse Manager Email"
                  value={editingWarehouse.warehouseManager.email}
                  onChange={(e) =>
                    setEditingWarehouse((prev) => ({
                      ...prev,
                      warehouseManager: {
                        ...prev.warehouseManager,
                        email: e.target.value,
                      },
                    }))
                  }
                  type="email"
                />
                <Input
                  name="googleMapsLink"
                  label="Google Maps Link"
                  value={editingWarehouse.googleMapsLink}
                  onChange={(e) =>
                    setEditingWarehouse((prev) => ({
                      ...prev,
                      googleMapsLink: e.target.value,
                    }))
                  }
                  className="col-span-2"
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
          Confirm Warehouse Deletion
        </DialogHeader>
        <DialogBody divider>
          <div className="space-y-4">
            <Typography className="text-gray-800 font-medium">
              Are you sure you want to delete this warehouse?
            </Typography>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <Typography className="text-yellow-700 font-medium mb-2">
                Warning: The following data will be permanently deleted:
              </Typography>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                <li>Warehouse profile and location details</li>
                <li>Associated inventory and product records</li>
                <li>Manager and contact information</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <Typography className="text-gray-700 mb-2">
                To confirm deletion, please type the warehouse name:
                <span className="font-bold text-red-500">
                  {" "}
                  {warehouseToDelete?.name}
                </span>
              </Typography>
              <Input
                type="text"
                label="Type warehouse name to confirm"
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
            disabled={confirmationName !== warehouseToDelete?.name}
            className="flex items-center gap-2"
          >
            {loading ? <Spinner /> : "Delete Permanently"}
          </Button>
          <Button
            color="gray"
            onClick={() => {
              setDeleteModalOpen(false);
              setConfirmationName("");
              setWarehouseToDelete(null);
            }}
          >
            Cancel
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default WarehouseForm;
