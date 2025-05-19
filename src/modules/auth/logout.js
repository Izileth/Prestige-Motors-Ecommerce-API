const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();



const logout = async (req, res) => {
    try {
        const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/',
        };
        
        res.clearCookie('token', cookieOptions)
        .status(200)
        .json({ success: true });
    } catch (error) {
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