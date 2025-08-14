const cloudinary = require('cloudinary').v2;

// Configuração do Cloudinary
cloudinary.config({
    cloud_name: 'dr24wlfn1',
    api_key: '821555882394182',
    api_secret: 'ZLE7xiB7Ip5hu1y16zSHcnThnGw'
});

// Função para fazer upload de uma única imagem (adaptada para buffer do Multer)
const uploadImage = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
        {
            resource_type: 'image',
            folder: 'prestige-motors',
        },
        (error, result) => {
            if (error) reject(error);
            else resolve(result);
        }
        ).end(fileBuffer);
    });
};

// ADICIONE ESTAS FUNÇÕES PARA AVATAR:

// Função específica para upload de avatar
const uploadAvatar = (fileBuffer, userId) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
        {
            resource_type: 'image',
            folder: 'prestige-motors/avatars', // Pasta específica para avatars
            public_id: `avatar_${userId}`, // Nome único baseado no ID do usuário
            transformation: [
                { width: 300, height: 300, crop: 'fill', gravity: 'face' }, // Redimensiona para 300x300 focando no rosto
                { quality: 'auto:good' } // Otimização automática
            ],
            overwrite: true // Substitui o avatar anterior automaticamente
        },
        (error, result) => {
            if (error) reject(error);
            else resolve(result);
        }
        ).end(fileBuffer);
    });
};

// Função para deletar avatar específico
const deleteAvatar = async (userId) => {
    try {
        const publicId = `prestige-motors/avatars/avatar_${userId}`;
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Erro ao deletar avatar:', error);
        throw error;
    }
};

const uploadImages = async (files) => {
    const uploadPromises = files.map(file => uploadImage(file.buffer));
    return Promise.all(uploadPromises);
};

const deleteImages = async (publicIds) => {
    if (!publicIds || publicIds.length === 0) {
        console.warn('Nenhum public_id fornecido para deleção');
        return { deleted: {} };
    }

    try {
        // Cloudinary aceita até 100 public_ids por requisição
        const chunkSize = 100;
        const results = [];
        
        for (let i = 0; i < publicIds.length; i += chunkSize) {
        const chunk = publicIds.slice(i, i + chunkSize);
        const result = await cloudinary.api.delete_resources(chunk);
        results.push(result);
        }

        return results;
    } catch (error) {
        console.error('Erro detalhado no Cloudinary:', {
        error: error.message,
        publicIdsEnviados: publicIds
        });
        throw error;
    }
};

module.exports = { 
    uploadImage,
    uploadImages,
    deleteImages,
    uploadAvatar,    // ADICIONE ESTA LINHA
    deleteAvatar     // ADICIONE ESTA LINHA
};