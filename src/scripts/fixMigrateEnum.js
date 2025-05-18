// scripts/migrateEnums.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateAllEnums() {
  await prisma.$transaction([
    // Carroceria
    prisma.vehicle.updateMany({
      where: { carroceria:  'BUGGY' },
      data: { carroceria: 'BUGGY' }
    }),
    
    // Categoria
    prisma.vehicle.updateMany({
      where: { categoria: 'HOT_HATCH' },
      data: { categoria: 'HOT_HATCH' }
    }),
    
    // Adicione outros enums conforme necessário
  ]);
  console.log('✅ Todos os enums foram migrados!');
}

migrateAllEnums()
  .catch(console.error)
  .finally(() => prisma.$disconnect());