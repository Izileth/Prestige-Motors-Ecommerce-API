const { PrismaClient } = require('@prisma/client');

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

const getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            include: {
                vendedor: {
                    select: {
                        nome: true,
                        email: true,
                        telefone: true
                    }
                }
            }
        });
        
        if (!vehicle) return res.status(404).json({ message: 'Veículo não encontrado' });
        
        res.json(vehicle);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    getVehicleById
}