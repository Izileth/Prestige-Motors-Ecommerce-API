const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserStats,
    getUserAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    uploadAvatar
} = require('../controllers/userController');
const { authenticate, authorize, checkSession } = require('../middleware/authMiddleware');

// Rotas públicas
router.post('/register', register);
router.post('/login', login);

// Rotas de autenticação
router.get('/check-session', authenticate, checkSession);
router.post('/logout', authenticate, logout);

// Rotas de usuário
router.get('/', authenticate, authorize(['ADMIN']), getUsers);
router.get('/me', authenticate, (req, res) => {
    // Rota conveniente para pegar os dados do usuário logado
    res.json({ user: req.user });
});
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, deleteUser);
router.get('/:id/stats', authenticate, getUserStats);

// Rotas de endereço
router.get('/:id/addresses', authenticate, authorize(['USER', 'ADMIN']), getUserAddresses);
router.post('/:id/addresses', authenticate, authorize(['USER', 'ADMIN']), createAddress);
router.put('/addresses/:addressId', authenticate, authorize(['USER', 'ADMIN']), updateAddress);
router.delete('/addresses/:addressId', authenticate, authorize(['USER', 'ADMIN']), deleteAddress);


// Upload de avatar
router.post('/:id/avatar', authenticate, uploadAvatar);

module.exports = router;