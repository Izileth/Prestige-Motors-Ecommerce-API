const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const getNegotiationDetails = async (req, res) => {
    try {
        console.log('=== GET NEGOTIATION DETAILS START ===');
        console.log('Negotiation ID:', req.params.negotiationId);
        console.log('User ID:', req.user?.id);

        const { negotiationId } = req.params;
        const userId = req.user.id;

        const negotiation = await prisma.negociations.findUnique({
            where: { id: negotiationId },
            select: {
                id: true,
                status: true,
                precoSolicitado: true,
                precoOfertado: true,
                precoNegociado: true,
                createdAt: true,
                updatedAt: true,
                dataFechamento: true,
                motivoRecusa: true,
                compradorId: true,
                vendedorId: true,
                vehicle: {
                    select: {
                        id: true,
                        marca: true,
                        modelo: true,
                        anoFabricacao: true,
                        preco: true
                    }
                },
                comprador: {
                    select: {
                        id: true,
                        nome: true,
                        avatar: true,
                        telefone: true
                    }
                },
                vendedor: {
                    select: {
                        id: true,
                        nome: true,
                        avatar: true,
                        telefone: true
                    }
                }
            }
        });

        if (!negotiation) {
            return res.status(404).json({ error: 'Negociação não encontrada' });
        }

        // Verificar se o usuário tem acesso a esta negociação
        if (negotiation.compradorId !== userId && negotiation.vendedorId !== userId) {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        // Buscar mensagens separadamente
        const messages = await prisma.mensage.findMany({
            where: { negociacaoId: negotiationId },
            select: {
                id: true,
                conteudo: true,
                tipo: true,
                createdAt: true,
                autorId: true,
                autor: {
                    select: {
                        nome: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Buscar algumas imagens do veículo
        const vehicleImages = await prisma.image.findMany({
            where: { vehicleId: negotiation.vehicle.id },
            select: {
                id: true,
                url: true,
                isMain: true
            },
            orderBy: [
                { isMain: 'desc' },
                { ordem: 'asc' }
            ],
            take: 3
        });

        const result = {
            ...negotiation,
            vehicle: {
                ...negotiation.vehicle,
                imagens: vehicleImages
            },
            mensagens: messages
        };

        console.log('=== NEGOTIATION DETAILS FOUND ===');
        console.log('Messages count:', messages.length);

        res.json(result);
    } catch (error) {
        console.error('=== GET NEGOTIATION DETAILS ERROR ===');
        console.error(error);
        res.status(500).json({ 
            error: 'Erro ao buscar detalhes da negociação',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getNegotiationDetails
}