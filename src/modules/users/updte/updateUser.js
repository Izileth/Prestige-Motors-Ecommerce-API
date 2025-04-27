const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const prisma = new PrismaClient();

const updateUserSchema = z.object({
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

module.exports = {
    updateUser
}
