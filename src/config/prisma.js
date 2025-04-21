// config/prisma.js
const { PrismaClient } = require("@prisma/client");
require('dotenv').config();


if (!process.env.DATABASE_URL) {
    console.error("⚠️ DATABASE_URL não foi encontrada no .env!");
    process.exit(1);
}
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

// Função para conectar e verificar a conexão
async function connectDB() {
    try {
        await prisma.$connect();
        console.log("✅ Conectado ao MongoDB via Prisma!");
        return prisma;
    } catch (error) {
        console.error("❌ Erro ao conectar ao MongoDB via Prisma:", error);
        process.exit(1);
    }
}

module.exports = { prisma, connectDB };