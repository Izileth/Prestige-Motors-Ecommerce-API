const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getUserNegotiations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 20 } = req.query;

        // Verificação básica de autorização
        if (!userId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        // Configuração da paginação
        const parsedPage = Math.max(1, parseInt(page));
        const parsedLimit = Math.min(Math.max(1, parseInt(limit)), 100);
        const skip = (parsedPage - 1) * parsedLimit;

        // Filtro base
        const whereClause = {
            OR: [
                { compradorId: userId },
                { vendedorId: userId }
            ],
            ...(status && { status })
        };

        // Consulta unificada com Promise.all
        const [negotiations, total] = await Promise.all([
            // Negociações
            prisma.negociations.findMany({
                where: whereClause,
                select: {
                    id: true,
                    status: true,
                    precoOfertado: true,
                    precoNegociado: true,
                    createdAt: true,
                    updatedAt: true,
                    comprador: { select: { nome: true, avatar: true } },
                    vendedor: { select: { nome: true, avatar: true } },
                    vehicle: {
                        select: {
                            id: true,
                            marca: true,
                            modelo: true,
                            anoFabricacao: true,
                            preco: true,
                            imagens: { 
                                where: { isMain: true },
                                take: 1,
                                select: { url: true }
                            }
                        }
                    },
                    _count: { select: { mensagens: true } }
                },
                orderBy: { updatedAt: 'desc' },
                take: parsedLimit,
                skip
            }),
            
            // Contagem total
            prisma.negociations.count({ where: whereClause })
        ]);

        // Formatação simplificada da resposta
        const formattedNegotiations = negotiations.map(negotiation => ({
            ...negotiation,
            vehicle: {
                ...negotiation.vehicle,
                mainImage: negotiation.vehicle.imagens[0]?.url || null
            },
            // Remover arrays internos desnecessários
            _count: negotiation._count.mensagens
        }));

        // Remover o array de imagens do objeto vehicle
        formattedNegotiations.forEach(n => delete n.vehicle.imagens);

        res.json({
            data: formattedNegotiations,
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                total,
                totalPages: Math.ceil(total / parsedLimit)
            }
        });

    } catch (error) {
        console.error('Error in getUserNegotiations:', error);
        res.status(500).json({ 
            error: 'Erro ao buscar negociações',
            ...(process.env.NODE_ENV === 'development' && {
                details: error.message
            })
        });
    }
};

module.exports = {
    getUserNegotiations
}