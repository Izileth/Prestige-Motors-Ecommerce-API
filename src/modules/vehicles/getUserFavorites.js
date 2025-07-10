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

const getUserFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        const [favorites, totalCount] = await Promise.all([
            prisma.favorites.findMany({
                where: {
                    userId
                },
                include: {
                    vehicle: {
                        include: {
                            imagens: {
                                select: {
                                    id: true,
                                    url: true,
                                    isMain: true,
                                    ordem: true
                                },
                                orderBy: {
                                    ordem: 'asc'
                                }
                            },
                            vendedor: {
                                select: {
                                    nome: true,
                                    email: true
                                }
                            }
                        }
                    }
                },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.favorites.count({
                where: {
                    userId
                }
            })
        ]);
        
        // Formatar dados para melhor visualização
        const formattedFavorites = favorites.map(fav => ({
            favoriteId: fav.id,
            favoritedAt: fav.createdAt,
            vehicle: fav.vehicle
        }));
        
        const totalPages = Math.ceil(totalCount / limitNum);
        
        res.json({
            data: formattedFavorites,
            meta: {
                currentPage: pageNum,
                itemsPerPage: limitNum,
                totalItems: totalCount,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    getUserFavorites
}