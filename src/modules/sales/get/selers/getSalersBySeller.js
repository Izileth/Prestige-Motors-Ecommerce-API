
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();



const getSalesBySeller = async (req, res) => {
    try {
        const { userId } = req.params;

        // Verifica se é admin ou está acessando seus próprios dados
        if (req.user.id !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const [asSeller, asBuyer] = await Promise.all([
        // Vendas onde o usuário é vendedor
        prisma.venda.findMany({
            where: { vendedorId: userId },
            orderBy: { dataVenda: 'desc' },
            include: {
            vehicle: {
                select: {
                marca: true,
                modelo: true,
                imagens: {
                    where: { isMain: true },
                    take: 1
                }
                }
            },
            comprador: {
                select: {
                nome: true
                }
            }
            }
        }),
        // Compras onde o usuário é comprador
        prisma.venda.findMany({
            where: { compradorId: userId },
            orderBy: { dataVenda: 'desc' },
            include: {
            vehicle: {
                select: {
                marca: true,
                modelo: true,
                imagens: {
                    where: { isMain: true },
                    take: 1
                }
                }
            },
            vendedor: {
                select: {
                nome: true,
                telefone: true
                }
            }
            }
        })
        ]);

        res.json({
        comoVendedor: asSeller,
        comoComprador: asBuyer
        });
    } catch (error) {
        console.error('Erro em getSalesByUser:', error);
        res.status(500).json({ error: 'Erro ao buscar vendas do usuário' });
    }
};

module.exports = {
    getSalesBySeller
}