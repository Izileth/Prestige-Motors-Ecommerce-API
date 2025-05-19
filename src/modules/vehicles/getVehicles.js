const { PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();

// Utilitário para sanitizar enums

const sanitizeEnum = (value, enumType) => {
    if (!value) return undefined;
    
    // Converte para string e padroniza (ex: 'buggy' → 'BUGGY')
    const strValue = value.toString().toUpperCase().trim();
    
    // Lista de valores válidos do enum (em maiúsculas)
    const validValues = Object.values(enumType).map(v => v.toString().toUpperCase());
    
    // Retorna o valor sanitizado se for válido
    return validValues.includes(strValue) ? strValue : undefined;
};

// Utilitário para sanitizar filtros numéricos
const sanitizeNumber = (value, min, max) => {
  const num = Number(value);
  return isNaN(num) ? undefined : Math.max(min, Math.min(max, num));
};

const getVehicles = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 100,
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
            carroceria,
            destaque,
            kmMin,
            kmMax,
            orderBy = 'createdAt',
            orderDirection = 'desc'
        } = req.query;

        // Sanitização básica dos parâmetros
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(parseInt(limit) || 100, 200); // Limite máximo de 200 itens

        const where = {
            status: 'DISPONIVEL'
        };

        // Filtros de texto (com sanitização)
        if (userId) where.vendedorId = userId.toString().trim();
        if (marca) where.marca = { contains: marca.toString().trim(), mode: 'insensitive' };
        if (modelo) where.modelo = { contains: modelo.toString().trim(), mode: 'insensitive' };
        
        // Filtros numéricos com sanitização
        if (anoMin || anoMax) {
            where.anoFabricacao = {};
            where.anoModelo = {};
            
            const currentYear = new Date().getFullYear();
            if (anoMin) {
                const min = sanitizeNumber(anoMin, 1900, currentYear);
                if (min) {
                    where.anoFabricacao.gte = min;
                    where.anoModelo.gte = min;
                }
            }
            if (anoMax) {
                const max = sanitizeNumber(anoMax, 1900, currentYear + 1);
                if (max) {
                    where.anoFabricacao.lte = max;
                    where.anoModelo.lte = max;
                }
            }
        }

        // Faixa de preço
        if (precoMin || precoMax) {
            where.preco = {};
            if (precoMin) {
                const min = sanitizeNumber(precoMin, 0, Number.MAX_SAFE_INTEGER);
                if (min) where.preco.gte = min;
            }
            if (precoMax) {
                const max = sanitizeNumber(precoMax, 0, Number.MAX_SAFE_INTEGER);
                if (max) where.preco.lte = max;
            }
        }

        // Quilometragem
        if (kmMin || kmMax) {
            where.quilometragem = {};
            if (kmMin) {
                const min = sanitizeNumber(kmMin, 0, 1000000);
                if (min) where.quilometragem.gte = min;
            }
            if (kmMax) {
                const max = sanitizeNumber(kmMax, 0, 1000000);
                if (max) where.quilometragem.lte = max;
            }
        }

        // Filtros de enum com sanitização
        if (combustivel) {
            const sanitized = sanitizeEnum(combustivel, combustivel);
            if (sanitized) where.tipoCombustivel = sanitized;
        }
        if (cambio) {
            const sanitized = sanitizeEnum(cambio, cambio);
            if (sanitized) where.cambio = sanitized;
        }
        if (categoria) {
            const sanitized = sanitizeEnum(categoria, categoria);
            if (sanitized) where.categoria = sanitized;
        }
        if (carroceria) {
            const sanitized = sanitizeEnum(carroceria, carroceria);
            if (sanitized) where.carroceria = sanitized;
        }
        
        // Filtro booleano
        if (destaque !== undefined) {
            where.destaque = destaque.toString().toLowerCase() === 'true';
        }

        // Ordenação com sanitização
        const orderFields = {};
        const validOrderFields = [
            'createdAt', 'preco', 'quilometragem', 
            'anoFabricacao', 'anoModelo', 'marca', 'modelo'
        ];
        
        if (orderBy) {
            const fields = orderBy.toString().split(',');
            fields.forEach(field => {
                const [fieldName, direction] = field.trim().split(':');
                if (validOrderFields.includes(fieldName)) {
                    const dir = direction && direction.toLowerCase() === 'asc' ? 'asc' : 'desc';
                    orderFields[fieldName] = dir;
                }
            });
        }
        
        if (Object.keys(orderFields).length === 0) {
            orderFields.createdAt = 'desc';
        }

        // Execução segura da query
        let vehicles = [];
        let totalCount = 0;
        
        try {
            [vehicles, totalCount] = await Promise.all([
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
        } catch (dbError) {
            console.error('Database error:', dbError);
            // Se houver erro na query, retorna uma lista vazia mas não quebra a resposta
            vehicles = [];
            totalCount = 0;
        }

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            data: vehicles,
            meta: {
                currentPage: pageNum,
                itemsPerPage: limitNum,
                totalItems: totalCount,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
                filtersApplied: {
                    ...(combustivel && { combustivel: where.tipoCombustivel || 'invalid' }),
                    ...(cambio && { cambio: where.cambio || 'invalid' }),
                    ...(categoria && { categoria: where.categoria || 'invalid' }),
                    ...(carroceria && { carroceria: where.carroceria || 'invalid' })
                }
            }
        });
    } catch (error) {
        console.error('Erro ao buscar veículos:', error);
        res.status(500).json({ 
            message: 'Erro no servidor.',
            ...(process.env.NODE_ENV === 'development' && { error: error.message })
        });
    }
};

module.exports = {
    getVehicles
};