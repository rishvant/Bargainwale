import Transport from '../models/transport.js';
import Organization from '../models/organization.js';

const transportController = {
  // Create a new transport
  createTransport: async (req, res) => {
    try {
      const { transport, transportType, transportContact, transportAgency, organization } = req.body;

      const newTransport = new Transport({
        transport,
        transportType,
        transportContact,
        transportAgency,
        organization
      });

      await newTransport.save();
      res.status(201).json({ message: 'Transport created successfully', transport: newTransport });
    } catch (error) {
      res.status(400).json({ message: 'Error creating transport', error });
    }
  },

  // Get all transports
  getAllTransports: async (req, res) => {
    try {
      const organization = await Organization.findOne({
        clerkOrganizationId: req.params.orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const transports = await Transport.find({ organization: organization._id });
      res.status(200).json(transports);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving transports', error });
    }
  },

  // Get a transport by ID
  getTransportById: async (req, res) => {
    try {
      const { id, orgId } = req.params;
      const organization = await Organization.findOne({
        clerkOrganizationId: orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const transport = await Transport.findOne({
        _id: id,
        organization: organization._id
      });

      if (!transport) {
        return res.status(404).json({ message: 'Transport not found' });
      }
      res.status(200).json(transport);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving transport', error });
    }
  },

  // Update a transport by ID
  updateTransport: async (req, res) => {
    try {
      const { transport, transportType, transportContact, transportAgency, organization, isActive } = req.body;

      const updatedTransport = await Transport.findByIdAndUpdate(
        req.params.id,
        { transport, transportType, transportContact, transportAgency, organization, isActive },
        { new: true, runValidators: true }
      );

      if (!updatedTransport) {
        return res.status(404).json({ message: 'Transport not found' });
      }

      res.status(200).json({ message: 'Transport updated successfully', transport: updatedTransport });
    } catch (error) {
      res.status(400).json({ message: 'Error updating transport', error });
    }
  },

  // Delete a transport by ID
  deleteTransport: async (req, res) => {
    try {
      const deletedTransport = await Transport.findByIdAndDelete(req.params.id);
      if (!deletedTransport) {
        return res.status(404).json({ message: 'Transport not found' });
      }
      res.status(200).json({ message: 'Transport deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting transport', error });
    }
  },
};

export default transportController;
