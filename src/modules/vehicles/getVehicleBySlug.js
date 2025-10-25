const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getVehicleBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const vehicle = await prisma.vehicle.findUnique({
            where: { slug },
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

        const avgRating = vehicle.avaliacoes.length > 0
            ? vehicle.avaliacoes.reduce((sum, review) => sum + review.rating, 0) / vehicle.avaliacoes.length
            : 0;

        const responseVehicle = {
            ...vehicle,
            reviewStats: {
                averageRating: avgRating,
                totalReviews: vehicle.avaliacoes.length
            }
        };

        res.json(responseVehicle);
    } catch (error) {
        console.error('Erro ao buscar veículo por slug:', error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};

module.exports = {
    getVehicleBySlug
};