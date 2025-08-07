const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const { handlePrismaError } = require('../../utils/errorHandler');

const getUsers = async (req, res) => {
    try {
        const { nome, email, page = 1, limit = 10 } = req.query;

        // Construir filtros dinamicamente
        const where = {};

        if (nome) {
            where.nome = { contains: nome, mode: 'insensitive' };
        }

        if (email) {
            where.email = { contains: email, mode: 'insensitive' };
        }

        // Buscar usuários com paginação
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                cpf: true,
                dataNascimento: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                isLoggedIn: true,
                lastLoginAt: true,
                loginCount: true,
                _count: {
                    select: {
                        vehicles: true
                    }
                }
            },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit),
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Contar total para paginação
        const total = await prisma.user.count({ where });

        res.json({
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports ={
    getUsers,
}