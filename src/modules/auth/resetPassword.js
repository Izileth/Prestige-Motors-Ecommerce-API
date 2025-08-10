const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// Configure com seu domínio verificado no Resend
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@prestigemotors.online';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://prestigemotors.online';

// Template de email minimalista monocromático
const createPasswordChangedEmailTemplate = (userEmail) => {
    const currentYear = new Date().getFullYear();
    
    return {
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Senha Alterada - Prestige Motors</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #000000;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <div style="border: 2px solid #000000; display: inline-block; padding: 12px 24px;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 400; letter-spacing: 2px;">
                            PRESTIGE MOTORS
                        </h1>
                    </div>
                </div>

                <!-- Main Content -->
                <div style="border: 1px solid #000000; padding: 40px 30px; background-color: #ffffff;">
                    
                    <!-- Success Icon -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 60px; height: 60px; border: 2px solid #000000; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background-color: #000000;">
                            <span style="color: #ffffff; font-size: 24px; font-weight: bold;">✓</span>
                        </div>
                    </div>

                    <!-- Title -->
                    <h2 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 300; text-align: center; color: #000000;">
                        Senha Alterada
                    </h2>

                    <!-- Divider -->
                    <div style="height: 1px; background-color: #000000; margin: 30px 0; width: 60px; margin-left: auto; margin-right: auto;"></div>

                    <!-- Message -->
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #000000; text-align: center;">
                        Sua senha foi <strong>alterada com sucesso</strong> no sistema Prestige Motors.
                    </p>

                    <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #000000; text-align: center;">
                        Se você não fez esta alteração, entre em contato conosco imediatamente.
                    </p>

                    <!-- Security Info -->
                    <div style="border: 1px solid #000000; padding: 20px; margin: 30px 0; background-color: #f9f9f9;">
                        <p style="margin: 0; font-size: 14px; color: #000000; text-align: center;">
                            <strong>Informações de Segurança:</strong><br>
                            Data: ${new Date().toLocaleDateString('pt-BR')}<br>
                            Horário: ${new Date().toLocaleTimeString('pt-BR')}<br>
                            E-mail: ${userEmail}
                        </p>
                    </div>

                    <!-- Call to Action -->
                    <div style="text-align: center; margin: 40px 0 20px 0;">
                        <a href="${FRONTEND_URL}/login" 
                           style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 15px 40px; font-size: 16px; font-weight: 500; letter-spacing: 1px; border: 2px solid #000000; transition: all 0.3s ease;">
                            FAZER LOGIN
                        </a>
                    </div>

                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #666666;">
                        Este é um email automático, não responda.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #666666;">
                        © ${currentYear} Prestige Motors - Sistema de Gerenciamento
                    </p>
                </div>

            </div>
        </body>
        </html>
        `,
        
        text: `
PRESTIGE MOTORS
================

SENHA ALTERADA COM SUCESSO

Sua senha foi alterada com sucesso no sistema Prestige Motors.

Se você não fez esta alteração, entre em contato conosco imediatamente.

INFORMAÇÕES DE SEGURANÇA:
Data: ${new Date().toLocaleDateString('pt-BR')}
Horário: ${new Date().toLocaleTimeString('pt-BR')}
E-mail: ${userEmail}

Acesse sua conta: ${FRONTEND_URL}/login

Este é um email automático, não responda.
© ${currentYear} Prestige Motors - Sistema de Gerenciamento
        `
    };
};

const resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body; // Alterado de newPassword para password para consistência
        
        // Validações básicas
        if (!token || !password || !confirmPassword) {
            return res.status(400).json({ 
                message: 'Token, senha e confirmação de senha são obrigatórios',
                error: 'MISSING_FIELDS'
            });
        }
        
        // Verificar se as senhas coincidem
        if (password !== confirmPassword) {
            return res.status(400).json({ 
                message: 'As senhas não coincidem',
                error: 'PASSWORD_MISMATCH'
            });
        }
        
        // Validar força da senha
        if (password.length < 6) {
            return res.status(400).json({ 
                message: 'A senha deve ter pelo menos 6 caracteres',
                error: 'PASSWORD_TOO_SHORT'
            });
        }
        
        // Validar caracteres obrigatórios
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({ 
                message: 'A senha deve conter pelo menos uma letra maiúscula',
                error: 'PASSWORD_MISSING_UPPERCASE'
            });
        }
        
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({ 
                message: 'A senha deve conter pelo menos um número',
                error: 'PASSWORD_MISSING_NUMBER'
            });
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
            return res.status(400).json({ 
                message: 'Token inválido ou expirado',
                error: 'TOKEN_INVALID_OR_EXPIRED'
            });
        }
        
        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Atualizar senha e limpar tokens
        await prisma.user.update({
            where: { id: user.id },
            data: {
                senha: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
                // Opcional: Atualizar timestamp de última alteração de senha
                updatedAt: new Date()
            }
        });
        
        // Enviar email de confirmação usando template minimalista
        try {
            const emailTemplate = createPasswordChangedEmailTemplate(user.email);
            
            const emailResponse = await resend.emails.send({
                from: EMAIL_FROM,
                to: [user.email],
                subject: 'Prestige Motors - Senha Alterada com Sucesso',
                html: emailTemplate.html,
                text: emailTemplate.text
            });
            
            console.log('Email de confirmação enviado:', emailResponse.id);
        } catch (emailError) {
            console.error('Erro ao enviar email de confirmação:', emailError);
            // Log do erro mas não falhar a redefinição
        }
        
        // Log de segurança
        console.log(`Senha redefinida para usuário: ${user.email} em ${new Date().toISOString()}`);
        
        res.json({ 
            message: 'Senha redefinida com sucesso',
            success: true
        });
        
    } catch (error) {
        console.error('Erro no processo de redefinição de senha:', error);
        
        // Diferentes tipos de erro
        if (error.code === 'P2025') {
            return res.status(404).json({ 
                message: 'Usuário não encontrado',
                error: 'USER_NOT_FOUND'
            });
        }
        
        res.status(500).json({ 
            message: 'Erro interno do servidor',
            error: 'INTERNAL_SERVER_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Função auxiliar para invalidar todos os tokens de reset de um usuário
const invalidateUserResetTokens = async (userId) => {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                resetToken: null,
                resetTokenExpiry: null
            }
        });
        console.log(`Tokens de reset invalidados para usuário ID: ${userId}`);
    } catch (error) {
        console.error('Erro ao invalidar tokens:', error);
    }
};

module.exports = {
    resetPassword,
    invalidateUserResetTokens
};