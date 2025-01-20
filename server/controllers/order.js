import mongoose from 'mongoose';
import Order from "../models/orders.js";
import Warehouse from "../models/warehouse.js";
import Item from "../models/items.js";
import ItemHistory from '../models/itemHistory.js';
import Organization from '../models/organization.js';
import User from '../models/user.js';

import { generateOrderEmailContent } from '../utils/mailContent.js';
import { sendEmailWithParams } from "./mail.js";

const orderController = {
  createOrder: async (req, res) => {
    try {
      const { remake = false } = req.headers;
      const {
        companyBargainDate,
        items,
        inco,
        companyBargainNo,
        billType,
        status,
        description,
        organization,
        warehouse: warehouseId,
        manufacturer,
        paymentDays = 21,
        reminderDays = [7, 3, 1],
      } = req.body;

      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Items must be an array" });
      }

      if (remake == false) {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        const recentOrders = await Order.find({
          createdAt: { $gte: fifteenMinutesAgo },
          organization: organization,
          warehouse: warehouseId,
        }).lean(); // `.lean()` to return plain JavaScript objects for better performance
        // console.log(recentOrders);
        const duplicateOrder = recentOrders.find((order) => {
          if (order.inco !== inco || order.manufacturer.toString() !== manufacturer) {
            return false;
          }
          const orderItems = order.items.map((item) => {
            return {
              itemId: item.item ? item.item.toString() : null,
              quantity: item.quantity,
              baseRate: item.baseRate,
              pickup: item.pickup,
            };
          });

          const requestItems = items.map((item) => {
            return {
              itemId: item.itemId.toString(),
              quantity: item.quantity,
              baseRate: item.baseRate,
              pickup: item.pickup,
            };
          });

          orderItems.sort((a, b) => a.itemId.localeCompare(b.itemId));
          requestItems.sort((a, b) => a.itemId.localeCompare(b.itemId));

          return orderItems.every((orderItem, index) => {
            const requestItem = requestItems[index];
            return (
              orderItem.itemId === requestItem.itemId &&
              orderItem.quantity === requestItem.quantity &&
              orderItem.baseRate === requestItem.baseRate &&
              orderItem.pickup === requestItem.pickup
            );
          });
        });
        if (duplicateOrder) {
          return res.status(409).json({
            message: "An identical order was placed in the last 15 minutes. Would you like to remake the order?",
            orderDetails: duplicateOrder
          });
        }
      }


      const orderItems = [];
      let totalAmount = 0;
      for (const {
        itemId,
        quantity,
        pickup,
        baseRate,
        taxpaidAmount,
        gst,
        cgst,
        sgst,
        igst,
        taxableAmount,
        contNumber
      } of items) {
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
          return res.status(400).json({ message: `Invalid itemId format: ${itemId}` });
        }

        const item = await Item.findById(itemId);
        if (!item) {
          return res.status(404).json({ message: `Item not found: ${itemId}` });
        }

        orderItems.push({
          item: item._id,
          quantity,
          pickup,
          baseRate,
          taxpaidAmount,
          gst,
          cgst,
          sgst,
          igst,
          taxableAmount,
          contNumber,
        });
        totalAmount += taxpaidAmount;
      }

      const order = new Order({
        companyBargainDate: new Date(companyBargainDate),
        items: orderItems,
        inco,
        companyBargainNo,
        billType,
        status,
        description,
        organization,
        warehouse: warehouseId,
        manufacturer,
        paymentDays,
        reminderDays,
        totalAmount
      });

      await order.save();

      let warehouseDocument = await Warehouse.findById(warehouseId);
      if (!warehouseDocument) {
        return res.status(404).json({ message: "Warehouse not found" });
      }

      for (let { item: itemId, quantity, pickup } of orderItems) {
        quantity = Number(quantity);
        const item = await Item.findById(itemId);
        if (!item) {
          return res.status(404).json({ message: `Item not found: ${itemId}` });
        }

        let existingVirtualInventoryItem = warehouseDocument.virtualInventory.find(
          (i) => i.item && i.item.toString() === itemId.toString() && i.pickup === pickup
        );

        let existingBilledInventoryItem = warehouseDocument.billedInventory.find(
          (i) => i.item && i.item.toString() === itemId.toString()
        );

        if (!existingVirtualInventoryItem) {
          warehouseDocument.virtualInventory.push({
            item: itemId,
            quantity,
            pickup,
          });
        } else {
          existingVirtualInventoryItem.quantity += quantity;
        }

        if (!existingBilledInventoryItem) {
          warehouseDocument.billedInventory.push({
            item: itemId,
            quantity: 0,
          });
        }

        await ItemHistory.create({
          item: itemId,
          pickup,
          sourceModel: "Manufacturer",
          source: manufacturer,
          destinationModel: "Warehouse",
          destination: warehouseId,
          quantity,
          organization,
          inventoryType: "Virtual"
        });
      }

      await warehouseDocument.save();

      const { subject, body } = generateOrderEmailContent(order);

      const org = await Organization.findById(organization);
      // console.log("----------------------------------",org);

      const recipient = {
        email: org.email,
        name: org.name,
      };

      const emailDetails = {
        body: body,
        subject: subject,
        recipient: recipient,
        transactionDetails: {
          transactionType: "order",
          transactionId: order._id,
        },
      };

      await sendEmailWithParams(emailDetails);

      res.status(201).json({ message: "Order created successfully", order });
    } catch (error) {
      console.error("Error creating order:", error.message || error);
      res.status(400).json({
        message: "Error creating order",
        error: {
          message: error.message || "An error occurred",
          stack: error.stack
        }
      });
    }
  },

  getAllOrders: async (req, res) => {
    try {
      const organization = await Organization.findOne({
        clerkOrganizationId: req.params.orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const orders = await Order.find({ organization: organization._id })
        .populate("items.item")
        .populate("warehouse")
        .populate("manufacturer");

      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving orders", error });
    }
  },

  getOrderById: async (req, res) => {
    try {
      const { id, orgId } = req.params;
      const organization = await Organization.findOne({
        clerkOrganizationId: orgId
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const order = await Order.findOne({
        _id: id,
        organization: organization._id
      })
        .populate("items.item")
        .populate("warehouse")
        .populate("manufacturer");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.status(200).json(order);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving order", error });
    }
  },

  updateOrder: async (req, res) => {
    try {
      const {
        companyBargainDate,
        items,
        inco,
        companyBargainNo,
        billType,
        status,
        description,
        organization,
        warehouse: warehouseId,
        manufacturer,
        paymentDays = 21,
        reminderDays = [7, 3, 1],
        totalAmount
      } = req.body;

      const order = await Order.findByIdAndUpdate(req.params.id, {
        companyBargainDate: new Date(companyBargainDate),
        items,
        inco,
        companyBargainNo,
        billType,
        status,
        description,
        organization,
        warehouse: warehouseId,
        manufacturer,
        paymentDays,
        reminderDays,
        totalAmount
      }, {
        new: true,
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.status(200).json({ message: "Order updated successfully", order });
    } catch (error) {
      res.status(400).json({ message: "Error updating order", error });
    }
  },

  deleteOrder: async (req, res) => {
    try {
      const { orderId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid orderId format' });
      }

      const order = await Order.findById(orderId).populate('warehouse');
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const { items, warehouse } = order;

      for (const { item, quantity, pickup } of items) {
        const virtualInventoryItem = warehouse.virtualInventory.find(
          (i) => i.item && i.item.toString() === item.toString() && i.pickup === pickup
        );

        if (virtualInventoryItem) {
          virtualInventoryItem.quantity -= quantity;
          //if (virtualInventoryItem.quantity < 0) virtualInventoryItem.quantity = 0;
        }
      }

      await warehouse.save();
      await Order.findByIdAndDelete(orderId);

      res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
      console.error('Error deleting order:', error.message || error);
      res.status(400).json({
        message: 'Error deleting order',
        error: {
          message: error.message || 'An error occurred',
          stack: error.stack,
        },
      });
    }
  },

  fetchPendingRemindersToday: async () => {
    try {
      const today = new Date();
      const orders = await Order.find({ status: "payment pending" });

      const pendingReminders = [];

      orders.forEach((order) => {
        const bargainDate = new Date(order.companyBargainDate);
        const dueDate = new Date(bargainDate);
        dueDate.setDate(dueDate.getDate() + order.paymentDays);

        const reminderDates = order.reminderDays.map((days) => {
          const reminderDate = new Date(dueDate);
          reminderDate.setDate(reminderDate.getDate() - days);
          return reminderDate;
        });

        reminderDates.forEach((reminderDate) => {
          if (
            reminderDate.getDate() === today.getDate() &&
            reminderDate.getMonth() === today.getMonth() &&
            reminderDate.getFullYear() === today.getFullYear()
          ) {
            pendingReminders.push(order);
          }
        });
      });

      return pendingReminders;
    } catch (error) {
      console.error("Error fetching pending reminders:", error);
      return [];
    }
  },
};

export default orderController;
