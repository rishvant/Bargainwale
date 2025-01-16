import CreditNote from "../models/creditnote.js";
import TotalSale from "../models/totalsale.js";
import Warehouse from "../models/warehouse.js";
import Sale from "../models/sale.js";
import ItemHistory from "../models/itemHistory.js";

const creditNoteController = {
  
  createCreditNote: async (req, res) => {
    try {
      const { totalSaleId, items, organization, invoiceDate, transporterId } = req.body;

      // Validate input
      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one item must be provided",
        });
      }

      for (const item of items) {
        if (!item.reason) {
          return res.status(400).json({
            success: false,
            message: "Each item must include a reason",
          });
        }
      }

      // Fetch total sale
      const totalSale = await TotalSale.findById(totalSaleId).populate("sales");
      if (!totalSale) {
        return res.status(404).json({ success: false, message: "Total sale not found" });
      }

      const creditNoteNumber = `CN-${Date.now()}`;
      const creditItems = [];

      for (const item of items) {
        const { itemId, quantity, reason } = item;

        // Calculate the total quantity sold
        let totalQuantitySold = 0;
        totalSale.sales.forEach((sale) => {
          sale.items.forEach((saleItem) => {
            if (saleItem.itemId.toString() === itemId.toString()) {
              totalQuantitySold += saleItem.quantity;
            }
          });
        });

        const overbilledQuantity = totalQuantitySold - quantity;

        if (overbilledQuantity > 0) {
          creditItems.push({
            itemId,
            quantity: overbilledQuantity,
            reason,
            status: "issued",
          });

          // Update the warehouse's billed inventory
          const warehouse = await Warehouse.findOne({ organization });
          if (!warehouse) {
            return res.status(404).json({
              success: false,
              message: "Warehouse not found for the given organization",
            });
          }

          const billedItem = warehouse.billedInventory.find(
            (i) => i.item.toString() === itemId.toString()
          );
          if (billedItem) {
            billedItem.quantity += overbilledQuantity;
          } else {
            warehouse.billedInventory.push({
              item: itemId,
              quantity: overbilledQuantity,
            });
          }

          await warehouse.save();
        }
      }

      // Create the credit note
      const newCreditNote = new CreditNote({
        totalSaleId,
        items: creditItems,
        organization,
        creditNoteNumber,
        invoiceDate,
        transporterId,
      });

      await newCreditNote.save();

     

      res.status(201).json({
        success: true,
        message: "Credit note created successfully",
        data: newCreditNote,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create credit note",
        error: error.message,
      });
    }
  },

  
  updateCreditNoteStatus: async (req, res) => {
    try {
      const { creditNoteId } = req.params;
  
      // Find the credit note by ID
      const creditNote = await CreditNote.findById(creditNoteId)
        .populate("items.itemId")
        .populate("totalSaleId");
        
      if (!creditNote) {
        return res.status(404).json({
          success: false,
          message: "Credit note not found",
        });
      }
  
      // Check if the credit note is already settled
      if (creditNote.status === "settled") {
        return res.status(400).json({
          success: false,
          message: "Credit note is already settled",
        });
      }
  
      // Loop through items in the credit note and update the warehouse inventory
      for (const creditItem of creditNote.items) {
        const warehouse = await Warehouse.findOne({ organization: creditNote.organization });
        if (!warehouse) {
          return res.status(404).json({
            success: false,
            message: "Warehouse not found for the organization",
          });
        }
  
        // Update billed inventory
        const billedItem = warehouse.billedInventory.find(
          (i) => i.item.toString() === creditItem.itemId._id.toString()
        );
        if (billedItem) {
          billedItem.quantity -= creditItem.quantity;
        }
  
        // Update virtual inventory
        const virtualInventoryItem = warehouse.virtualInventory.find(
          (i) => i.item.toString() === creditItem.itemId._id.toString()
        );
        if (virtualInventoryItem) {
          virtualInventoryItem.quantity += creditItem.quantity;
        } else {
          warehouse.virtualInventory.push({
            item: creditItem.itemId._id,
            quantity: creditItem.quantity,
          });
        }
  
        // Save the warehouse after inventory adjustments
        await warehouse.save();
      }
  
      // Mark the credit note as settled
      creditNote.status = "settled";
      await creditNote.save();
  
      res.status(200).json({
        success: true,
        message: "Credit note status updated to settled",
        data: creditNote,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update credit note status",
        error: error.message,
      });
    }
  },
  
  getAllCreditNotesForOrganization: async (req, res) => {
    try {
      const creditNotes = await CreditNote.find({ organization: req.params.orgId })
        .populate("items.itemId") // Assuming you want to populate item details
        .populate("totalSaleId"); // Populate the total sale if needed

      res.status(200).json({
        success: true,
        data: creditNotes,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve credit notes",
        error: error.message,
      });
    }
  },

  getCreditNoteById: async (req, res) => {
    try {
      const creditNote = await CreditNote.findById(req.params.creditNoteId)
        .populate("items.itemId") 
        .populate("totalSaleId"); 

      if (!creditNote) {
        return res.status(404).json({
          success: false,
          message: "Credit note not found",
        });
      }

      res.status(200).json({
        success: true,
        data: creditNote,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve credit note",
        error: error.message,
      });
    }
  },
};

export default creditNoteController;
