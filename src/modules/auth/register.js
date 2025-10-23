const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const slugify = require('slugify');

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
                .optional(),

                cpf: z.string()
                .length(11)
                .regex(/^\d+$/)
                .optional()
                .nullable()
                .transform(val => val ? val.replace(/\D/g, '') : null)
                .refine(val => val === null || val.length === 11, {
                    message: "CPF deve ter 11 dígitos"
                }),
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

        const baseSlug = slugify(nome, { lower: true, strict: true });
        let slug = baseSlug;
        let userWithSameSlug = await prisma.user.findUnique({ where: { slug } });
        let counter = 1;
        while (userWithSameSlug) {
            slug = `${baseSlug}-${counter}`;
            userWithSameSlug = await prisma.user.findUnique({ where: { slug } });
            counter++;
        }

        const userData = {
            nome: nome.trim(),
            email: email.toLowerCase().trim(),
            slug: slug,
            senha: await bcrypt.hash(senha, 10),
            role: 'USER',
            ...(telefone && { telefone }),
            ...(dataNascimento && { dataNascimento })
        };

        if (cpf) {
            userData.cpf = cpf;
        }

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

        const newUser = await prisma.user.create({
            data: userData,
            include: {
                enderecos: Boolean(endereco)
            }
        });

        // Verificação crítica de segurança
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET não definido no ambiente');
        }

        // Geração do token após criação bem-sucedida
        const token = jwt.sign(
            { 
                id: newUser.id,
                role: newUser.role 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        // Configuração do cookie
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        };
        return res
        .cookie('token', token, cookieOptions)
        .status(201)
        .json({
            success: true,
            token,
            user: {
                id: newUser.id,
                nome: newUser.nome,
                email: newUser.email,
                slug: newUser.slug,
                role: newUser.role
            }
        });
   

    } // Substitua o bloco catch atual por:
    catch (error) {
        console.error('ERRO NO REGISTRO:', error);
        
        if (error.code === 'P2002') {
            const target = error.meta?.target || '';
            let field = 'dados';
            let message = 'Já existe um registro com esses dados';
    
            if (typeof target === 'string') {
                if (target.includes('email')) {
                    field = 'email';
                    message = 'Este email já está cadastrado';
                } else if (target.includes('cpf')) {
                    field = 'cpf';
                    message = 'Este CPF já está cadastrado';
                }
            }
    
            return res.status(409).json({
                success: false,
                error: `${field}_already_exists`,
                message
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


module.exports ={
    register,
}