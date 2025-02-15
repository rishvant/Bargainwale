import express from "express";
import priceController from "../controllers/itemprice.js";

const router = express.Router();

router.post("/api/add", priceController.addOrUpdatePrice);
router.get("/api/:orgId/warehouseprices/:warehouseId", priceController.getPricesByWarehouse);
router.get('/api/:orgId/prices', priceController.getAllPrices);
router.get('/api/:orgId/warehouse/:warehouseId/itemprice/:itemId', priceController.getItemPriceByWarehouse);
router.get("/api/:orgId/history/:warehouseId", priceController.getPriceHistory);

export default router;