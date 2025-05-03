const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getSalesStats = async (req, res) => {
    try {
        // 1. Estatísticas básicas
        const totalSales = await prisma.venda.count();
        const revenueStats = await prisma.venda.aggregate({
        _sum: { precoVenda: true },
        _avg: { precoVenda: true },
        _min: { precoVenda: true },
        _max: { precoVenda: true }
        });

        // 2. Vendas por método de pagamento
        const salesByPayment = await prisma.venda.groupBy({
        by: ['formaPagamento'],
        _count: { _all: true },
        _sum: { precoVenda: true }
        });

        // 3. Vendas por status (se tivesse status)
        const salesByStatus = await prisma.venda.groupBy({
        by: ['status'],  // Campo agora existe
        _count: { _all: true }
        });

        // 4. Vendas mensais (últimos 12 meses)
        const currentDate = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const monthlySales = await prisma.venda.groupBy({
        by: ['dataVenda'],
        where: {
            dataVenda: {
            gte: twelveMonthsAgo,
            lte: currentDate
            }
        },
        _count: { _all: true },
        _sum: { precoVenda: true }
        });

        // Formatar dados mensais
        const formattedMonthlySales = monthlySales.map(sale => ({
        month: sale.dataVenda.toISOString().slice(0, 7), // Formato YYYY-MM
        count: sale._count._all,
        total: sale._sum.precoVenda
        }));

        // 5. Vendas por categoria de veículo
        const salesByCategory = await prisma.venda.groupBy({
            by: ['categoriaVeiculo'],  // Campo direto
            _count: { _all: true },
            _sum: { precoVenda: true }
        });

        // 6. Top vendedores
        const topSellers = await prisma.venda.groupBy({
        by: ['vendedorId'],
        _count: { _all: true },
        _sum: { precoVenda: true },
        orderBy: {
            _sum: {
            precoVenda: 'desc'
            }
        },
        take: 5
        });

        // Formatar resposta
        const stats = {
        totals: {
            sales: totalSales,
            revenue: revenueStats._sum.precoVenda || 0,
            averageSale: revenueStats._avg.precoVenda || 0,
            minSale: revenueStats._min.precoVenda || 0,
            maxSale: revenueStats._max.precoVenda || 0
        },
        byPaymentMethod: salesByPayment.reduce((acc, item) => {
            acc[item.formaPagamento] = {
            count: item._count._all,
            total: item._sum.precoVenda
            };
            return acc;
        }, {}),
        byStatus: salesByStatus.reduce((acc, item) => {
            acc[item.status] = item._count._all;
            return acc;
        }, {}),
        monthlySales: formattedMonthlySales,
        byVehicleCategory: salesByCategory.reduce((acc, item) => {
            acc[item['vehicle.categoria']] = {
            count: item._count._all,
            total: item._sum.precoVenda
            };
            return acc;
        }, {}),
        topSellers: await Promise.all(topSellers.map(async seller => {
            const user = await prisma.user.findUnique({
            where: { id: seller.vendedorId },
            select: { nome: true, email: true }
            });
            return {
            seller: user,
            salesCount: seller._count._all,
            totalRevenue: seller._sum.precoVenda
            };
        }))
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching sales stats:', error);
        res.status(500).json({ error: 'Failed to fetch sales statistics' });
    }
};


module.exports = {
    getSalesStats
}