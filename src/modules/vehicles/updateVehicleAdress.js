
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const { z } = require('zod');


const addressSchema = z.object({
    cep: z.string().length(8),
    logradouro: z.string().min(3),
    numero: z.string().min(1),
    complemento: z.string().optional(),
    bairro: z.string().min(3),
    cidade: z.string().min(3),
    estado: z.string().length(2),
    pais: z.string().default('Brasil'),
    latitude: z.number().optional(),
    longitude: z.number().optional()
});

const addOrUpdateVehicleAddress = async (req,res) => {
    try {
        const { vehicleId, addressId } = req.params;
        const data = addressSchema.parse(req.body);
        const userId = req.user.id;

        // Verificar se o veículo pertence ao usuário
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            select: { vendedorId: true }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        if (vehicle.vendedorId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Não autorizado' });
        }

        let address;
        if (addressId) {
            // Atualizar endereço existente
            address = await prisma.address.update({
                where: { id: addressId },
                data
            });
        } else {
            // Criar novo endereço
            address = await prisma.address.create({
                data: {
                    ...data,
                    userId,
                    vehicles: {
                        connect: { id: vehicleId }
                    }
                }
            });
        }

        res.json(address);
    } catch (error) {
        console.error('Error in addOrUpdateVehicleAddress:', error);
        res.status(500).json({ error: 'Erro ao processar endereço' });
    }
};

module.exports = {
    addOrUpdateVehicleAddress
}