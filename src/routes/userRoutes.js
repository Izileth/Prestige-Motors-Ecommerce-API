const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserStats,
    // Verifique se estas funções existem no controller:
    getUserAddresses, // ← Provavelmente essa é a função faltando
    createAddress,
    updateAddress,
    getUserSales,
    getUserPurchases
} = require('../controllers/userController'); // ← Confirme o caminho
const { protect, admin } = require('../middleware/authMiddleware');

// Rotas públicas
router.post('/register', register);
router.post('/login', login);

// Rotas protegidas
router.get('/', protect, admin, getUsers);
router.get('/:id', protect, getUserById);
router.get('/:id/enderecos', protect, getUserAddresses); // Nova
router.get('/:id/vendas', protect, getUserSales); // Nova (como vendedor)
router.get('/:id/compras', protect, getUserPurchases); // Nova (como comprador)
router.put('/:id', protect, updateUser);
router.post('/:id/enderecos', protect, createAddress); // Nova
router.put('/:id/enderecos/:addressId', protect, updateAddress); // Nova
router.delete('/:id', protect, deleteUser);
router.get('/:id/stats', protect, getUserStats);

module.exports = router;