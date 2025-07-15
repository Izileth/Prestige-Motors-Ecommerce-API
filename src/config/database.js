
const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
    } else {
    // Em desenvolvimento, use uma instância global para evitar múltiplas conexões
    if (!global.__prisma) {
        global.__prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
        });
    }
    prisma = global.__prisma;
}

module.exports = {
    prisma
}