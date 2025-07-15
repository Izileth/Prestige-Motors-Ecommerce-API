const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');



const updateUserSchema = z.object({
    nome: z.string().min(3).transform(val => val.trim()).optional(),
    email: z.string().email().transform(val => val.toLowerCase().trim()).optional(),
    senha: z.string().min(6).optional(),
    telefone: z.string()
                .min(10).max(11)
                .regex(/^\d+$/)
                .transform(val => val.replace(/\D/g, ''))
                .nullable()
                .optional(),
    cpf: z.string()
            .length(11)
            .regex(/^\d+$/)
            .nullable()
            .optional()
            .transform(val => val?.replace(/\D/g, '') || null),
    dataNascimento: z.union([
                z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                z.null()
            ])
            .optional()
            .transform(val => val ? new Date(val) : null)
}).refine(data => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser fornecido para atualização"
});

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar os dados de entrada
        const parsedData = updateUserSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: parsedData.error.errors
            });
        }

        const { nome, email, telefone, senha, cpf, dataNascimento } = parsedData.data;

        // Verificar permissões
        if (req.user.id !== id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        // Preparar dados para atualização
        const updateData = {};
        if (nome) updateData.nome = nome;
        
        if (email) {
            const existingEmail = await prisma.user.findFirst({
                where: { 
                    email,
                    NOT: { id }
                }
            });
            if (existingEmail) {
                return res.status(400).json({ message: 'Email já está em uso' });
            }
            updateData.email = email;
        }
        
        if (telefone !== undefined) updateData.telefone = telefone;
        
        if (cpf !== undefined) {
            const existingCpf = await prisma.user.findFirst({
                where: { 
                    cpf,
                    NOT: { id }
                }
            });
            if (existingCpf) {
                return res.status(400).json({ message: 'CPF já está em uso' });
            }
            updateData.cpf = cpf;
        }
        
        if (dataNascimento !== undefined) updateData.dataNascimento = dataNascimento;
        
        if (senha) {
            updateData.senha = await bcrypt.hash(senha, 10);
        }

        // Verificar se há dados para atualizar
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Nenhum dado válido fornecido para atualização' });
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

        res.json({
            message: 'Usuário atualizado com sucesso',
            user
        });
    } catch (error) {
        console.error('Erro na atualização:', error);
        
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                message: 'Dados inválidos',
                errors: error.errors 
            });
        }
        
        if (error.code === 'P2002') {
            return res.status(400).json({ 
                message: 'Valor único já existe',
                field: error.meta?.target?.[0]
            });
        }
        
        res.status(500).json({ message: 'Erro interno no servidor' });
    }
};

module.exports = {
    updateUser
}
