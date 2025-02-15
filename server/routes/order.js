import { Router } from 'express';
import orderController from '../controllers/order.js';

const router = Router();

router.post('/api/order', orderController.createOrder);
router.get('/api/:orgId/order', orderController.getAllOrders);
router.get('/api/:orgId/order/:id', orderController.getOrderById);
router.put('/api/order/:id', orderController.updateOrder);
router.delete('/api/order/:orderId', orderController.deleteOrder);

export default router;