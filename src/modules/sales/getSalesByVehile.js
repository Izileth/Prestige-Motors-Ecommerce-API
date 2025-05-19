const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getSalesByVehicle = async (req, res) => {
    try {
        const { vehicleId } = req.params;

        // Verifica se o usuário é dono do veículo ou admin
        const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { vendedorId: true }
        });

        if (!vehicle) {
        return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        if (req.user.id !== vehicle.vendedorId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const sales = await prisma.venda.findMany({
        where: { vehicleId },
        orderBy: { dataVenda: 'desc' },
        select: {
            id: true,
            precoVenda: true,
            dataVenda: true,
            comprador: {
            select: {
                nome: true,
                telefone: true
            }
            }
        }
        });

        res.json(sales);
    } catch (error) {
        console.error('Erro em getSalesByVehicle:', error);
        res.status(500).json({ error: 'Erro ao buscar vendas' });
    }
};

module.exports = {
    getSalesByVehicle
}