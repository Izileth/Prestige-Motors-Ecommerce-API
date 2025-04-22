const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
    try {
        // 1. Verificar o cookie (não mais o header Authorization)
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'not_authenticated',
                message: 'Acesso não autorizado. Por favor, faça login.' 
            });
        }

        // 2. Verificar e decodificar o token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Buscar o usuário no banco de dados (opcional - pode usar apenas os dados do token)
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { 
                id: true, 
                nome: true, 
                email: true, 
                role: true,
                avatar: true
            }
        });

        if (!user) {
            // Limpa o cookie se o usuário não existir mais
            res.clearCookie('token');
            return res.status(401).json({ 
                success: false,
                error: 'user_not_found',
                message: 'Usuário não encontrado' 
            });
        }

        // 4. Adicionar o usuário ao objeto `req` para uso posterior
        req.user = user;
        next();
    } catch (error) {
        console.error('Erro de autenticação:', error);

        // Limpa o cookie em caso de erro
        res.clearCookie('token');

        // Retornar erros específicos
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                error: 'invalid_token',
                message: 'Token inválido' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                error: 'token_expired',
                message: 'Sessão expirada. Por favor, faça login novamente.' 
            });
        }

        // Erro genérico
        return res.status(401).json({ 
            success: false,
            error: 'authentication_error',
            message: 'Falha na autenticação' 
        });
    }
};
const checkSession = async (req, res) => {
    try {
        // Se o middleware de autenticação passou, o usuário está válido
        const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            avatar: true
        }
        });

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({
        success: false,
        error: 'session_error',
        message: 'Erro ao verificar sessão'
        });
    }
};
const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false,
                error: 'not_authorized',
                message: 'Acesso negado. Permissões insuficientes.' 
            });
        }
        next();
    };
};

// Middleware específico para admin (pode ser substituído pelo authorize)
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ 
            success: false,
            error: 'admin_required',
            message: 'Acesso restrito a administradores' 
        });
    }
};

module.exports = { 
    checkSession,
    authenticate,  // substitui o protect
    authorize,     // versão mais flexível
    admin          // mantido para compatibilidade
};