const express = require('express');
const router = express.Router();
const {
    createVehicle,
    getVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    getVehicleStats,
    getUserVehicles,
    getUserVehicleStats,
    toggleFavorite,
    getUserFavorites,
    registerView,
    getVehicleViews,
    createReview,
    getVehicleReviews,
    getVehiclesByVendor,
    updateVehicleStatus,
} = require('../controllers/vehicleController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { uploadImage, uploadVideo } = require('../middleware/uploadMiddleware');

// Rotas públicas
router.get('/', getVehicles);
router.get('/stats', getVehicleStats);
router.get('/:id', getVehicleById);
router.get('/:id/reviews', getVehicleReviews);
router.get('/vendors/:vendorId', getVehiclesByVendor);

// Rotas autenticadas
router.post('/', authenticate, authorize(['USER', 'ADMIN']), createVehicle);
router.post('/:id/views', registerView);
router.post('/:id/favorites', authenticate, toggleFavorite);
router.post('/:id/reviews', authenticate, createReview);

// Uploads (protegidos)
router.post('/:id/images', authenticate, uploadImage);
router.post('/:id/videos', authenticate, uploadVideo);

// Rotas do usuário atual
router.get('/me/vehicles', authenticate, getUserVehicles);
router.get('/me/views', authenticate, getVehicleViews);
router.get('/me/favorites', authenticate, getUserFavorites);
router.get('/me/vehicle-stats', authenticate, getUserVehicleStats);

// Rotas de administração
router.put('/:id', authenticate, authorize(['USER', 'ADMIN']), updateVehicle);
router.put('/:id/status', authenticate, authorize(['ADMIN']), updateVehicleStatus);
router.delete('/:id', authenticate, authorize(['USER', 'ADMIN']), deleteVehicle);

module.exports = router;