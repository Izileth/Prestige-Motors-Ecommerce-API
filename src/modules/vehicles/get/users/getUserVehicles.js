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
        // Obter o ID do usuário autenticado
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
            vendedorId: userId // Filtrar apenas veículos do usuário logado
        };

        // Filtros adicionais
        if (marca) where.marca = { contains: marca, mode: 'insensitive' };
        if (modelo) where.modelo = { contains: modelo, mode: 'insensitive' };
        if (status) where.status = status; // Assumindo que você adicionou um campo status ao modelo

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

        // Pesquisa global em marca e modelo
        if (search) {
            where.OR = [
                { marca: { contains: search, mode: 'insensitive' } },
                { modelo: { contains: search, mode: 'insensitive' } },
                { descricao: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Configurar ordenação
        const orderFields = orderBy.split(',').map(field => ({
            [field]: orderDirection.toLowerCase() === 'asc' ? 'asc' : 'desc'
        }));

        // Executar as consultas
        const [vehicles, totalCount] = await Promise.all([
            prisma.vehicle.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: orderFields,
                include: {
                    // Opcionalmente incluir informações relacionadas, como visualizações ou favoritos
                    // Se tiver outros modelos relacionados, você pode incluí-los aqui
                }
            }),
            prisma.vehicle.count({ where })
        ]);

        // Adicionar estatísticas específicas do usuário
        const userStats = await prisma.$transaction([
            // Quantidade total de veículos do usuário
            prisma.vehicle.count({ where: { vendedorId: userId } }),
            
            // Preço médio dos veículos do usuário
            prisma.vehicle.aggregate({
                where: { vendedorId: userId },
                _avg: { preco: true }
            }),
            
            // Veículo mais visualizado (assumindo que existe um modelo ou campo de visualizações)
            // Isso é apenas um exemplo - ajuste conforme seu modelo de dados
            /*
            prisma.vehicle.findFirst({
                where: { vendedorId: userId },
                orderBy: { visualizacoes: 'desc' }
            })
            */
        ]);

        // Calcular metadados da paginação
        const totalPages = Math.ceil(totalCount / limitNum);

        // Resposta
        res.json({
            data: vehicles,
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
                averagePrice: userStats[1]._avg.preco,
                // topVehicle: userStats[2] // Descomente se implementar a consulta acima
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
}