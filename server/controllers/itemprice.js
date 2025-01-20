import Price from "../models/itemprice.js";
import Warehouse from "../models/warehouse.js";
import Item from "../models/items.js";
import PriceHistory from "../models/pricehistory.js";
import Organization from "../models/organization.js";

const priceController = {
  addOrUpdatePrice: async (req, res) => {
    try {
      const { warehouseId, prices, organization } = req.body;

      // Validate Warehouse
      const warehouse = await Warehouse.findOne({ _id: warehouseId });
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found or does not belong to the organization" });
      }

      // Loop through Prices to Update or Add
      for (const { itemId, companyPrice, rackPrice, plantPrice, depotPrice } of prices) {
        // Validate Item
        const item = await Item.findOne({ _id: itemId });
        if (!item) {
          return res.status(404).json({ message: `Item not found for ID: ${itemId}` });
        }

        // Find existing price record
        let price = await Price.findOne({ warehouse: warehouseId, item: itemId });

        if (price) {
          const priceHistory = new PriceHistory({
            warehouse: warehouseId,
            item: itemId,
            companyPrice: price.companyPrice,
            rackPrice: price.rackPrice,
            plantPrice: price.plantPrice,
            depotPrice: price.depotPrice,
            organization,
            effectiveDate: price.updatedAt,
          });
          await priceHistory.save();

          // Update Existing Price
          price.companyPrice = companyPrice;
          price.rackPrice = rackPrice;
          price.plantPrice = plantPrice;
          price.depotPrice = depotPrice;
          price.pricesUpdated = true;
          price.date = new Date();
          await price.save();
        } else {
          // Create New Price Record
          price = new Price({
            warehouse: warehouseId,
            item: itemId,
            companyPrice,
            rackPrice,
            plantPrice,
            depotPrice,
            organization,
            pricesUpdated: true,
          });
          await price.save();

          // Log New Price in History
          const priceHistory = new PriceHistory({
            warehouse: warehouseId,
            item: itemId,
            companyPrice,
            rackPrice,
            plantPrice,
            depotPrice,
            organization,
          });
          await priceHistory.save();
        }
      }

      res.status(200).json({ message: "Prices updated successfully" });
    } catch (error) {
      console.error("Error adding or updating price:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },


  getPricesByWarehouse: async (req, res) => {
    try {
      const { warehouseId } = req.params;


      const items = await Item.find({ warehouses: { $in: [warehouseId] } });

      if (!items.length) {
        return res.status(404).json({ message: "No items found for the specified warehouse" });
      }

      const result = [];


      for (const item of items) {
        const price = await Price.findOne({ warehouse: warehouseId, item: item._id });

        if (price) {
          result.push({
            item,
            companyPrice: price.companyPrice,
            rackPrice: price.rackPrice,
            plantPrice: price.plantPrice,
            depotPrice: price.depotPrice,
            pricesUpdated: price.pricesUpdated,
            date: price.date,
            message: "Price updated"
          });
        } else {
          result.push({
            item,
            message: "Price not updated"
          });
        }
      }

      if (!result.length) {
        return res.status(404).json({ message: "No prices found for the specified warehouse" });
      }

      res.status(200).json({ message: "Prices retrieved successfully", items: result });
    } catch (error) {
      console.error("Error retrieving prices by warehouse:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },


  getAllPrices: async (req, res) => {
    try {
      const prices = await Price.find()
        .populate("item", "flavor material")
        .populate("warehouse", "name location");

      if (!prices.length) {
        return res.status(404).json({ message: "No prices found" });
      }

      res.status(200).json({ message: "All prices retrieved successfully", prices });
    } catch (error) {
      console.error("Error retrieving all prices:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },


  getItemPriceByWarehouse: async (req, res) => {
    try {
      const { warehouseId, itemId } = req.params;

      const price = await Price.findOne({ warehouse: warehouseId, item: itemId })
        .populate("item", "flavor material")
        .populate("warehouse", "name location");

      if (!price) {
        return res
          .status(404)
          .json({ message: "Price not found for the specified item and warehouse" });
      }

      res.status(200).json({ message: "Price retrieved successfully", price });
    } catch (error) {
      console.error("Error retrieving price by item and warehouse:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  getPriceHistory: async (req, res) => {
    try {
      const { orgId, warehouseId } = req.params;
      const { itemId } = req.query;

      const organization = await Organization.findOne({
        clerkOrganizationId: orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Base query
      const query = {
        warehouse: warehouseId,
        organization: organization._id
      };
      if (itemId) {
        query.item = itemId;
      }

      const priceHistory = await PriceHistory.find(query)
        .populate("item", "flavor material")
        .populate("warehouse", "name location")
        .sort({ effectiveDate: -1 });

      if (!priceHistory.length) {
        return res.status(404).json({
          message: "No price history found for the specified warehouse and/or item"
        });
      }

      res.status(200).json({
        message: "Price history retrieved successfully",
        priceHistory
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  },

};


export default priceController;
