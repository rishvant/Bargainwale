import mongoose from "mongoose";
import Booking from "../models/booking.js";
import Warehouse from "../models/warehouse.js";
import Buyer from "../models/buyer.js";
import Item from "../models/items.js";
import ItemHistory from "../models/itemHistory.js";
import { generateBookingEmailContent } from "../utils/mailContent.js";
import { sendEmailWithParams } from "./mail.js";
import Organization from "../models/organization.js";

const bookingController = {
  createBooking: async (req, res) => {
    try {
      const {
        BargainDate,
        BargainNo,
        items,
        inco,
        validity,
        deliveryOption,
        warehouse: warehouseId,
        organization,
        buyer,
        deliveryAddress,
        description,
        reminderDays = [7, 3, 1],
        totalAmount,
      } = req.body;

      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Items must be an array" });
      }

      const bookingItems = [];

      for (const {
        item: itemId,
        quantity,
        pickup,
        discount,
        taxpaidAmount,
        taxableAmount,
        gst,
        cgst,
        sgst,
        igst,
        contNumber,
        basePrice,
        // rackPrice,
        // depoPrice,
        // plantPrice,
      } of items) {
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
          return res
            .status(400)
            .json({ message: `Invalid itemId format: ${itemId}` });
        }

        const item = await Item.findById(itemId);
        if (!item) {
          return res.status(404).json({ message: `Item not found: ${itemId}` });
        }

        bookingItems.push({
          item: item._id,
          quantity,
          pickup,
          discount,
          taxpaidAmount,
          taxableAmount,
          gst,
          cgst,
          sgst,
          igst,
          contNumber,
          basePrice,
          // rackPrice,
          // depoPrice,
          // plantPrice,
        });
      }

      const booking = new Booking({
        BargainDate: new Date(BargainDate),
        BargainNo,
        items: bookingItems,
        inco,
        validity,
        deliveryOption,
        warehouse: warehouseId,
        organization,
        buyer,
        deliveryAddress,
        description,
        reminderDays,
        totalAmount,
      });

      let noDiscount = true;
      for (const item of items) {
        if (item.discount !== 0) {
          noDiscount = false;
          break;
        }
      }
      if (noDiscount) {
        let warehouseDocument = await Warehouse.findById(warehouseId);
        if (!warehouseDocument) {
          return res.status(404).json({ message: "Warehouse not found" });
        }

        for (let { item: itemId, quantity, pickup } of bookingItems) {
          quantity = Number(quantity);

          let existingVirtualInventoryItem =
            warehouseDocument.virtualInventory.find(
              (i) =>
                i.item &&
                i.item.toString() === itemId.toString() &&
                i.pickup === pickup
            );

          let existingSoldInventoryItem = warehouseDocument.soldInventory.find(
            (i) =>
              i.item &&
              i.item.toString() === itemId.toString() &&
              i.pickup === pickup
          );

          if (!existingVirtualInventoryItem) {
            return res.status(400).json({
              message: `Item not found in virtual inventory: ${itemId}`,
            });
          }

          existingVirtualInventoryItem.quantity -= quantity;

          if (!existingSoldInventoryItem) {
            warehouseDocument.soldInventory.push({
              item: itemId,
              virtualQuantity: quantity,
              pickup,
            });
          } else {
            existingSoldInventoryItem.virtualQuantity += quantity;
          }

          await ItemHistory.create({
            item: itemId,
            pickup,
            sourceModel: "Warehouse",
            source: warehouseId,
            destinationModel: "Buyer",
            destination: buyer,
            quantity,
            organization,
            inventoryType: "Virtual"
          });
        }
        await warehouseDocument.save();
        booking.discountStatus = "approved";

        const emailContent = generateBookingEmailContent(booking);
        // console.log(emailContent);

        const buyerDetails = await Buyer.findById(buyer);
        // console.log("..........",buyerDetails);

        const recipient = {
          email: buyerDetails.buyerEmail,
          name: buyerDetails.buyer,
        };

        const emailDetails = {
          body: emailContent.body,
          subject: emailContent.subject,
          recipient: recipient,
          transactionDetails: {
            transactionType: "booking",
            transactionId: booking._id,
          },
        };
        console.log("waw", emailDetails);
        await sendEmailWithParams(emailDetails);
      }

      await booking.save();
      res
        .status(201)
        .json({ message: "Booking created successfully", booking });
    } catch (error) {
      console.error("Error creating booking:", error.message || error);
      res.status(400).json({
        message: "Error creating booking",
        error: {
          message: error.message || "An error occurred",
          stack: error.stack,
        },
      });
    }
  },

  getAllBookings: async (req, res) => {
    try {
      const organization = await Organization.findOne({
        clerkOrganizationId: req.params.orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const bookings = await Booking.find({ organization: organization._id })
        .populate("items.item")
        .populate("warehouse")
        .populate("buyer");

      res.status(200).json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving bookings", error });
    }
  },

  getBookingById: async (req, res) => {
    try {
      const { id, orgId } = req.params;
      const booking = await Booking.findOne({ _id: id, organization: orgId })
        .populate("items.item")
        .populate("warehouse")
        .populate("buyer");

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.status(200).json(booking);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving booking", error });
    }
  },

  updateBooking: async (req, res) => {
    try {
      const {
        BargainDate,
        items,
        inco,
        validity,
        deliveryOption,
        warehouse: warehouseId,
        organization,
        buyer,
        deliveryAddress,
        description,
        reminderDays = [7, 3, 1],
        totalAmount,
      } = req.body;

      const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        {
          BargainDate: new Date(BargainDate),
          items,
          inco,
          validity,
          deliveryOption,
          warehouse: warehouseId,
          organization,
          buyer,
          deliveryAddress,
          description,
          reminderDays,
          totalAmount,
        },
        {
          new: true,
        }
      );

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res
        .status(200)
        .json({ message: "Booking updated successfully", booking });
    } catch (error) {
      res.status(400).json({ message: "Error updating booking", error });
    }
  },

  updateBookingForDiscount: async (req, res) => {
    try {
      const { items } = req.body;
      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (
        booking.discountStatus === "partially approved" ||
        booking.discountStatus === "approved"
      ) {
        return res.status(404).json({
          message:
            "Booking has already been approved either completely or partially",
        });
      }
      let fullyApproved = true;
      for (const item of items) {
        const itemId = item.item;
        const bookingItem = booking.items.find(
          (bookingItem) => bookingItem.item.toString() === itemId.toString()
        );
        if (!bookingItem) {
          return res
            .status(404)
            .json({ message: `Item with ${itemId} not found in booking` });
        }
        bookingItem.discount = item.discount;
        bookingItem.taxableAmount = item.taxableAmount;
        bookingItem.taxpaidAmount = item.taxpaidAmount;
        if (item.discount === 0) {
          fullyApproved = false;
        }
      }
      const warehouseId = booking.warehouse;
      let warehouseDocument = await Warehouse.findById(warehouseId);
      if (!warehouseDocument) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      for (let { item: itemId, quantity, pickup } of booking.items) {
        quantity = Number(quantity);

        let existingVirtualInventoryItem =
          warehouseDocument.virtualInventory.find(
            (i) =>
              i.item &&
              i.item.toString() === itemId.toString() &&
              i.pickup === pickup
          );

        let existingSoldInventoryItem = warehouseDocument.soldInventory.find(
          (i) =>
            i.item &&
            i.item.toString() === itemId.toString() &&
            i.pickup === pickup
        );

        if (!existingVirtualInventoryItem) {
          return res.status(400).json({
            message: `Item not found in virtual inventory: ${itemId}`,
          });
        }

        existingVirtualInventoryItem.quantity -= quantity;

        if (!existingSoldInventoryItem) {
          warehouseDocument.soldInventory.push({
            item: itemId,
            virtualQuantity: quantity,
            pickup,
          });
        } else {
          existingSoldInventoryItem.virtualQuantity += quantity;
        }
        await ItemHistory.create({
          item: itemId,
          pickup,
          sourceModel: "Warehouse",
          source: warehouseId,
          destinationModel: "Buyer",
          destination: booking.buyer,
          quantity,
          organization: booking.organization,
          inventoryType: "Virtual"
        });
      }
      await warehouseDocument.save();
      if (fullyApproved) {
        booking.discountStatus = "approved";
      } else {
        booking.discountStatus = "partially approved";
      }
      await booking.save();
      const emailContent = generateBookingEmailContent(booking);

      const recipient = {
        email: "22107@iiitu.ac.in",
        name: "Amrutansh Jha",
      };

      const emailDetails = {
        body: emailContent.body,
        subject: emailContent.subject,
        recipient: recipient,
        transactionDetails: {
          transactionType: "booking",
          transactionId: booking._id,
        },
      };

      await sendEmailWithParams(emailDetails);
      res
        .status(200)
        .json({ message: "Booking updated successfully", booking });
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error updating booking for discount", error });
    }
  },

  deleteBooking: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid booking ID format" });
      }

      const booking = await Booking.findById(id).populate("warehouse");
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const { items, warehouse } = booking;
      if (!warehouse) {
        return res
          .status(404)
          .json({ message: "Associated warehouse not found" });
      }

      for (const { item, quantity, pickup } of items) {
        const virtualInventoryItem = warehouse.virtualInventory.find(
          (i) =>
            i.item &&
            i.item.toString() === item.toString() &&
            i.pickup === pickup
        );

        if (virtualInventoryItem) {
          virtualInventoryItem.quantity += quantity;
        } else {
          return res.status(400).json({
            message: `Item not found in virtual inventory for booking: ${item}`,
          });
        }

        const soldInventoryItem = warehouse.soldInventory.find(
          (i) =>
            i.item &&
            i.item.toString() === item.toString() &&
            i.pickup === pickup
        );
        if (soldInventoryItem) {
          soldInventoryItem.virtualQuantity -= quantity;

          if (soldInventoryItem.virtualQuantity <= 0) {
            warehouse.soldInventory = warehouse.soldInventory.filter(
              (i) =>
                !(i.item.toString() === item.toString() && i.pickup === pickup)
            );
          }
        } else {
          return res.status(400).json({
            message: `Item not found in sold inventory for booking: ${item}`,
          });
        }
      }

      await warehouse.save();

      await Booking.findByIdAndDelete(id);

      res.status(200).json({ message: "Booking deleted successfully" });
    } catch (error) {
      console.error("Error deleting booking:", error.message || error);
      res.status(400).json({
        message: "Error deleting booking",
        error: {
          message: error.message || "An error occurred",
          stack: error.stack,
        },
      });
    }
  },
  getBookingBetweenDates: async (req, res) => {
    try {
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ message: "Both startDate and endDate are required." });
      }

      const booking = await Booking.find({
        invoiceDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      });

      res.status(200).json({ success: true, sales });
    } catch (error) {
      console.error("Error fetching booking between dates:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  getBookingsByBuyerId: async (req, res) => {
    try {
      const { buyerId } = req.params;

      const bookings = await Booking.find({ buyer: buyerId })
        .populate("warehouse")
        .populate("buyer");

      if (!bookings.length) {
        return res
          .status(404)
          .json({ message: "No bookings found for the provided buyer ID" });
      }

      res.status(200).json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Error fetching bookings", error });
    }
  },
};

export default bookingController;
