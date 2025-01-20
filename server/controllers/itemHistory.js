import mongoose from "mongoose";
import ItemHistory from "../models/itemHistory.js";
import Organization from "../models/organization.js";

const itemHistoryController = {
    getAllItemHistory: async (req, res) => {
        try {
            const organization = await Organization.findOne({
                clerkOrganizationId: req.params.orgId
            });

            if (!organization) {
                return res.status(404).json({ message: "Organization not found" });
            }

            const itemHistories = await ItemHistory.find({ organization: organization._id })
                .populate("item");

            res.status(200).json({
                success: true,
                data: itemHistories,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to retrieve item history",
                error: error.message,
            });
        }
    },
    getItemHistoryById: async (req, res) => {
        try {
            const { id, orgId } = req.params;
            const organization = await Organization.findOne({
                clerkOrganizationId: orgId
            });

            if (!organization) {
                return res.status(404).json({ message: "Organization not found" });
            }

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid item ID format.",
                });
            }

            const itemHistories = await ItemHistory.find({
                item: id,
                organization: organization._id
            })
                .populate("item");

            if (!itemHistories.length) {
                return res.status(404).json({
                    success: false,
                    message: "No item history found for this item and organization.",
                });
            }

            const populatedItemHistories = await Promise.all(itemHistories.map(async (history) => {
                return await ItemHistory.populate(history, [
                    { path: "source", model: history.sourceModel },
                    { path: "destination", model: history.destinationModel },
                ]);
            }));

            res.status(200).json({
                success: true,
                data: populatedItemHistories,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to retrieve item history",
                error: error.message,
            });
        }
    },
    getItemHistoryByInventoryAndPickup: async (req, res) => {
        try {
            const { id, orgId, pickup, inventory } = req.params;

            const organization = await Organization.findOne({
                clerkOrganizationId: orgId
            });

            if (!organization) {
                return res.status(404).json({ message: "Organization not found" });
            }

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid item ID format.",
                });
            }

            const query = {
                item: id,
                organization: organization._id,
                inventoryType: inventory
            };

            if (pickup) {
                query.pickup = pickup;
            }

            const itemHistories = await ItemHistory.find(query).populate("item");

            if (!itemHistories.length) {
                return res.status(404).json({
                    success: false,
                    message: "No item history found for this item and organization.",
                });
            }

            const populatedItemHistories = await Promise.all(itemHistories.map(async (history) => {
                return await ItemHistory.populate(history, [
                    { path: "source", model: history.sourceModel },
                    { path: "destination", model: history.destinationModel },
                ]);
            }));

            res.status(200).json({
                success: true,
                data: populatedItemHistories,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to retrieve item history",
                error: error.message,
            });
        }
    },
    deleteItemHistory: async (req, res) => {
        try {
            const { id } = req.params;

            const itemHistory = await ItemHistory.findByIdAndDelete(id);
            if (!itemHistory) {
                return res.status(404).json({
                    success: false,
                    message: "Item history not found",
                });
            }

            res.status(200).json({
                success: true,
                message: "Item history deleted successfully",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to delete item history",
                error: error.message,
            });
        }
    },
};

export default itemHistoryController;
