const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixAddresses() {
  const addresses = await prisma.endereco.findMany({
    where: { createdAt: null },
  });

  for (const addr of addresses) {
    await prisma.endereco.update({
      where: { id: addr.id },
      data: { createdAt: new Date(addr._id.getTimestamp()) },
    });
  }
}

fixAddresses()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
