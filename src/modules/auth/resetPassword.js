const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// Configure com seu domínio verificado no Resend
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@prestigemotors.online';

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token e nova senha são obrigatórios' });
        }
        
        // Validar força da senha (opcional)
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'A nova senha deve ter pelo menos 8 caracteres' });
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
        
        // Notificar usuário por email usando Resend
        try {
            await resend.emails.send({
                from: EMAIL_FROM,
                to: [user.email],
                subject: 'Prestige Motors - Senha Alterada',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #28a745; text-align: center;">Senha Alterada com Sucesso</h1>
                        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; 
                                    border-radius: 5px; padding: 15px; margin: 20px 0;">
                            <p style="color: #155724; margin: 0; font-weight: bold;">
                                ✓ Sua senha foi redefinida com sucesso!
                            </p>
                        </div>
                        <p style="color: #555; font-size: 16px;">
                            Sua senha no Prestige Motors foi alterada em ${new Date().toLocaleString('pt-BR')}.
                        </p>
                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; 
                                    border-radius: 5px; padding: 15px; margin: 20px 0;">
                            <p style="color: #856404; margin: 0;">
                                <strong>⚠️ Importante:</strong> Se você não realizou esta alteração, 
                                entre em contato com nosso suporte imediatamente.
                            </p>
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                               style="background-color: #007bff; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                Fazer Login
                            </a>
                        </div>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #aaa; font-size: 12px; text-align: center;">
                            © Prestige Motors - Sistema de Gerenciamento<br>
                            Este é um email automático, não responda.
                        </p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Erro ao enviar email de confirmação:', emailError);
            // Não falhar a redefinição por causa do email
        }
        
        res.json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
        console.error('Erro no processo de redefinição de senha:', error);
        res.status(500).json({ 
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    resetPassword
};