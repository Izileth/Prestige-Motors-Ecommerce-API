const express = require('express');
const router = express.Router();

const {
    createSale,
    updateSale,
    getSaleById,
    getPurchasesByUser,
    getSalesBySeller,
    getSalesByVehicle,
    getSalesStats, 
    getUserSalesHistory,
} = require('../modules/sales/salesModule')

const { authenticate, authorize } = require('../middleware/authMiddleware');



// Rotas autenticadas

router.get('/stats', authenticate, authorize(['USER', 'ADMIN']), getSalesStats);
router.post('/', authenticate, authorize(['USER', 'ADMIN']), createSale);
router.get('/:id', authenticate, getSaleById);
router.put('/:id', authenticate, authorize(['ADMIN']), updateSale);

// Históricos
router.get('/vehicles/:vehicleId', authenticate, getSalesByVehicle);

router.get('/:userId/stats', authenticate, getUserSalesHistory);
router.get('/buyers/:userId', authenticate,  getPurchasesByUser);
router.get('/sellers/:userId', authenticate, authorize(['USER', 'ADMIN']), getSalesBySeller);


module.exports = router;