// Crie um script temporário (ex: fix-buggy-enum.js)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEnum() {
  await prisma.vehicle.updateMany({
    where: { carroceria: "BUGGY" },
    data: { carroceria: "BUGGY" } // Força a escrita correta
  });
  console.log("Valores de carroceria atualizados");
}

fixEnum()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());