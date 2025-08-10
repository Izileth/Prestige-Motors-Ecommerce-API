
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// ⚠️ CORREÇÃO PRINCIPAL: Formato correto do campo FROM
const EMAIL_FROM = process.env.EMAIL_FROM || 'Prestige Motors <noreply@prestigemotors.online>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://prestigemotors.online';

// Função para validar e formatar o campo FROM
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

// Função para debug do campo FROM
const debugEmailFrom = () => {
    console.log('=== DEBUG EMAIL FROM ===');
    console.log('EMAIL_FROM env:', process.env.EMAIL_FROM);
    console.log('Validated FROM:', VALIDATED_EMAIL_FROM);
    console.log('=======================');
};

// Template de email (mesmo código anterior, mas com FROM corrigido)
const createPasswordResetEmailTemplate = (resetUrl, userEmail) => {
    const currentYear = new Date().getFullYear();
    
    return {
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Redefinição de Senha - Prestige Motors</title>
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
                    
                    <!-- Lock Icon -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 60px; height: 60px; border: 2px solid #000000; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background-color: #ffffff;">
                            <span style="color: #000000; font-size: 24px;">🔑</span>
                        </div>
                    </div>

                    <!-- Title -->
                    <h2 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 300; text-align: center; color: #000000;">
                        Redefinir Senha
                    </h2>

                    <!-- Divider -->
                    <div style="height: 1px; background-color: #000000; margin: 30px 0; width: 60px; margin-left: auto; margin-right: auto;"></div>

                    <!-- Message -->
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #000000; text-align: center;">
                        Você solicitou a <strong>redefinição de sua senha</strong> no sistema Prestige Motors.
                    </p>

                    <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #000000; text-align: center;">
                        Clique no botão abaixo para criar uma nova senha:
                    </p>

                    <!-- Call to Action Button -->
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${resetUrl}" 
                           style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 15px 40px; font-size: 16px; font-weight: 500; letter-spacing: 1px; border: 2px solid #000000;">
                            REDEFINIR SENHA
                        </a>
                    </div>

                    <!-- Security Info -->
                    <div style="border: 1px solid #000000; padding: 20px; margin: 30px 0; background-color: #f9f9f9;">
                        <p style="margin: 0; font-size: 14px; color: #000000; text-align: center;">
                            <strong>Informações de Segurança:</strong><br>
                            Este link é válido por <strong>1 hora</strong><br>
                            Solicitado em: ${new Date().toLocaleString('pt-BR')}<br>
                            E-mail: ${userEmail}
                        </p>
                    </div>

                    <!-- Alternative Link -->
                    <div style="margin: 30px 0; padding: 20px; background-color: #f5f5f5; border-left: 3px solid #000000;">
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000; font-weight: 500;">
                            Link alternativo:
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #666666; word-break: break-all; line-height: 1.4;">
                            <a href="${resetUrl}" style="color: #000000; text-decoration: underline;">${resetUrl}</a>
                        </p>
                    </div>

                    <!-- Security Warning -->
                    <div style="margin: 30px 0;">
                        <p style="margin: 0; font-size: 14px; color: #666666; text-align: center;">
                            Se você <strong>não solicitou</strong> esta redefinição, ignore este email.<br>
                            Sua senha permanecerá inalterada.
                        </p>
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

REDEFINIR SENHA

Você solicitou a redefinição de sua senha no sistema Prestige Motors.

Para criar uma nova senha, acesse o link abaixo:
${resetUrl}

INFORMAÇÕES DE SEGURANÇA:
• Este link é válido por 1 hora
• Solicitado em: ${new Date().toLocaleString('pt-BR')}
• E-mail: ${userEmail}

Se você não solicitou esta redefinição, ignore este email.
Sua senha permanecerá inalterada.

© ${currentYear} Prestige Motors - Sistema de Gerenciamento

Este é um email automático, não responda.
        `
    };
};

const forgotPassword = async (req, res) => {
    try {
        // Debug do campo FROM em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            debugEmailFrom();
        }

        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                message: 'Email é obrigatório',
                error: 'EMAIL_REQUIRED'
            });
        }

        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Por favor, insira um email válido',
                error: 'EMAIL_INVALID_FORMAT'
            });
        }
        
        // Buscar usuário
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });
        
        if (!user) {
            return res.status(200).json({ 
                message: 'Se este email estiver registrado, você receberá um link de recuperação',
                success: true
            });
        }
        
        // Gerar token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora
        
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        
        // Atualizar usuário
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: hashedToken,
                resetTokenExpiry,
                updatedAt: new Date()
            }
        });
        
        // URL de redefinição
        const resetUrl = `${FRONTEND_URL}/passwords/reset/${resetToken}`;
        
        // Enviar email com FROM corrigido
        try {
            const emailTemplate = createPasswordResetEmailTemplate(resetUrl, user.email);
            
            console.log('Tentando enviar email com FROM:', VALIDATED_EMAIL_FROM);
            
            const emailResponse = await resend.emails.send({
                from: VALIDATED_EMAIL_FROM, // ← CORREÇÃO PRINCIPAL AQUI
                to: [email],
                subject: 'Prestige Motors - Redefinição de Senha',
                html: emailTemplate.html,
                text: emailTemplate.text
            });
            
            console.log(`Email enviado com sucesso. ID: ${emailResponse.id}`);
            
            res.status(200).json({ 
                message: 'Email de redefinição enviado com sucesso',
                success: true,
                ...(process.env.NODE_ENV === 'development' && {
                    emailId: emailResponse.id,
                    resetToken: resetToken,
                    fromField: VALIDATED_EMAIL_FROM // Debug info
                })
            });
            
        } catch (emailError) {
            console.error('Erro detalhado do Resend:', emailError);
            
            // Reverter token se email falhar
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken: null,
                    resetTokenExpiry: null
                }
            });
            
            res.status(500).json({ 
                message: 'Não foi possível enviar o email. Verifique o endereço e tente novamente.',
                error: 'EMAIL_SEND_FAILED',
                details: process.env.NODE_ENV === 'development' ? {
                    message: emailError.message,
                    fromField: VALIDATED_EMAIL_FROM,
                    resendError: emailError
                } : undefined
            });
        }
        
    } catch (error) {
        console.error('Erro no processo de recuperação:', error);
        
        res.status(500).json({ 
            message: 'Erro interno do servidor',
            error: 'INTERNAL_SERVER_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    forgotPassword,
    validateAndFormatFromField, // Exportar para reutilizar
    debugEmailFrom // Exportar para debug
};