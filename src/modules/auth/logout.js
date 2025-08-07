const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();



const logout = async (req, res) => {
    try {
        // Extrair userId do token (se disponível)
        let userId = null;
        const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            } catch (jwtError) {
                console.log('Token inválido no logout, mas continuando...');
            }
        }

        // Se temos o userId, atualizar status no banco
        if (userId) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    isLoggedIn: false,
                    lastLogoutAt: new Date(),
                    currentSessionId: null
                }
            });
        }

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
            path: '/'
        };
        
        res.clearCookie('token', cookieOptions)
           .status(200)
           .json({ 
               success: true,
               message: 'Logout realizado com sucesso' 
           });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'logout_error',
            message: 'Erro ao fazer logout'
        });
    }
};

module.exports = {
    logout
}