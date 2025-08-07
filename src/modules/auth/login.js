const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const crypto = require('crypto'); // Adicione no topo do arquivo
const sessionId = crypto.randomUUID();


const login = async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'invalid_request',
                message: 'Corpo da requisição inválido'
            });
        }

        // 1. Validação básica dos campos
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({
                success: false,
                error: 'missing_credentials',
                message: 'Email e senha são obrigatórios'
            });
        }
        
        // 2. Busca o usuário com tratamento case-insensitive
        const user = await prisma.user.findUnique({
            where: { 
                email: email.toLowerCase().trim() 
            }
        });

        // 3. Verificação segura
        if (!user) {
            // Mesma mensagem para usuário não encontrado e senha incorreta
            return res.status(401).json({
                success: false,
                error: 'invalid_credentials',
                message: 'Credenciais inválidas'
            });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isLoggedIn: true,
                lastLoginAt: new Date(),
                currentSessionId: sessionId,
                loginCount: {
                    increment: 1
                }
            }
        });

        // 4. Comparação de senha com tratamento de erro
        let passwordMatch;
        try {
            passwordMatch = await bcrypt.compare(senha, user.senha);
        } catch (bcryptError) {
            console.error('Bcrypt error:', bcryptError);
            throw new Error('Erro na verificação de senha');
        }

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: 'invalid_credentials',
                message: 'Credenciais inválidas'
            });
        }
        
        // 5. Geração de token

        const token = jwt.sign(
            { 
                id: user.id,
                role: user.role,
                sessionId: sessionId // ADICIONAR esta linha
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        // 6. Configuração de cookie para cross-origin seguro
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development', // true em produção/staging
            sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
            maxAge: 24 * 60 * 60 * 1000, // 1 dia em milissegundos
            path: '/'
        };
        
        // 7. Log dos detalhes para debug
        console.log('Login bem sucedido para:', user.email);
        console.log('Cookie options:', cookieOptions);
        console.log('NODE_ENV:', process.env.NODE_ENV);
        
        // 8. Resposta com cookie e token no corpo
        return res
            .cookie('token', token, cookieOptions)
            .status(200)
            .json({
                success: true,
                token, // Inclui o token na resposta para estratégia alternativa
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    role: user.role,
                    isLoggedIn: true,
                    lastLoginAt: new Date(),
                    loginCount: user.loginCount + 1
                }
            });
    } catch (error) {
        console.error('Login error:', error);
        
        // 9. Tratamento de erros específico para JWT
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(500).json({
                success: false,
                error: 'token_error',
                message: 'Erro ao gerar token de acesso'
            });
        }

        res.status(500).json({
            success: false,
            error: 'server_error',
            message: process.env.NODE_ENV === 'development' 
                ? error.message 
                : 'Erro interno no servidor'
        });
    }
};

module.exports = {
    login
};