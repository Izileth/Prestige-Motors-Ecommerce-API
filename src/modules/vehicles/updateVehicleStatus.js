const { PrismaClient } = require('@prisma/client');
const { Prisma } = require('@prisma/client');
const prisma = new PrismaClient();


const handlePrismaError = (error, res) => {
    console.error('Erro Prisma:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Erro conhecido do Prisma
        switch (error.code) {
            case 'P2002': // Violação de unicidade
                return res.status(409).json({ message: 'Conflito: registro com este valor já existe.' });
            case 'P2025': // Registro não encontrado
                return res.status(404).json({ message: 'Registro não encontrado.' });
            case 'P2003': // Violação de chave estrangeira
                return res.status(400).json({ message: 'Referência inválida.' });
            default:
                return res.status(400).json({ message: `Erro na requisição: ${error.code}` });
        }
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        // Erro de validação
        return res.status(400).json({ message: 'Dados inválidos fornecidos.' });
    }
    
    // Erro genérico
    return res.status(500).json({ message: 'Erro no servidor' });
};

const updateVehicleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Validar status
        const validStatus = ['DISPONIVEL', 'VENDIDO', 'RESERVADO', 'INATIVO'];
        if (!validStatus.includes(status)) {
            return res.status(400).json({ 
                message: 'Status inválido', 
                validStatus
            });
        }
        
        // Verificar se o veículo existe
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            select: {
                id: true,
                vendedorId: true
            }
        });
        
        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }
        
        // Verificar permissão (proprietário ou admin)
        if (vehicle.vendedorId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Acesso negado: você não tem permissão para atualizar este veículo' });
        }
        
        // Atualizar status
        const updatedVehicle = await prisma.vehicle.update({
            where: { id },
            data: { status }
        });
        
        res.json({
            message: 'Status atualizado com sucesso',
            vehicle: updatedVehicle
        });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    updateVehicleStatus
}