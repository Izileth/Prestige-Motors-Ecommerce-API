const { PrismaClient } = require('@prisma/client');
const { Prisma } = require('@prisma/client');

const prisma = new PrismaClient();
const handlePrismaError = (error, res) => {
    console.error('Erro Prisma:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Erro conhecido do Prisma
        switch (error.code) {
            case 'P2002': // Violação de unicidade
                return res.status(409).json({ message: 'Conflito: registro com este valor já existe.' });
            case 'P2025': // Registro não encontrado
                return res.status(404).json({ message: 'Registro não encontrado.' });
            case 'P2003': // Violação de chave estrangeira
                return res.status(400).json({ message: 'Referência inválida.' });
            default:
                return res.status(400).json({ message: `Erro na requisição: ${error.code}` });
        }
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        // Erro de validação
        return res.status(400).json({ message: 'Dados inválidos fornecidos.' });
    }
    
    // Erro genérico
    return res.status(500).json({ message: 'Erro no servidor' });
};

const getUserVehicleStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Período (últimos 30 dias por padrão)
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        
        // Estatísticas de visualizações
        const viewStats = await prisma.$transaction([
            // Estatísticas agregadas dos veículos
            prisma.vehicle.aggregate({
                where: { 
                    vendedorId: userId 
                },
                _sum: { 
                    visualizacoes: true,
                    preco: true
                },
                _avg: {
                    preco: true,
                    quilometragem: true
                },
                _count: {
                    _all: true
                }
            }),
            
            // Top 5 veículos mais visualizados
            prisma.vehicle.findMany({
                where: { 
                    vendedorId: userId 
                },
                orderBy: { 
                    visualizacoes: 'desc' 
                },
                take: 5,
                select: {
                    id: true,
                    marca: true,
                    modelo: true,
                    anoFabricacao: true,
                    anoModelo: true,
                    preco: true,
                    precoPromocional: true,
                    visualizacoes: true,
                    status: true,
                    imagens: {
                        where: { isMain: true },
                        take: 1,
                        select: { url: true }
                    }
                }
            }),
            
            // Visualizações detalhadas por período
            prisma.viewLog.groupBy({
                by: ['createdAt'],
                where: {
                    vehicle: {
                        vendedorId: userId
                    },
                    createdAt: {
                        gte: startDate
                    }
                },
                _count: {
                    _all: true
                },
                orderBy: {
                    createdAt: 'asc'
                }
            }),
            
            // Total de favoritos
            prisma.favorites.count({
                where: {
                    vehicle: {
                        vendedorId: userId
                    }
                }
            }),
            
            // Distribuição por status
            prisma.vehicle.groupBy({
                by: ['status'],
                where: {
                    vendedorId: userId
                },
                _count: {
                    _all: true
                }
            })
        ]);
        
        // Formatar dados de visualizações por dia
        const viewsByDayMap = new Map();
        viewStats[2].forEach(item => {
            const dateStr = item.createdAt.toISOString().split('T')[0];
            viewsByDayMap.set(dateStr, (viewsByDayMap.get(dateStr) || 0) + item._count._all);
        });
        
        // Converter para array ordenado
        const viewsByDay = Array.from(viewsByDayMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Formatar distribuição por status
        const statusDistribution = viewStats[4].reduce((acc, curr) => {
            acc[curr.status] = curr._count._all;
            return acc;
        }, {});
        
        // Resposta completa alinhada com o schema
        res.json({
            summary: {
                totalVehicles: viewStats[0]._count._all || 0,
                totalViews: viewStats[0]._sum.visualizacoes || 0,
                totalValue: viewStats[0]._sum.preco || 0,
                averagePrice: viewStats[0]._avg.preco || 0,
                averageMileage: viewStats[0]._avg.quilometragem || 0,
                totalFavorites: viewStats[3] || 0,
                statusDistribution
            },
            topPerformers: viewStats[1].map(vehicle => ({
                ...vehicle,
                mainImage: vehicle.imagens[0]?.url || null
            })),
            viewsTrend: viewsByDay,
            timeRange: {
                start: startDate.toISOString(),
                end: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error in getUserVehicleStats:', error);
        handlePrismaError(error, res);
    }
};

module.exports = {
    getUserVehicleStats
}