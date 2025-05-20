const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');

const app = express();

// 1. Segurança básica
app.use(helmet());
app.use(xss());
app.use(morgan('combined'));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Private-Network', 'true');
    res.header('Permissions-Policy', 'interest-cohort=()');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});

// 2. CORS Dinâmico
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://vortex-motors-services.vercel.app'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        } else {
        callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Access-Control-Allow-Origin'],
    credentials: true,
    exposedHeaders: ['Set-Cookie', 'Authorization'],
}));

// 3. Configurações adicionais
app.use(cookieParser());
app.use(express.json());

// 4. Rate Limiting
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
}));

// 5. Rotas
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));

// 6. Rota de teste
app.get('/api/teste', (req, res) => {
    res.json({ 
        message: 'API funcionando!',
        environment: process.env.NODE_ENV,
        allowedOrigins
    });
});

// 7. Tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app;