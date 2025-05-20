const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');

const app = express();

// 1. Middlewares iniciais (segurança básica)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Configuração específica do Helmet
}));
app.use(xss());
app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json());

// 2. Configuração CORS (DEVE vir após helmet e antes das rotas)
const allowedOrigins = [
  'https://vortex-motors-services.vercel.app',
  'http://localhost:5173' // Para desenvolvimento
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Cache-Control'
  ],
  exposedHeaders: ['Set-Cookie', 'Authorization'],
  optionsSuccessStatus: 200
}));

// 3. Middleware personalizado para headers adicionais (OPCIONAL)
app.use((req, res, next) => {
  // Headers adicionais que não conflitam com CORS
  res.header('Permissions-Policy', 'interest-cohort=()');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie, Authorization');
  next();
});

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