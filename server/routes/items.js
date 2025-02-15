import express from 'express';
import itemController from '../controllers/items.js';

const router = express.Router();

router.post('/api/items', itemController.createItem);
router.get('/api/:orgId/items', itemController.getAllItems);
router.get('/api/:orgId/items/:id', itemController.getItemById);
router.get('/api/:orgId/items/warehouse/:warehouseId', itemController.getItemByWarehouseId);
router.put('/api/items/:id', itemController.updateItem);
router.delete('/api/items/:id', itemController.deleteItem);

export default router;