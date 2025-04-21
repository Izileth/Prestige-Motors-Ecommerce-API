const multer = require('multer');
const { imageStorage, videoStorage } = require('../config/cloudinary');

// Upload de imagens
const uploadImage = multer({ storage: imageStorage }).array('images', 10); // Máx. 10 imagens

// Upload de vídeos
const uploadVideo = multer({ storage: videoStorage }).single('video'); // 1 vídeo por vez

module.exports = { uploadImage, uploadVideo };