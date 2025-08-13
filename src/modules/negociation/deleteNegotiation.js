
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cron = require('node-cron');

const cancelNegotiation = async (req, res) => {
    try {
        console.log('=== CANCEL NEGOTIATION START ===');
        console.log('Negotiation ID:', req.params.negotiationId);
        console.log('User ID:', req.user?.id);
        
        const { negotiationId } = req.params;
        const userId = req.user.id;
        
        // Tempo em horas para deletar após cancelamento (configurável)
        const DELETE_AFTER_HOURS = process.env.DELETE_CANCELLED_NEGOTIATIONS_AFTER_HOURS || 24;
        
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
        
        // Calcula quando a negociação deve ser deletada
        const deleteAt = new Date();
        deleteAt.setHours(deleteAt.getHours() + parseInt(DELETE_AFTER_HOURS));
        
        const updatedNegotiation = await prisma.negociations.update({
            where: { id: negotiationId },
            data: {
                status: 'CANCELADA',
                dataFechamento: new Date(),
                motivoRecusa: 'Negociação cancelada pelo comprador',
                // Adicione este campo ao seu schema Prisma
                deleteScheduledAt: deleteAt
            }
        });
        
        console.log('=== NEGOTIATION CANCELLED ===');
        console.log('Scheduled for deletion at:', deleteAt);
        
        res.json({
            ...updatedNegotiation,
            willBeDeletedAt: deleteAt
        });
    } catch (error) {
        console.error('=== CANCEL NEGOTIATION ERROR ===');
        console.error(error);
        res.status(500).json({ 
            error: 'Erro ao cancelar negociação',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ====== 2. SERVIÇO DE DELEÇÃO AUTOMÁTICA ======
class NegotiationCleanupService {
    constructor() {
        this.prisma = prisma;
    }
    
    async deleteExpiredNegotiations() {
        try {
            console.log('=== STARTING CLEANUP OF EXPIRED NEGOTIATIONS ===');
            
            const now = new Date();
            
            // Busca negociações canceladas que já passaram do prazo para deleção
            const expiredNegotiations = await this.prisma.negociations.findMany({
                where: {
                    status: 'CANCELADA',
                    deleteScheduledAt: {
                        lte: now
                    }
                },
                select: {
                    id: true,
                    dataFechamento: true,
                    deleteScheduledAt: true
                }
            });
            
            if (expiredNegotiations.length === 0) {
                console.log('No expired negotiations found');
                return { deleted: 0 };
            }
            
            console.log(`Found ${expiredNegotiations.length} expired negotiations to delete`);
            
            // Delete em lote para melhor performance
            const deletedNegotiations = await this.prisma.negociations.deleteMany({
                where: {
                    id: {
                        in: expiredNegotiations.map(n => n.id)
                    }
                }
            });
            
            console.log(`=== CLEANUP COMPLETED: ${deletedNegotiations.count} negotiations deleted ===`);
            
            return {
                deleted: deletedNegotiations.count,
                deletedIds: expiredNegotiations.map(n => n.id)
            };
            
        } catch (error) {
            console.error('=== CLEANUP ERROR ===');
            console.error(error);
            throw error;
        }
    }
    
    // Método para cancelar a deleção programada (caso necessário)
    async cancelScheduledDeletion(negotiationId) {
        try {
            const updated = await this.prisma.negociations.update({
                where: { id: negotiationId },
                data: {
                    deleteScheduledAt: null
                }
            });
            
            console.log(`Cancelled scheduled deletion for negotiation ${negotiationId}`);
            return updated;
        } catch (error) {
            console.error(`Error cancelling scheduled deletion for ${negotiationId}:`, error);
            throw error;
        }
    }
}

// ====== 3. SCHEDULER COM NODE-CRON ======

class NegotiationScheduler {
    constructor() {
        this.cleanupService = new NegotiationCleanupService();
        this.job = null;
    }
    
    start() {
        try {
            // Roda a cada hora (você pode ajustar conforme necessário)
            // Formato cron: minuto hora dia mês dia-da-semana
            const cronPattern = process.env.CLEANUP_CRON_PATTERN || '0 * * * *'; // A cada hora
            
            console.log(`Starting negotiation cleanup scheduler with pattern: ${cronPattern}`);
            
            // Valida o padrão cron antes de usar
            if (!cron.validate(cronPattern)) {
                console.error(`Invalid cron pattern: ${cronPattern}. Using default pattern.`);
                const defaultPattern = '0 * * * *';
                console.log(`Using default pattern: ${defaultPattern}`);
            }
            
            const validPattern = cron.validate(cronPattern) ? cronPattern : '0 * * * *';
            
            // Remove timezone para evitar problemas em produção
            this.job = cron.schedule(validPattern, async () => {
                try {
                    console.log('Running scheduled negotiation cleanup...');
                    await this.cleanupService.deleteExpiredNegotiations();
                } catch (error) {
                    console.error('Scheduled cleanup failed:', error);
                }
            }, {
                scheduled: true
                // Removido timezone para evitar problemas em produção
            });
            
            console.log('Negotiation cleanup scheduler started successfully');
        } catch (error) {
            console.error('Failed to start negotiation cleanup scheduler:', error);
            console.log('Scheduler will not run, but manual cleanup is still available');
        }
    }
    
    stop() {
        if (this.job) {
            this.job.stop();
            console.log('Negotiation cleanup scheduler stopped');
        }
    }
    
    // Método para executar limpeza manual
    async runCleanupNow() {
        return await this.cleanupService.deleteExpiredNegotiations();
    }
}

// ====== 4. ROTA PARA LIMPEZA MANUAL (OPCIONAL) ======
const runManualCleanup = async (req, res) => {
    try {
        const cleanupService = new NegotiationCleanupService();
        const result = await cleanupService.deleteExpiredNegotiations();
        
        res.json({
            success: true,
            message: `Cleanup completed successfully`,
            ...result
        });
    } catch (error) {
        console.error('Manual cleanup error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao executar limpeza manual',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ====== 5. INICIALIZAÇÃO DO SCHEDULER ======
const scheduler = new NegotiationScheduler();

// Inicia o scheduler quando o servidor subir
const initializeNegotiationCleanup = () => {
    try {
        console.log('Initializing negotiation cleanup system...');
        scheduler.start();
        
        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, stopping scheduler...');
            scheduler.stop();
        });
        
        process.on('SIGINT', () => {
            console.log('SIGINT received, stopping scheduler...');
            scheduler.stop();
        });
        
        console.log('Negotiation cleanup system initialized successfully');
    } catch (error) {
        console.error('Failed to initialize negotiation cleanup system:', error);
        console.log('Application will continue without automatic cleanup. Manual cleanup is still available.');
    }
};

module.exports = {
    cancelNegotiation,
    NegotiationCleanupService,
    NegotiationScheduler,
    runManualCleanup,
    initializeNegotiationCleanup
};