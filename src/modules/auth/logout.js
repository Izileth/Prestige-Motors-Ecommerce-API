const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();



const logout = async (req, res) => {
    try {
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