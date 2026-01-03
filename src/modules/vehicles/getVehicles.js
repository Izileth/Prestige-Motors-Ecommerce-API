const { PrismaClient } = require('@prisma/client');
const redisClient = require('../../config/redis');

const prisma = new PrismaClient();

const ENUM_MAPPINGS = {
    combustivel: {
        'gasolina': 'GASOLINA',
        'etanol': 'ETANOL',
        'flex': 'FLEX',
        'diesel': 'DIESEL',
        'elétrico': 'ELETRICO',
        'eletrico': 'ELETRICO',
        'híbrido': 'HIBRIDO',
        'hibrido': 'HIBRIDO',
        'gnv': 'GNV'
    },
    cambio: {
        'manual': 'MANUAL',
        'automático': 'AUTOMATICO',
        'automatico': 'AUTOMATICO',
        'semi-automático': 'SEMI_AUTOMATICO',
        'semi automatico': 'SEMI_AUTOMATICO',
        'semiautomatico': 'SEMI_AUTOMATICO',
        'cvt': 'CVT'
    },
    carroceria: {
        'hatch': 'HATCH',
        'sedã': 'SEDAN',
        'sedan': 'SEDAN',
        'suv': 'SUV',
        'picape': 'PICAPE',
        'coupé': 'COUPE',
        'coupe': 'COUPE',
        'conversível': 'CONVERSIVEL',
        'conversivel': 'CONVERSIVEL',
        'perua': 'PERUA',
        'minivan': 'MINIVAN',
        'van': 'VAN',
        'buggy': 'BUGGY',
        'offroad': 'OFFROAD'
    },
    categoria: {
        'hyper car': 'HYPERCAR',
        'hipercarro': 'HYPERCAR',
        'supercar': 'SUPERCAR',
        'super car': 'SUPERCAR',
        'supercarro': 'SUPERCAR',
        'esportivo': 'SPORTS_CAR',
        'esporte': 'SPORTS_CAR',
        'sports': 'SPORTS_CAR',
        'sports car': 'SPORTS_CAR',
        'carro esportivo': 'SPORTS_CAR',
        'muscle classico': 'CLASSIC_MUSCLE',
        'muscle clássico': 'CLASSIC_MUSCLE',
        'muscle': 'CLASSIC_MUSCLE',
        'muscle car': 'CLASSIC_MUSCLE',
        'carro muscle': 'CLASSIC_MUSCLE',
        'muscle moderno': 'MODERN_MUSCLE',
        'modern muscle': 'MODERN_MUSCLE',
        'retro super': 'RETRO_SUPER',
        'retro': 'RETRO_SUPER',
        'super retro': 'RETRO_SUPER',
        'drift': 'DRIFT_CAR',
        'drift car': 'DRIFT_CAR',
        'carro drift': 'DRIFT_CAR',
        'track toy': 'TRACK_TOY',
        'brinquedo pista': 'TRACK_TOY',
        'offroad': 'OFFROAD',
        'fora de estrada': 'OFFROAD',
        '4x4': 'OFFROAD',
        'buggy': 'BUGGY',
        'pickup 4x4': 'PICKUP_4X4',
        'picape 4x4': 'PICKUP_4X4',
        'caminhonete': 'PICKUP_4X4',
        'suv': 'SUV',
        'utilitaire': 'SUV',
        'hot hatch': 'HOT_HATCH',
        'hatch esportivo': 'HOT_HATCH',
        'hatch quente': 'HOT_HATCH',
        'saloon': 'SALOON',
        'sedan': 'SALOON',
        'sedã': 'SALOON',
        'gt': 'GT',
        'grand tourer': 'GT',
        'gran turismo': 'GT',
        'rally': 'RALLY',
        'rali': 'RALLY',
        'concept': 'CONCEPT',
        'conceito': 'CONCEPT',
        'carro conceito': 'CONCEPT',
        'superesportivo': 'SPORTS_CAR',
        'carro de corrida': 'TRACK_TOY',
        'brinquedo de pista': 'TRACK_TOY',
        'caminhonete 4x4': 'PICKUP_4X4',
        'utilitário esportivo': 'SUV',
        'hatchback': 'HOT_HATCH',
        'cupê': 'COUPE',
        'station wagon': 'PERUA'
    }
};

// Função corrigida para sanitizar enums
const sanitizeEnum = (value, enumType) => {
    if (!value) return undefined;
    
    const input = value.toString().trim().toLowerCase();
    
    // Tenta encontrar o mapeamento correspondente
    for (const [mapType, mappings] of Object.entries(ENUM_MAPPINGS)) {
        // Verifica se o valor de entrada existe no mapeamento
        if (mappings[input]) {
            const mappedValue = mappings[input];
            // Verifica se o valor mapeado existe no enum fornecido
            if (enumType[mappedValue]) {
                return mappedValue;
            }
        }
    }
    
    // Se não encontrou no mapeamento, tenta match direto com o enum
    const directMatch = Object.keys(enumType).find(
        key => key.toLowerCase() === input
    );
    
    return directMatch || undefined;
};

// Utilitário para sanitizar filtros numéricos
const sanitizeNumber = (value, min, max) => {
    const num = Number(value);
    return isNaN(num) ? undefined : Math.max(min, Math.min(max, num));
};

const getVehicles = async (req, res) => {
    try {
        const cacheKey = `vehicles:${JSON.stringify(req.query)}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

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
        const limitNum = Math.min(parseInt(limit) || 100, 200);

        const where = {};
        
        // Comentado para teste - descomente se o campo status existir no seu schema
        // where.status = 'DISPONIVEL';

        // Filtros de texto (com sanitização)
        if (userId) where.vendedorId = userId.toString().trim();
        if (marca) where.marca = { contains: marca.toString().trim(), mode: 'insensitive' };
        if (modelo) where.modelo = { contains: modelo.toString().trim(), mode: 'insensitive' };
        
        // CORREÇÃO: Filtros de ano usando OR para flexibilidade
        if (anoMin || anoMax) {
            const anoFilter = {};
            const currentYear = new Date().getFullYear();
            
            if (anoMin) {
                const min = sanitizeNumber(anoMin, 1900, currentYear);
                if (min !== undefined) anoFilter.gte = min;
            }
            if (anoMax) {
                const max = sanitizeNumber(anoMax, 1900, currentYear + 1);
                if (max !== undefined) anoFilter.lte = max;
            }
            
            // Usa OR para permitir que anoFabricacao OU anoModelo satisfaça o filtro
            if (Object.keys(anoFilter).length > 0) {
                where.OR = [
                    { anoFabricacao: anoFilter },
                    { anoModelo: anoFilter }
                ];
            }
        }

        // Faixa de preço
        if (precoMin || precoMax) {
            where.preco = {};
            if (precoMin) {
                const min = sanitizeNumber(precoMin, 0, Number.MAX_SAFE_INTEGER);
                if (min !== undefined) where.preco.gte = min;
            }
            if (precoMax) {
                const max = sanitizeNumber(precoMax, 0, Number.MAX_SAFE_INTEGER);
                if (max !== undefined) where.preco.lte = max;
            }
        }

        // Quilometragem
        if (kmMin || kmMax) {
            where.quilometragem = {};
            if (kmMin) {
                const min = sanitizeNumber(kmMin, 0, 1000000);
                if (min !== undefined) where.quilometragem.gte = min;
            }
            if (kmMax) {
                const max = sanitizeNumber(kmMax, 0, 1000000);
                if (max !== undefined) where.quilometragem.lte = max;
            }
        }

        // Filtros de enum com sanitização corrigida
        if (combustivel) {
            const sanitized = sanitizeEnum(combustivel, {
                GASOLINA: 'GASOLINA',
                ETANOL: 'ETANOL',
                FLEX: 'FLEX',
                DIESEL: 'DIESEL',
                ELETRICO: 'ELETRICO',
                HIBRIDO: 'HIBRIDO',
                GNV: 'GNV'
            });
            if (sanitized) where.tipoCombustivel = sanitized;
        }

        if (cambio) {
            const sanitized = sanitizeEnum(cambio, {
                MANUAL: 'MANUAL',
                AUTOMATICO: 'AUTOMATICO',
                SEMI_AUTOMATICO: 'SEMI_AUTOMATICO',
                CVT: 'CVT'
            });
            if (sanitized) where.cambio = sanitized;
        }

        if (carroceria) {
            const sanitized = sanitizeEnum(carroceria, {
                HATCH: 'HATCH',
                SEDAN: 'SEDAN',
                SUV: 'SUV',
                PICAPE: 'PICAPE',
                COUPE: 'COUPE',
                CONVERSIVEL: 'CONVERSIVEL',
                PERUA: 'PERUA',
                MINIVAN: 'MINIVAN',
                VAN: 'VAN',
                BUGGY: 'BUGGY',
                OFFROAD: 'OFFROAD'
            });
            if (sanitized) where.carroceria = sanitized;
        }

        if (categoria) {
            const sanitized = sanitizeEnum(categoria, {
                HYPERCAR: 'HYPERCAR',
                SUPERCAR: 'SUPERCAR',
                SPORTS_CAR: 'SPORTS_CAR',
                CLASSIC_MUSCLE: 'CLASSIC_MUSCLE',
                MODERN_MUSCLE: 'MODERN_MUSCLE',
                RETRO_SUPER: 'RETRO_SUPER',
                DRIFT_CAR: 'DRIFT_CAR',
                TRACK_TOY: 'TRACK_TOY',
                OFFROAD: 'OFFROAD',
                BUGGY: 'BUGGY',
                PICKUP_4X4: 'PICKUP_4X4',
                SUV: 'SUV',
                HOT_HATCH: 'HOT_HATCH',
                SALOON: 'SALOON',
                GT: 'GT',
                RALLY: 'RALLY',
                CONCEPT: 'CONCEPT'
            });
            if (sanitized) where.categoria = sanitized;
        }

        // Logs para debug
        console.log('=== DEBUG FILTROS ===');
        console.log('Query params:', req.query);
        console.log('WHERE construído:', JSON.stringify(where, null, 2));
        console.log('Filtros aplicados:');
        console.log('  - combustivel:', combustivel, '->', where.tipoCombustivel);
        console.log('  - cambio:', cambio, '->', where.cambio);
        console.log('  - carroceria:', carroceria, '->', where.carroceria);
        console.log('  - categoria:', categoria, '->', where.categoria);

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

        // Log de contagem total antes dos filtros (para debug)
        try {
            const totalVehicles = await prisma.vehicle.count();
            console.log(`Total de veículos no banco: ${totalVehicles}`);
        } catch (countError) {
            console.log('Erro ao contar veículos:', countError.message);
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

            console.log(`Veículos encontrados com filtros: ${totalCount}`);
            console.log(`Veículos retornados nesta página: ${vehicles.length}`);
            
        } catch (dbError) {
            console.error('Erro na query do banco:', dbError);
            console.error('Stack:', dbError.stack);
            
            // Retorna erro mais específico em desenvolvimento
            if (process.env.NODE_ENV === 'development') {
                return res.status(500).json({ 
                    message: 'Erro ao executar query no banco de dados',
                    error: dbError.message,
                    where: where
                });
            }
            
            vehicles = [];
            totalCount = 0;
        }

        const totalPages = Math.ceil(totalCount / limitNum);

        const response = {
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
                    ...(carroceria && { carroceria: where.carroceria || 'invalid' }),
                    ...(anoMin && { anoMin }),
                    ...(anoMax && { anoMax }),
                    ...(precoMin && { precoMin }),
                    ...(precoMax && { precoMax })
                }
            }
        };

        // Cache apenas se houver resultados
        if (totalCount > 0) {
            await redisClient.set(cacheKey, JSON.stringify(response), {
                EX: 3600 // Cache por 1 hora
            });
        }

        res.json(response);
        
    } catch (error) {
        console.error('Erro geral ao buscar veículos:', error);
        console.error('Stack completo:', error.stack);
        
        res.status(500).json({ 
            message: 'Erro no servidor.',
            ...(process.env.NODE_ENV === 'development' && { 
                error: error.message,
                stack: error.stack 
            })
        });
    }
};

module.exports = {
    getVehicles
};