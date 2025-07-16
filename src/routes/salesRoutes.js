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
    getUserSalesStats,
    getUserTransactions
} = require('../modules/sales/salesModule');



const { authenticate, authorize } = require('../middleware/authMiddleware');

// Rotas autenticadas
router.get('/stats', authenticate, authorize(['USER', 'ADMIN']), getSalesStats);
router.post('/', authenticate, authorize(['USER', 'ADMIN']), createSale);
router.get('/:id', authenticate, getSaleById);
router.put('/:id', authenticate, authorize(['ADMIN', 'USER']), updateSale);

// Históricos
router.get('/vehicles/:vehicleId', authenticate, getSalesByVehicle);

// Rota Para Estatísticas específicas do usuário
router.get('/:userId/stats', authenticate, authorize(['USER', 'ADMIN']), getUserSalesStats);

// Rota para histórico (se for diferente das stats)
router.get('/:userId/history', authenticate, getUserSalesHistory);

// Transações do usuário
router.get('/transactions/:userId', authenticate, getUserTransactions);

// Compras e vendas específicas
router.get('/buyers/:userId', authenticate, getPurchasesByUser);
router.get('/sellers/:userId', authenticate, authorize(['USER', 'ADMIN']), getSalesBySeller);

module.exports = router;