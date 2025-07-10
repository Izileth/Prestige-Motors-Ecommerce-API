
const { PrismaClient, Prisma } = require('@prisma/client'); // Adicione Prisma à importação

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
const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se o veículo existe
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            select: { vendedorId: true }
        });

        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }

        // Verificar permissões
        if (vehicle.vendedorId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        // Deletar em transação para garantir integridade
        await prisma.$transaction([
            // 1. Deletar imagens relacionadas
            prisma.image.deleteMany({
                where: { vehicleId: id }
            }),
            
            // 2. Deletar outros relacionamentos se existirem (ex: videos, favoritos)
            prisma.video.deleteMany({ where: { vehicleId: id } }),
            prisma.favorites.deleteMany({ where: { vehicleId: id } }),
            
            // 3. Finalmente deletar o veículo
            prisma.vehicle.delete({
                where: { id }
            })
        ]);

        res.json({ message: 'Veículo removido com sucesso' });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    deleteVehicle
}