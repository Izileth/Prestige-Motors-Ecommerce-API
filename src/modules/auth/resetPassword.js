const { PrismaClient} = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();


const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@prestigemotors.com.br';


const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER || 'user@example.com',
        pass: process.env.EMAIL_PASSWORD || 'password'
    }
});


const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token e nova senha são obrigatórios' });
        }
        
        // Hash do token recebido para comparar com o armazenado
        const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
        
        // Buscar usuário com token válido
        const user = await prisma.user.findFirst({
        where: {
            resetToken: hashedToken,
            resetTokenExpiry: {
            gt: new Date() // Data de expiração maior que agora (token ainda válido)
            }
        }
        });
        
        if (!user) {
        return res.status(400).json({ message: 'Token inválido ou expirado' });
        }
        
        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        // Atualizar senha e limpar tokens
        await prisma.user.update({
        where: { id: user.id },
        data: {
            senha: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null
        }
        });
        
        // Notificar usuário por email
        try {
        await transporter.sendMail({
            from: EMAIL_FROM,
            to: user.email,
            subject: 'Prestige Motors - Senha Alterada',
            html: `
            <h1>Senha Alterada com Sucesso</h1>
            <p>Sua senha foi redefinida com sucesso.</p>
            <p>Se você não realizou esta alteração, entre em contato com nosso suporte imediatamente.</p>
            `
        });
        } catch (emailError) {
        console.error('Erro ao enviar email de confirmação:', emailError);
        // Não falhar a redefinição por causa do email
        }
        
        res.json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    resetPassword
}