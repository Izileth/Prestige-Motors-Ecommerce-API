const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const prisma = new PrismaClient();

// Função auxiliar para tratamento de erros
const handlePrismaError = (error, res) => {
    console.error('Erro Prisma:', error);
    
    if (error.code === 'P2002') {
        return res.status(400).json({ 
            message: 'Já existe um registro com este valor único',
            field: error.meta?.target?.[0] || 'unknown'
        });
    }
    
    if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Registro não encontrado' });
    }
    
    return res.status(500).json({ message: 'Erro no Servidor' });
};

// Schema de validação para registro de usuário

// Schema de validação para registro de usuário
// Schema de validação para registro de usuário atualizado
const registerSchema = z.object({
    nome: z.string().min(3).transform(val => val.trim()),
    email: z.string().email().transform(val => val.toLowerCase().trim()),
    senha: z.string().min(6),
    telefone: z.string()
                .min(10).max(11)
                .regex(/^\d+$/)
                .transform(val => val.replace(/\D/g, ''))
                .optional(), // Tornando opcional
    cpf: z.string()
            .length(11)
            .regex(/^\d+$/)
            .optional()
            .nullable()
            .transform(val => val?.replace(/\D/g, '') || null),
    dataNascimento: z.string()
        .refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val))
        .optional()
        .nullable()
        .transform(val => val ? new Date(val) : null),
    endereco: z.object({
        rua: z.string().min(3),
        numero: z.string().min(1),
        complemento: z.string().optional().nullable(),
        bairro: z.string().min(3),
        cidade: z.string().min(3),
        estado: z.string().length(2),
        cep: z.string().regex(/^\d{8}$/),
        latitude: z.number().optional().nullable(),
        longitude: z.number().optional().nullable(),
        pais: z.string().optional().default('Brasil')
    }).optional().nullable()
});
// Schema de validação para atualização de usuário
const updateUserSchema = z.object({
    nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.').optional(),
    email: z.string().email('Email inválido.').optional(),
    telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido.').optional(),
    senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.').optional(),
    cpf: z.string().regex(/^\d{11}$/, 'CPF inválido.').optional(),
    dataNascimento: z.string()
        .refine(val => {
            // Verifica se a string está no formato ISO 8601 (YYYY-MM-DD)
            return /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val));
        }, {
            message: 'Data de nascimento deve estar no formato YYYY-MM-DD'
        })
        .transform(val => new Date(val))
        .optional()
});

const register = async (req, res) => {
    try {
        // Validação dos dados com tratamento de campos nulos/vazios
        const parsedData = registerSchema.safeParse({
            ...req.body,
            cpf: req.body.cpf?.trim() === '' ? null : req.body.cpf,
            telefone: req.body.telefone?.trim() === '' ? null : req.body.telefone,
            endereco: req.body.endereco || null
        });

        // Verificar se a validação passou
        if (!parsedData.success) {
            return res.status(400).json({
                success: false,
                error: 'validation_error',
                message: 'Dados inválidos',
                details: parsedData.error.errors
            });
        }

        const { nome, email, senha, telefone, cpf, dataNascimento, endereco } = parsedData.data;

        // Verificação de usuário existente com tratamento para CPF e email nulos
        const whereCondition = {
            OR: []
        };
        
        if (email) {
            whereCondition.OR.push({ email });
        }
        
        if (cpf) {
            whereCondition.OR.push({ cpf });
        }
        
        // Só executa a busca se houver condições
        let existingUser = null;
        if (whereCondition.OR.length > 0) {
            existingUser = await prisma.user.findFirst({
                where: whereCondition,
                select: {
                    email: true,
                    cpf: true
                }
            });
        }

        if (existingUser) {
            if (email && existingUser.email === email) {
                return res.status(409).json({ 
                    success: false,
                    error: 'email_already_exists',
                    message: 'Este email já está cadastrado' 
                });
            }
            if (cpf && existingUser.cpf === cpf) {
                return res.status(409).json({ 
                    success: false,
                    error: 'cpf_already_exists',
                    message: 'Este CPF já está cadastrado' 
                });
            }
        }

        // Preparação dos dados com tratamento completo de nulos

        const userData = {
            nome: nome.trim(),
            email: email.toLowerCase().trim(),
            senha: await bcrypt.hash(senha, 10),
            role: 'USER',
            ...(telefone && { telefone }),
            ...(cpf && { cpf }),
            ...(dataNascimento && { dataNascimento })
        };

        // Adiciona o endereço apenas se existir
        if (endereco) {
            userData.enderecos = {
                create: {
                    cep: endereco.cep.replace(/\D/g, ''),
                    logradouro: endereco.rua,
                    numero: endereco.numero,
                    complemento: endereco.complemento || null,
                    bairro: endereco.bairro,
                    cidade: endereco.cidade,
                    estado: endereco.estado,
                    pais: endereco.pais || 'Brasil',
                    latitude: endereco.latitude || null,
                    longitude: endereco.longitude || null
                }
            };
        }

        // Criação do usuário com tratamento de erros específico
        const user = await prisma.user.create({
            data: userData,
            include: {
                enderecos: Boolean(endereco)
            }
        });

        return res.status(201).json({
            success: true,
            userId: user.id,
            hasAddress: Boolean(user.enderecos?.length)
        });

    } catch (error) {
        console.error('ERRO NO REGISTRO:', error);
        
        // Tratamento específico para erros de constraint do Prisma
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0];
            const fieldName = field === 'User_cpf_key' ? 'cpf' : 
                                field === 'User_email_key' ? 'email' : field; 
            return res.status(409).json({
                success: false,
                error: `${fieldName}_already_exists`,
                message: fieldName === 'cpf' 
                    ? 'Este CPF já está cadastrado' 
                    : 'Este email já está cadastrado'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'server_error',
            message: 'Erro interno no servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const login = async (req, res) => {
    try {
        // 1. Validação básica dos campos
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({
                success: false,
                error: 'missing_credentials',
                message: 'Email e senha são obrigatórios'
            });
        }

        // 2. Busca o usuário com tratamento case-insensitive
        const user = await prisma.user.findUnique({
            where: { 
                email: email.toLowerCase().trim() 
            }
        });

        // 3. Verificação segura
        if (!user) {
            // Mesma mensagem para usuário não encontrado e senha incorreta
            return res.status(401).json({
                success: false,
                error: 'invalid_credentials',
                message: 'Credenciais inválidas'
            });
        }

        // 4. Comparação de senha com tratamento de erro
        let passwordMatch;
        try {
            passwordMatch = await bcrypt.compare(senha, user.senha);
        } catch (bcryptError) {
            console.error('Bcrypt error:', bcryptError);
            throw new Error('Erro na verificação de senha');
        }

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: 'invalid_credentials',
                message: 'Credenciais inválidas'
            });
        }

        // 5. Geração de token
        const token = jwt.sign(
            { 
                id: user.id,
                role: user.role 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        // 6. Resposta com cookie seguro
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        }).json({
            success: true,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role
            },
            message: 'Login realizado com sucesso'
        });

    } catch (error) {
        console.error('Login error:', error);
        
        // 7. Tratamento de erros específico para JWT
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(500).json({
                success: false,
                error: 'token_error',
                message: 'Erro ao gerar token de acesso'
            });
        }

        res.status(500).json({
            success: false,
            error: 'server_error',
            message: 'Erro interno no servidor'
        });
    }
};

const uploadAvatar = async (req, res) => {
    const { id } = req.params;
    const avatarUrl = req.file.path; // Após upload via multer+Cloudinary
  
    await prisma.user.update({
      where: { id },
      data: { avatar: avatarUrl }
    });
  
    res.json({ avatarUrl });
};

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

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
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
                vehicles: {
                    select: {
                        id: true,
                        marca: true,
                        modelo: true,
                        preco: true,
                        ano: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Verificar se o usuário está acessando seus próprios dados ou é um admin
        if (req.user.id !== id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Acesso negado' });
        }
   
        res.json(user);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('ID do usuário a ser atualizado:', id); // Log para depuração
        console.log('Dados recebidos:', req.body); // Log para depuração

        // Validar os dados de entrada
        const { nome, email, telefone, senha, cpf, dataNascimento } = updateUserSchema.parse(req.body);

        // Verificar se o usuário está atualizando seus próprios dados ou é um admin
        if (req.user.id !== id && req.user.role !== 'ADMIN') {
            console.log('Acesso negado: req.user.id =', req.user.id, 'e id =', id); // Log para depuração
            return res.status(403).json({ message: 'Acesso negado' });
        }

        // Preparar dados para atualização
        const updateData = {};
        if (nome) updateData.nome = nome;
        if (email) {
            // Verificar se o novo email já está em uso por outro usuário
            const existingEmail = await prisma.user.findUnique({
                where: { email }
            });
            
            if (existingEmail && existingEmail.id !== id) {
                return res.status(400).json({ message: 'Este email já está em uso por outro usuário' });
            }
            
            updateData.email = email;
        }
        if (telefone) updateData.telefone = telefone;
        if (cpf) {
            // Verificar se o novo CPF já está em uso por outro usuário
            const existingCpf = await prisma.user.findUnique({
                where: { cpf }
            });
            
            if (existingCpf && existingCpf.id !== id) {
                return res.status(400).json({ message: 'Este CPF já está em uso por outro usuário' });
            }
            
            updateData.cpf = cpf;
        }
        if (dataNascimento) updateData.dataNascimento = dataNascimento;
        if (senha) {
            const salt = await bcrypt.genSalt(10);
            updateData.senha = await bcrypt.hash(senha, salt);
        }

        // Verificar se há dados para atualizar
        if (Object.keys(updateData).length === 0) {
            console.log('Nenhum dado fornecido para atualização'); // Log para depuração
            return res.status(400).json({ message: 'Nenhum dado fornecido para atualização' });
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                cpf: true,
                dataNascimento: true,
                role: true,
                updatedAt: true
            }
        });

        console.log('Usuário atualizado:', user); // Log para depuração
        res.json({
            message: 'Usuário atualizado com sucesso',
            user
        });
    } catch (error) {
        console.error('Erro na função updateUser:', error); // Log para depuração
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
        }
        handlePrismaError(error, res);
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar primeiro se o usuário existe
        const userExists = await prisma.user.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!userExists) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Excluir todos os veículos associados primeiro
        await prisma.vehicle.deleteMany({
            where: { vendedorId: id }
        });

        // Agora excluir o usuário
        await prisma.user.delete({
            where: { id }
        });

        res.json({ message: 'Usuário removido com sucesso' });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

const getUserStats = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se o usuário existe
        const userExists = await prisma.user.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!userExists) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Verificar se o usuário está acessando suas próprias estatísticas ou é um admin
        if (req.user.id !== id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        // Contar total de veículos
        const totalVehicles = await prisma.vehicle.count({
            where: { vendedorId: id }
        });

        // Valor total dos veículos
        const vehicleStats = await prisma.vehicle.aggregate({
            where: { vendedorId: id },
            _sum: {
                preco: true
            },
            _avg: {
                preco: true,
                ano: true
            },
            _min: {
                preco: true
            },
            _max: {
                preco: true
            }
        });

        res.json({
            totalVehicles,
            valorTotalInventario: vehicleStats._sum.preco || 0,
            precoMedio: vehicleStats._avg.preco || 0,
            anoMedio: vehicleStats._avg.ano || 0,
            precoMinimo: vehicleStats._min.preco || 0,
            precoMaximo: vehicleStats._max.preco || 0
        });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

const getUserAddresses = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se o usuário está acessando seus próprios endereços ou é admin
        if (req.user.id !== id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const addresses = await prisma.endereco.findMany({
        where: { userId: id },
        select: {
            id: true,
            cep: true,
            logradouro: true,
            numero: true,
            complemento: true,
            bairro: true,
            cidade: true,
            estado: true,
            pais: true
        }
        });

        res.json(addresses);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

const createAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const addressData = req.body;

        // Verifica se o usuário está criando para si mesmo
        if (req.user.id !== id) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const address = await prisma.endereco.create({
        data: {
            ...addressData,
            userId: id
        }
        });

        res.status(201).json(address);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

const updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const addressData = req.body;

        // Primeiro verifica se o endereço pertence ao usuário
        const existingAddress = await prisma.endereco.findUnique({
        where: { id: addressId },
        select: { userId: true }
        });

        if (!existingAddress) {
        return res.status(404).json({ error: 'Endereço não encontrado' });
        }

        if (existingAddress.userId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const updatedAddress = await prisma.endereco.update({
        where: { id: addressId },
        data: addressData
        });

        res.json(updatedAddress);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

const getUserSales = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se o usuário está acessando suas próprias vendas ou é admin
        if (req.user.id !== id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const sales = await prisma.venda.findMany({
        where: { vendedorId: id },
        include: {
            vehicle: {
            select: {
                marca: true,
                modelo: true,
                anoFabricacao: true
            }
            },
            comprador: {
            select: {
                nome: true,
                email: true
            }
            }
        },
        orderBy: { dataVenda: 'desc' }
        });

        res.json(sales);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

const getUserPurchases = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se o usuário está acessando suas próprias compras ou é admin
        if (req.user.id !== id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const purchases = await prisma.venda.findMany({
        where: { compradorId: id },
        include: {
            vehicle: {
            select: {
                marca: true,
                modelo: true,
                anoFabricacao: true,
                imagens: {
                where: { isMain: true },
                take: 1
                }
            }
            },
            vendedor: {
            select: {
                nome: true,
                telefone: true
            }
            }
        },
        orderBy: { dataVenda: 'desc' }
        });

        res.json(purchases);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

// No final do arquivo:
module.exports = {
    register,
    login,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserStats,
    getUserAddresses,
    createAddress,
    updateAddress,
    getUserSales,
    getUserPurchases,
    uploadAvatar // Adicionado na exportação
};