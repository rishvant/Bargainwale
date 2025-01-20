import Item from "../models/items.js";
import Warehouse from "../models/warehouse.js";
import Organization from "../models/organization.js";


const itemController = {
  // Create a new item
  createItem: async (req, res) => {
    try {
      const { flavor, hsnCode, material, materialdescription, netweight, grossweight, gst, packaging, packsize, staticPrice, warehouses, organization } = req.body;

      // Create the new item
      const newItem = new Item({
        flavor,
        hsnCode,
        material,
        materialdescription,
        netweight,
        grossweight,
        gst,
        packaging,
        packsize,
        staticPrice,
        warehouses,
        organization
      });


      const savedItem = await newItem.save();
      if (warehouses && warehouses.length > 0) {
        const warehouseUpdates = warehouses.map(async (warehouseId) => {
          return Warehouse.findByIdAndUpdate(
            warehouseId,
            {
              $push: {
                virtualInventory: [
                  { item: savedItem._id, pickup: "rack", quantity: 0 },
                  { item: savedItem._id, pickup: "plant", quantity: 0 },
                  { item: savedItem._id, pickup: "depot", quantity: 0 },
                ],
                billedInventory: { item: savedItem._id, quantity: 0 },
                soldInventory: [
                  { item: savedItem._id, pickup: "rack", virtualQuantity: 0 },
                  { item: savedItem._id, pickup: "plant", virtualQuantity: 0 },
                  { item: savedItem._id, pickup: "depot", virtualQuantity: 0 },
                ],
              },
            },
            { new: true }
          );
        });
        await Promise.all(warehouseUpdates);
      }
      res.status(201).json({ message: "Item created successfully and added to warehouses", item: savedItem });
    } catch (error) {
      console.error("Error creating item:", error);
      res.status(400).json({ message: "Error creating item", error });
    }
  },
  getAllItems: async (req, res) => {
    try {
      const organization = await Organization.findOne({
        clerkOrganizationId: req.params.orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const items = await Item.find({ organization: organization._id });
      res.status(200).json(items);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving items", error });
    }
  },

  getItemById: async (req, res) => {
    try {
      const { id, orgId } = req.params;
      const organization = await Organization.findOne({
        clerkOrganizationId: orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const item = await Item.findOne({
        _id: id,
        organization: organization._id
      });

      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.status(200).json(item);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving item", error });
    }
  },
  getItemByWarehouseId: async (req, res) => {
    try {
      const { warehouseId, orgId } = req.params;
      const items = await Item.find({ warehouses: warehouseId, organization: orgId }); // Assuming warehouse is stored as a reference or ID

      if (items.length === 0) {
        return res.status(404).json({ message: "No items found for the specified warehouse" });
      }

      res.status(200).json(items);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving items by warehouse", error });
    }
  },

  updateItem: async (req, res) => {
    try {
      const { flavor, hsnCode, material, materialdescription, netweight, grossweight, gst, packaging, packsize, staticPrice, warehouses, isActive } = req.body;

      const updatedItem = await Item.findByIdAndUpdate(
        req.params.id,
        {
          flavor,
          hsnCode,
          material,
          materialdescription,
          netweight,
          grossweight,
          gst,
          packaging,
          packsize,
          staticPrice,
          warehouses,
          isActive
        },
        { new: true }
      );

      if (!updatedItem) {
        return res.status(404).json({ message: "Item not found" });
      }

      res.status(200).json({ message: "Item updated successfully", item: updatedItem });
    } catch (error) {
      res.status(400).json({ message: "Error updating item", error });
    }
  },

  deleteItem: async (req, res) => {
    try {
      const deletedItem = await Item.findByIdAndDelete(req.params.id);

      if (!deletedItem) {
        return res.status(404).json({ message: "Item not found" });
      }

      res.status(200).json({ message: "Item deleted successfully", item: deletedItem });
    } catch (error) {
      res.status(500).json({ message: "Error deleting item", error });
    }
  }
};
export default itemController;
