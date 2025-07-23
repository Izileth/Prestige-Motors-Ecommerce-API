const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const respondToNegotiation = async (req, res) => {
    try {
        console.log('=== RESPOND TO NEGOTIATION START ===');
        console.log('Negotiation ID:', req.params.negotiationId);
        console.log('User ID:', req.user?.id);
        console.log('Body:', req.body);

        const { negotiationId } = req.params;
        const { action, precoNegociado, motivo } = req.body;
        const userId = req.user.id;

        if (!action || !['ACCEPT', 'REJECT', 'COUNTER'].includes(action)) {
            return res.status(400).json({ error: 'Ação inválida. Use: ACCEPT, REJECT ou COUNTER' });
        }

        const negotiation = await prisma.negociations.findUnique({
            where: { id: negotiationId },
            include: { vehicle: true }
        });

        if (!negotiation) {
            return res.status(404).json({ error: 'Negociação não encontrada' });
        }

        if (negotiation.vendedorId !== userId) {
            return res.status(403).json({ error: 'Apenas o vendedor pode responder à negociação' });
        }

        if (!['ABERTA', 'CONTRA_OFERTA'].includes(negotiation.status)) {
            return res.status(400).json({ error: 'Esta negociação já foi respondida' });
        }

        let updateData = {};
        let messageContent = '';

        switch (action) {
            case 'ACCEPT':
                updateData = {
                    status: 'ACEITA',
                    precoNegociado: precoNegociado ? parseFloat(precoNegociado) : negotiation.precoOfertado,
                    dataFechamento: new Date()
                };
                messageContent = 'Negociação aceita';
                break;

            case 'REJECT':
                updateData = {
                    status: 'RECUSADA',
                    motivoRecusa: motivo || 'Negociação recusada',
                    dataFechamento: new Date()
                };
                messageContent = motivo || 'Negociação recusada';
                break;

            case 'COUNTER':
                if (!precoNegociado) {
                    return res.status(400).json({ error: 'Preço negociado é obrigatório para contraproposta' });
                }
                updateData = {
                    status: 'CONTRA_OFERTA',
                    precoNegociado: parseFloat(precoNegociado)
                };
                messageContent = `Contraproposta de R$ ${precoNegociado}`;
                break;
        }

        const [updatedNegotiation] = await prisma.$transaction([
            prisma.negociations.update({
                where: { id: negotiationId },
                data: updateData
            }),
            prisma.mensage.create({
                data: {
                    negociacaoId: negotiationId,
                    autorId: userId,
                    conteudo: messageContent,
                    tipo: action === 'COUNTER' ? 'CONTRA_OFERTA' : 'SISTEMA'
                }
            })
        ]);

        console.log('=== NEGOTIATION RESPONDED ===');
        console.log('New status:', updatedNegotiation.status);

        res.json(updatedNegotiation);
    } catch (error) {
        console.error('=== RESPOND TO NEGOTIATION ERROR ===');
        console.error(error);
        res.status(500).json({ 
            error: 'Erro ao responder à negociação',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    respondToNegotiation
}