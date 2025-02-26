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
  createTransport,
  deleteTransport,
  getTransport,
  updateTransport,
} from "@/services/masterService";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import PhoneInput from "react-phone-number-input";
import excel from "../../assets/excel.svg";
import transportImage from "../../assets/transport.png";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";
import FileUploadModal from "./FileUploadModal";

const requiredColumns = [
  "Transport",
  "TransportType",
  "TransportContact",
  "TransportAgency",
];

const TransportForm = () => {
  const [loading, setLoading] = useState(false);
  const [transport, setTransport] = useState([]);
  const [form, setForm] = useState({
    transport: "",
    transportType: "",
    transportContact: "",
    transportAgency: "",
    organization: localStorage.getItem("organizationId"),
  });
  const [editingTransport, setEditingTransport] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    fetchTransport();
  }, []);

  const fetchTransport = async () => {
    try {
      const response = await getTransport();
      setTransport(response || []);
    } catch (error) {
      toast.error("Error fetching transport data!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.transport ||
      !form.transportType ||
      !form.transportContact ||
      !form.transportAgency
    ) {
      toast.error("Please fill out all required fields!");
      return;
    }
    setLoading(true);
    try {
      await createTransport(form);
      toast.success("Transport added successfully!");
      setForm({
        transport: "",
        transportType: "",
        transportContact: "",
        transportAgency: "",
        organization: localStorage.getItem("organizationId"),
      });
      fetchTransport();
      setAddModalOpen(false);
    } catch (error) {
      toast.error("Error adding transport!");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (
      !editingTransport.transport ||
      !editingTransport.transportType ||
      !editingTransport.transportContact ||
      !editingTransport.transportAgency
    ) {
      toast.error("Please fill out all required fields!");
      return;
    }
    setLoading(true);
    try {
      await updateTransport(editingTransport, editingTransport._id);
      toast.success("Transport updated successfully!");
      fetchTransport();
      setEditModalOpen(false);
    } catch (error) {
      toast.error("Error updating transport!");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (isActive, id) => {
    try {
      const response = await updateTransport({ isActive: !isActive }, id);
      fetchTransport();
    } catch (error) {
      console.error("Error updating transport status:", error);
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
        `${API_BASE_URL}/upload/transport`,
        formData
      );

      if (response.status === 200) {
        setProgress(100);
        toast.success("File uploaded successfully");
        setFile(null);
        fetchTransport();
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

  const handleDelete = async (id) => {
    try {
      await deleteTransport(id);
      toast.success("Transport deleted successfully!");
      fetchTransport();
    } catch (error) {
      toast.error("Error deleting transport!");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openEditModal = (transportItem) => {
    setEditingTransport({ ...transportItem });
    setEditModalOpen(true);
  };

  // Handle Excel Download
  const handleExcelDownload = () => {
    if (transport.length === 0) {
      toast.error("No transport data available to download!");
      return;
    }

    // Map transport data to an Excel-friendly format
    const data = transport.map((item) => ({
      Name: item.transport,
      Type: item.transportType,
      Contact: item.transportContact,
      Agency: item.transportAgency,
    }));

    // Create a new workbook and add data
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transport");

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, "Transport_List.xlsx");
    toast.success("Transport list downloaded successfully!");
  };

  return (
    <div className="container mx-auto p-6">
      {/* Transport List */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <Typography variant="h4" className="font-bold">
            Transport Management
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
              + Add Transport
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
          image={transportImage}
        />

        <div className="flex flex-col">
          <h3 className="text-[1.2rem] font-[500]">Active Transports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {transport?.filter((transport) => transport.isActive)?.length >
            0 ? (
              transport
                ?.filter((transport) => transport.isActive)
                ?.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl transition duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Typography
                        variant="h6"
                        className="font-bold text-lg text-gray-800 tracking-wide"
                      >
                        {item.transport}
                      </Typography>
                      <Switch
                        checked={item.isActive}
                        onChange={() => toggleStatus(item.isActive, item._id)}
                        color="green"
                        className="transform scale-125"
                      />
                    </div>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">Type:</span>{" "}
                      {item.transportType}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Contact:
                      </span>{" "}
                      {item.transportContact}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Agency:
                      </span>{" "}
                      {item.transportAgency}
                    </Typography>
                    <div className="mt-5 flex gap-4">
                      <Button
                        color="blue"
                        size="sm"
                        onClick={() => openEditModal(item)}
                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
                      >
                        <AiOutlineEdit /> Edit
                      </Button>
                      {/* <Button
                        color="red"
                        size="sm"
                        onClick={() => handleDelete(item._id)}
                        className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                      >
                        <AiOutlineDelete /> Delete
                      </Button> */}
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-gray-600 text-[1.1rem] col-span-full">
                No transports available.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col mt-14">
          <h3 className="text-[1.2rem] font-[500]">Deactive Transports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transport?.filter((transport) => !transport.isActive)?.length >
            0 ? (
              transport
                ?.filter((transport) => !transport.isActive)
                ?.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl opacity-50 hover:opacity-100 transition-opacity duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Typography
                        variant="h6"
                        className="font-bold text-lg text-gray-800 tracking-wide"
                      >
                        {item.transport}
                      </Typography>
                      <Switch
                        checked={item.isActive}
                        onChange={() => toggleStatus(item.isActive, item._id)}
                        color="green"
                        className="transform scale-125"
                      />
                    </div>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">Type:</span>{" "}
                      {item.transportType}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Contact:
                      </span>{" "}
                      {item.transportContact}
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-600">
                        Agency:
                      </span>{" "}
                      {item.transportAgency}
                    </Typography>
                    <div className="mt-5 flex gap-4">
                      <Button
                        color="blue"
                        size="sm"
                        onClick={() => openEditModal(item)}
                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
                      >
                        <AiOutlineEdit /> Edit
                      </Button>
                      {/* <Button
                        color="red"
                        size="sm"
                        onClick={() => handleDelete(item._id)}
                        className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                      >
                        <AiOutlineDelete /> Delete
                      </Button> */}
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-gray-600 text-[1.1rem] col-span-full">
                No transports available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Transport Modal */}
      <Dialog open={addModalOpen} handler={() => setAddModalOpen(false)}>
        <DialogHeader>Add Transport</DialogHeader>
        <DialogBody divider>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Input
              name="transport"
              label="Transport Name"
              value={form.transport}
              onChange={handleInputChange}
              required
            />
            <Input
              name="transportType"
              label="Transport Type"
              value={form.transportType}
              onChange={handleInputChange}
              required
            />
            <PhoneInput
              name="transportContact"
              label="Contact"
              value={form.transportContact}
              onChange={(value) =>
                handleInputChange({
                  target: { name: "transportContact", value },
                })
              }
              required
              international
              defaultCountry="IN"
            />
            <Input
              name="transportAgency"
              label="Agency"
              value={form.transportAgency}
              onChange={handleInputChange}
              required
            />
          </form>
        </DialogBody>
        <DialogFooter className="flex gap-2">
          <Button color="blue" onClick={handleSubmit} disabled={loading}>
            {loading ? <Spinner /> : "Add Transport"}
          </Button>
          <Button color="gray" onClick={() => setAddModalOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Transport Modal */}
      {editingTransport && (
        <Dialog open={editModalOpen} handler={() => setEditModalOpen(false)}>
          <DialogHeader>Edit Transport</DialogHeader>
          <DialogBody divider>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="transport"
                label="Transport Name"
                value={editingTransport.transport}
                onChange={(e) =>
                  setEditingTransport((prev) => ({
                    ...prev,
                    transport: e.target.value,
                  }))
                }
                required
              />
              <Input
                name="transportType"
                label="Transport Type"
                value={editingTransport.transportType}
                onChange={(e) =>
                  setEditingTransport((prev) => ({
                    ...prev,
                    transportType: e.target.value,
                  }))
                }
                required
              />
              <PhoneInput
                name="transportContact"
                label="Contact"
                value={editingTransport.transportContact}
                onChange={(value) =>
                  setEditingTransport((prev) => ({
                    ...prev,
                    transportContact: value,
                  }))
                }
                required
                international
                defaultCountry="IN"
              />
              <Input
                name="transportAgency"
                label="Agency"
                value={editingTransport.transportAgency}
                onChange={(e) =>
                  setEditingTransport((prev) => ({
                    ...prev,
                    transportAgency: e.target.value,
                  }))
                }
                required
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
    </div>
  );
};

export default TransportForm;
