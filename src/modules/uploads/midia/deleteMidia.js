
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs').promises;

/**
 * Delete a specific image from a vehicle
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteVehicleImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { imageUrl, imageId } = req.body; // Aceitar imageId como alternativa

        // Debug logging
        console.log('Delete Vehicle Image Request:');
        console.log('- Vehicle ID:', id);
        console.log('- Image URL/ID:', imageUrl || imageId);
        console.log('- Request Body:', JSON.stringify(req.body));

        if (!id) {
            return res.status(400).json({ 
                message: 'ID do veículo é obrigatório' 
            });
        }
        
        if (!imageUrl && !imageId) {
            return res.status(400).json({ 
                message: 'URL ou ID da imagem é obrigatório', 
                receivedBody: req.body 
            });
        }


        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            include: { imagens: true }
        });

        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }

        // Check if the user is the owner of the vehicle or an admin
        // Only if we have user authentication data
        if (req.user) {
            if (req.user.role !== 'ADMIN' && vehicle.vendedorId !== req.user.id) {
                return res.status(403).json({ 
                    message: 'Você não tem permissão para remover imagens deste veículo' 
                });
            }
        } else {
            console.log('Warning: User authentication data not available - skipping permission check');
            // In production, you would want to enforce authentication
            // but for development/debugging we'll allow it to proceed
        }

        // Find the image by URL - try exact match first
        let image;

        if (imageId) {
            image = await prisma.image.findUnique({
                where: {
                    id: imageId,
                    vehicleId: id
                }
            });
        }

         if (!image && imageUrl) {
            // Try exact match first
            image = await prisma.image.findFirst({
                where: {
                    vehicleId: id,
                    url: imageUrl
                }
            });

            // If not found, try a case-insensitive contains match
            if (!image) {
                image = await prisma.image.findFirst({
                    where: {
                        vehicleId: id,
                        url: {
                            contains: imageUrl.split('/').pop(), // Try matching just the filename part
                            mode: 'insensitive'
                        }
                    }
                });
            }

            // If still not found, try matching by ends with the filename
            if (!image) {
                const filename = imageUrl.split('/').pop();
                const allImages = await prisma.image.findMany({
                    where: { vehicleId: id }
                });
                
                console.log('All vehicle images:', allImages.map(img => img.url));
                
                // Find an image whose URL ends with the same filename
                image = allImages.find(img => 
                    img.url.toLowerCase().endsWith(filename.toLowerCase())
                );
            }

            // If still not found, try finding by MongoDB ObjectId
            if (!image && /^[0-9a-fA-F]{24}$/.test(imageUrl)) {
                // If imageUrl looks like a MongoDB ObjectId, try finding by ID
                image = await prisma.image.findUnique({
                    where: {
                        id: imageUrl,
                        vehicleId: id
                    }
                });
            }
        }

        if (!image) {
            return res.status(404).json({ 
                message: 'Imagem não encontrada', 
                searchedFor: imageUrl || imageId,
                vehicleId: id
            });
        }
        console.log('Image found:', image);

        // Check if there will be at least one image remaining after deletion
        const totalImages = await prisma.image.count({
            where: { vehicleId: id }
        });

        if (totalImages <= 1) {
            return res.status(400).json({ 
                message: 'Não é possível remover todas as imagens. O veículo deve ter pelo menos uma imagem.' 
            });
        }


        // Check if the image is the main image
        if (image.isMain) {
            // Find another image to set as main
            const anotherImage = await prisma.image.findFirst({
                where: {
                    vehicleId: id,
                    id: { not: image.id }
                }
            });

            if (anotherImage) {
                // Set another image as main
                await prisma.image.update({
                    where: { id: anotherImage.id },
                    data: { isMain: true }
                });
            }
        }

        // Delete the image record from the database
        await prisma.image.delete({
            where: { id: image.id }
        });

        // Try to delete the physical file if it's stored locally
        try {
            // Extract the filename from the URL
            const urlParts = imageUrl.split('/');
            const filename = urlParts[urlParts.length - 1];
            
            // Check if it's a local file (not an external URL)
            if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                // Assuming images are stored in an uploads directory
                const uploadsDir = path.join(__dirname, '../../uploads/vehicles');
                const filePath = path.join(uploadsDir, filename);
                
                // Check if file exists before attempting to delete
                await fs.access(filePath);
                await fs.unlink(filePath);
            }
        } catch (fileError) {
            // Just log the error but continue, as the DB record is already deleted
            console.error('Erro ao remover arquivo físico:', fileError);
        }

        res.status(200).json({ 
            message: 'Imagem removida com sucesso',
            deletedImageId: image.id
        });
    } catch (error) {
        console.error('Erro ao remover imagem:', error);
        res.status(500).json({ 
            message: 'Erro ao remover imagem do veículo',
            error: error.message 
        });
    }
};

module.exports = {
    deleteVehicleImage
};