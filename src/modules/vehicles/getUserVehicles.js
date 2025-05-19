const { PrismaClient } = require('@prisma/client');
const { Prisma } = require('@prisma/client');

const prisma = new PrismaClient();

const handlePrismaError = (error, res) => {
    console.error('Erro Prisma:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Erro conhecido do Prisma
        switch (error.code) {
            case 'P2002': // Violação de unicidade
                return res.status(409).json({ message: 'Conflito: registro com este valor já existe.' });
            case 'P2025': // Registro não encontrado
                return res.status(404).json({ message: 'Registro não encontrado.' });
            case 'P2003': // Violação de chave estrangeira
                return res.status(400).json({ message: 'Referência inválida.' });
            default:
                return res.status(400).json({ message: `Erro na requisição: ${error.code}` });
        }
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        // Erro de validação
        return res.status(400).json({ message: 'Dados inválidos fornecidos.' });
    }
    
    // Erro genérico
    return res.status(500).json({ message: 'Erro no servidor' });
};
const getUserVehicles = async (req, res) => {
    try {
        const userId = req.user.id;

        // Parâmetros de paginação e filtros
        const {
            page = 1,
            limit = 10,
            status,
            marca,
            modelo,
            anoMin,
            anoMax,
            precoMin,
            precoMax,
            kmMin,
            kmMax,
            orderBy = 'createdAt',
            orderDirection = 'desc',
            search
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // Construir condições de filtro
        const where = {
            vendedorId: userId
        };

        // Filtros adicionais (mantenha os existentes)
        if (marca) where.marca = { contains: marca, mode: 'insensitive' };
        if (modelo) where.modelo = { contains: modelo, mode: 'insensitive' };
        if (status) where.status = status;

        if (anoMin || anoMax) {
            where.anoFabricacao = {};
            if (anoMin) where.anoFabricacao.gte = parseInt(anoMin);
            if (anoMax) where.anoFabricacao.lte = parseInt(anoMax);
        }

        if (precoMin || precoMax) {
            where.preco = {};
            if (precoMin) where.preco.gte = parseFloat(precoMin);
            if (precoMax) where.preco.lte = parseFloat(precoMax);
        }

        if (kmMin || kmMax) {
            where.quilometragem = {};
            if (kmMin) where.quilometragem.gte = parseInt(kmMin);
            if (kmMax) where.quilometragem.lte = parseInt(kmMax);
        }

        if (search) {
            where.OR = [
                { marca: { contains: search, mode: 'insensitive' } },
                { modelo: { contains: search, mode: 'insensitive' } },
                { descricao: { contains: search, mode: 'insensitive' } }
            ];
        }

        const orderFields = orderBy.split(',').map(field => ({
            [field]: orderDirection.toLowerCase() === 'asc' ? 'asc' : 'desc'
        }));

        // Atualize a consulta para incluir imagens
        const [vehicles, totalCount] = await Promise.all([
            prisma.vehicle.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: orderFields,
                include: {
                    imagens: {
                        select: {
                            id: true,
                            url: true,
                            isMain: true,
                            ordem: true
                        },
                        orderBy: {
                            ordem: 'asc'
                        }
                    },
                    vendedor: {
                        select: {
                            id: true,
                            nome: true
                        }
                    }
                }
            }),
            prisma.vehicle.count({ where })
        ]);

        // Estatísticas
        const userStats = await prisma.$transaction([
            prisma.vehicle.count({ where: { vendedorId: userId } }),
            prisma.vehicle.aggregate({
                where: { vendedorId: userId },
                _avg: { preco: true }
            })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            data: vehicles.map(vehicle => ({
                ...vehicle,
                // Garante que imagens seja um array mesmo se vazio
                imagens: vehicle.imagens || []
            })),
            meta: {
                currentPage: pageNum,
                itemsPerPage: limitNum,
                totalItems: totalCount,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
            stats: {
                totalVehicles: userStats[0],
                averagePrice: userStats[1]._avg.preco
            }
        });
    } catch (error) {
        console.error('Erro ao buscar veículos do usuário:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Parâmetros inválidos', errors: error.errors });
        }
        handlePrismaError(error, res);
    }
};

module.exports = {
    getUserVehicles
};