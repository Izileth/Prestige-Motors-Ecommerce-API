const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDatabase() {
    try {
        // Deletar registros de cada modelo
        await prisma.image.deleteMany();
        await prisma.vehicle.deleteMany();
        await prisma.user.deleteMany();

        console.log('Todos os dados foram deletados com sucesso.');
    } catch (error) {
        console.error('Erro ao deletar dados:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetDatabase();