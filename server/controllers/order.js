import Order from "../models/orders.js";
import axios from 'axios'
import Warehouse from "../models/warehouse.js";


const orderController = {
    createOrder: async (req, res) => {
        try {
            const {
                items, // Array of items
                companyBargainNo,
                sellerName,
                sellerLocation,
                sellerContact,
                billType,
                status,
                description,
                organization,
                warehouse,
                transportLocation,
                transportType
            } = req.body;

            console.log(req.body);

            const order = new Order({
                items,  // Array of items
                companyBargainNo,
                sellerName,
                sellerLocation,
                sellerContact,
                billType,
                status,
                description,
                organization,
                warehouse,
                transportLocation,
                transportType,
            });

            await order.save();

            // Update the corresponding warehouse inventory
            let warehouseDocument = await Warehouse.findById(warehouse);

            if (!warehouseDocument) {
                return res.status(404).json({ message: 'Warehouse not found' });
            }

            const processItem = (inventoryArray) => {
                return inventoryArray.find((i) => i.itemName === name);
            };
        for (const item of items) {
            const { name, weight, quantity } = item;
        
    

            if (billType === "Virtual Billed") {
                let existingVirtualInventoryItem = processItem(warehouseDocument.virtualInventory);
                if (!existingVirtualInventoryItem) {
                    warehouseDocument.virtualInventory.push({
                        itemName: name,
                        weight,
                        quantity,
                    });
                    warehouseDocument.billedInventory.push({
                        itemName: name,
                        weight,
                        quantity: 0,
                    });
                } else {
                    existingVirtualInventoryItem.quantity += quantity;
                }
            } else {
                let existingVirtualInventoryItem = processItem(warehouseDocument.virtualInventory);
                let existingBilledInventoryItem = processItem(warehouseDocument.billedInventory);

                if (!existingBilledInventoryItem) {
                    return res.status(400).json({
                        message: "Billing for inventory item that is not virtual",
                    });
                } else {
                    if (quantity > existingVirtualInventoryItem.quantity) {
                        return res.status(400).json({
                            message: "Billing more than what is available in virtual inventory",
                        });
                    }
                    existingVirtualInventoryItem.quantity -= quantity;
                    existingBilledInventoryItem.quantity += quantity;
                }
            }
            }

            await warehouseDocument.save();

            res.status(201).json({ message: 'Order created successfully', order });
        

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: 'Error creating order', error });
        }
    },

    deleteOrder: async (req, res) => {
        try {
            const order = await Order.findById(req.params.id);

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            const { warehouseId } = req.params;
            const { itemName, billType, quantity } = req.body;
      
            const warehouse = await Warehouse.findById(warehouseId);
      
            if (!warehouse) {
              return res.status(404).json({ message: "Warehouse not found" });
            }
        for (const item of order.items) {
                const { name, quantity } = item;

            const processItem = (inventoryArray) => {
              return inventoryArray.find((i) => i.itemName === itemName);
            };
      
            if (billType === "Virtual") {
              const existingVirtualInventoryItem = processItem(
                warehouse.virtualInventory
              );
              if (!existingVirtualInventoryItem) {
                return res
                  .status(400)
                  .json({ message: "Item not found in virtual inventory" });
              }
              if (existingVirtualInventoryItem.quantity < quantity) {
                return res.status(400).json({
                  message: "Cannot reduce quantity below zero in virtual inventory",
                });
              }
              existingVirtualInventoryItem.quantity -= quantity;
            } else if (billType === "Billed") {
              const existingBilledInventoryItem = processItem(
                warehouse.billedInventory
              );
              if (!existingBilledInventoryItem) {
                return res
                  .status(400)
                  .json({ message: "Item not found in billed inventory" });
              }
              if (existingBilledInventoryItem.quantity < quantity) {
                return res.status(400).json({
                  message: "Cannot reduce quantity below zero in billed inventory",
                });
              }
              existingBilledInventoryItem.quantity -= quantity;
            } else {
              return res.status(400).json({ message: "Invalid billType provided" });
            }
        }
      
            await warehouse.save();
      
            res.status(200).json({
              message: "Order deleted successfully",
              warehouse,
            });
          } catch (error) {
            res
              .status(500)
              .json({ message: "Error deleting order", error });
          }
        },
    
    getAllOrders: async (req, res) => {
        try {
            const orders = await Order.find();
            res.status(200).json(orders);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving orders', error });
        }
    },
    getOrderById: async (req, res) => {
        try {
            const order = await Order.find({ organization: req.params.id });
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.status(200).json(order);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving order', error });
        }
    },
    updateOrder: async (req, res) => {
        try {
            const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.status(200).json({ message: 'Order updated successfully', order });
        } catch (error) {
            res.status(400).json({ message: 'Error updating order', error });
        }
    },
    
};

export default orderController;