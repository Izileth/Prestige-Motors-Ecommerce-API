const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getUserSalesHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (req.user.id !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const sales = await prisma.sale.findMany({
            where: { vendedorId: userId },
            include: {
                vehicle: { select: { marca: true, modelo: true, anoFabricacao: true } },
                comprador: { select: { nome: true, email: true } }
            },
            orderBy: { dataVenda: 'desc' }
        });

        res.json(sales);
    } catch (error) {
        handlePrismaError(error, res);
    }
};
module.exports = {
    getUserSalesHistory
}