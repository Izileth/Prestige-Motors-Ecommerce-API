const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const handlePrismaError = (error, res) => {
    console.error('Erro Prisma:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2025': // Registro não encontrado
                return res.status(404).json({ message: 'Favorito não encontrado.' });
            case 'P2003': // Violação de chave estrangeira
                return res.status(400).json({ message: 'Referência inválida.' });
            default:
                return res.status(400).json({ message: `Erro na requisição: ${error.code}` });
        }
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        return res.status(400).json({ message: 'Dados inválidos fornecidos.' });
    }
    
    return res.status(500).json({ message: 'Erro no servidor' });
};

const removeFavoriteVehicle = async (req, res) => {
    try {
        const { id: vehicleId } = req.params;
        const userId = req.user.id;

        // Verificar se o favorito existe
        const favorite = await prisma.favorites.findUnique({
            where: {
                userId_vehicleId: {
                    userId,
                    vehicleId
                }
            }
        });

        if (!favorite) {
            return res.status(404).json({ 
                success: false,
                message: 'Veículo não encontrado nos favoritos' 
            });
        }

        // Remover dos favoritos
        await prisma.favorites.delete({
            where: {
                id: favorite.id
            }
        });

        return res.status(200).json({ 
            success: true,
            favorited: false,
            message: 'Veículo removido dos favoritos com sucesso' 
        });

    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    removeFavoriteVehicle
};