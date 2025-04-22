const express = require('express');
const router = express.Router();
const {
    createSale,
    updateSale,
    getSaleById,
    getSalesByVehicle,
    getSalesBySeller,
    getPurchasesByUser // Nova função
} = require('../controllers/saleController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Rotas autenticadas
router.post('/', authenticate, authorize(['USER', 'ADMIN']), createSale);
router.get('/:id', authenticate, getSaleById);
router.put('/:id', authenticate, authorize(['ADMIN']), updateSale);

// Históricos
router.get('/vehicles/:vehicleId', authenticate, getSalesByVehicle);


router.get('/buyers/:userId', authenticate, authorize(['USER', 'ADMIN']), getPurchasesByUser);
router.get('/sellers/:userId', authenticate, authorize(['USER', 'ADMIN']), getSalesBySeller);

module.exports = router;