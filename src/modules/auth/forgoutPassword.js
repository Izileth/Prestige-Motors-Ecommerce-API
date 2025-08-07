const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const RESET_TOKEN_EXPIRY = 3600000; // 1 hora em milissegundos
// Configure com seu domínio verificado no Resend
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@prestigemotors.online';

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
            return res.status(200).json({ 
                message: 'Se este email estiver registrado, você receberá um link de recuperação' 
            });
        }
        
        // Gerar token de redefinição (válido por 1 hora)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY);
        
        // Armazenar token hash no banco
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        
        // Atualizar usuário com token de reset
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: hashedToken,
                resetTokenExpiry
            }
        });
        
        // URL de redefinição (front-end)
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
        
        // Enviar email com link de redefinição usando Resend
        try {
            await resend.emails.send({
                from: EMAIL_FROM,
                to: [email],
                subject: 'Prestige Motors - Redefinição de Senha',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #333; text-align: center;">Redefinição de Senha</h1>
                        <p style="color: #555; font-size: 16px;">
                            Você solicitou a redefinição de sua senha no Prestige Motors.
                        </p>
                        <p style="color: #555; font-size: 16px;">
                            Clique no botão abaixo para definir uma nova senha:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background-color: #007bff; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                Redefinir minha senha
                            </a>
                        </div>
                        <p style="color: #888; font-size: 14px;">
                            Este link é válido por 1 hora.
                        </p>
                        <p style="color: #888; font-size: 14px;">
                            Se você não solicitou esta redefinição, ignore este email.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #aaa; font-size: 12px; text-align: center;">
                            © Prestige Motors - Sistema de Gerenciamento
                        </p>
                    </div>
                `
            });
            
            res.status(200).json({ message: 'Email de redefinição enviado' });
        } catch (emailError) {
            console.error('Erro ao enviar email de redefinição:', emailError);
            res.status(500).json({ 
                message: 'Não foi possível enviar o email de redefinição',
                error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
            });
        }
    } catch (error) {
        console.error('Erro no processo de recuperação de senha:', error);
        res.status(500).json({ 
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    forgotPassword
};