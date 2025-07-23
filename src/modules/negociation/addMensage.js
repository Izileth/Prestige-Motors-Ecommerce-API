const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const addMessage = async (req, res) => {
    try {
        console.log('=== ADD MESSAGE START ===');
        console.log('Negotiation ID:', req.params.negotiationId);
        console.log('User ID:', req.user?.id);
        console.log('Body:', req.body);

        const { negotiationId } = req.params;
        const { conteudo, tipo } = req.body;
        const userId = req.user.id;

        if (!conteudo) {
            return res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' });
        }

        // Verifica se a negociação existe e o usuário tem acesso
        const negotiation = await prisma.negociations.findUnique({
            where: { id: negotiationId },
            select: { 
                id: true,
                compradorId: true, 
                vendedorId: true, 
                status: true 
            }
        });

        if (!negotiation) {
            return res.status(404).json({ error: 'Negociação não encontrada' });
        }

        if (negotiation.compradorId !== userId && negotiation.vendedorId !== userId) {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        if (!['ABERTA', 'CONTRA_OFERTA'].includes(negotiation.status)) {
            return res.status(400).json({ error: 'Esta negociação está fechada para novas mensagens' });
        }

        // Criar mensagem e atualizar negociação em transação
        const result = await prisma.$transaction(async (tx) => {
            const message = await tx.mensage.create({
                data: {
                    negociacaoId: negotiationId,
                    autorId: userId,
                    conteudo,
                    tipo: tipo || 'TEXTO'
                },
                include: {
                    autor: {
                        select: {
                            nome: true,
                            avatar: true
                        }
                    }
                }
            });

            // Atualizar timestamp da negociação
            await tx.negociations.update({
                where: { id: negotiationId },
                data: { updatedAt: new Date() }
            });

            return message;
        });

        console.log('=== MESSAGE ADDED ===');
        console.log('Message ID:', result.id);

        res.status(201).json(result);
    } catch (error) {
        console.error('=== ADD MESSAGE ERROR ===');
        console.error(error);
        res.status(500).json({ 
            error: 'Erro ao enviar mensagem',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    addMessage
}