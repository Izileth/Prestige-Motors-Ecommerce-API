const { PrismaClient } = require('@prisma/client');


const prisma = new PrismaClient();


const getVehicleViews = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se o usuário é o dono do veículo ou admin
        const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        select: { vendedorId: true }
        });

        if (!vehicle) {
        return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        if (vehicle.vendedorId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const views = await prisma.viewLog.findMany({
        where: { vehicleId: id },
        orderBy: { createdAt: 'desc' },
        take: 100
        });

        res.json(views);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    getVehicleViews
}