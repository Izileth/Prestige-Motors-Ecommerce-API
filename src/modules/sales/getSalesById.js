const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;

        const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
            vehicle: {
            select: {
                marca: true,
                modelo: true,
                anoFabricacao: true,
                imagens: {
                where: { isMain: true },
                take: 1
                }
            }
            },
            vendedor: {
            select: {
                nome: true,
                telefone: true,
                email: true
            }
            },
            comprador: {
            select: {
                nome: true,
                telefone: true,
                email: true
            }
            }
        }
        });

        if (!sale) {
        return res.status(404).json({ error: 'Venda não encontrada' });
        }

        // Verifica se o usuário tem acesso (vendedor, comprador ou admin)
        if (
        req.user.role !== 'ADMIN' &&
        req.user.id !== sale.vendedorId &&
        req.user.id !== sale.compradorId
        ) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        res.json(sale);
    } catch (error) {
        console.error('Erro em getSaleById:', error);
        res.status(error.status || 500).json({ error: error.message });
    }
};

module.exports = {
    getSaleById
}