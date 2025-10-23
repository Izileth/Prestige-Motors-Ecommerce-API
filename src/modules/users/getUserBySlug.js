
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getUserBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const user = await prisma.user.findUnique({
            where: {
                slug: slug
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuário', error: error.message });
    }
};

module.exports = { getUserBySlug };
