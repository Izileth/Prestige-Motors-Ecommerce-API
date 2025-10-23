
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const slugify = require('slugify');

const updateUserSlug = async (req, res) => {
    try {
        const { id } = req.params;
        const { slug } = req.body;

        if (!slug) {
            return res.status(400).json({ message: 'O novo slug é obrigatório' });
        }

        const newSlug = slugify(slug, { lower: true, strict: true });

        const existingUser = await prisma.user.findFirst({
            where: {
                slug: newSlug,
                id: {
                    not: id
                }
            }
        });

        if (existingUser) {
            return res.status(409).json({ message: 'Este slug já está em uso' });
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: id
            },
            data: {
                slug: newSlug
            }
        });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar o slug do usuário', error: error.message });
    }
};

module.exports = { updateUserSlug };
