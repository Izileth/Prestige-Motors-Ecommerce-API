
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Cache simples em memória para stats
const statsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para limpar cache expirado
const clearExpiredCache = () => {
    const now = Date.now();
    for (const [key, value] of statsCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            statsCache.delete(key);
        }
    }
};

// Limpar cache expirado a cada 10 minutos
setInterval(clearExpiredCache, 10 * 60 * 1000);

// Função para tratar erros do Prisma
function handlePrismaError(error, res) {
    console.error('Erro do Prisma:', error);
    
    // Verificar se a resposta já foi enviada
    if (res.headersSent) {
        console.error('Tentativa de enviar resposta dupla impedida');
        return;
    }
    
    if (error.code) {
        // Erros específicos do Prisma
        switch (error.code) {
            case 'P2002':
                return res.status(400).json({ 
                    message: 'Violação de unicidade', 
                    code: error.code 
                });
            case 'P2025':
                return res.status(404).json({ 
                    message: 'Registro não encontrado', 
                    code: error.code 
                });
            case 'P1001':
                return res.status(500).json({ 
                    message: 'Erro de conexão com banco de dados', 
                    code: error.code 
                });
            default:
                return res.status(400).json({ 
                    message: `Erro do Prisma: ${error.message}`, 
                    code: error.code 
                });
        }
    }
    
    return res.status(500).json({ 
        message: 'Erro interno do servidor', 
        error: error.message 
    });
}

const getUserStats = async (req, res) => {
    try {
        console.log('=== INÍCIO getUserStats ===');
        
        // Verificar se req e res existem
        if (!req || !res) {
            console.error('req ou res não definidos');
            return;
        }
        
        const { id } = req.params;
        console.log('ID recebido:', id);
        
        // Verificar cache primeiro
        const cacheKey = `user_stats_${id}`;
        const cached = statsCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            console.log('Retornando dados do cache');
            return res.json(cached.data);
        }

        // Validar o ID
        if (!id || typeof id !== 'string') {
            console.log('ID inválido:', id);
            if (!res.headersSent) {
                return res.status(400).json({ message: 'ID inválido' });
            }
            return;
        }

        // Validar req.user
        if (!req.user || !req.user.id || !req.user.role) {
            console.log('req.user não definido ou incompleto:', req.user);
            if (!res.headersSent) {
                return res.status(401).json({ message: 'Usuário não autenticado' });
            }
            return;
        }

        // Verificar se o usuário existe
        console.log('Verificando existência do usuário...');
        const userExists = await prisma.user.findUnique({
            where: { id },
            select: { id: true },
        });
        console.log('Resultado da verificação:', userExists);

        if (!userExists) {
            console.log('Usuário não encontrado');
            if (!res.headersSent) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }
            return;
        }

        // Verificar permissões
        console.log('Verificando permissões...', { 
            userId: req.user.id, 
            role: req.user.role,
            targetId: id 
        });
        
        if (req.user.id !== id && req.user.role !== 'ADMIN') {
            console.log('Acesso negado');
            if (!res.headersSent) {
                return res.status(403).json({ message: 'Acesso negado' });
            }
            return;
        }

        // Buscar dados em paralelo para melhor performance
        console.log('Buscando dados do usuário...');
        const [totalVehicles, vehicleStats] = await Promise.all([
            // Contar veículos
            prisma.vehicle.count({
                where: { vendedorId: id },
            }),
            // Estatísticas
            prisma.vehicle.aggregate({
                where: { vendedorId: id },
                _sum: { preco: true },
                _avg: {
                    preco: true,
                    anoFabricacao: true,
                    anoModelo: true,
                },
                _min: { preco: true },
                _max: { preco: true },
            })
        ]);

        console.log('Dados obtidos:', {
            totalVehicles,
            vehicleStats: {
                sum: vehicleStats._sum?.preco,
                avg: vehicleStats._avg?.preco,
                min: vehicleStats._min?.preco,
                max: vehicleStats._max?.preco
            }
        });

        // Preparar resposta
        const response = {
            totalVehicles: totalVehicles || 0,
            valorTotalInventario: vehicleStats._sum?.preco || 0,
            precoMedio: vehicleStats._avg?.preco || 0,
            anoFabricacaoMedio: Math.round(vehicleStats._avg?.anoFabricacao || 0),
            anoModeloMedio: Math.round(vehicleStats._avg?.anoModelo || 0),
            precoMinimo: vehicleStats._min?.preco || 0,
            precoMaximo: vehicleStats._max?.preco || 0,
        };

        console.log('Resposta preparada:', response);
        console.log('=== FIM getUserStats - SUCESSO ===');

        // Armazenar no cache
        statsCache.set(cacheKey, {
            data: response,
            timestamp: Date.now()
        });

        // Enviar resposta apenas se não foi enviada ainda
        if (!res.headersSent) {
            return res.json(response);
        }

    } catch (error) {
        console.error('=== ERRO em getUserStats ===');
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        console.error('Código do erro:', error.code);
        
        // Verificar se a resposta já foi enviada antes de tentar enviar erro
        if (!res.headersSent) {
            handlePrismaError(error, res);
        } else {
            console.error('Erro ocorreu após resposta já ter sido enviada');
        }
    }
};

module.exports = {
    getUserStats,
};