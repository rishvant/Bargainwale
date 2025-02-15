import { Router } from "express";
import purchaseController from "../controllers/purchase.js";

const router = Router();

router.post("/api/purchase", purchaseController.createPurchase);
router.get("/api/:orgId/purchase", purchaseController.getAllPurchases);
router.get("/api/:orgId/purchase/:id", purchaseController.getPurchaseById);
router.get("/api/purchases-between-dates", purchaseController.getPurchasesBetweenDates);
router.delete("/api/purchase/:id", purchaseController.deletePurchase);

export default router;