
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const { handlePrismaError } = require('../../utils/errorHandler');

const getUserAddresses = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('=== INÍCIO getUserAddresses ===');
        console.log('ID recebido:', id);
        console.log('Prisma instance:', !!prisma); // Debug
        console.log('Prisma address model:', !!prisma.address); // Debug
        
        // Verifica se o usuário está acessando seus próprios endereços ou é admin
        if (req.user.id !== id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const addresses = await prisma.address.findMany({
            where: { userId: id },
            select: {
                id: true,
                cep: true,
                logradouro: true,
                numero: true,
                complemento: true,
                bairro: true,
                cidade: true,
                estado: true,
                pais: true
            }
        });

        console.log('Endereços encontrados:', addresses.length);
        res.json(addresses);
    } catch (error) {
        console.error('Erro em getUserAddresses:', error);
        handlePrismaError(error, res);
    }
};

module.exports = {
    getUserAddresses
};