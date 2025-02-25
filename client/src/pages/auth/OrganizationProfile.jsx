import { API_BASE_URL } from "@/services/api";
import axios from "axios";
import { useEffect, useState } from "react";
import { Asterisk } from "lucide-react";
import { toast } from "sonner";

const ManageOrganizationProfile = ({ setOpen }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
    },
    gstin: "",
    fssai: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    const orgId = localStorage.getItem("clerk_active_org");
    try {
      const response = await axios.get(`${API_BASE_URL}/organization/${orgId}`);
      setFormData(response.data);
    } catch (err) {
      console.log("Error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const orgId = localStorage.getItem("clerk_active_org");

    try {
      const response = await axios.put(
        `${API_BASE_URL}/organization/${orgId}`,
        formData
      );

      if (response.status === 200) {
        setOpen(false);
        toast.success("Profile Saved!");
        setFormData("");
      } else {
        toast.error("Failed to save organization in the database.");
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("An error occurred while creating the organization.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 flex flex-col gap-4 bg-white rounded-lg shadow-lg w-full"
    >
      {/* Name (Read-Only) */}
      <div className="w-full">
        <label className="block text-xs font-medium text-gray-700">
          Organization Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          readOnly
          className="mt-1 w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm px-2 py-2"
        />
      </div>

      {/* Email */}
      <div className="w-full">
        <label className="block text-xs font-medium text-gray-700 flex items-end">
          Email <Asterisk className="w-[0.7rem] text-red-500" />
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          className="mt-1 w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-2 py-2"
        />
      </div>

      {/* Phone */}
      <div className="w-full">
        <label className="block text-xs font-medium text-gray-700 flex items-end">
          Phone <Asterisk className="w-[0.7rem] text-red-500" />
        </label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          required
          className="mt-1 w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-2 py-2"
        />
      </div>

      {/* Address */}
      <div className="w-full">
        <label className="block text-xs font-medium text-gray-700 flex items-end">
          Address Line 1 <Asterisk className="w-[0.7rem] text-red-500" />
        </label>
        <input
          type="text"
          name="addressLine1"
          value={formData.address?.line1}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              address: { ...prev.address, line1: e.target.value },
            }))
          }
          required
          className="mt-1 w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-2 py-2"
        />
      </div>

      <div className="w-full">
        <label className="block text-xs font-medium text-gray-700 flex items-end">
          Address Line 2 <Asterisk className="w-[0.7rem] text-red-500" />
        </label>
        <input
          type="text"
          name="addressLine2"
          value={formData.address?.line2}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              address: { ...prev.address, line2: e.target.value },
            }))
          }
          className="mt-1 w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-2 py-2"
        />
      </div>

      <div className="flex gap-4">
        <div className="w-full">
          <label className="block text-xs font-medium text-gray-700 flex items-end">
            City <Asterisk className="w-[0.7rem] text-red-500" />
          </label>
          <input
            type="text"
            name="city"
            value={formData.address?.city}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                address: { ...prev.address, city: e.target.value },
              }))
            }
            required
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-2 py-2"
          />
        </div>

        <div className="w-full">
          <label className="block text-xs font-medium text-gray-700 flex items-end">
            State <Asterisk className="w-[0.7rem] text-red-500" />
          </label>
          <input
            type="text"
            name="state"
            value={formData.address?.state}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                address: { ...prev.address, state: e.target.value },
              }))
            }
            required
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-2 py-2"
          />
        </div>

        <div className="w-full">
          <label className="block text-xs font-medium text-gray-700 flex items-end">
            Pincode <Asterisk className="w-[0.7rem] text-red-500" />
          </label>
          <input
            type="text"
            name="state"
            value={formData.address?.pincode}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                address: { ...prev.address, pincode: e.target.value },
              }))
            }
            required
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-2 py-2"
          />
        </div>
      </div>

      {/* Add similar inputs for line2, city, state, and pincode here */}

      {/* GSTIN */}
      <div className="flex gap-4">
        <div className="w-full">
          <label className="block text-xs font-medium text-gray-700 flex items-end">
            GSTIN <Asterisk className="w-[0.7rem] text-red-500" />
          </label>
          <input
            type="text"
            name="gstin"
            value={formData.gstin}
            onChange={handleInputChange}
            required
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-2 py-2"
          />
        </div>

        {/* FSSAI */}
        <div className="w-full">
          <label className="block text-xs font-medium text-gray-700 flex items-end">
            FSSAI <Asterisk className="w-[0.7rem] text-red-500" />
          </label>
          <input
            type="text"
            name="fssai"
            value={formData.fssai}
            onChange={handleInputChange}
            required
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-2 py-2"
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700"
      >
        {isSubmitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
};

export default ManageOrganizationProfile;
