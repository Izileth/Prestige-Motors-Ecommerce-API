
const nodemailer = require('nodemailer');

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@prestigemotors.com.br';

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || 'user@example.com',
        pass: process.env.EMAIL_PASSWORD || 'password'
    }
});

// Test connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.log('Error connecting to email server:', error);
    } else {
        console.log('Email server connection established');
    }
});

/**
 * Sends an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML email content
 * @returns {Promise} - Email sending result
 */
const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        html
        });
        
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
};

/**
 * Sends password reset email
 * @param {string} to - User email
 * @param {string} resetUrl - Password reset URL
 * @param {string} name - User's name
 */
const sendPasswordResetEmail = async (to, resetUrl, name) => {
    const subject = 'Prestige Motors - Redefinição de Senha';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #333;">Redefinição de Senha</h1>
        </div>
        
        <p>Olá${name ? ` ${name}` : ''},</p>
        
        <p>Você solicitou a redefinição de sua senha no Prestige Motors.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Redefinir minha senha
            </a>
        </div>
        
        <p>Este link é válido por 1 hora. Se você não solicitou esta redefinição, ignore este email.</p>
        
        <hr style="border: 1px solid #eee; margin: 30px 0;" />
        
        <p style="color: #666; font-size: 14px; text-align: center;">
            Prestige Motors - A melhor experiência em compra de veículos
        </p>
        </div>
    `;
    
    return sendEmail(to, subject, html);
};

/**
 * Sends welcome email to new users
 * @param {string} to - User email
 * @param {string} name - User's name
 */
    const sendWelcomeEmail = async (to, name) => {
    const subject = 'Bem-vindo ao Prestige Motors';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #333;">Bem-vindo ao Prestige Motors!</h1>
        </div>
        
        <p>Olá, ${name}!</p>
        
        <p>Estamos muito felizes em tê-lo como nosso cliente. Agora você pode começar a explorar os melhores veículos do mercado.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Explorar veículos
            </a>
        </div>
        
        <p>Se você tiver qualquer dúvida, nossa equipe está à disposição para ajudar.</p>
        
        <hr style="border: 1px solid #eee; margin: 30px 0;" />
        
        <p style="color: #666; font-size: 14px; text-align: center;">
            Prestige Motors - A melhor experiência em compra de veículos
        </p>
        </div>
    `;
    
    return sendEmail(to, subject, html);
};

/**
 * Sends password changed confirmation email
 * @param {string} to - User email
 * @param {string} name - User's name
 */
const sendPasswordChangedEmail = async (to, name) => {
    const subject = 'Prestige Motors - Senha Alterada';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #333;">Senha Alterada com Sucesso</h1>
        </div>
        
        <p>Olá${name ? ` ${name}` : ''},</p>
        
        <p>Sua senha foi redefinida com sucesso.</p>
        
        <p>Se você não realizou esta alteração, entre em contato com nosso suporte imediatamente.</p>
        
        <hr style="border: 1px solid #eee; margin: 30px 0;" />
        
        <p style="color: #666; font-size: 14px; text-align: center;">
            Prestige Motors - A melhor experiência em compra de veículos
        </p>
        </div>
    `;
    
    return sendEmail(to, subject, html);
};

module.exports = {
    sendEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    sendPasswordChangedEmail
};