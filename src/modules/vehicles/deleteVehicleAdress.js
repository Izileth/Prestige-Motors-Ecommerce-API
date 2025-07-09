
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();



const removeVehicleAddress = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const userId = req.user.id;

        // Verificar se o veículo pertence ao usuário
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            include: { localizacao: true }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        if (vehicle.vendedorId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Não autorizado' });
        }

        if (!vehicle.localizacao) {
            return res.status(404).json({ error: 'Endereço não encontrado' });
        }

        // Desassociar endereço do veículo (sem deletar o endereço)
        await prisma.vehicle.update({
            where: { id: vehicleId },
            data: {
                localizacao: {
                    disconnect: true
                }
            }
        });

        res.json({ message: 'Endereço removido com sucesso' });
    } catch (error) {
        console.error('Error in removeVehicleAddress:', error);
        res.status(500).json({ error: 'Erro ao remover endereço' });
    }
};

module.exports = {
    removeVehicleAddress
};