import express from "express";
import itemHistoryController from "../controllers/itemHistory.js";

const router = express.Router();

router.get('/api/:orgId/itemhistory', itemHistoryController.getAllItemHistory);
router.get('/api/:orgId/itemhistory/:id', itemHistoryController.getItemHistoryById);
router.get('/api/:orgId/itemhistory/:id/:inventory/:pickup', itemHistoryController.getItemHistoryByInventoryAndPickup);
router.get('/api/:orgId/itemhistory/:id/:inventory', itemHistoryController.getItemHistoryByInventoryAndPickup);

export default router;