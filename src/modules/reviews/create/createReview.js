const { PrismaClient } = require('@prisma/client');
const { Prisma } = require('@prisma/client');

const prisma = new PrismaClient();


const createReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comentario } = req.body;

        const review = await prisma.avaliacao.create({
        data: {
            vehicleId: id,
            userId: req.user.id,
            rating,
            comentario
        },
        include: {
            user: {
            select: {
                nome: true,
                avatar: true
            }
            }
        }
        });

        res.status(201).json(review);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    createReview
}