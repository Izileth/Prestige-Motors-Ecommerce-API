const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const uploadVideos = async (req, res) => {
    try {
        const { id } = req.params;
        const video = await prisma.video.create({
        data: {
            url: req.file.path,
            isMain: true,
            vehicleId: id
        }
        });
        res.status(201).json({ success: true, video });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    uploadVideos
}