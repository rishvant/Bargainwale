import Sale from "../models/sale.js";
import Warehouse from "../models/warehouse.js";
import Booking from "../models/booking.js";
import Transport from "../models/transport.js";
import ItemHistory from "../models/itemHistory.js";
import Organization from "../models/organization.js";

const saleController = {
  createSale: async (req, res) => {
    try {
      const {
        warehouseId,
        bookingId,
        items,
        organization,
      } = req.body;

      // Fetch the warehouse and booking documents
      const warehouseDocument = await Warehouse.findById(warehouseId);
      if (!warehouseDocument) {
        return res.status(404).json({ message: "Warehouse not found" });
      }

      const bookingDocument = await Booking.findById(bookingId).populate(
        "items.item"
      );
      const booking = await Booking.findById(bookingId).populate("buyer");

      if (!bookingDocument) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (bookingDocument.status === "fully sold") {
        return res.status(400).json({
          success: false,
          message: "Sale cannot be created for a fully sold booking",
        });
      }

      // Retrieve all previous sales for this booking
      // const previousSales = await Sale.find({ bookingId });
      // const previousSaleQuantities = {};

      // for (const sale of previousSales) {
      //   for (const item of sale.items) {
      //     if (!previousSaleQuantities[item.itemId]) {
      //       previousSaleQuantities[item.itemId] = 0;
      //     }
      //     previousSaleQuantities[item.itemId] += item.quantity;
      //   }
      // }

      // let isPartiallySold = false;
      // let isFullySold = true;

      // Process each item in the sale
      for (const item of items) {
        const { itemId, quantity, pickup } = item;

        const bookingItem = bookingDocument.items.find(
          (i) =>
            i.item._id.toString() === itemId.toString() && i.pickup === pickup
        );

        if (!bookingItem) {
          return res.status(400).json({
            success: false,
            message: `Item not found in booking`,
          });
        }

        const totalSoldQuantity = (bookingItem.soldQuantity || 0) + quantity;

        if (totalSoldQuantity > bookingItem.quantity) {
          return res.status(400).json({
            success: false,
            message: `Item ${itemId} is being sold more than what was booked`,
          });
        }

        const virtualInventoryItem = warehouseDocument.virtualInventory.find(
          (i) => i.item.toString() === itemId.toString() && i.pickup === pickup
        );

        const billedInventoryItem = warehouseDocument.billedInventory.find(
          (i) => i.item.toString() === itemId.toString()
        );

        const soldInventoryItem = warehouseDocument.soldInventory.find(
          (i) => i.item.toString() === itemId.toString() && i.pickup === pickup
        );

        if (billedInventoryItem) {
          if (billedInventoryItem.quantity >= quantity) {
            billedInventoryItem.quantity -= quantity;
            soldInventoryItem.quantity -= quantity;
            virtualInventoryItem.quantity += quantity;
          } else {
            return res.status(400).json({
              success: false,
              message:
                "Selling more than what is available in billed inventory",
            });
          }
        } else {
          return res.status(400).json({
            success: false,
            message: `Selling item that is not in billed inventory`,
          });
        }

        if (totalSoldQuantity <= bookingItem.quantity) {
          // isPartiallySold = true;
          // isFullySold = false;
          bookingItem.soldQuantity = totalSoldQuantity;
        }
        await ItemHistory.create({
          item: itemId,
          pickup,
          sourceModel: "Booking",
          source: bookingId,
          destinationModel: "Buyer",
          destination: booking.buyer._id,
          quantity,
          organization,
          inventoryType: "Sold"
        });
      }

      let isFullySold = true;

      for (const item of bookingDocument.items) {
        if (item.quantity != item.soldQuantity) {
          isFullySold = false;
          break;
        }
      }
      if (isFullySold) {
        bookingDocument.status = "fully sold";
      } else {
        bookingDocument.status = "partially sold";
      }

      // if (isFullySold && !isPartiallySold) {
      //   bookingDocument.status = "fully sold";
      // } else if (isPartiallySold) {
      //   bookingDocument.status = "partially sold";
      // }
      await bookingDocument.save();
      await warehouseDocument.save();

      const newSale = new Sale({
        warehouseId,
        bookingId,
        items,
        organization,
      });

      await newSale.save();

      res.status(201).json({
        success: true,
        message: "Sale created successfully",
        data: newSale,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create sale",
        error: error.message,
      });
    }
  },
  getAllSales: async (req, res) => {
    try {
      const organization = await Organization.findOne({
        clerkOrganizationId: req.params.orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const sales = await Sale.find({ organization: organization._id })
        .populate("items.itemId")
        .populate("warehouseId")
        .populate("bookingId");

      res.status(200).json({
        success: true,
        data: sales,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve sales",
        error: error.message,
      });
    }
  },
  getSaleById: async (req, res) => {
    try {
      const { id, orgId } = req.params;
      const organization = await Organization.findOne({
        clerkOrganizationId: orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const sale = await Sale.findOne({
        _id: id,
        organization: organization._id
      })
        .populate("items.itemId")
        .populate("warehouseId")
        .populate("bookingId");

      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.status(200).json({
        success: true,
        data: sale,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve sale",
        error: error.message,
      });
    }
  },
  getSalesBetweenDates: async (req, res) => {
    try {
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ message: "Both startDate and endDate are required." });
      }

      const sales = await Sale.find({
        invoiceDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      });

      res.status(200).json({ success: true, sales });
    } catch (error) {
      console.error("Error fetching sales between dates:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },
  deleteSale: async (req, res) => {
    try {
      const sale = await Sale.findById(req.params.id);
      if (!sale) {
        return res.status(404).json({
          success: false,
          message: "Sale not found",
        });
      }

      const warehouse = await Warehouse.findById(sale.warehouseId);
      if (!warehouse) {
        return res.status(404).json({
          success: false,
          message: "Warehouse not found",
        });
      }

      for (const item of sale.items) {
        const { itemId, quantity, pickup } = item;

        const virtualInventoryItem = warehouse.virtualInventory.find(
          (i) => i.item.toString() === itemId.toString() && i.pickup === pickup
        );

        const soldInventoryItem = warehouse.soldInventory.find(
          (i) => i.item.toString() === itemId.toString()
        );

        soldInventoryItem.quantity -= quantity;
        if (virtualInventoryItem) {
          virtualInventoryItem.quantity += quantity;
        } else {
          warehouse.virtualInventory.push({
            item: itemId,
            quantity,
          });
        }
      }

      const booking = await Booking.findById(sale.bookingId);
      if (booking) {
        const remainingSales = await Sale.find({
          bookingId: sale.bookingId,
        });

        let isPartiallySold = false;
        let isFullySold = true;

        for (const sale of remainingSales) {
          for (const item of sale.items) {
            const bookingItem = booking.items.find(
              (i) =>
                i.item._id.toString() === item.itemId.toString() &&
                i.pickup === pickup
            );
            if (bookingItem) {
              const totalPurchaseQuantity =
                (previousSaleQuantities[item.itemId] || 0) + item.quantity;
              if (totalPurchaseQuantity < bookingItem.quantity) {
                isPartiallySold = true;
                isFullySold = false;
              }
            }
          }
        }

        if (isFullySold && !isPartiallySold) {
          booking.status = "fully sold";
        } else if (isPartiallySold) {
          booking.status = "partially sold";
        } else {
          booking.status = "created";
        }
        await booking.save();
      }

      await Sale.findByIdAndDelete(req.params.id);
      await warehouse.save();

      res.status(200).json({
        success: true,
        message: "Sale deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete sale",
        error: error.message,
      });
    }
  },
};

export default saleController;
