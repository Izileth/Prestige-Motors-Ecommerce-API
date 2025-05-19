const { PrismaClient } = require('@prisma/client');
const { Prisma } = require('@prisma/client');

const prisma = new PrismaClient();

const { z } = require('zod');



const registerVehicleView = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id; // Opcional - pode ser null para usuários não autenticados
        
        // Obter IP e user agent
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        // Verificar se o veículo existe
        const vehicle = await prisma.vehicle.findUnique({
            where: { id }
        });
        
        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }
        
        // Incrementar contador de visualizações do veículo
        await prisma.vehicle.update({
            where: { id },
            data: {
                visualizacoes: {
                    increment: 1
                }
            }
        });
        
        // Registrar log detalhado de visualização
        await prisma.viewLog.create({
            data: {
                vehicleId: id,
                userId,
                ipAddress,
                userAgent
            }
        });
        
        return res.status(200).json({ message: 'Visualização registrada com sucesso' });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    registerVehicleView
}