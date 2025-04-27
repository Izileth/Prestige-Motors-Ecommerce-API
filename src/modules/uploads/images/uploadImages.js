const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const uploadImages = async (req, res) => {
    try {
        const { id } = req.params;
        const images = req.files.map(file => ({
        url: file.path,
        isMain: false,
        ordem: 0,
        vehicleId: id
        }));

        await prisma.image.createMany({ data: images });
        res.status(201).json({ success: true, images });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    uploadImages
}