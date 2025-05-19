const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getUserStats = async (req, res) => {
    try {
        console.log('Iniciando getUserStats'); // Log inicial
        const { id } = req.params;
        console.log('ID recebido:', id); // Log do ID

        // Verificar se o usuário existe
        console.log('Verificando existência do usuário...');
        const userExists = await prisma.user.findUnique({
            where: { id },
            select: { id: true }
        });
        console.log('Resultado da verificação:', userExists);

        if (!userExists) {
            console.log('Usuário não encontrado');
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Verificar permissões
        console.log('Verificando permissões...');
        console.log('req.user.id:', req.user.id, 'id:', id, 'req.user.role:', req.user.role);
        if (req.user.id !== id && req.user.role !== 'ADMIN') {
            console.log('Acesso negado');
            return res.status(403).json({ message: 'Acesso negado' });
        }

        // Contar veículos
        console.log('Contando veículos...');
        const totalVehicles = await prisma.vehicle.count({
            where: { vendedorId: id }
        });
        console.log('Total de veículos:', totalVehicles);

        // Estatísticas
        console.log('Buscando estatísticas...');
       
        const vehicleStats = await prisma.vehicle.aggregate({
        where: { vendedorId: id },
        _sum: { preco: true },
        _avg: { 
            preco: true,
            anoFabricacao: true, // Campo correto
            anoModelo: true      // Ou este, dependendo da sua necessidade
        },
        _min: { preco: true },
        _max: { preco: true }
        });
        console.log('Estatísticas obtidas:', vehicleStats);


        res.json({
            totalVehicles,
            valorTotalInventario: vehicleStats._sum.preco || 0,
            precoMedio: vehicleStats._avg.preco || 0,
            anoFabricacaoMedio: vehicleStats._avg.anoFabricacao || 0,
            anoModeloMedio: vehicleStats._avg.anoModelo || 0,
            precoMinimo: vehicleStats._min.preco || 0,
            precoMaximo: vehicleStats._max.preco || 0
        });
    } catch (error) {
        console.error('Erro completo em getUserStats:', error);
        handlePrismaError(error, res);
    }
};

module.exports = {
    getUserStats
}