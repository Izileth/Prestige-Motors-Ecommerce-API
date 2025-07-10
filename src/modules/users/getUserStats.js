const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Função para tratar erros do Prisma
function handlePrismaError(error, res) {
    console.error('Erro do Prisma:', error);
    if (error.code) {
        // Erros específicos do Prisma, como P2002 (violação de unicidade)
        return res.status(400).json({ message: `Erro do Prisma: ${error.message}`, code: error.code });
    }
    return res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
}

const getUserStats = async (req, res) => {
    try {
        console.log('Iniciando getUserStats');
        const { id } = req.params;
        console.log('ID recebido:', id);

        // Validar o ID
        if (!id || typeof id !== 'string') {
        console.log('ID inválido:', id);
        return res.status(400).json({ message: 'ID inválido' });
        }

        // Validar req.user
        if (!req.user || !req.user.id || !req.user.role) {
        console.log('req.user não definido ou incompleto:', req.user);
        return res.status(401).json({ message: 'Usuário não autenticado' });
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
        return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Verificar permissões
        console.log('Verificando permissões...', { userId: req.user.id, role: req.user.role });
        if (req.user.id !== id && req.user.role !== 'ADMIN') {
        console.log('Acesso negado');
        return res.status(403).json({ message: 'Acesso negado' });
        }

        // Contar veículos
        console.log('Contando veículos...');
        const totalVehicles = await prisma.vehicle.count({
        where: { vendedorId: id },
        });
        console.log('Total de veículos:', totalVehicles);

        // Estatísticas
        console.log('Buscando estatísticas...');
        const vehicleStats = await prisma.vehicle.aggregate({
        where: { vendedorId: id },
        _sum: { preco: true },
        _avg: {
            preco: true,
            anoFabricacao: true,
            anoModelo: true,
        },
        _min: { preco: true },
        _max: { preco: true },
        });
        console.log('Estatísticas obtidas:', vehicleStats);

        // Retornar resposta
        res.json({
        totalVehicles,
        valorTotalInventario: vehicleStats._sum?.preco || 0,
        precoMedio: vehicleStats._avg?.preco || 0,
        anoFabricacaoMedio: vehicleStats._avg?.anoFabricacao || 0,
        anoModeloMedio: vehicleStats._avg?.anoModelo || 0,
        precoMinimo: vehicleStats._min?.preco || 0,
        precoMaximo: vehicleStats._max?.preco || 0,
        });
    } catch (error) {
        console.error('Erro completo em getUserStats:', error.message, error.stack);
        handlePrismaError(error, res);
    }
};

module.exports = {
    getUserStats,
};