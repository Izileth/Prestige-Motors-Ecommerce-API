// routes/vehicleRoutes.js
const express = require('express');
const router = express.Router();

// Importação de módulos (mantém o mesmo)
const {
    createReview,
    getVehicleReviews,
    updateReview,
    deleteReview
} = require('../modules/reviews/reviewsModule');

const {
    createVehicle,
    getVehicles,
    getVehicleById,
    getVehicleBySlug,
    getUserVehicles,
    getUserFavorites,
    getUserVehicleStats,
    getVehiclesByVendor,
    getVehicleDetails,
    getVehicleFavorites,
    addFavoriteVehicle,
    removeFavoriteVehicle,
    getVehicleStats,
    updateVehicle,
    updateVehicleStatus,
    deleteVehicle,
    getVehicleAddress,
    addOrUpdateVehicleAddress,
    removeVehicleAddress
} = require('../modules/vehicles/vehicleModule');

const {uploadVehicleImages, deleteVehicleImage, uploadVehicleVideos} = require('../modules/uploads/uploadModule');

const {
    registerView,
    registerVehicleView,
    getVehicleViews,
} = require('../modules/views/viewsModule');

// Middlewares
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { uploadVehicle } = require('../config/multer'); // MUDANÇA AQUI: usar uploadVehicle
const {uploadMiddleware} = require('../middleware/uploadMiddleware');

// ================ ROTAS PÚBLICAS ================
router.get('/', getVehicles);
router.get('/stats', getVehicleStats);
router.get('/:identifier', getVehicleById);
router.get('/slug/:slug', getVehicleBySlug);
router.get('/:id/reviews', getVehicleReviews);
router.get('/:identifier/details', getVehicleDetails);
router.get('/vendors/:vendorId', getVehiclesByVendor);
router.get('/:vehicleId/address', getVehicleAddress);

// ================ ROTAS AUTENTICADAS ================

// Rota para criação de veículo com suporte para upload de imagens
router.post('/', 
    authenticate, 
    authorize(['USER', 'ADMIN']), 
    uploadVehicle.array('images', 10), // MUDANÇA AQUI: usar uploadVehicle
    uploadMiddleware,
    createVehicle
);

// Rota para upload adicional de imagens (após criação do veículo)
router.post('/:id/images', 
    authenticate, 
    authorize(['USER', 'ADMIN']),
    uploadVehicle.array('images', 10), // MUDANÇA AQUI: usar uploadVehicle
    uploadVehicleImages
);

// Rota para remover imagem específica de um veículo
router.delete('/:id/images',
    authenticate,
    authorize(['USER', 'ADMIN']),
    deleteVehicleImage
);

// Rota para upload de vídeos
router.post('/:id/videos', 
    authenticate,
    authorize(['USER', 'ADMIN']),
    uploadVehicle.single('video'), // MUDANÇA AQUI: usar uploadVehicle
    uploadVehicleVideos
);

// Outras rotas autenticadas (mantém o mesmo)
router.get('/favorites', authenticate, getVehicleFavorites);
router.post('/:id/views', registerView);
router.post('/:id/favorites', authenticate, addFavoriteVehicle);
router.post('/:id/reviews', authenticate, createReview);
router.post('/:vehicleId/address', authenticate, authorize(['USER', 'ADMIN']), addOrUpdateVehicleAddress);

// ================ ROTAS DO USUÁRIO ATUAL ================
router.get('/me/vehicles', authenticate, getUserVehicles);
router.get('/me/views', authenticate, getVehicleViews);
router.get('/me/favorites', authenticate, getUserFavorites);
router.get('/me/vehicle-stats', authenticate, getUserVehicleStats);

// ================ ROTAS DE ADMINISTRAÇÃO ================
router.put('/:id', 
    authenticate, 
    authorize(['USER', 'ADMIN']),
    uploadVehicle.array('images', 10), // MUDANÇA AQUI: usar uploadVehicle
    uploadMiddleware,
    updateVehicle
);

router.put('/:id/status', authenticate, authorize(['USER', 'ADMIN']), updateVehicleStatus);
router.put('/reviews/:reviewId', authenticate, authorize(['USER', 'ADMIN']), updateReview);
router.put('/:vehicleId/address', authenticate, authorize(['USER', 'ADMIN']), addOrUpdateVehicleAddress);
router.delete('/reviews/:reviewId', authenticate, authorize(['USER', 'ADMIN']), deleteReview);
router.delete('/:vehicleId/address', authenticate, authorize(['USER', 'ADMIN']), removeVehicleAddress);
router.delete('/:id', authenticate, authorize(['USER', 'ADMIN']), deleteVehicle);
router.delete('/:id/favorites', authenticate, removeFavoriteVehicle);

module.exports = router;