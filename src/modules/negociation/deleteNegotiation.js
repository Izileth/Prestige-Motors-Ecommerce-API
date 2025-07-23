const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const cancelNegotiation = async (req, res) => {
    try {
        console.log('=== CANCEL NEGOTIATION START ===');
        console.log('Negotiation ID:', req.params.negotiationId);
        console.log('User ID:', req.user?.id);

        const { negotiationId } = req.params;
        const userId = req.user.id;

        const negotiation = await prisma.negociations.findUnique({
            where: { id: negotiationId }
        });

        if (!negotiation) {
            return res.status(404).json({ error: 'Negociação não encontrada' });
        }

        if (negotiation.compradorId !== userId) {
            return res.status(403).json({ error: 'Apenas o comprador pode cancelar a negociação' });
        }

        if (!['ABERTA', 'CONTRA_OFERTA'].includes(negotiation.status)) {
            return res.status(400).json({ error: 'Esta negociação não pode ser cancelada' });
        }

        const updatedNegotiation = await prisma.negociations.update({
            where: { id: negotiationId },
            data: {
                status: 'CANCELADA',
                dataFechamento: new Date(),
                motivoRecusa: 'Negociação cancelada pelo comprador'
            }
        });

        console.log('=== NEGOTIATION CANCELLED ===');
        
        res.json(updatedNegotiation);
    } catch (error) {
        console.error('=== CANCEL NEGOTIATION ERROR ===');
        console.error(error);
        res.status(500).json({ 
            error: 'Erro ao cancelar negociação',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    cancelNegotiation
}