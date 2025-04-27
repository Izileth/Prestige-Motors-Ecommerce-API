const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient()

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar primeiro se o usuário existe
        const userExists = await prisma.user.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!userExists) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Excluir todos os veículos associados primeiro
        await prisma.vehicle.deleteMany({
            where: { vendedorId: id }
        });

        // Agora excluir o usuário
        await prisma.user.delete({
            where: { id }
        });

        res.json({ message: 'Usuário removido com sucesso' });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    deleteUser
}