const { PrismaClient } = require('@prisma/client');
const { Prisma } = require('@prisma/client');

const prisma = new PrismaClient();

const { z } = require('zod');

const { 
    Combustivel, 
    Cambio, 
    Carroceria, 
    Categoria, 
    Classe, 
    StatusVeiculo 
} = require('@prisma/client');

const vehicleSchema = z.object({
    marca: z.string(),
    modelo: z.string(),
    anoFabricacao: z.number().int(),
    anoModelo: z.number().int(),
    preco: z.number().positive(),
    precoPromocional: z.number().positive().optional(),
    descricao: z.string().optional(),
    quilometragem: z.number().positive(),
    tipoCombustivel: z.enum(Object.values(Combustivel )),
    cambio: z.enum(Object.values(Cambio)),
    cor: z.string(),
    portas: z.number().int().min(2).max(5),
    finalPlaca: z.number().int().min(0).max(9).optional(),
    carroceria: z.enum(Object.values(Carroceria)),
    potencia: z.number().int().positive().optional(),
    motor: z.string().optional(),
    categoria: z.enum(Object.values(Categoria)),
    classe: z.enum(Object.values(Classe)),
    status: z.enum(Object.values(StatusVeiculo)).default('DISPONIVEL'),
    destaque: z.boolean().default(false),
    seloOriginal: z.boolean().default(false),
    aceitaTroca: z.boolean().default(false),
    parcelamento: z.number().positive().optional(),
    localizacaoId: z.string().optional()
});


// Função auxiliar para tratar erros do Prisma
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

// Adicione esses métodos:

const uploadImages = async (req, res) => {
    try {
        const { id } = req.params;
        const images = req.files.map(file => ({
        url: file.path,
        isMain: false,
        ordem: 0,
        vehicleId: id
        }));

        await prisma.image.createMany({ data: images });
        res.status(201).json({ success: true, images });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

const uploadVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const video = await prisma.video.create({
        data: {
            url: req.file.path,
            isMain: true,
            vehicleId: id
        }
        });
        res.status(201).json({ success: true, video });
    } catch (error) {
        handlePrismaError(error, res);
    }
};




const createVehicle = async (req, res) => {
    try {
        const data = vehicleSchema.parse(req.body);
        const vehicle = await prisma.vehicle.create({
        data: {
            ...data,
            vendedorId: req.user.id,
            imagens: data.imagens ? {
            create: data.imagens.map(img => ({ url: img }))
            } : undefined,
            videos: data.videos ? {
            create: data.videos.map(video => ({ url: video }))
            } : undefined
        },
        include: {
            vendedor: {
            select: {
                id: true,
                nome: true
            }
            }
        }
        });
        
        res.status(201).json(vehicle);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
        }
        handlePrismaError(error, res);
    }
};


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

// Adicione estas funções ao vehicleController.js

// 1. Função para registrar visualização de veículo
const registerVehicleView = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id; // Opcional - pode ser null para usuários não autenticados
        
        // Obter IP e user agent
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        // Verificar se o veículo existe
        const vehicle = await prisma.vehicle.findUnique({
            where: { id }
        });
        
        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }
        
        // Incrementar contador de visualizações do veículo
        await prisma.vehicle.update({
            where: { id },
            data: {
                visualizacoes: {
                    increment: 1
                }
            }
        });
        
        // Registrar log detalhado de visualização
        await prisma.viewLog.create({
            data: {
                vehicleId: id,
                userId,
                ipAddress,
                userAgent
            }
        });
        
        return res.status(200).json({ message: 'Visualização registrada com sucesso' });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

// 2. Função para adicionar/remover favorito (toggle)
const toggleFavorite = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Verificar se o veículo existe
        const vehicle = await prisma.vehicle.findUnique({
            where: { id }
        });
        
        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }
        
        // Verificar se já é favorito
        const existingFavorite = await prisma.favorito.findUnique({
            where: {
                userId_vehicleId: {
                    userId,
                    vehicleId: id
                }
            }
        });
        
        let result;
        
        if (existingFavorite) {
            // Remover dos favoritos
            result = await prisma.favorito.delete({
                where: {
                    id: existingFavorite.id
                }
            });
            
            return res.status(200).json({ 
                favorited: false,
                message: 'Veículo removido dos favoritos' 
            });
        } else {
            // Adicionar aos favoritos
            result = await prisma.favorito.create({
                data: {
                    userId,
                    vehicleId: id
                }
            });
            
            return res.status(200).json({ 
                favorited: true,
                message: 'Veículo adicionado aos favoritos' 
            });
        }
    } catch (error) {
        handlePrismaError(error, res);
    }
};

// 3. Função para listar favoritos do usuário
const getUserFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        const [favorites, totalCount] = await Promise.all([
            prisma.favorito.findMany({
                where: {
                    userId
                },
                include: {
                    vehicle: {
                        include: {
                            vendedor: {
                                select: {
                                    nome: true,
                                    email: true
                                }
                            }
                        }
                    }
                },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.favorito.count({
                where: {
                    userId
                }
            })
        ]);
        
        // Formatar dados para melhor visualização
        const formattedFavorites = favorites.map(fav => ({
            favoriteId: fav.id,
            favoritedAt: fav.createdAt,
            vehicle: fav.vehicle
        }));
        
        const totalPages = Math.ceil(totalCount / limitNum);
        
        res.json({
            data: formattedFavorites,
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
        handlePrismaError(error, res);
    }
};

// 4. Função para atualizar status de um veículo
const updateVehicleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Validar status
        const validStatus = ['DISPONIVEL', 'VENDIDO', 'RESERVADO', 'INATIVO'];
        if (!validStatus.includes(status)) {
            return res.status(400).json({ 
                message: 'Status inválido', 
                validStatus
            });
        }
        
        // Verificar se o veículo existe
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            select: {
                id: true,
                vendedorId: true
            }
        });
        
        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }
        
        // Verificar permissão (proprietário ou admin)
        if (vehicle.vendedorId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Acesso negado: você não tem permissão para atualizar este veículo' });
        }
        
        // Atualizar status
        const updatedVehicle = await prisma.vehicle.update({
            where: { id },
            data: { status }
        });
        
        res.json({
            message: 'Status atualizado com sucesso',
            vehicle: updatedVehicle
        });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

// 5. Função para obter estatísticas de visualizações de veículos do usuário

const getUserVehicleStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Período (últimos 30 dias por padrão)
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        
        // Estatísticas de visualizações
        const viewStats = await prisma.$transaction([
            // Estatísticas agregadas dos veículos
            prisma.vehicle.aggregate({
                where: { 
                    vendedorId: userId 
                },
                _sum: { 
                    visualizacoes: true,
                    preco: true
                },
                _avg: {
                    preco: true,
                    quilometragem: true
                },
                _count: {
                    _all: true
                }
            }),
            
            // Top 5 veículos mais visualizados
            prisma.vehicle.findMany({
                where: { 
                    vendedorId: userId 
                },
                orderBy: { 
                    visualizacoes: 'desc' 
                },
                take: 5,
                select: {
                    id: true,
                    marca: true,
                    modelo: true,
                    anoFabricacao: true,
                    anoModelo: true,
                    preco: true,
                    precoPromocional: true,
                    visualizacoes: true,
                    status: true,
                    imagens: {
                        where: { isMain: true },
                        take: 1,
                        select: { url: true }
                    }
                }
            }),
            
            // Visualizações detalhadas por período
            prisma.viewLog.groupBy({
                by: ['createdAt'],
                where: {
                    vehicle: {
                        vendedorId: userId
                    },
                    createdAt: {
                        gte: startDate
                    }
                },
                _count: {
                    _all: true
                },
                orderBy: {
                    createdAt: 'asc'
                }
            }),
            
            // Total de favoritos
            prisma.favorito.count({
                where: {
                    vehicle: {
                        vendedorId: userId
                    }
                }
            }),
            
            // Distribuição por status
            prisma.vehicle.groupBy({
                by: ['status'],
                where: {
                    vendedorId: userId
                },
                _count: {
                    _all: true
                }
            })
        ]);
        
        // Formatar dados de visualizações por dia
        const viewsByDayMap = new Map();
        viewStats[2].forEach(item => {
            const dateStr = item.createdAt.toISOString().split('T')[0];
            viewsByDayMap.set(dateStr, (viewsByDayMap.get(dateStr) || 0) + item._count._all);
        });
        
        // Converter para array ordenado
        const viewsByDay = Array.from(viewsByDayMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Formatar distribuição por status
        const statusDistribution = viewStats[4].reduce((acc, curr) => {
            acc[curr.status] = curr._count._all;
            return acc;
        }, {});
        
        // Resposta completa alinhada com o schema
        res.json({
            summary: {
                totalVehicles: viewStats[0]._count._all || 0,
                totalViews: viewStats[0]._sum.visualizacoes || 0,
                totalValue: viewStats[0]._sum.preco || 0,
                averagePrice: viewStats[0]._avg.preco || 0,
                averageMileage: viewStats[0]._avg.quilometragem || 0,
                totalFavorites: viewStats[3] || 0,
                statusDistribution
            },
            topPerformers: viewStats[1].map(vehicle => ({
                ...vehicle,
                mainImage: vehicle.imagens[0]?.url || null
            })),
            viewsTrend: viewsByDay,
            timeRange: {
                start: startDate.toISOString(),
                end: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error in getUserVehicleStats:', error);
        handlePrismaError(error, res);
    }
};

const getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            include: {
                vendedor: {
                    select: {
                        nome: true,
                        email: true,
                        telefone: true
                    }
                }
            }
        });
        
        if (!vehicle) return res.status(404).json({ message: 'Veículo não encontrado' });
        
        res.json(vehicle);
    } catch (error) {
        handlePrismaError(error, res);
    }
};
// Função para listar veículos por usuário

const updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se o veículo existe
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            select: {
                id: true,
                vendedorId: true
            }
        });

        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }

        // Verificar se o usuário é o proprietário do veículo ou um admin
        if (vehicle.vendedorId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Acesso negado: você não tem permissão para atualizar este veículo' });
        }

        // Validar os dados recebidos com vehicleSchema para consistência, mas tornando todos os campos opcionais
        const updateData = {};
        const validatedData = req.body;

        // Mapear campos do request para o modelo do banco de dados
        if (validatedData.marca !== undefined) updateData.marca = validatedData.marca;
        if (validatedData.modelo !== undefined) updateData.modelo = validatedData.modelo;
        if (validatedData.anoFabricacao !== undefined) updateData.anoFabricacao = validatedData.anoFabricacao;
        if (validatedData.anoModelo !== undefined) updateData.anoModelo = validatedData.anoModelo; 
        if (validatedData.preco !== undefined) updateData.preco = validatedData.preco;
        if (validatedData.precoPromocional !== undefined) updateData.precoPromocional = validatedData.precoPromocional;
        if (validatedData.descricao !== undefined) updateData.descricao = validatedData.descricao;
        if (validatedData.quilometragem !== undefined) updateData.quilometragem = validatedData.quilometragem;
        if (validatedData.tipoCombustivel !== undefined) updateData.tipoCombustivel = validatedData.tipoCombustivel;
        if (validatedData.cambio !== undefined) updateData.cambio = validatedData.cambio;
        if (validatedData.cor !== undefined) updateData.cor = validatedData.cor;
        if (validatedData.portas !== undefined) updateData.portas = validatedData.portas;
        if (validatedData.finalPlaca !== undefined) updateData.finalPlaca = validatedData.finalPlaca;
        if (validatedData.carroceria !== undefined) updateData.carroceria = validatedData.carroceria;
        if (validatedData.potencia !== undefined) updateData.potencia = validatedData.potencia;
        if (validatedData.motor !== undefined) updateData.motor = validatedData.motor;
        if (validatedData.categoria !== undefined) updateData.categoria = validatedData.categoria;
        if (validatedData.classe !== undefined) updateData.classe = validatedData.classe;
        if (validatedData.status !== undefined) updateData.status = validatedData.status;
        if (validatedData.destaque !== undefined) updateData.destaque = validatedData.destaque;
        if (validatedData.seloOriginal !== undefined) updateData.seloOriginal = validatedData.seloOriginal;
        if (validatedData.aceitaTroca !== undefined) updateData.aceitaTroca = validatedData.aceitaTroca;
        if (validatedData.parcelamento !== undefined) updateData.parcelamento = validatedData.parcelamento;
        if (validatedData.localizacaoId !== undefined) updateData.localizacaoId = validatedData.localizacaoId;

        // Atualizar veículo
        const updatedVehicle = await prisma.vehicle.update({
            where: { id },
            data: updateData
        });

        res.json({
            message: 'Veículo atualizado com sucesso',
            vehicle: updatedVehicle
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
        }
        handlePrismaError(error, res);
    }
};

const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se o veículo existe e obter informações do vendedor
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            select: {
                id: true,
                vendedorId: true
            }
        });
        
        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }
        
        // Verificar se o usuário é o proprietário do veículo ou um admin
        if (vehicle.vendedorId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Acesso negado: você não tem permissão para excluir este veículo' });
        }
        
        await prisma.vehicle.delete({
            where: { id }
        });
        
        res.json({ message: 'Veículo removido com sucesso' });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

// Busca avançada com agregações
const getVehicleStats = async (req, res) => {
    try {
        // Obter estatísticas agregadas
        const [marcasCount, mediaPreco, mediaKm, mediaAnoFabricacao, mediaAnoModelo] = await Promise.all([
            // Contagem por marca (sintaxe correta para groupBy)
            prisma.vehicle.groupBy({
                by: ['marca'],
                _count: {
                    marca: true
                },
                orderBy: {
                    marca: 'desc'
                }
            }),
            
            // Média de preço
            prisma.vehicle.aggregate({
                _avg: {
                    preco: true
                }
            }),
            
            // Média de km
            prisma.vehicle.aggregate({
                _avg: {
                    quilometragem: true
                }
            }),
            
            // Média de ano de fabricação
            prisma.vehicle.aggregate({
                _avg: {
                    anoFabricacao: true
                }
            }),
            
            // Média de ano do modelo
            prisma.vehicle.aggregate({
                _avg: {
                    anoModelo: true
                }
            })
        ]);
        
        res.json({
            marcas: marcasCount.map(item => ({
                marca: item.marca,
                quantidade: item._count.marca
            })),
            estatisticas: {
                precoMedio: mediaPreco._avg.preco,
                quilometragemMedia: mediaKm._avg.quilometragem,
                anoFabricacaoMedio: mediaAnoFabricacao._avg.anoFabricacao,
                anoModeloMedio: mediaAnoModelo._avg.anoModelo
            }
        });
    } catch (error) {
        console.error('Erro em getVehicleStats:', error);
        handlePrismaError(error, res);
    }
};
// Adicionar método para buscar veículos de um vendedor específico
const getVehiclesByVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        const [vehicles, totalCount] = await Promise.all([
            prisma.vehicle.findMany({
                where: {
                    vendedorId: vendorId
                },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.vehicle.count({
                where: {
                    vendedorId: vendorId
                }
            })
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
        handlePrismaError(error, res);
    }
};

const getVehicleDetails = async (req, res) => {
    try {
        const vehicle = await prisma.vehicle.findUnique({
        where: { id: req.params.id },
        include: {
            vendedor: {
            select: {
                id: true,
                nome: true,
                telefone: true
            }
            },
            imagens: true,
            videos: true,
            avaliacoes: {
            include: {
                user: {
                select: {
                    nome: true,
                    avatar: true
                }
                }
            }
            }
        }
        });
        
        // Registrar visualização
        await prisma.viewLog.create({
        data: {
            vehicleId: req.params.id,
            userId: req.user?.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        }
        });
        
        res.json(vehicle);
    } catch (error) {
        // Tratamento de erros
    }
};

const getVehicleFavorites = async (req, res) => {
    try {
        const favorites = await prisma.favorito.findMany({
        where: { userId: req.user.id },
        include: {
            vehicle: {
            include: {
                imagens: {
                where: { isMain: true },
                take: 1
                },
                vendedor: {
                select: {
                    nome: true,
                    telefone: true
                }
                }
            }
            }
        },
        orderBy: { createdAt: 'desc' }
        });

        res.json(favorites.map(fav => fav.vehicle));
    } catch (error) {
        handlePrismaError(error, res);
    }
};

const registerView = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.$transaction([
        prisma.vehicle.update({
            where: { id },
            data: { visualizacoes: { increment: 1 } }
        }),
        prisma.viewLog.create({
            data: {
            vehicleId: id,
            userId: req.user?.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
            }
        })
        ]);

        res.json({ success: true });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

const getVehicleViews = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se o usuário é o dono do veículo ou admin
        const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        select: { vendedorId: true }
        });

        if (!vehicle) {
        return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        if (vehicle.vendedorId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const views = await prisma.viewLog.findMany({
        where: { vehicleId: id },
        orderBy: { createdAt: 'desc' },
        take: 100
        });

        res.json(views);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

const createReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comentario } = req.body;

        const review = await prisma.avaliacao.create({
        data: {
            vehicleId: id,
            userId: req.user.id,
            rating,
            comentario
        },
        include: {
            user: {
            select: {
                nome: true,
                avatar: true
            }
            }
        }
        });

        res.status(201).json(review);
    } catch (error) {
        handlePrismaError(error, res);
    }
};


const getVehicleReviews = async (req, res) => {
    try {
        const { id } = req.params;

        const reviews = await prisma.avaliacao.findMany({
        where: { vehicleId: id },
        include: {
            user: {
            select: {
                nome: true,
                avatar: true
            }
            }
        },
        orderBy: { createdAt: 'desc' }
        });

        // Calcula média de avaliações
        const avgRating = await prisma.avaliacao.aggregate({
        where: { vehicleId: id },
        _avg: { rating: true }
        });

        res.json({
        reviews,
        averageRating: avgRating._avg.rating || 0,
        totalReviews: reviews.length
        });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    createVehicle,
    createReview,
    registerView,
    updateVehicle,
    updateVehicleStatus,
    uploadImages,
    uploadVideo,
    updateVehicleStatus,
    deleteVehicle,
    getVehicles,
    getUserFavorites,
    getUserVehicleStats,
    getUserVehicles,
    getVehicleById,
    getVehicleDetails,
    getVehicleStats,
    getVehiclesByVendor,
    getVehicleReviews,
    getVehicleViews,
    getVehicleFavorites,
    registerVehicleView,
    toggleFavorite,
};