const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { z } = require('zod');

const prisma = new PrismaClient();

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

const uploadAvatar = async (req, res) => {
    const { id } = req.params;
    const avatarUrl = req.file.path; // Após upload via multer+Cloudinary
    
    await prisma.user.update({
        where: { id },
        data: { avatar: avatarUrl }
    });

    res.json({ avatarUrl });
};

module.exports ={
    register,
    uploadAvatar,
}