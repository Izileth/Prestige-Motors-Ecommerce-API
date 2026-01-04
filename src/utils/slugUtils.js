const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');

const prisma = new PrismaClient();

/**
 * Gera um slug único verificando se já existe no banco
 */
async function generateUniqueSlug(baseSlug, vehicleId) {
    let slug = baseSlug;
    let counter = 1;
    
    // Verifica se o slug já existe (excluindo o veículo atual)
    while (true) {
        const existing = await prisma.vehicle.findFirst({
            where: {
                slug: slug,
                id: { not: vehicleId }
            }
        });
        
        if (!existing) {
            return slug;
        }
        
        // Se existe, adiciona um sufixo numérico
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
}

module.exports = {
    generateUniqueSlug,
    slugify
};