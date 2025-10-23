const express = require('express');
const router = express.Router();

const {
    createAddress,
    updateAddress,
    deleteAddress
} = require('../modules/adress/adressModule')

const {
    register,
    login,
    logout,
    resetPassword,
    forgotPassword,
    validateAndFormatFromField,
    debugEmailFrom,
    invalidateUserResetTokens
} = require('../modules/auth/authModule')

const {
    getUsers,
    getUserById,
    getUserAddresses,
    getUserStats,
    updateUser,
    deleteUser,
    uploadAvatar,
    deleteUserAvatar,
    getUserBySlug,
    updateUserSlug
} = require('../modules/users/userModule')
const { authenticate, authorize, checkSession } = require('../middleware/authMiddleware');

const { getUserStatsWithTimeout } = require('../middleware/timeoutMiddleware');
const {uploadUserAvatar} = require('../config/multer');



// Rotas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword, validateAndFormatFromField, debugEmailFrom);
router.post('/reset-password', resetPassword, invalidateUserResetTokens);

// Rotas de autenticação
router.get('/check-session', authenticate, checkSession);
router.post('/logout', authenticate, logout);

// Rotas de usuário
router.get('/', authenticate, authorize(['USER', 'ADMIN']), getUsers);
router.get('/me', authenticate, (req, res) => {
    res.json({ user: req.user });
});

router.get('/:id', authenticate, getUserById);
router.get('/slug/:slug', authenticate, getUserBySlug);
router.put('/:id', authenticate, updateUser);
router.put('/:id/slug', authenticate, updateUserSlug);
router.delete('/:id', authenticate, deleteUser);
router.get('/:id/stats', authenticate, getUserStats, getUserStatsWithTimeout);

// Rotas de endereço
router.get('/:id/addresses', authenticate, authorize(['USER', 'ADMIN']), getUserAddresses);
router.post('/:id/addresses', authenticate, authorize(['USER', 'ADMIN']), createAddress);
router.put('/addresses/:addressId', authenticate, authorize(['USER', 'ADMIN']), updateAddress);
router.delete('/addresses/:addressId', authenticate, authorize(['USER', 'ADMIN']), deleteAddress);


// Upload de avatar
router.post('/:id/avatar', authenticate, uploadUserAvatar.single('avatar'), uploadAvatar);
router.delete('/:id/avatar', authenticate, deleteUserAvatar);

module.exports = router;