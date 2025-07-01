const { PrismaClient} = require('@prisma/client');

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
        
        // Adicionando variações em português
        'hipercarro': 'HYPERCAR',
        'superesportivo': 'SPORTS_CAR',
        'carro de corrida': 'TRACK_TOY',
        'brinquedo de pista': 'TRACK_TOY',
        'caminhonete 4x4': 'PICKUP_4X4',
        'utilitário esportivo': 'SUV',
        'hatchback': 'HOT_HATCH',
        'cupê': 'COUPE',
        'perua': 'PERUA',
        'station wagon': 'PERUA',
        'minivan': 'MINIVAN',
        'van': 'VAN'
    }
};



const sanitizeEnum = (value, enumType) => {
    if (!value) return undefined;
    
    const input = value.toString().trim().toLowerCase();
    
    // Verifica nos mapeamentos primeiro
    for (const [key, mappings] of Object.entries(ENUM_MAPPINGS)) {
        if (mappings[input] && mappings[input] === enumType[mappings[input]]) {
        return mappings[input];
        }
    }
    
    // Se não encontrou no mapeamento, tenta diretamente
    const directMatch = Object.values(enumType).find(
        v => v.toString().toLowerCase() === input
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
            where.tipoCombustivel = sanitizeEnum(combustivel, {
                GASOLINA: 'GASOLINA',
                ETANOL: 'ETANOL',
                FLEX: 'FLEX',
                DIESEL: 'DIESEL',
                ELETRICO: 'ELETRICO',
                HIBRIDO: 'HIBRIDO',
                GNV: 'GNV'
            });
        }

        if (cambio) {
            where.cambio = sanitizeEnum(cambio, {
                MANUAL: 'MANUAL',
                AUTOMATICO: 'AUTOMATICO',
                SEMI_AUTOMATICO: 'SEMI_AUTOMATICO',
                CVT: 'CVT'
            });
        }

        if (carroceria) {
            where.carroceria = sanitizeEnum(carroceria, {
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
        }

        if (categoria) {
            where.categoria = sanitizeEnum(categoria, {
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
        }

        console.log('Filtro combustivel:', combustivel, '->', where.tipoCombustivel);
        console.log('Filtro cambio:', cambio, '->', where.cambio);
        console.log('Filtro carroceria:', carroceria, '->', where.carroceria);
        console.log('Filtro categoria:', categoria, '->', where.categoria);

        
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