const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();



const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        // Verifica se o comentário existe e pertence ao usuário
        const existingReview = await prisma.review.findUnique({
            where: { id: reviewId }
        });

        if (!existingReview) {
            return res.status(404).json({ error: 'Comentário não encontrado' });
        }

        if (existingReview.userId !== req.user.id) {
            return res.status(403).json({ error: 'Você não tem permissão para remover este comentário' });
        }

        // Remove o comentário
        await prisma.review.delete({
            where: { id: reviewId }
        });

        res.status(204).send(); // Resposta sem conteúdo para sucesso
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    deleteReview
};