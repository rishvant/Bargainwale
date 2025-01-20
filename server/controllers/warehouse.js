import Warehouse from "../models/warehouse.js";
import mongoose from "mongoose";
import Organization from "../models/organization.js";

const warehouseController = {
  createWarehouse: async (req, res) => {
    try {
      const { name, location, organization, warehouseManager } = req.body;

      // if (!warehouseManager || !warehouseManager.name || !warehouseManager.email) {
      //   return res.status(400).json({ message: "Warehouse manager name and email are required" });
      // }

      const warehouse = new Warehouse({
        name,
        location,
        organization,
        warehouseManager, // Expecting { name, email }
        virtualInventory: [],
        billedInventory: [],
        soldInventory: [],
      });

      await warehouse.save();
      res.status(201).json({
        message: "Warehouse created successfully",
        warehouse,
      });
    } catch (error) {
      res.status(400).json({
        message: "Error creating warehouse",
        error,
      });
    }
  },
  getAllWarehouses: async (req, res) => {
    try {
      const organization = await Organization.findOne({
        clerkOrganizationId: req.params.orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const warehouses = await Warehouse.find({ organization: organization._id })
        .populate("virtualInventory.item")
        .populate("billedInventory.item")
        .populate("soldInventory.item");

      res.status(200).json(warehouses);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving warehouses", error });
    }
  },
  getWarehouseByFilter: async (req, res) => {
    try {
      const { name, state, city, warehouseManagerName, warehouseManagerEmail } = req.query;

      let filter = {};

      if (name) filter.name = name;
      if (state) filter["location.state"] = state;
      if (city) filter["location.city"] = city;
      if (warehouseManagerName) filter["warehouseManager.name"] = warehouseManagerName;
      if (warehouseManagerEmail) filter["warehouseManager.email"] = warehouseManagerEmail;

      filter.organization = req.params.orgId;
      const warehouses = await Warehouse.find(filter);

      if (warehouses.length === 0) {
        return res.status(404).json({ message: "No warehouses found matching the criteria." });
      }

      res.status(200).json({ warehouses });
    } catch (error) {
      res.status(500).json({ message: "Error retrieving warehouses", error });
    }
  },
  getWarehouseById: async (req, res) => {
    try {
      const { id, orgId } = req.params;
      const organization = await Organization.findOne({
        clerkOrganizationId: orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const warehouse = await Warehouse.findOne({
        _id: id,
        organization: organization._id
      })
        .populate("virtualInventory.item")
        .populate("billedInventory.item")
        .populate("soldInventory.item");

      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.status(200).json(warehouse);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving warehouse", error });
    }
  },
  updateWarehouse: async (req, res) => {
    try {
      const { id } = req.params;
      const { warehouseManager, name, state, city, isActive } = req.body;

      // Validate warehouse ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid warehouse ID" });
      }

      const warehouse = await Warehouse.findById(id);

      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }

      // Update fields
      if (name) warehouse.name = name;
      if (state) warehouse.location.state = state;
      if (city) warehouse.location.city = city;
      if (typeof (isActive) === "boolean") warehouse.isActive = isActive;

      // Ensure warehouseManager is an object
      if (warehouseManager) {
        if (typeof warehouseManager === "object") {
          if (warehouseManager.name) warehouse.warehouseManager.name = warehouseManager.name;
          if (warehouseManager.email) warehouse.warehouseManager.email = warehouseManager.email;
        } else {
          return res.status(400).json({
            message: "Invalid warehouseManager format. It should be an object with 'name' and 'email'.",
          });
        }
      }

      await warehouse.save();

      res.status(200).json({
        message: "Warehouse details updated successfully",
        warehouse,
      });
    } catch (error) {
      console.error("Error updating warehouse:", error);
      res.status(400).json({
        message: "Error updating warehouse",
        error: error.message || error,
      });
    }
  },
  deleteWarehouse: async (req, res) => {
    try {
      const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.status(200).json({ message: "Warehouse deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting warehouse", error });
    }
  },
};

export default warehouseController;

// addInventoryItem: async (req, res) => {
//   try {
//     let warehouse = await Warehouse.findById(req.params.id);

//     if (!warehouse) {
//       return res.status(404).json({ message: "Warehouse not found" });
//     }

//     const { itemId, quantity, billType } = req.body;

//     if (!itemId || !quantity || !billType) {
//       return res
//         .status(400)
//         .json({ message: "Incomplete inventory item details" });
//     }

//     const processItem = (inventoryArray) => {
//       return inventoryArray.find((i) => i.item.toString() === itemId);
//     };

//     if (billType === "Virtual Billed") {
//       const existingVirtualInventoryItem = processItem(
//         warehouse.virtualInventory
//       );
//       if (!existingVirtualInventoryItem) {
//         warehouse.virtualInventory.push({
//           item: itemId,
//           quantity,
//         });
//         warehouse.billedInventory.push({
//           item: itemId,
//           quantity: 0,
//         });
//       } else {
//         existingVirtualInventoryItem.quantity += quantity;
//       }
//     } else {
//       const existingVirtualInventoryItem = processItem(
//         warehouse.virtualInventory
//       );
//       const existingBilledInventoryItem = processItem(
//         warehouse.billedInventory
//       );

//       if (!existingBilledInventoryItem) {
//         return res.status(400).json({
//           message: "Billing for inventory item that is not virtual",
//         });
//       } else {
//         if (quantity > existingVirtualInventoryItem.quantity) {
//           return res.status(400).json({
//             message:
//               "Billing more than what is available in virtual inventory",
//           });
//         }
//         existingVirtualInventoryItem.quantity -= quantity;
//         existingBilledInventoryItem.quantity += quantity;
//       }
//     }

//     // Update soldInventory
//     const updateSoldInventory = (itemId, billedQuantity, virtualQuantity) => {
//       const existingSoldItem = warehouse.soldInventory.find(
//         (i) => i.item.toString() === itemId
//       );
//       if (!existingSoldItem) {
//         warehouse.soldInventory.push({
//           item: itemId,
//           billedQuantity,
//           virtualQuantity,
//         });
//       } else {
//         existingSoldItem.billedQuantity += billedQuantity;
//         existingSoldItem.virtualQuantity += virtualQuantity;
//       }
//     };

//     updateSoldInventory(
//       itemId,
//       billType === "Billed" ? quantity : 0,
//       billType === "Virtual" ? quantity : 0
//     );

//     await warehouse.save();

//     res.status(200).json({
//       message: "Inventory item added/updated successfully",
//       warehouse,
//     });
//   } catch (error) {
//     res
//       .status(400)
//       .json({ message: "Error adding/updating inventory item", error });
//   }
// },

// deleteInventoryItem: async (req, res) => {
//   try {
//     const { warehouseId } = req.params;
//     const { itemId, billType, quantity } = req.body;

//     const warehouse = await Warehouse.findById(warehouseId);

//     if (!warehouse) {
//       return res.status(404).json({ message: "Warehouse not found" });
//     }

//     const processItem = (inventoryArray) => {
//       return inventoryArray.find((i) => i.item.toString() === itemId);
//     };

//     if (billType === "Virtual") {
//       const existingVirtualInventoryItem = processItem(
//         warehouse.virtualInventory
//       );
//       if (!existingVirtualInventoryItem) {
//         return res
//           .status(400)
//           .json({ message: "Item not found in virtual inventory" });
//       }
//       if (existingVirtualInventoryItem.quantity < quantity) {
//         return res.status(400).json({
//           message: "Cannot reduce quantity below zero in virtual inventory",
//         });
//       }
//       existingVirtualInventoryItem.quantity -= quantity;

//       // Update soldInventory
//       const soldItem = warehouse.soldInventory.find(
//         (i) => i.item.toString() === itemId
//       );
//       if (soldItem) {
//         soldItem.virtualQuantity -= quantity;
//       }
//     } else if (billType === "Billed") {
//       const existingBilledInventoryItem = processItem(
//         warehouse.billedInventory
//       );
//       if (!existingBilledInventoryItem) {
//         return res
//           .status(400)
//           .json({ message: "Item not found in billed inventory" });
//       }
//       if (existingBilledInventoryItem.quantity < quantity) {
//         return res.status(400).json({
//           message: "Cannot reduce quantity below zero in billed inventory",
//         });
//       }
//       existingBilledInventoryItem.quantity -= quantity;

//       // Update soldInventory
//       const soldItem = warehouse.soldInventory.find(
//         (i) => i.item.toString() === itemId
//       );
//       if (soldItem) {
//         soldItem.billedQuantity -= quantity;
//       }
//     } else {
//       return res.status(400).json({ message: "Invalid billType provided" });
//     }

//     await warehouse.save();

//     res.status(200).json({
//       message: "Inventory item quantity updated successfully",
//       warehouse,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error updating inventory item quantity", error });
//   }
// },

