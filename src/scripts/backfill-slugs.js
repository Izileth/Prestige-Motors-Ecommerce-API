const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');

const prisma = new PrismaClient();

async function backfillSlugs() {
    try {
        const vehicles = await prisma.vehicle.findMany();

        for (const vehicle of vehicles) {
            const slug = slugify(`${vehicle.marca}-${vehicle.modelo}-${vehicle.anoFabricacao}`, { lower: true });

            await prisma.vehicle.update({
                where: { id: vehicle.id },
                data: { slug },
            });

            console.log(`Slug gerado para o veículo ${vehicle.id}: ${slug}`);
        }

        console.log('Backfill de slugs concluído com sucesso!');
    } catch (error) {
        console.error('Erro durante o backfill de slugs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backfillSlugs();