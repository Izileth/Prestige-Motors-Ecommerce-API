const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// Configure com seu domínio verificado no Resend


const EMAIL_FROM = process.env.EMAIL_FROM || 'Prestige Motors <noreply@prestigemotors.online>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://prestigemotors.online';

const validateAndFormatFromField = () => {
    let fromField = process.env.EMAIL_FROM;
    
    if (!fromField) {
        // Valor padrão com nome e email
        return 'Prestige Motors <noreply@prestigemotors.online>';
    }
    
    // Limpar espaços extras
    fromField = fromField.trim();
    
    // Verificar se já está no formato correto
    const formatWithName = /^.+\s<.+@.+\..+>$/;
    const formatEmailOnly = /^.+@.+\..+$/;
    
    if (formatWithName.test(fromField) || formatEmailOnly.test(fromField)) {
        return fromField;
    }
    
    // Se não está em formato válido, usar padrão
    console.warn('EMAIL_FROM em formato inválido, usando padrão');
    return 'Prestige Motors <noreply@prestigemotors.online>';
};


// Usar a função para obter o FROM correto
const VALIDATED_EMAIL_FROM = validateAndFormatFromField();


// Template de email minimalista monocromático
const createPasswordChangedEmailTemplate = (userEmail) => {
  const currentYear = new Date().getFullYear()

  return {
    html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Senha Alterada - Prestige Motors</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); color: #1a1a1a; line-height: 1.6;">
            <div style="max-width: 560px; margin: 0 auto; padding: 60px 20px;">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 60px;">
                    <div style="display: inline-block; position: relative;">
                        <h1 style="margin: 0; font-size: 32px; font-weight: 200; letter-spacing: 8px; color: #000000; text-transform: uppercase;">
                            Prestige
                        </h1>
                        <div style="width: 100%; height: 1px; background: linear-gradient(90deg, transparent 0%, #000000 50%, transparent 100%); margin-top: 8px;"></div>
                        <p style="margin: 12px 0 0 0; font-size: 11px; font-weight: 400; letter-spacing: 3px; color: #666666; text-transform: uppercase;">
                            Motors
                        </p>
                    </div>
                </div>

                <!-- Main Content Card -->
                <div style="background: #ffffff; border-radius: 16px; padding: 50px 40px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08); position: relative; overflow: hidden;">
                    
                    <!-- Background Pattern -->
                    <div style="position: absolute; top: 0; right: 0; width: 120px; height: 120px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 0 16px 0 100%; opacity: 0.3;"></div>
                    
                    <!-- Custom Success Icon -->
                    <div style="text-align: center; margin-bottom: 40px; position: relative; z-index: 1;">
                        <div style="width: 80px; height: 80px; margin: 0 auto; position: relative;">
                            <!-- Outer Circle -->
                            <div style="width: 80px; height: 80px; border: 3px solid #000000; border-radius: 50%; position: absolute; top: 0; left: 0; background: #ffffff;"></div>
                            <!-- Inner Success Shape -->
                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                                <!-- Custom Checkmark made with geometric shapes -->
                                <div style="width: 24px; height: 12px; border-left: 4px solid #000000; border-bottom: 4px solid #000000; transform: rotate(-45deg); margin-top: -6px;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Title Hierarchy -->
                    <div style="text-align: center; margin-bottom: 50px;">
                        <h2 style="margin: 0 0 16px 0; font-size: 36px; font-weight: 100; color: #000000; letter-spacing: 2px;">
                            Senha Alterada
                        </h2>
                        <div style="width: 40px; height: 2px; background: #000000; margin: 0 auto;"></div>
                    </div>

                    <!-- Message Content -->
                    <div style="margin-bottom: 40px;">
                        <p style="margin: 0 0 24px 0; font-size: 18px; font-weight: 400; color: #1a1a1a; text-align: center; line-height: 1.7;">
                            Sua senha foi <span style="font-weight: 600; color: #000000;">alterada com sucesso</span> no sistema Prestige Motors.
                        </p>
                        
                        <p style="margin: 0; font-size: 16px; font-weight: 400; color: #4a4a4a; text-align: center; line-height: 1.6;">
                            Se você não fez esta alteração, entre em contato conosco imediatamente.
                        </p>
                    </div>

                    <!-- Security Information -->
                    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border-radius: 0px; padding: 32px; margin: 40px 0; border-left: 4px solid #000000; position: relative;">
                        <div style="margin-bottom: 20px;">
                            <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #000000; text-transform: uppercase; letter-spacing: 1px;">
                                Informações de Segurança
                            </h3>
                        </div>
                        
                        <div style="display: table; width: 100%;">
                            <div style="display: table-row;">
                                <div style="display: table-cell; padding: 4px 0; font-size: 14px; color: #666666; width: 80px;">Data:</div>
                                <div style="display: table-cell; padding: 4px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${new Date().toLocaleDateString("pt-BR")}</div>
                            </div>
                            <div style="display: table-row;">
                                <div style="display: table-cell; padding: 4px 0; font-size: 14px; color: #666666;">Horário:</div>
                                <div style="display: table-cell; padding: 4px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${new Date().toLocaleTimeString("pt-BR")}</div>
                            </div>
                            <div style="display: table-row;">
                                <div style="display: table-cell; padding: 4px 0; font-size: 14px; color: #666666;">E-mail:</div>
                                <div style="display: table-cell; padding: 4px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${userEmail}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Call to Action -->
                    <div style="text-align: center; margin: 50px 0 20px 0;">
                        <a href="\${FRONTEND_URL}/login" 
                           style="display: inline-block; background: #000000; color: #ffffff; text-decoration: none; padding: 18px 48px; font-size: 14px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; border-radius: 8px; transition: all 0.3s ease; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);">
                            Fazer Login
                        </a>
                    </div>

                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 60px;">
                    <div style="margin-bottom: 20px;">
                        <div style="width: 60px; height: 1px; background: linear-gradient(90deg, transparent 0%, #cccccc 50%, transparent 100%); margin: 0 auto;"></div>
                    </div>
                    
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #999999; font-weight: 400;">
                        Este é um email automático, não responda.
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #cccccc; font-weight: 300; letter-spacing: 1px;">
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
Data: ${new Date().toLocaleDateString("pt-BR")}
Horário: ${new Date().toLocaleTimeString("pt-BR")}
E-mail: ${userEmail}

Acesse sua conta: \${FRONTEND_URL}/login

Este é um email automático, não responda.
© ${currentYear} Prestige Motors - Sistema de Gerenciamento
        `,
  }
}

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
                from: VALIDATED_EMAIL_FROM, // ← CORREÇÃO PRINCIPAL AQUI
                to: [user.email],
                subject: 'Prestige Motors - Senha Alterada com Sucesso',
                html: emailTemplate.html,
                text: emailTemplate.text
            });
            
            console.log('Email de confirmação enviado:', emailResponse.id);
        } catch (emailError) {
            console.error('Erro ao enviar email de confirmação:', emailError);
            
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