const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


const getVehicleReviews = async (req, res) => {
    try {
        const { id } = req.params;

        const reviews = await prisma.review.findMany({
        where: { vehicleId: id },
        include: {
            user: {
            select: {
                nome: true,
                avatar: true
            }
            }
        },
        orderBy: { createdAt: 'desc' }
        });

        // Calcula média de avaliações
        const avgRating = await prisma.review.aggregate({
        where: { vehicleId: id },
        _avg: { rating: true }
        });

        res.json({
        reviews,
        averageRating: avgRating._avg.rating || 0,
        totalReviews: reviews.length
        });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    getVehicleReviews
}