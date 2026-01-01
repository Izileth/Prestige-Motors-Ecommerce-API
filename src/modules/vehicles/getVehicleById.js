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

const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

const getVehicleById = async (req, res) => {
    try {
        const { identifier } = req.params;
        
        const isObjectId = isValidObjectId(identifier);

        const whereClause = {
            OR: [
                { slug: identifier }
            ]
        };

        if (isObjectId) {
            whereClause.OR.push({ id: identifier });
        }
        
        const vehicle = await prisma.vehicle.findFirst({
            where: whereClause,
            include: {
                vendedor: {
                    select: {
                        nome: true,
                        email: true,
                        telefone: true
                    }
                },
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
                videos: {
                    select: {
                        id: true,
                        url: true
                    }
                },
                localizacao: {
                    select: {
                        cidade: true,
                        estado: true
                    }
                },
                // Adicione este trecho para incluir as avaliações
                avaliacoes: {
                    include: {
                        user: {
                            select: {
                                nome: true,
                                avatar: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });
        
        if (!vehicle) return res.status(404).json({ message: 'Veículo não encontrado' });
        
        // Calcular a média das avaliações
        const avgRating = vehicle.avaliacoes.length > 0 
            ? vehicle.avaliacoes.reduce((sum, review) => sum + review.rating, 0) / vehicle.avaliacoes.length 
            : 0;
        
        // Adicionar média e total de avaliações ao objeto de resposta
        const responseVehicle = {
            ...vehicle,
            reviewStats: {
                averageRating: avgRating,
                totalReviews: vehicle.avaliacoes.length
            }
        };
        
        res.json(responseVehicle);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    getVehicleById
}