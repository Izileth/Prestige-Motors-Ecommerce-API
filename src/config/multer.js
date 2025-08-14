const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const cloudinary = require('cloudinary').v2;


const storage = new CloudinaryStorage({
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
        overwrite: true // Substitui avatar anterior automaticamente
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Apenas arquivos JPEG, PNG e SVG são permitidos'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        // Removido o limite de files: 1 para permitir múltiplos arquivos
    },
    preservePath: true,
    fileFilter: fileFilter
});

module.exports = upload; // Exportando como CommonJS