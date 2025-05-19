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

const addFavoriteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Verificar se o veículo existe
        const vehicle = await prisma.vehicle.findUnique({
            where: { id }
        });
        
        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }
        
        // Verificar se já é favorito
        const existingFavorite = await prisma.favorito.findUnique({
            where: {
                userId_vehicleId: {
                    userId,
                    vehicleId: id
                }
            }
        });
        
        let result;
        
        if (existingFavorite) {
            // Remover dos favoritos
            result = await prisma.favorito.delete({
                where: {
                    id: existingFavorite.id
                }
            });
            
            return res.status(200).json({ 
                favorited: false,
                message: 'Veículo removido dos favoritos' 
            });
        } else {
            // Adicionar aos favoritos
            result = await prisma.favorito.create({
                data: {
                    userId,
                    vehicleId: id
                }
            });
            
            return res.status(200).json({ 
                favorited: true,
                message: 'Veículo adicionado aos favoritos' 
            });
        }
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    addFavoriteVehicle
}
