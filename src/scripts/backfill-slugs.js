
const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');

const prisma = new PrismaClient();

async function backfillSlugs() {
    const users = await prisma.user.findMany({
        where: {
            slug: null
        }
    });

    for (const user of users) {
        const baseSlug = slugify(user.nome, { lower: true, strict: true });
        let slug = baseSlug;
        let userWithSameSlug = await prisma.user.findUnique({ where: { slug } });
        let counter = 1;
        while (userWithSameSlug) {
            slug = `${baseSlug}-${counter}`;
            userWithSameSlug = await prisma.user.findUnique({ where: { slug } });
            counter++;
        }

        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                slug: slug
            }
        });

        console.log(`Slug gerado para o usuário ${user.nome}: ${slug}`);
    }
}

backfillSlugs()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
