const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comentario } = req.body;

        // Verifica se o comentário existe e pertence ao usuário
        const existingReview = await prisma.review.findUnique({
            where: { id: reviewId }
        });

        if (!existingReview) {
            return res.status(404).json({ error: 'Comentário não encontrado' });
        }

        if (existingReview.userId !== req.user.id) {
            return res.status(403).json({ error: 'Você não tem permissão para editar este comentário' });
        }

        // Calcula a diferença de tempo desde a criação do comentário
        const now = new Date();
        const reviewDate = existingReview.createdAt;
        const timeDiff = now - reviewDate; // diferença em milissegundos
        const hoursDiff = timeDiff / (1000 * 60 * 60); // converte para horas

        // Define o prazo máximo para edição (24 horas)
        const MAX_EDIT_HOURS = 24;

        if (hoursDiff > MAX_EDIT_HOURS) {
            return res.status(403).json({ 
                error: 'O prazo para edição deste comentário expirou',
                details: `Comentários só podem ser editados até ${MAX_EDIT_HOURS} horas após a postagem`
            });
        }

        // Atualiza o comentário
        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                rating,
                comentario,
                updatedAt: now // Usa a data já calculada
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

        res.json(updatedReview);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    updateReview,
};