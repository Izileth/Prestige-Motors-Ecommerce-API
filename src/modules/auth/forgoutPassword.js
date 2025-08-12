
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);


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
  const currentYear = new Date().getFullYear()

  return {
    html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Redefinição de Senha - Prestige Motors</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%); color: #000000; line-height: 1;">
            
            <!-- Container -->
            <div style="max-width: 560px; margin: 0 auto; padding: 60px 20px;">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 80px;">
                    <div style="display: inline-block; position: relative;">
                        <!-- Custom geometric logo -->
                        <div style="width: 4px; height: 32px; background-color: #000000; display: inline-block; margin-right: 16px; vertical-align: top; margin-top: 4px;"></div>
                        <h1 style="margin: 0; font-size: 32px; font-weight: 200; letter-spacing: 4px; display: inline-block; vertical-align: top;">
                            PRESTIGE MOTORS
                        </h1>
                        <div style="width: 4px; height: 32px; background-color: #000000; display: inline-block; margin-left: 16px; vertical-align: top; margin-top: 4px;"></div>
                    </div>
                </div>

                <!-- Main Content Card -->
                <div style="background-color: #ffffff; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header Section -->
                    <div style="padding: 60px 40px 40px 40px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                        
                        <!-- Custom Key Icon -->
                        <div style="margin-bottom: 32px;">
                            <div style="width: 80px; height: 80px; margin: 0 auto; position: relative;">
                                <!-- Key body -->
                                <div style="width: 40px; height: 8px; background-color: #000000; position: absolute; top: 36px; left: 0;"></div>
                                <!-- Key head -->
                                <div style="width: 24px; height: 24px; border: 4px solid #000000; border-radius: 50%; position: absolute; top: 24px; right: 8px; background-color: #ffffff;"></div>
                                <!-- Key teeth -->
                                <div style="width: 8px; height: 12px; background-color: #000000; position: absolute; top: 44px; left: 8px;"></div>
                                <div style="width: 8px; height: 8px; background-color: #000000; position: absolute; top: 28px; left: 16px;"></div>
                            </div>
                        </div>

                        <!-- Title -->
                        <h2 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 300; color: #000000; letter-spacing: 1px;">
                            REDEFINIR SENHA
                        </h2>
                        
                        <!-- Subtitle line -->
                        <div style="width: 60px; height: 2px; background-color: #000000; margin: 0 auto;"></div>
                    </div>

                    <!-- Content Section -->
                    <div style="padding: 40px;">
                        
                        <!-- Message -->
                        <div style="text-align: center; margin-bottom: 40px;">
                            <p style="margin: 0 0 24px 0; font-size: 18px; font-weight: 400; color: #000000; line-height: 1.5;">
                                Você solicitou a redefinição de sua senha
                            </p>
                            <p style="margin: 0; font-size: 16px; font-weight: 300; color: #666666; line-height: 1.6;">
                                Clique no botão abaixo para criar uma nova senha segura
                            </p>
                        </div>

                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 50px 0;">
                            <a href="${resetUrl}" 
                               style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 18px 48px; font-size: 14px; font-weight: 500; letter-spacing: 2px; transition: all 0.2s ease; border-radius: 1px;">
                                REDEFINIR AGORA
                            </a>
                        </div>

                        <!-- Security Info -->
                        <div style="background-color: #fafafa; padding: 32px; margin: 40px 0; border-left: 4px solid #000000;">
                            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                                <!-- Custom clock icon -->
                                <div style="width: 20px; height: 20px; border: 2px solid #000000; border-radius: 50%; margin-right: 12px; margin-top: 2px; position: relative; flex-shrink: 0;">
                                    <div style="width: 1px; height: 6px; background-color: #000000; position: absolute; top: 2px; left: 50%; transform: translateX(-50%);"></div>
                                    <div style="width: 4px; height: 1px; background-color: #000000; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
                                </div>
                                <div>
                                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 500; color: #000000;">
                                        Válido por 1 hora
                                    </p>
                                    <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.4;">
                                        Solicitado em ${new Date().toLocaleString("pt-BR")}<br>
                                        Para: ${userEmail}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Alternative Access -->
                        <div style="margin: 40px 0; padding: 24px; background-color: #f8f8f8; border-radius: 1px;">
                            <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 500; color: #000000; text-transform: uppercase; letter-spacing: 1px;">
                                Link Alternativo
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #666666; word-break: break-all; line-height: 1.5;">
                                <a href="${resetUrl}" style="color: #000000; text-decoration: none; border-bottom: 1px solid #cccccc;">${resetUrl}</a>
                            </p>
                        </div>

                        <!-- Security Notice -->
                        <div style="text-align: center; margin-top: 40px; padding-top: 32px; border-top: 1px solid #f0f0f0;">
                            <p style="margin: 0; font-size: 13px; color: #999999; line-height: 1.5;">
                                Se você não solicitou esta redefinição, ignore este email.<br>
                                Sua senha permanecerá inalterada.
                            </p>
                        </div>

                    </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 60px;">
                    <div style="margin-bottom: 16px;">
                        <div style="width: 40px; height: 1px; background-color: #cccccc; margin: 0 auto;"></div>
                    </div>
                    <p style="margin: 0 0 8px 0; font-size: 11px; color: #999999; letter-spacing: 0.5px;">
                        EMAIL AUTOMÁTICO • NÃO RESPONDER
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #cccccc;">
                        © ${currentYear} PRESTIGE MOTORS
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
• Solicitado em: ${new Date().toLocaleString("pt-BR")}
• E-mail: ${userEmail}

Se você não solicitou esta redefinição, ignore este email.
Sua senha permanecerá inalterada.

© ${currentYear} Prestige Motors

Este é um email automático, não responda.
        `,
  }
}


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