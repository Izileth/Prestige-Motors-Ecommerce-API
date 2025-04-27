const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


const createAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const addressData = req.body;

        // Verifica se o usuário está criando para si mesmo
        if (req.user.id !== id) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const address = await prisma.endereco.create({
        data: {
            ...addressData,
            userId: id
        }
        });

        res.status(201).json(address);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    createAddress
}