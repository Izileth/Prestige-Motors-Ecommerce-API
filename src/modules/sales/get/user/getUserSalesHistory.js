const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getUserSalesHistory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se o usuário está acessando suas próprias vendas ou é admin
        if (req.user.id !== id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const sales = await prisma.venda.findMany({
        where: { vendedorId: id },
        include: {
            vehicle: {
            select: {
                marca: true,
                modelo: true,
                anoFabricacao: true
            }
            },
            comprador: {
            select: {
                nome: true,
                email: true
            }
            }
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