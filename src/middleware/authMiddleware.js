const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const protect = async (req, res, next) => {
    let token;

    // Verificar se o token está no cabeçalho Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extrair o token do cabeçalho
            token = req.headers.authorization.split(' ')[1];

            // Verificar e decodificar o token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Buscar o usuário no banco de dados
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, nome: true, email: true, role: true }
            });

            // Se o usuário não existir, retornar erro
            if (!user) {
                return res.status(401).json({ message: 'Usuário não encontrado' });
            }

            // Adicionar o usuário ao objeto `req` para uso posterior
            req.user = user;
            next();
        } catch (error) {
            console.error('Erro de autenticação:', error);

            // Retornar erros específicos com base no tipo de erro
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Token inválido' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expirado' });
            }

            // Erro genérico
            return res.status(401).json({ message: 'Não autorizado' });
        }
    }

    // Se não houver token, retornar erro
    if (!token) {
        return res.status(401).json({ message: 'Não autorizado, token não fornecido' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Somente administradores podem acessar esta rota.' });
    }
};

module.exports = { protect, admin };