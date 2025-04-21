const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuração do armazenamento para imagens
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: `${process.env.CLOUDINARY_FOLDER}/images`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, crop: 'scale', quality: 'auto' }],
  },
});

// Configuração do armazenamento para vídeos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: `${process.env.CLOUDINARY_FOLDER}/videos`,
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'webm'],
    transformation: [{ width: 1280, crop: 'scale', quality: 'auto' }],
  },
});

module.exports = { cloudinary, imageStorage, videoStorage };