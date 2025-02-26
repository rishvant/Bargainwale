import React, { useState } from "react";
import {
  useOrganization,
  useOrganizationList,
  useUser,
} from "@clerk/clerk-react";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { GrFormNextLink } from "react-icons/gr";
import { Asterisk } from "lucide-react";

const CreateOrganizationPage = () => {
  const { createOrganization, setActive } = useOrganizationList();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    organizationName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    fssai: "",
  });
  const [setAsActive, setSetAsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { organization, isLoaded } = useOrganization();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!organizationName) {
      toast.error("Organization name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const organization = await createOrganization({
        name: formData.organizationName,
      });

      if (setAsActive) {
        await setActive({ organization });
      }

      const response = await axios.post(`${API_BASE_URL}/organization`, {
        name: formData.organizationName,
        clerkOrganizationId: organization.id,
        creatorId: user.id,
        email: formData.email,
        phone: formData.phone,
        address: {
          line1: formData.addressLine1,
          line2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        gstin: formData.gstin,
        fssai: formData.fssai,
      });

      if (response.status === 201) {
        toast.success("Organization created successfully!");
        setFormData("");
        localStorage.setItem("clerk_active_org", organization?.id);
        setSetAsActive(true);
        navigate("/dashboard");
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
    <div className="flex items-center justify-center py-5">
      {isLoaded ? (
        organization === null ? (
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-4xl px-8 py-6 bg-white rounded-xl shadow-lg flex flex-col gap-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Create Organization
            </h2>

            {/* Organization Name */}
            <div>
              <label
                htmlFor="organizationName"
                className="block text-sm font-medium text-gray-700 flex items-end"
              >
                Organization Name
                <Asterisk className="w-[0.8rem] text-red-500" />
              </label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                placeholder="e.g. Bargainwale"
                value={formData.organizationName}
                onChange={handleChange}
                disabled={isSubmitting}
                required
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 flex items-end"
              >
                Email
                <Asterisk className="w-[0.8rem] text-red-500" />
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. support@bargainwale.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                required
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 flex items-end"
              >
                Phone Number
                <Asterisk className="w-[0.8rem] text-red-500" />
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="e.g. +91 234 567 8901"
                value={formData.phone}
                onChange={handleChange}
                disabled={isSubmitting}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
              />
            </div>

            {/* Address Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Address
              </h3>
              <div className="mb-4">
                <label
                  htmlFor="addressLine1"
                  className="block text-sm font-medium text-gray-700 flex items-end"
                >
                  Address Line 1
                  <Asterisk className="w-[0.8rem] text-red-500" />
                </label>
                <input
                  id="addressLine1"
                  name="addressLine1"
                  type="text"
                  placeholder="e.g. 123 Main Street"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="addressLine2"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address Line 2
                </label>
                <input
                  id="addressLine2"
                  name="addressLine2"
                  type="text"
                  placeholder="e.g. Apartment, suite, unit, etc."
                  value={formData.addressLine2}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 flex items-end"
                  >
                    City
                    <Asterisk className="w-[0.8rem] text-red-500" />
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="e.g. New Delhi"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                  />
                </div>

                <div className="flex-1">
                  <label
                    htmlFor="state"
                    className="block text-sm font-medium text-gray-700 flex items-end"
                  >
                    State
                    <Asterisk className="w-[0.8rem] text-red-500" />
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    placeholder="e.g. Delhi"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="pincode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Pincode
                </label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  placeholder="e.g. 110001"
                  value={formData.pincode}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                />
              </div>
            </div>

            {/* GSTIN and FSSAI Section */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label
                  htmlFor="gstin"
                  className="block text-sm font-medium text-gray-700 flex items-end"
                >
                  GSTIN Number
                  <Asterisk className="w-[0.8rem] text-red-500" />
                </label>
                <input
                  id="gstin"
                  name="gstin"
                  type="text"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  value={formData.gstin}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                />
              </div>

              <div className="flex-1">
                <label
                  htmlFor="fssai"
                  className="block text-sm font-medium text-gray-700"
                >
                  FSSAI Number
                </label>
                <input
                  id="fssai"
                  name="fssai"
                  type="text"
                  placeholder="e.g. 12345678901234"
                  value={formData.fssai}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 py-2 px-4 w-full inline-flex items-center justify-center gap-x-2 text-sm font-medium rounded-lg border border-gray-300 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting
                ? "Creating organization..."
                : "Create Organization"}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-[1.1rem]">Organization already created!</h1>
            <Link
              to="/dashboard"
              className="text-[#0000EE] text-[1rem] flex items-center hover:underline transition-all"
            >
              Go to Dashboard <GrFormNextLink className="text-[1.2rem]" />
            </Link>
          </div>
        )
      ) : (
        <h1 className="text-[1rem]">Loading...</h1>
      )}
    </div>
  );
};

export default CreateOrganizationPage;
