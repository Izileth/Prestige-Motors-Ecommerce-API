const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

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
            role: user.role 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' } // Aumentei para 7 dias
        );


        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true em produção
            sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
            domain: process.env.NODE_ENV === 'development' 
                ? 'localhost' 
                : '.vortex-motors-services.vercel.app' // COM o ponto inicial
        };
        


        // 6. Resposta com cookie seguro
        res.cookie('token', token, cookieOptions)
        .status(200)
        .json({
            success: true,
            token, // <- aqui está o segredo!
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role
            }
        });


    } catch (error) {
        console.error('Login error:', error);
        
        // 7. Tratamento de erros específico para JWT
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
            message: 'Erro interno no servidor'
        });
    }
};

module.exports = {
    login
};