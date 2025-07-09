
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


const getVehicleAddress = async (req, res) => {
    try {
        const { vehicleId } = req.params;

        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            include: { localizacao: true }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        if (!vehicle.localizacao) {
            return res.status(404).json({ error: 'Endereço não encontrado' });
        }

        res.json(vehicle.localizacao);
    } catch (error) {
        console.error('Error in getVehicleAddress:', error);
        res.status(500).json({ error: 'Erro ao buscar endereço' });
    }
};

module.exports = {
    getVehicleAddress
};