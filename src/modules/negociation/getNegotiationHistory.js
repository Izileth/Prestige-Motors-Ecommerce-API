const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const getNegotiationHistory = async (req, res) => {
    try {
        console.log('=== GET NEGOTIATION HISTORY START ===');
        
        const { negotiationId } = req.params;
        const userId = req.user.id;
        
        console.log('negotiationId:', negotiationId);
        console.log('userId:', userId);

        // Verificar se usuário tem acesso
        const negotiation = await prisma.negociations.findUnique({
            where: { id: negotiationId },
            select: { 
                compradorId: true, 
                vendedorId: true 
            }
        });

        console.log('negotiation found:', negotiation);

        if (!negotiation || (negotiation.compradorId !== userId && negotiation.vendedorId !== userId)) {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        // ADICIONE ESTE LOG PARA VERIFICAR SE EXISTEM REGISTROS
        const totalRecords = await prisma.negotiationsHistory.count({
            where: { negociacaoId: negotiationId }
        });
        console.log('Total records in history for this negotiation:', totalRecords);

        const history = await prisma.negotiationsHistory.findMany({
            where: { negociacaoId: negotiationId },
            select: {
                id: true,
                acao: true,
                detalhes: true,
                createdAt: true,
                usuario: {
                    select: {
                        nome: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log('=== HISTORY FOUND ===');
        console.log('Records count:', history.length);
        console.log('First record:', history[0]); // Para ver se há dados

        res.json(history);
    } catch (error) {
        console.error('=== GET NEGOTIATION HISTORY ERROR ===');
        console.error(error);
        res.status(500).json({ 
            error: 'Erro ao buscar histórico',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getNegotiationHistory
}