const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


const updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const addressData = req.body;

        // Primeiro verifica se o endereço pertence ao usuário
        const existingAddress = await prisma.endereco.findUnique({
        where: { id: addressId },
        select: { userId: true }
        });

        if (!existingAddress) {
        return res.status(404).json({ error: 'Endereço não encontrado' });
        }

        if (existingAddress.userId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const updatedAddress = await prisma.endereco.update({
        where: { id: addressId },
        data: addressData
        });

        res.json(updatedAddress);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    updateAddress
}