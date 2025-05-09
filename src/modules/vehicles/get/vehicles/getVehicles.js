const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getVehicles = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            userId,
            marca,
            modelo,
            anoMin,
            anoMax,
            precoMin,
            precoMax,
            combustivel,
            cambio,
            categoria,
            destaque,
            kmMin,
            kmMax,
            orderBy = 'createdAt',
            orderDirection = 'desc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // Build where clause based on filters
        const where = {
            status: 'DISPONIVEL' // Only return available vehicles by default
        };

        // Filter by specific user's vehicles
        if (userId) where.vendedorId = userId;

        // Basic text filters
        if (marca) where.marca = { contains: marca, mode: 'insensitive' };
        if (modelo) where.modelo = { contains: modelo, mode: 'insensitive' };
        
        // Handle year filters - apply to both anoFabricacao and anoModelo
        if (anoMin || anoMax) {
            // Filter by fabrication year
            where.anoFabricacao = {};
            if (anoMin) where.anoFabricacao.gte = parseInt(anoMin);
            if (anoMax) where.anoFabricacao.lte = parseInt(anoMax);
            
            // Filter by model year
            where.anoModelo = {};
            if (anoMin) where.anoModelo.gte = parseInt(anoMin);
            if (anoMax) where.anoModelo.lte = parseInt(anoMax);
        }

        // Price range filter
        if (precoMin || precoMax) {
            where.preco = {};
            if (precoMin) where.preco.gte = parseFloat(precoMin);
            if (precoMax) where.preco.lte = parseFloat(precoMax);
        }

        // Mileage range filter (quilometragem in the schema)
        if (kmMin || kmMax) {
            where.quilometragem = {};
            if (kmMin) where.quilometragem.gte = parseFloat(kmMin);
            if (kmMax) where.quilometragem.lte = parseFloat(kmMax);
        }

        // Enum filters
        if (combustivel) where.tipoCombustivel = combustivel;
        if (cambio) where.cambio = cambio;
        if (categoria) where.categoria = categoria;
        
        // Boolean filter
        if (destaque !== undefined) where.destaque = destaque === 'true';

        // Parse order by fields
        const orderFields = {};
        if (orderBy) {
            const fields = orderBy.split(',');
            fields.forEach(field => {
                orderFields[field.trim()] = orderDirection.toLowerCase() === 'asc' ? 'asc' : 'desc';
            });
        } else {
            orderFields.createdAt = 'desc'; // Default ordering
        }

        // Execute query with pagination
        const [vehicles, totalCount] = await Promise.all([
            prisma.vehicle.findMany({
                where,
                include: {
                    vendedor: {
                        select: {
                            nome: true,
                            email: true,
                            telefone: true
                        }
                    },
                    imagens: {
                        select: {
                            url: true,
                            isMain: true,
                            ordem: true
                        },
                        orderBy: [
                            { isMain: 'desc' },
                            { ordem: 'asc' }
                        ]
                    },
                    localizacao: {
                        select: {
                            cidade: true,
                            estado: true
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
        if (error instanceof Error) {
            if ('code' in error && error.code === 'P2010') {
                res.status(500).json({ message: 'Erro de conexão com o banco de dados. Tente novamente mais tarde.' });
            } else {
                res.status(500).json({ message: 'Erro no servidor.', error: error.message });
            }
        } else {
            res.status(500).json({ message: 'Erro desconhecido no servidor.' });
        }
    }
};

module.exports = {
    getVehicles
};