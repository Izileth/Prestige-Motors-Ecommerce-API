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
    getVehicleFavorites,
    registerView,
    getVehicleViews,
    createReview,
    getVehicleReviews,
    updateVehicleStatus,
    getVehiclesByVendor
} = require('../controllers/vehicleController');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadImage, uploadVideo } = require('../middleware/uploadMiddleware');

// Rotas públicas
router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.get('/stats', getVehicleStats);
router.get('/vendedor/:vendorId', getVehiclesByVendor); // Nova
router.get('/:id/avaliacoes', getVehicleReviews); // Nova

// Rotas autenticadas
router.post('/', protect, createVehicle);
router.post('/:id/images', protect, uploadImage);
router.post('/:id/video', protect, uploadVideo, uploadVideo);
router.post('/:id/visualizacao', registerView); // Nova
router.post('/:id/favorito', protect, toggleFavorite); // Nova
router.post('/:id/avaliar', protect, createReview); // Nova


// Rotas de usuário específico
router.get('/meus/veiculos', protect, getUserVehicles);
router.get('/meus/visuzalizacoes', protect, getVehicleViews);
router.get('/meus/favoritos', protect, getVehicleFavorites); // Nova
router.get('/meus/stats', protect, getUserVehicleStats);

// Rotas de admin/vendedor
router.put('/:id', protect, updateVehicle);
router.put('/:id/status', protect, updateVehicleStatus); // Nova
router.delete('/:id', protect, deleteVehicle);

module.exports = router;