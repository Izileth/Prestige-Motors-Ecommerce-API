// config/multer.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configuração para AVATARES (upload direto para Cloudinary)
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'prestige-motors/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
        transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' }
        ],
        public_id: (req, file) => {
            const userId = req.params.id;
            console.log(`📁 Gerando public_id para usuário: ${userId}`);
            return `avatar_${userId}`;
        },
        overwrite: true
    },
});

// Configuração para VEÍCULOS (armazena em memória para processamento manual)
const vehicleStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Apenas arquivos JPEG, PNG e SVG são permitidos'), false);
    }
};

// Upload para AVATARES
const uploadAvatar = multer({
    storage: avatarStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    },
    fileFilter: fileFilter
});

// Upload para VEÍCULOS (mantém buffer para processamento manual)
const uploadVehicle = multer({
    storage: vehicleStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 10 // Permite até 10 arquivos
    },
    fileFilter: fileFilter
});

module.exports = {
    uploadAvatar,
    uploadVehicle,
    // Manter compatibilidade com código existente
    upload: uploadVehicle // Para não quebrar as rotas existentes
};