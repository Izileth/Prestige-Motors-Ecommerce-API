const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getVehicleBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        console.log('🔍 Buscando veículo por slug:', slug);

        if (!slug || slug.trim() === '') {
            return res.status(400).json({ message: 'Slug inválido' });
        }

        // ✅ SOLUÇÃO: Use findFirst ao invés de findUnique
        const vehicle = await prisma.vehicle.findFirst({
            where: { 
                slug: slug.trim() // Garante que não há espaços extras
            },
            select: { // Explicitly select fields, including slug
                id: true,
                slug: true, // Adicionar o slug aqui
                marca: true,
                modelo: true,
                anoFabricacao: true,
                anoModelo: true,
                preco: true,
                precoPromocional: true,
                descricao: true,
                quilometragem: true,
                tipoCombustivel: true,
                cambio: true,
                cor: true,
                portas: true,
                finalPlaca: true,
                carroceria: true,
                potencia: true,
                motor: true,
                categoria: true,
                classe: true,
                status: true,
                visualizacoes: true,
                destaque: true,
                seloOriginal: true,
                aceitaTroca: true,
                parcelamento: true,
                localizacaoId: true,
                createdAt: true,
                updatedAt: true,
                vendedorId: true,
                aceitaNegociacao: true,
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
                    select: {
                        id: true,
                        rating: true,
                        comentario: true,
                        createdAt: true,
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

        if (!vehicle) {
            console.log('❌ Veículo não encontrado com slug:', slug);
            return res.status(404).json({ 
                message: 'Veículo não encontrado',
                slug: slug 
            });
        }

        console.log('✅ Veículo encontrado:', vehicle.id);

        // Calcula estatísticas de avaliações
        const avgRating = vehicle.avaliacoes.length > 0
            ? vehicle.avaliacoes.reduce((sum, review) => sum + review.rating, 0) / vehicle.avaliacoes.length
            : 0;

        const responseVehicle = {
            ...vehicle,
            reviewStats: {
                averageRating: Number(avgRating.toFixed(1)),
                totalReviews: vehicle.avaliacoes.length
            }
        };

        console.log('📊 Stats calculados - Média:', avgRating, 'Total:', vehicle.avaliacoes.length);

        res.json(responseVehicle);

    } catch (error) {
        console.error('❌ Erro ao buscar veículo por slug:', error);
        console.error('Stack:', error.stack);
        
        res.status(500).json({ 
            message: 'Erro no servidor',
            ...(process.env.NODE_ENV === 'development' && {
                error: error.message,
                stack: error.stack
            })
        });
    }
};

module.exports = {
    getVehicleBySlug
};