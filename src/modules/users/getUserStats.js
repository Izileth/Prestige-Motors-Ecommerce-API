
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Cache em memória para estatísticas
const statsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Limpeza de cache expirado
const clearExpiredCache = () => {
    const now = Date.now();
    for (const [key, value] of statsCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            statsCache.delete(key);
        }
    }
};
setInterval(clearExpiredCache, 10 * 60 * 1000);

// Tratamento de erros do Prisma
function handlePrismaError(error, res) {
    console.error('Erro do Prisma:', error);
    if (res.headersSent) return;

    const errorMap = {
        'P2002': { status: 400, message: 'Violação de unicidade' },
        'P2025': { status: 404, message: 'Registro não encontrado' },
        'P1001': { status: 500, message: 'Erro de conexão com banco de dados' },
    };
    const errorResponse = errorMap[error.code] || { status: 400, message: `Erro do Prisma: ${error.message}` };
    
    return res.status(errorResponse.status).json({ message: errorResponse.message, code: error.code });
}

// Funções de Estatísticas Adicionais
const getAdditionalStats = async (userId) => {
    const [
        vehicleTimeline, 
        priceDistribution, 
        brandDistribution, 
        statusDistribution, 
        categoryDistribution,
        salesStats,
        negotiationStats
    ] = await Promise.all([
        // Timeline de Veículos
        prisma.vehicle.groupBy({ by: ['createdAt'], where: { vendedorId: userId }, _count: { id: true }, orderBy: { createdAt: 'asc' } }),
        // Distribuição de Preços
        prisma.vehicle.groupBy({ by: ['preco'], where: { vendedorId: userId }, _count: { id: true } }),
        // Distribuição de Marcas
        prisma.vehicle.groupBy({ by: ['marca'], where: { vendedorId: userId }, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
        // Distribuição de Status
        prisma.vehicle.groupBy({ by: ['status'], where: { vendedorId: userId }, _count: { id: true } }),
        // Distribuição de Categoria
        prisma.vehicle.groupBy({ by: ['categoria'], where: { vendedorId: userId }, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
        // Estatísticas de Vendas
        prisma.sale.aggregate({ where: { vendedorId: userId }, _sum: { precoVenda: true }, _count: { id: true } }),
        // Estatísticas de Negociações
        prisma.negociations.aggregate({ where: { vendedorId: userId }, _count: { id: true } }),
    ]);

    return {
        vehicleTimeline,
        priceDistribution,
        brandDistribution,
        statusDistribution,
        categoryDistribution,
        salesStats: {
            totalSalesValue: salesStats._sum.precoVenda || 0,
            totalVehiclesSold: salesStats._count.id || 0,
        },
        negotiationStats: {
            totalNegotiations: negotiationStats._count.id || 0,
        },
    };
};

const getUserStats = async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `user_stats_${id}`;
        
        const cached = statsCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return res.json(cached.data);
        }

        if (!id || typeof id !== 'string') return res.status(400).json({ message: 'ID inválido' });
        if (!req.user || !req.user.id) return res.status(401).json({ message: 'Usuário não autenticado' });

        if (req.user.id !== id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        const [userExists, totalVehicles, vehicleStats, additionalStats] = await Promise.all([
            prisma.user.findUnique({ where: { id }, select: { id: true } }),
            prisma.vehicle.count({ where: { vendedorId: id } }),
            prisma.vehicle.aggregate({
                where: { vendedorId: id },
                _sum: { preco: true },
                _avg: { preco: true, anoFabricacao: true, anoModelo: true },
                _min: { preco: true },
                _max: { preco: true },
            }),
            getAdditionalStats(id),
        ]);

        if (!userExists) return res.status(404).json({ message: 'Usuário não encontrado' });

        const response = {
            totalVehicles: totalVehicles || 0,
            valorTotalInventario: vehicleStats._sum?.preco || 0,
            precoMedio: vehicleStats._avg?.preco || 0,
            anoFabricacaoMedio: Math.round(vehicleStats._avg?.anoFabricacao || 0),
            anoModeloMedio: Math.round(vehicleStats._avg?.anoModelo || 0),
            precoMinimo: vehicleStats._min?.preco || 0,
            precoMaximo: vehicleStats._max?.preco || 0,
            ...additionalStats,
        };

        statsCache.set(cacheKey, { data: response, timestamp: Date.now() });
        if (!res.headersSent) res.json(response);

    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    getUserStats,
};
