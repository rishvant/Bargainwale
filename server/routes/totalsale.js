import express from 'express';
import totalSaleController from '../controllers/totalsale.js';

const router = express.Router();


router.post('/api/totalsales', totalSaleController.createTotalSale);
router.get('/api/totalsales/:orgId', totalSaleController.getAllTotalSales);
router.get('/api/totalsale/:orgId/:id', totalSaleController.getTotalSaleById);
router.delete('/api/totalsale/:id', totalSaleController.deleteTotalSale);

export default router;