import Purchase from "../models/purchase.js";
import Warehouse from "../models/warehouse.js";
import Order from "../models/orders.js";
import Transport from "../models/transport.js";
import Organization from "../models/organization.js";
import ItemHistory from "../models/itemHistory.js";
import { generatePurchaseEmailContent } from "../utils/mailContent.js";
import { sendEmailWithParams } from "./mail.js";

const purchaseController = {
  createPurchase: async (req, res) => {
    try {
      const {
        warehouseId,
        transporterId,
        orderId,
        items,
        invoiceDate,
        organization,
      } = req.body;
      // console.log(items);
      // Fetch the warehouse and order documents
      const warehouseDocument = await Warehouse.findById(warehouseId);
      if (!warehouseDocument) {
        return res.status(404).json({ message: "Warehouse not found" });
      }

      const orderDocument = await Order.findById(orderId).populate(
        "items.item"
      );
      if (!orderDocument) {
        return res.status(404).json({ message: "Order not found" });
      }

      const orderWarehouse = await Warehouse.findById(
        Order.findById(orderId).warehouse
      );

      if (orderDocument.status === "billed") {
        return res.status(400).json({
          success: false,
          message: "Purchase cannot be created for a fully billed order",
        });
      }

      // Retrieve all previous purchases for this order
      // const previousPurchases = await Purchase.find({ orderId });
      // const previousPurchaseQuantities = {};

      // for (const purchase of previousPurchases) {
      //   for (const item of purchase.items) {
      //     if (!previousPurchaseQuantities[item.itemId]) {
      //       previousPurchaseQuantities[item.itemId] = 0;
      //     }
      //     previousPurchaseQuantities[item.itemId] += item.quantity;
      //   }
      // }

      // let isPartiallyPaid = false;
      // let isFullyPaid = true;

      // Process each item in the purchase
      for (const item of items) {
        const { itemId, quantity, pickup } = item;

        // Find the order item
        const orderItem = orderDocument.items.find((i) => {
          // console.log(orderDocument.items);
          return (
            i.item._id.toString() === itemId.toString() && i.pickup == pickup
          );
        });

        if (!orderItem) {
          return res.status(400).json({
            success: false,
            message: `Item not found in order`,
          });
        }

        // Calculate the total quantity purchased so far for this item

        // const totalPurchasedQuantity = (previousPurchaseQuantities[itemId] || 0) + quantity;
        let totalPurchasedQuantity = (orderItem.purchaseQuantity || 0) + quantity;

        // Check if the purchase quantity exceeds the order quantity
        if (totalPurchasedQuantity > orderItem.quantity) {
          return res.status(400).json({
            success: false,
            message: `Item ${itemId} is being purchased more than what was ordered`,
          });
        }

        // Determine the status of the order based on purchases
        if (totalPurchasedQuantity <= orderItem.quantity) {
          // console.log(orderItem.purchaseQuantity);
          orderItem.purchaseQuantity = totalPurchasedQuantity;
          // console.log(orderItem.purchaseQuantity);
        }

        // Adjust virtual and billed inventory
        const virtualInventoryItem = warehouseDocument.virtualInventory.find(
          (i) => i.item.toString() === itemId.toString() && i.pickup === pickup
        );

        const soldInventoryItem = warehouseDocument.soldInventory.find(
          (i) => i.item.toString() === itemId.toString() && i.pickup === pickup
        );

        let billedInventoryItem = warehouseDocument.billedInventory.find(
          (i) => i.item.toString() === itemId.toString()
        );

        if (virtualInventoryItem) {
          // if (virtualInventoryItem.quantity >= quantity) {
          virtualInventoryItem.quantity -= quantity;

          if (billedInventoryItem) {
            billedInventoryItem.quantity += quantity;
          } else {
            warehouseDocument.billedInventory.push({
              item: itemId,
              quantity,
            });
          }
          await ItemHistory.create({
            item: itemId,
            pickup,
            sourceModel: "Order",
            source: orderId,
            destinationModel: "Warehouse",
            destination: warehouseId,
            quantity,
            organization,
            inventoryType: "Billed"
          });
          // } else {
          //   return res.status(400).json({
          //     success: false,
          //     message:
          //       "Buying more than what is available in virtual inventory",
          //   });
          // }
        } else {
          return res.status(400).json({
            success: false,
            message: `Purchasing item that is not in virtual inventory`,
          });
        }
      }

      let isFullyPaid = true;

      for (const item of orderDocument.items) {
        if (item.quantity != item.purchaseQuantity) {
          isFullyPaid = false;
          break;
        }
      }
      if (isFullyPaid) {
        orderDocument.status = "billed";
      } else {
        orderDocument.status = "partially paid";
      }

      // Update the order status based on payment
      // if (isFullyPaid && !isPartiallyPaid) {
      //   orderDocument.status = "billed";
      // } else if (isPartiallyPaid) {
      //   orderDocument.status = "partially paid";
      // }
      await orderDocument.save();
      await warehouseDocument.save();

      // Create and save the new purchase
      // console.log(items);
      // console.log(items);
      // console.log({
      //   warehouseId,
      //   transporterId,
      //   orderId,
      //   items,
      //   invoiceDate,
      // });
      const newPurchase = new Purchase({
        warehouseId,
        transporterId,
        orderId,
        items,
        invoiceDate,
        organization,
      });

      // console.log(newPurchase);

      await newPurchase.save();

      const emailContent = generatePurchaseEmailContent(newPurchase);

      const org = await Organization.findById(organization);
      console.log("----------------------------------", org);

      const recipient = {
        email: org.email,
        name: org.name,
      };

      const emailDetails = {
        body: emailContent.body,
        subject: emailContent.subject,
        recipient: recipient,
        transactionDetails: {
          transactionType: "purchase",
          transactionId: newPurchase._id,
        },
      };

      await sendEmailWithParams(emailDetails);

      res.status(201).json({
        success: true,
        message: "Purchase created successfully",
        data: newPurchase,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create purchase",
        error: error.message,
      });
    }
  },
  getAllPurchases: async (req, res) => {
    try {
      const organization = await Organization.findOne({
        clerkOrganizationId: req.params.orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const purchases = await Purchase.find({ organization: organization._id })
        .populate("items.itemId")
        .populate("warehouseId")
        .populate("orderId");

      res.status(200).json({
        success: true,
        data: purchases,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve purchases",
        error: error.message,
      });
    }
  },

  getPurchaseById: async (req, res) => {
    try {
      const { id, orgId } = req.params;
      const organization = await Organization.findOne({
        clerkOrganizationId: orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const purchase = await Purchase.findOne({
        _id: id,
        organization: organization._id
      })
        .populate("items.itemId")
        .populate("warehouseId")
        .populate("orderId");

      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      res.status(200).json({
        success: true,
        data: purchase,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve purchase",
        error: error.message,
      });
    }
  },

  getPurchasesBetweenDates: async (req, res) => {
    try {
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Both startDate and endDate are required." });
      }

      const purchases = await Purchase.find({
        invoiceDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      });

      res.status(200).json({ success: true, purchases });
    } catch (error) {
      console.error("Error fetching purchases between dates:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  deletePurchase: async (req, res) => {
    try {
      const purchase = await Purchase.findById(req.params.id);
      if (!purchase) {
        return res.status(404).json({
          success: false,
          message: "Purchase not found",
        });
      }

      const warehouse = await Warehouse.findById(purchase.warehouseId);
      if (!warehouse) {
        return res.status(404).json({
          success: false,
          message: "Warehouse not found",
        });
      }

      for (const item of purchase.items) {
        const { itemId, quantity, pickup } = item;
        // console.log(itemId, quantity, pickup);

        const virtualInventoryItem = warehouse.virtualInventory.find((i) => {
          // console.log(i.pickup);
          return i.item.toString() === itemId.toString() && i.pickup == pickup;
        });

        const billedInventoryItem = warehouse.billedInventory.find(
          (i) => i.item.toString() === itemId.toString()
        );
        billedInventoryItem.quantity -= quantity;
        if (virtualInventoryItem) {
          virtualInventoryItem.quantity += quantity;
        } else {
          warehouse.virtualInventory.push({
            item: itemId,
            quantity,
          });
        }
      }

      const order = await Order.findById(purchase.orderId);
      console.log(order);
      if (order) {
        const remainingPurchases = await Purchase.find({
          orderId: purchase.orderId,
        });
        console.log("---------------------------", remainingPurchases);
        let isPartiallyPaid = false;
        let isFullyPaid = true;

        for (const purchase of remainingPurchases) {
          for (const item of purchase.items) {
            const orderItem = order.items.find((i) => {
              // console.log(i.pickup);
              return (
                i.item._id.toString() === item.itemId.toString() &&
                i.pickup == pickup
              );
            });
            if (orderItem) {
              const totalPurchasedQuantity =
                (previousPurchaseQuantities[item.itemId] || 0) + item.quantity;
              if (totalPurchasedQuantity < orderItem.quantity) {
                isPartiallyPaid = true;
                isFullyPaid = false;
              }
            }
          }
        }

        if (isFullyPaid && !isPartiallyPaid) {
          order.status = "billed";
        } else if (isPartiallyPaid) {
          order.status = "partially paid";
        } else {
          order.status = "created";
        }
        await order.save();
      }

      await Purchase.findByIdAndDelete(req.params.id);
      await warehouse.save();

      res.status(200).json({
        success: true,
        message: "Purchase deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete purchase",
        error: error.message,
      });
    }
  },
};

export default purchaseController;
