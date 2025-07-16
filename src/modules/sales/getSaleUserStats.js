const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getUserSalesStats = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Verificar se o usuário existe
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, nome: true, email: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // 1. Estatísticas básicas do usuário como vendedor
        const userSalesStats = await prisma.sale.aggregate({
            where: { vendedorId: userId },
            _count: { _all: true },
            _sum: { precoVenda: true },
            _avg: { precoVenda: true },
            _min: { precoVenda: true },
            _max: { precoVenda: true }
        });

        // 2. Estatísticas básicas do usuário como comprador
        const userPurchasesStats = await prisma.sale.aggregate({
            where: { compradorId: userId },
            _count: { _all: true },
            _sum: { precoVenda: true },
            _avg: { precoVenda: true },
            _min: { precoVenda: true },
            _max: { precoVenda: true }
        });

        // 3. Vendas por método de pagamento (como vendedor)
        const salesByPayment = await prisma.sale.groupBy({
            where: { vendedorId: userId },
            by: ['formaPagamento'],
            _count: { _all: true },
            _sum: { precoVenda: true }
        });

        // 4. Compras por método de pagamento (como comprador)
        const purchasesByPayment = await prisma.sale.groupBy({
            where: { compradorId: userId },
            by: ['formaPagamento'],
            _count: { _all: true },
            _sum: { precoVenda: true }
        });

        // 5. Vendas por status (como vendedor)
        const salesByStatus = await prisma.sale.groupBy({
            where: { vendedorId: userId },
            by: ['status'],
            _count: { _all: true }
        });

        // 6. Compras por status (como comprador)
        const purchasesByStatus = await prisma.sale.groupBy({
            where: { compradorId: userId },
            by: ['status'],
            _count: { _all: true }
        });

        // 7. Vendas mensais do usuário (últimos 12 meses)
        const currentDate = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const userMonthlySales = await prisma.sale.groupBy({
            where: {
                vendedorId: userId,
                dataVenda: {
                    gte: twelveMonthsAgo,
                    lte: currentDate
                }
            },
            by: ['dataVenda'],
            _count: { _all: true },
            _sum: { precoVenda: true }
        });

        // 8. Compras mensais do usuário (últimos 12 meses)
        const userMonthlyPurchases = await prisma.sale.groupBy({
            where: {
                compradorId: userId,
                dataVenda: {
                    gte: twelveMonthsAgo,
                    lte: currentDate
                }
            },
            by: ['dataVenda'],
            _count: { _all: true },
            _sum: { precoVenda: true }
        });

        // 9. Vendas por categoria de veículo (como vendedor)
        const salesByCategory = await prisma.sale.groupBy({
            where: { vendedorId: userId },
            by: ['categoriaVeiculo'],
            _count: { _all: true },
            _sum: { precoVenda: true }
        });

        // 10. Compras por categoria de veículo (como comprador)
        const purchasesByCategory = await prisma.sale.groupBy({
            where: { compradorId: userId },
            by: ['categoriaVeiculo'],
            _count: { _all: true },
            _sum: { precoVenda: true }
        });

        // 11. Últimas vendas do usuário
        const recentSales = await prisma.sale.findMany({
            where: { vendedorId: userId },
            orderBy: { dataVenda: 'desc' },
            take: 5,
            include: {
                comprador: {
                    select: { nome: true, email: true }
                }
            }
        });

        // 12. Últimas compras do usuário
        const recentPurchases = await prisma.sale.findMany({
            where: { compradorId: userId },
            orderBy: { dataVenda: 'desc' },
            take: 5,
            include: {
                vendedor: {
                    select: { nome: true, email: true }
                }
            }
        });

        // 13. Ranking do usuário (posição entre vendedores)
        const allSellersRanking = await prisma.sale.groupBy({
            by: ['vendedorId'],
            _sum: { precoVenda: true },
            _count: { _all: true },
            orderBy: {
                _sum: {
                    precoVenda: 'desc'
                }
            }
        });

        const userRanking = allSellersRanking.findIndex(seller => seller.vendedorId === userId) + 1;

        // Formatar dados mensais
        const formattedMonthlySales = userMonthlySales.map(sale => ({
            month: sale.dataVenda.toISOString().slice(0, 7),
            count: sale._count._all,
            total: sale._sum.precoVenda
        }));

        const formattedMonthlyPurchases = userMonthlyPurchases.map(purchase => ({
            month: purchase.dataVenda.toISOString().slice(0, 7),
            count: purchase._count._all,
            total: purchase._sum.precoVenda
        }));

        // Formatar resposta
        const stats = {
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email
            },
            asSeller: {
                totals: {
                    sales: userSalesStats._count._all || 0,
                    revenue: userSalesStats._sum.precoVenda || 0,
                    averageSale: userSalesStats._avg.precoVenda || 0,
                    minSale: userSalesStats._min.precoVenda || 0,
                    maxSale: userSalesStats._max.precoVenda || 0
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
                    acc[item.categoriaVeiculo] = {
                        count: item._count._all,
                        total: item._sum.precoVenda
                    };
                    return acc;
                }, {}),
                recentSales: recentSales.map(sale => ({
                    id: sale.id,
                    precoVenda: sale.precoVenda,
                    dataVenda: sale.dataVenda,
                    status: sale.status,
                    formaPagamento: sale.formaPagamento,
                    categoriaVeiculo: sale.categoriaVeiculo,
                    comprador: sale.comprador
                })),
                ranking: {
                    position: userRanking,
                    totalSellers: allSellersRanking.length
                }
            },
            asBuyer: {
                totals: {
                    purchases: userPurchasesStats._count._all || 0,
                    spent: userPurchasesStats._sum.precoVenda || 0,
                    averagePurchase: userPurchasesStats._avg.precoVenda || 0,
                    minPurchase: userPurchasesStats._min.precoVenda || 0,
                    maxPurchase: userPurchasesStats._max.precoVenda || 0
                },
                byPaymentMethod: purchasesByPayment.reduce((acc, item) => {
                    acc[item.formaPagamento] = {
                        count: item._count._all,
                        total: item._sum.precoVenda
                    };
                    return acc;
                }, {}),
                byStatus: purchasesByStatus.reduce((acc, item) => {
                    acc[item.status] = item._count._all;
                    return acc;
                }, {}),
                monthlyPurchases: formattedMonthlyPurchases,
                byVehicleCategory: purchasesByCategory.reduce((acc, item) => {
                    acc[item.categoriaVeiculo] = {
                        count: item._count._all,
                        total: item._sum.precoVenda
                    };
                    return acc;
                }, {}),
                recentPurchases: recentPurchases.map(purchase => ({
                    id: purchase.id,
                    precoVenda: purchase.precoVenda,
                    dataVenda: purchase.dataVenda,
                    status: purchase.status,
                    formaPagamento: purchase.formaPagamento,
                    categoriaVeiculo: purchase.categoriaVeiculo,
                    vendedor: purchase.vendedor
                }))
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching user sales stats:', error);
        res.status(500).json({ error: 'Failed to fetch user sales statistics' });
    }
};

module.exports = {
    getUserSalesStats
};