
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadImages } = require('../../../services/uploadService');

/**
 * Upload de imagens adicionais para um veículo existente
 */
const uploadVehicleImages = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Verificar se o veículo existe
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            include: {
                imagens: {
                    orderBy: { ordem: 'asc' }
                }
            }
        });
        
        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }
        
        // Verificar permissão (apenas o vendedor ou admin)
        if (vehicle.vendedorId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Sem permissão para modificar este veículo' });
        }
        
        // Verificar se há arquivos para upload
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Nenhuma imagem enviada' });
        }
        
        // Fazer upload das novas imagens
        const uploadedImages = await uploadImages(req.files);
        
        // Obter a maior ordem atual
        const maxOrdem = vehicle.imagens.length > 0 
            ? Math.max(...vehicle.imagens.map(img => img.ordem || 0)) 
            : -1;
        
        // Criar registros de imagens para o veículo
        const imagensInfo = uploadedImages.map((img, index) => ({
            url: img.secure_url,
            publicId: img.public_id,
            isMain: vehicle.imagens.length === 0 && index === 0, // Primeira imagem como principal apenas se não houver outras
            ordem: maxOrdem + 1 + index
        }));
        
        // Salvar as imagens no banco de dados


        const newImages = await prisma.image.createMany({
            data: imagensInfo.map(img => ({
                url: img.url,
                isMain: img.isMain,
                ordem: img.ordem,
                vehicleId: id
            }))
        });
        
        // Buscar as imagens atualizadas
        const updatedVehicle = await prisma.vehicle.findUnique({
            where: { id },
            include: {
                imagens: {
                    orderBy: { ordem: 'asc' }
                }
            }
        });
        
        res.status(201).json({
            message: 'Imagens adicionadas com sucesso',
            addedCount: newImages.count,
            imagens: updatedVehicle.imagens
        });
        
    } catch (error) {
        console.error('Erro ao fazer upload de imagens:', error);
        res.status(500).json({ 
            message: 'Erro ao processar upload de imagens',
            error: error.message
        });
    }
};

/**
 * Upload de vídeos para um veículo existente
 */
const uploadVehicleVideos = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Verificar se o veículo existe
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
        });
        
        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }
        
        // Verificar permissão (apenas o vendedor ou admin)
        if (vehicle.vendedorId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Sem permissão para modificar este veículo' });
        }
        
        // Verificar se há um arquivo para upload
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum vídeo enviado' });
        }
        
        // Configuração para upload de vídeo
        const videoUpload = await cloudinary.uploader.upload_stream(
            {
                resource_type: 'video',
                folder: 'prestige-motors/videos',
                eager: [
                    { width: 300, height: 300, crop: "pad", audio_codec: "none" },
                    { width: 160, height: 100, crop: "crop", gravity: "south", audio_codec: "none" }
                ],
                eager_async: true,
                eager_notification_url: "https://seu-dominio.com/api/cloudinary-callback"
            },
            async (error, result) => {
                if (error) {
                    console.error('Erro no upload do vídeo:', error);
                    return res.status(500).json({ message: 'Erro ao processar vídeo', error: error.message });
                }
                
                try {
                    // Adicionar URL do vídeo ao veículo
                    await prisma.vehicleVideo.create({
                        data: {
                            url: result.secure_url,
                            publicId: result.public_id,
                            vehicleId: id
                        }
                    });
                    
                    // Buscar o veículo atualizado com vídeos
                    const updatedVehicle = await prisma.vehicle.findUnique({
                        where: { id },
                        include: {
                            videos: true
                        }
                    });
                    
                    res.status(201).json({
                        message: 'Vídeo adicionado com sucesso',
                        videos: updatedVehicle.videos
                    });
                } catch (dbError) {
                    console.error('Erro ao salvar vídeo no banco:', dbError);
                    res.status(500).json({ message: 'Erro ao salvar vídeo', error: dbError.message });
                }
            }
        ).end(req.file.buffer);
        
    } catch (error) {
        console.error('Erro no processamento de vídeo:', error);
        res.status(500).json({ 
            message: 'Erro ao processar upload de vídeo',
            error: error.message
        });
    }
};

module.exports = {
    // Exporte junto com os outros métodos existentes
    uploadVehicleImages,
    uploadVehicleVideos
};