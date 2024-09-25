import mongoose from 'mongoose';
import Order from "../models/orders.js";
import Warehouse from "../models/warehouse.js";
import Item from "../models/items.js";

const orderController = {
  createOrder: async (req, res) => {
    try {
      const {
        companyBargainDate,
        items,
        companyBargainNo,
        billType,
        status,
        description,
        organization,
        warehouse: warehouseId,
        manufacturer,
        transportCatigory,
        paymentDays = 21,
        reminderDays = [7, 3, 1],
      } = req.body;

      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Items must be an array" });
      }

      const orderItems = [];

      for (const { itemId, quantity,pickup } of items) {
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
          return res.status(400).json({ message: `Invalid itemId format: ${itemId}` });
        }

        const item = await Item.findById(itemId);
        if (!item) {
          return res.status(404).json({ message: `Item not found: ${itemId}` });
        }

        orderItems.push({ item: item._id, quantity, pickup });
      }

      const order = new Order({
        companyBargainDate: new Date(companyBargainDate),
        items: orderItems,
        companyBargainNo,
        billType,
        status,
        description,
        organization,
        warehouse: warehouseId,
        manufacturer,
        transportCatigory,
        paymentDays,
        reminderDays,
      });

      await order.save();
      // console.log("Warehouse ID:", warehouseId);

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

        // const weight = item.grossweight; 
        // const itemName = item.materialdescription;  

        // if (billType === "Virtual Billed") {
        let existingVirtualInventoryItem = warehouseDocument.virtualInventory.find(
          (i) => i.item && i.item.toString() === itemId.toString() && i.pickup===pickup
        );
 
        if (!existingVirtualInventoryItem) {
          warehouseDocument.virtualInventory.push({
            item: itemId,
            quantity,
            // weight,
            // itemName,
            pickup
          });
          warehouseDocument.billedInventory.push({
            item: itemId,
            quantity: 0,
            // weight,
            // itemName,
            pickup
          });
        } else {
          existingVirtualInventoryItem.quantity += quantity;
        }
        // } else if (billType === "Billed") {
        //   let existingVirtualInventoryItem = warehouseDocument.virtualInventory.find(
        //     (i) => i.item && i.item.toString() === itemId.toString()
        //   );
        //   let existingBilledInventoryItem = warehouseDocument.billedInventory.find(
        //     (i) => i.item && i.item.toString() === itemId.toString()
        //   );

        //   if (!existingBilledInventoryItem) {
        //     return res.status(400).json({
        //       message: "Billing for inventory item that is not virtual",
        //     });
        //   } else {
        //     if (!existingVirtualInventoryItem) {
        //       return res.status(400).json({
        //         message: "Virtual inventory item not found",
        //       });
        //     }

        //     if (quantity > existingVirtualInventoryItem.quantity) {
        //       return res.status(400).json({
        //         message: "Billing more than what is available in virtual inventory",
        //       });
        //     }
        //     existingVirtualInventoryItem.quantity -= quantity;
        //     existingBilledInventoryItem.quantity += quantity;
        //   }
        // }
      }

      await warehouseDocument.save();
      res.status(201).json({ message: "Order created successfully", order });
    } catch (error) {
      console.error("Error creating order:", error.message || error);
      res.status(400).json({
        message: "Error creating order",
        error: {
          message: error.message || "An error occurred",
          stack: error.stack // Optional: include stack trace for more details
        }
      });
    }
  },

  getAllOrders: async (req, res) => {
    try {
      const orders = await Order.find()
        .populate('items.item')
        .populate('warehouse')
        .populate('manufacturer');
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving orders", error });
    }
  },

  getOrderById: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id)
        .populate('items')
        .populate('warehouse')
        .populate('manufacturer');
        
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
      const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
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

  // updateBillTypePartWise: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const { items } = req.body;

  //     const order = await Order.findById(id).populate('items');

  //     if (!order) {
  //       return res.status(404).json({ message: "Order not found" });
  //     }

  //     let warehouseDocument = await Warehouse.findById(order.warehouse);

  //     if (!warehouseDocument) {
  //       return res.status(404).json({ message: "Warehouse not found" });
  //     }

  //     for (const updatedItem of items) {
  //       const { itemId, quantity, billType } = updatedItem;

  //       const existingOrderItem = order.items.find(
  //         (item) => item._id.toString() === itemId.toString()
  //       );
  //       if (!existingOrderItem) {
  //         return res
  //           .status(400)
  //           .json({ message: `Item not found in order` });
  //       }

  //       const existingVirtualInventoryItem = warehouseDocument.virtualInventory.find(
  //         (i) => i.item && i.item.toString() === itemId.toString()
  //       );
  //       const existingBilledInventoryItem = warehouseDocument.billedInventory.find(
  //         (i) => i.item && i.item.toString() === itemId.toString()
  //       );

  //       if (billType === "Virtual Billed") {
  //         if (!existingVirtualInventoryItem) {
  //           return res
  //             .status(400)
  //             .json({ message: `Item not found in virtual inventory` });
  //         }
  //         if (quantity > existingVirtualInventoryItem.quantity) {
  //           return res.status(400).json({
  //             message: `Not enough quantity in virtual inventory for item`,
  //           });
  //         }

  //         existingVirtualInventoryItem.quantity -= quantity;
  //         if (existingBilledInventoryItem) {
  //           existingBilledInventoryItem.quantity += quantity;
  //         } else {
  //           warehouseDocument.billedInventory.push({
  //             item: itemId,
  //             quantity,
  //           });
  //         }

  //         existingOrderItem.quantity -= quantity;

  //         if (existingOrderItem.quantity < 0) {
  //           existingOrderItem.quantity = 0;
  //         }
  //       } else {
  //         return res
  //           .status(400)
  //           .json({ message: `Invalid bill type for item` });
  //       }
  //     }

  //     await order.save();
  //     await warehouseDocument.save();

  //     res.status(200).json({ message: "Order updated successfully", order });
  //   } catch (error) {
  //     res.status(400).json({ message: "Error updating order", error });
  //   }
  // },

    deleteOrder: async (req, res) => {
      try {
        const { orderId } = req.params;
        console.log('Received orderId:', orderId);
  
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
          return res.status(400).json({ message: 'Invalid orderId format' });
        }
  
        // Find the order to be deleted
        const order = await Order.findById(orderId).populate('warehouse');
  
        if (!order) {
          return res.status(404).json({ message: 'Order not found' });
        }
  
        const { items, billType, warehouse } = order;
  
        // Adjust the inventory in the warehouse
        for (const { item, quantity } of items) {
          const virtualInventoryItem = warehouse.virtualInventory.find(
            (i) => i.item && i.item.toString() === item.toString()
          );
          const billedInventoryItem = warehouse.billedInventory.find(
            (i) => i.item && i.item.toString() === item.toString()
          );
  
          // if (billType === 'Virtual Billed') {
          if (virtualInventoryItem) {
            virtualInventoryItem.quantity -= quantity;
            if (virtualInventoryItem.quantity < 0) virtualInventoryItem.quantity = 0;
          }
          // } else if (billType === 'Billed') {
          //   if (billedInventoryItem) {
          //     billedInventoryItem.quantity -= quantity;
          //     if (billedInventoryItem.quantity < 0) billedInventoryItem.quantity = 0;
          //     // Optionally, you could move excess quantity back to virtual inventory if needed
          //     if (virtualInventoryItem) {
          //       virtualInventoryItem.quantity += quantity;
          //     }
          //   }
          // }
        }
  
        await warehouse.save();
  
        // Delete the order
        await Order.findByIdAndDelete(orderId);
  
        res.status(200).json({ message: 'Order deleted successfully' });
      } catch (error) {
        console.error('Error deleting order:', error.message || error);
        res.status(400).json({
          message: 'Error deleting order',
          error: {
            message: error.message || 'An error occurred',
            stack: error.stack, // Optional: include stack trace for more details
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
