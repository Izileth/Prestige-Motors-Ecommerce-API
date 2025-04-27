

const { PrismaClient, Prisma } = require('@prisma/client');
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

/**
 * Obtém a lista de veículos favoritos do usuário
 */
const getVehicleFavorites = async (req, res) => {
    try {

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        
        const { page = 1, limit = 10, startDate, endDate } = req.query;
    

        const where = { userId: req.user.id };
        
        if (startDate || endDate) {
            where.createdAt = {
                ...(startDate && { gte: new Date(startDate) }),
                ...(endDate && { lte: new Date(endDate) })
            };
        }
        
        const [favorites, total] = await Promise.all([
            prisma.favorito.findMany({
                where,
                include: {
                    vehicle: {
                        include: {
                            imagens: {
                                where: { isMain: true },
                                take: 1
                            },
                            vendedor: {
                                select: {
                                    nome: true,
                                    telefone: true,
                                    avatar: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit)
            }),
            prisma.favorito.count({ where })
        ]);
        
        res.json({
            data: favorites.map(fav => ({
                ...fav.vehicle,
                mainImage: fav.vehicle.imagens[0]?.url,
                seller: fav.vehicle.vendedor
            })),
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    getVehicleFavorites
}