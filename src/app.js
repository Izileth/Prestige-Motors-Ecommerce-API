const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const xss = require('xss-clean');

const cookieParser = require('cookie-parser');

const app = express();

// 1. Helmet (proteção de cabeçalhos HTTP)
app.use(helmet());

// 2. Logs de requisições com Morgan
app.use(morgan('combined')); // Use 'dev' para logs mais simples em desenvolvimento

// 3. Proteção contra XSS (Cross-Site Scripting)
app.use(xss());

// 4. Configuração do CORS

app.use(cookieParser());

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'] // Removi 'Authorization' pois não usaremos mais
}));
app.options('*', cors()); // Habilita OPTIONS para todas as rotas

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    next();
});


// 5. Rate Limiting (limitação de requisições)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use(limiter);

// 6. Middleware para parsear JSON
app.use(express.json());

// 7. Rotas
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/sales', require('./routes/salesRoutes')); // Novo



//app.use('/api/avaliacoes', require('./routes/reviewRoutes')); // Novo

// Rota de teste
app.get('/api/teste', (req, res) => {
    res.json({ 
        message: 'API funcionando!',
        endpoints: {
            usuarios: '/api/usuarios',
            veiculos: '/api/veiculos',
            vendas: '/api/vendas',
            avaliacoes: '/api/avaliacoes'
        }
    });
});
// 8. Tratamento centralizado de erros

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});



module.exports = app;