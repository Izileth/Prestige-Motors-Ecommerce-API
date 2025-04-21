const express = require('express');
const router = express.Router();
const {
    createSale,
    getSaleById,
    updateSale,
    getSalesByVehicle,
    getSalesByUser
} = require('../controllers/saleController');
const { protect, admin } = require('../middleware/authMiddleware');

// Rotas autenticadas
router.post('/', protect, createSale);

router.get('/veiculo/:vehicleId', protect, getSalesByVehicle); // Histórico de vendas de um veículo
router.get('/usuario/:userId', protect, admin, getSalesByUser); // Todas vendas de um usuário (admin)
router.get('/:id', protect, getSaleById);
router.put('/:id', protect, admin, updateSale); // Apenas admin pode alterar vendas

module.exports = router;