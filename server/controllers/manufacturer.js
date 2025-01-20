import Manufacturer from "../models/manufacturer.js";
import Organization from "../models/organization.js";

const manufacturerController = {
  createManufacturer: async (req, res) => {
    try {
      const {
        manufacturer,
        manufacturerCompany,
        manufacturerdeliveryAddress,
        manufacturerContact,
        manufacturerEmail,
        manufacturerGstno,
        manufacturerGooglemaps,
        organization
      } = req.body;

      const newManufacturer = new Manufacturer({
        manufacturer,
        manufacturerCompany,
        manufacturerdeliveryAddress,
        manufacturerContact,
        manufacturerEmail,
        manufacturerGstno,
        manufacturerGooglemaps,
        organization
      });

      await newManufacturer.save();
      res.status(201).json({ message: "Manufacturer created successfully", newManufacturer });
    } catch (error) {
      res.status(400).json({ message: "Error creating manufacturer", error });
    }
  },

  getAllManufacturers: async (req, res) => {
    try {
      const organization = await Organization.findOne({
        clerkOrganizationId: req.params.orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const manufacturers = await Manufacturer.find({ organization: organization._id });
      res.status(200).json(manufacturers);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving manufacturers", error });
    }
  },

  getManufacturerById: async (req, res) => {
    try {
      const { id, orgId } = req.params;
      const organization = await Organization.findOne({
        clerkOrganizationId: orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const manufacturer = await Manufacturer.findOne({
        _id: id,
        organization: organization._id
      });

      if (!manufacturer) {
        return res.status(404).json({ message: "Manufacturer not found" });
      }
      res.status(200).json(manufacturer);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving manufacturer", error });
    }
  },

  updateManufacturer: async (req, res) => {
    try {
      const {
        manufacturer,
        manufacturerCompany,
        manufacturerdeliveryAddress,
        manufacturerContact,
        manufacturerEmail,
        manufacturerGstno,
        manufacturerGooglemaps,
        isActive
      } = req.body;

      const manufacturerToUpdate = await Manufacturer.findById(req.params.id);
      if (!manufacturerToUpdate) {
        return res.status(404).json({ message: "Manufacturer not found" });
      }

      // Update the manufacturer details
      if (manufacturer) manufacturerToUpdate.manufacturer = manufacturer;
      if (manufacturerCompany) manufacturerToUpdate.manufacturerCompany = manufacturerCompany;
      if (manufacturerdeliveryAddress)
        manufacturerToUpdate.manufacturerdeliveryAddress = manufacturerdeliveryAddress;
      if (manufacturerContact) manufacturerToUpdate.manufacturerContact = manufacturerContact;
      if (manufacturerEmail) manufacturerToUpdate.manufacturerEmail = manufacturerEmail;
      if (manufacturerGstno) manufacturerToUpdate.manufacturerGstno = manufacturerGstno;
      if (manufacturerGooglemaps)
        manufacturerToUpdate.manufacturerGooglemaps = manufacturerGooglemaps;
      if (typeof (isActive) === "boolean") manufacturerToUpdate.isActive = isActive;

      await manufacturerToUpdate.save();
      res.status(200).json({ message: "Manufacturer updated successfully", manufacturerToUpdate });
    } catch (error) {
      res.status(400).json({ message: "Error updating manufacturer", error });
    }
  },

  deleteManufacturer: async (req, res) => {
    try {
      const manufacturerToDelete = await Manufacturer.findById(req.params.id);
      if (!manufacturerToDelete) {
        return res.status(404).json({ message: "Manufacturer not found" });
      }

      await Manufacturer.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Manufacturer deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting manufacturer", error });
    }
  },
};

export default manufacturerController;
