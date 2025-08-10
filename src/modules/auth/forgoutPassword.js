const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const RESET_TOKEN_EXPIRY = 3600000; // 1 hora em milissegundos
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@prestigemotors.online';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://prestigemotors.online';

// Template de email minimalista monocromático para recuperação de senha
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
                    <div style="border: 1px solid #000000; display: inline-block; padding: 8px 16px;">
                        <h1 style="margin: 0; font-size: 20px; font-weight: 400; letter-spacing: 1px;">
                            PRESTIGE MOTORS
                        </h1>
                    </div>
                </div>

                <!-- Main Content -->
                <div style="border: 1px solid #000000; padding: 40px 30px; background-color: #ffffff;">
                    
                    <!-- Lock Icon -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 50px; height: 50px; border: 1px solid #000000; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background-color: #ffffff;">
                            <span style="color: #000000; font-size: 20px;">🔒</span>
                        </div>
                    </div>

                    <!-- Title -->
                    <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 300; text-align: center; color: #000000;">
                        Redefinir Senha
                    </h2>

                    <!-- Divider -->
                    <div style="height: 1px; background-color: #000000; margin: 30px auto; width: 40px;"></div>

                    <!-- Message -->
                    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #000000; text-align: center;">
                        Você solicitou a <strong>redefinição de sua senha</strong> no sistema Prestige Motors.
                    </p>

                    <p style="margin: 0 0 30px 0; font-size: 14px; line-height: 1.5; color: #000000; text-align: center;">
                        Clique no botão abaixo para criar uma nova senha:
                    </p>

                    <!-- Call to Action Button -->
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${resetUrl}" 
                           style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 32px; font-size: 14px; font-weight: 500; letter-spacing: 1px; border: 1px solid #000000;">
                            REDEFINIR SENHA
                        </a>
                    </div>

                    <!-- Security Info -->
                    <div style="border: 1px solid #000000; padding: 20px; margin: 30px 0; background-color: #ffffff; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #000000;">
                            <strong>Informações de Segurança:</strong><br>
                            Este link é válido por <strong>1 hora</strong><br>
                            Solicitado em: ${new Date().toLocaleString('pt-BR')}<br>
                            E-mail: ${userEmail}
                        </p>
                    </div>

                    <!-- Alternative Link -->
                    <div style="margin: 30px 0; padding: 20px; background-color: #ffffff; border-left: 1px solid #000000; text-align: center;">
                        <p style="margin: 0 0 10px 0; font-size: 12px; color: #000000; font-weight: 500;">
                            Link alternativo:
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #000000; word-break: break-all; line-height: 1.4;">
                            <a href="${resetUrl}" style="color: #000000; text-decoration: underline;">${resetUrl}</a>
                        </p>
                    </div>

                    <!-- Security Warning -->
                    <div style="margin: 30px 0; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #000000;">
                            Se você <strong>não solicitou</strong> esta redefinição, ignore este email.<br>
                            Sua senha permanecerá inalterada.
                        </p>
                    </div>

                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #000000;">
                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #000000;">
                        Este é um email automático, não responda.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #000000;">
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

// Função para validar formato de email
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Validações básicas
        if (!email) {
            return res.status(400).json({ 
                message: 'Email é obrigatório',
                error: 'EMAIL_REQUIRED'
            });
        }

        // Validar formato do email
        if (!validateEmail(email)) {
            return res.status(400).json({ 
                message: 'Por favor, insira um email válido',
                error: 'EMAIL_INVALID_FORMAT'
            });
        }
        
        // Buscar usuário
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() } // Normalizar email para lowercase
        });
        
        if (!user) {
            // Por segurança, não informamos se o email existe ou não
            // Mas retornamos sucesso para não dar dicas sobre emails válidos
            return res.status(200).json({ 
                message: 'Se este email estiver registrado, você receberá um link de recuperação',
                success: true
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
                resetTokenExpiry,
                // Opcional: Log da solicitação
                updatedAt: new Date()
            }
        });
        
        // URL de redefinição (front-end) - Atualizada para nova estrutura de rotas
        const resetUrl = `${FRONTEND_URL}/passwords/reset/${resetToken}`;
        
        // Enviar email com template minimalista
        try {
            const emailTemplate = createPasswordResetEmailTemplate(resetUrl, user.email);
            
            const emailResponse = await resend.emails.send({
                from: EMAIL_FROM,
                to: [email],
                subject: 'Prestige Motors - Redefinição de Senha',
                html: emailTemplate.html,
                text: emailTemplate.text
            });
            
            // Log de sucesso com ID do email
            console.log(`Email de reset enviado para ${email}. ID: ${emailResponse.id}`);
            
            res.status(200).json({ 
                message: 'Email de redefinição enviado com sucesso',
                success: true,
                // Em desenvolvimento, retornar informações extras
                ...(process.env.NODE_ENV === 'development' && {
                    emailId: emailResponse.id,
                    resetToken: resetToken // APENAS EM DESENVOLVIMENTO!
                })
            });
            
        } catch (emailError) {
            console.error('Erro ao enviar email de redefinição:', emailError);
            
            // Reverter alterações no banco se o email falhar
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken: null,
                    resetTokenExpiry: null
                }
            });
            
            res.status(500).json({ 
                message: 'Não foi possível enviar o email de redefinição. Tente novamente.',
                error: 'EMAIL_SEND_FAILED',
                details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
            });
        }
        
    } catch (error) {
        console.error('Erro no processo de recuperação de senha:', error);
        
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

// Função auxiliar para limpar tokens expirados (pode ser executada por cronjob)
const cleanExpiredTokens = async () => {
    try {
        const result = await prisma.user.updateMany({
            where: {
                resetTokenExpiry: {
                    lt: new Date() // Menor que agora (expirado)
                }
            },
            data: {
                resetToken: null,
                resetTokenExpiry: null
            }
        });
        
        console.log(`${result.count} tokens expirados foram limpos`);
        return result.count;
    } catch (error) {
        console.error('Erro ao limpar tokens expirados:', error);
        return 0;
    }
};

module.exports = {
    forgotPassword,
    cleanExpiredTokens
};