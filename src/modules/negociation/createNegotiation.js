const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createNegotiation = async (req, res) => {
    try {
        console.log('=== CREATE NEGOTIATION START ===');
        console.log('User ID:', req.user?.id);
        console.log('Body:', req.body);

        const { vehicleId, precoOfertado, comentario } = req.body;
        const userId = req.user.id;

        // Validações básicas
        if (!vehicleId || !precoOfertado) {
            return res.status(400).json({ 
                error: 'vehicleId e precoOfertado são obrigatórios' 
            });
        }

        // Verifica se o veículo existe e está disponível
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            select: {
                id: true,
                preco: true,
                status: true,
                aceitaNegociacao: true,
                vendedorId: true,
                marca: true,
                modelo: true,
                anoFabricacao: true
            }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        if (vehicle.status !== 'DISPONIVEL' || !vehicle.aceitaNegociacao) {
            return res.status(400).json({ error: 'Este veículo não está disponível para negociação' });
        }

        // Não permitir que o vendedor negocie consigo mesmo
        if (vehicle.vendedorId === userId) {
            return res.status(400).json({ error: 'Você não pode negociar seu próprio veículo' });
        }

        // Criar negociação, mensagem inicial e histórico em transação
        const result = await prisma.$transaction(async (tx) => {
            // 1. Criar a negociação
            const negotiation = await tx.negociations.create({
                data: {
                    vehicleId,
                    compradorId: userId,
                    vendedorId: vehicle.vendedorId,
                    precoSolicitado: vehicle.preco,
                    precoOfertado: parseFloat(precoOfertado),
                    status: 'ABERTA'
                }
            });

            // 2. Criar mensagem inicial
            const message = await tx.mensage.create({
                data: {
                    negociacaoId: negotiation.id,
                    autorId: userId,
                    conteudo: comentario || `Oferta inicial de R$ ${precoOfertado}`,
                    tipo: 'OFERTA'
                }
            });

            // ✅ 3. CRIAR REGISTRO DE HISTÓRICO - CRIAÇÃO DA NEGOCIAÇÃO
            const historyCreation = await tx.negotiationsHistory.create({
                data: {
                    negociacaoId: negotiation.id,
                    acao: 'CRIACAO',
                    usuarioId: userId,
                    detalhes: {
                        veiculo: {
                            marca: vehicle.marca,
                            modelo: vehicle.modelo,
                            ano: vehicle.anoFabricacao
                        },
                        precoOriginal: vehicle.preco,
                        precoOfertado: parseFloat(precoOfertado),
                        comentario: comentario || null
                    }
                }
            });

            // ✅ 4. CRIAR REGISTRO DE HISTÓRICO - PRIMEIRA OFERTA
            const historyOffer = await tx.negotiationsHistory.create({
                data: {
                    negociacaoId: negotiation.id,
                    acao: 'OFERTA',
                    usuarioId: userId,
                    detalhes: {
                        precoOfertado: parseFloat(precoOfertado),
                        comentario: comentario || null,
                        tipoOferta: 'INICIAL'
                    }
                }
            });

            return { negotiation, message, historyCreation, historyOffer };
        });

        // Buscar dados completos para resposta
        const negotiationWithDetails = await prisma.negociations.findUnique({
            where: { id: result.negotiation.id },
            include: {
                vehicle: {
                    select: {
                        marca: true,
                        modelo: true,
                        anoFabricacao: true,
                        preco: true
                    }
                },
                comprador: {
                    select: {
                        nome: true,
                        avatar: true
                    }
                },
                vendedor: {
                    select: {
                        nome: true,
                        avatar: true
                    }
                }
            }
        });

        console.log('=== NEGOTIATION CREATED ===');
        console.log('Negotiation ID:', negotiationWithDetails.id);
        console.log('History records created:', 2);

        res.status(201).json(negotiationWithDetails);
    } catch (error) {
        console.error('=== CREATE NEGOTIATION ERROR ===');
        console.error(error);
        res.status(500).json({ 
            error: 'Erro ao criar negociação',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    createNegotiation
};