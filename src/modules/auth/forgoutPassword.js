const { PrismaClient} = require('@prisma/client');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();
const RESET_TOKEN_EXPIRY = 3600000; // 1 hora em milissegundos
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

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
        return res.status(400).json({ message: 'Email é obrigatório' });
        }
        
        // Buscar usuário
        const user = await prisma.user.findUnique({
        where: { email }
        });
        
        if (!user) {
        // Por segurança, não informamos se o email existe ou não
        return res.status(200).json({ message: 'Se este email estiver registrado, você receberá um link de recuperação' });
        }
        
        // Gerar token de redefinição (válido por 1 hora)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY);
        
        // Armazenar token hash no banco (poderia ser um modelo separado, mas usaremos campos no usuário)
        const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
        
        // Atualizar usuário com token de reset
        await prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken: hashedToken,
            resetTokenExpiry // Seria necessário adicionar estes campos ao modelo User no schema
        }
        });
        
        // URL de redefinição (front-end)
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
        
        // Enviar email com link de redefinição
        try {
        await transporter.sendMail({
            from: EMAIL_FROM,
            to: email,
            subject: 'Prestige Motors - Redefinição de Senha',
            html: `
            <h1>Redefinição de Senha</h1>
            <p>Você solicitou a redefinição de sua senha no Prestige Motors.</p>
            <p>Clique no link abaixo para definir uma nova senha:</p>
            <a href="${resetUrl}" target="_blank">Redefinir minha senha</a>
            <p>Este link é válido por 1 hora.</p>
            <p>Se você não solicitou esta redefinição, ignore este email.</p>
            `
        });
        
        res.status(200).json({ message: 'Email de redefinição enviado' });
        } catch (emailError) {
        console.error('Erro ao enviar email de redefinição:', emailError);
        res.status(500).json({ message: 'Não foi possível enviar o email de redefinição' });
        }
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    forgotPassword
}