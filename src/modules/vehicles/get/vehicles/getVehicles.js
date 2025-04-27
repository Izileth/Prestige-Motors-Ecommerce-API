const { PrismaClient } = require('@prisma/client');
const { Prisma } = require('@prisma/client');

const prisma = new PrismaClient();

const getVehicles = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            marca,
            modelo,
            anoMin,
            anoMax,
            precoMin,
            precoMax,
            kmMin,
            kmMax,
            orderBy = 'createdAt',
            orderDirection = 'desc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const where = {};

        if (marca) where.marca = { contains: marca, mode: 'insensitive' };
        if (modelo) where.modelo = { contains: modelo, mode: 'insensitive' };

        if (anoMin || anoMax) {
            where.ano = {};
            if (anoMin) where.ano.gte = parseInt(anoMin);
            if (anoMax) where.ano.lte = parseInt(anoMax);
        }

        if (precoMin || precoMax) {
            where.preco = {};
            if (precoMin) where.preco.gte = parseFloat(precoMin);
            if (precoMax) where.preco.lte = parseFloat(precoMax);
        }

        if (kmMin || kmMax) {
            where.kilometragem = {};
            if (kmMin) where.kilometragem.gte = parseInt(kmMin);
            if (kmMax) where.kilometragem.lte = parseInt(kmMax);
        }

        const orderFields = orderBy.split(',').map(field => ({
            [field]: orderDirection.toLowerCase() === 'asc' ? 'asc' : 'desc'
        }));

        const [vehicles, totalCount] = await Promise.all([
            prisma.vehicle.findMany({
                where,
                include: {
                    vendedor: {
                        select: {
                            nome: true,
                            email: true
                        }
                    }
                },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: orderFields
            }),
            prisma.vehicle.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            data: vehicles,
            meta: {
                currentPage: pageNum,
                itemsPerPage: limitNum,
                totalItems: totalCount,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Erro ao buscar veículos:', error);
        if (error.code === 'P2010') {
            res.status(500).json({ message: 'Erro de conexão com o banco de dados. Tente novamente mais tarde.' });
        } else {
            res.status(500).json({ message: 'Erro no servidor.' });
        }
    }
};

module.exports = {
    getVehicles
}