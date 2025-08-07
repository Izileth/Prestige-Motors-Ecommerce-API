const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');

const {preventDuplicates} = require('./middleware/cacheSizeMiddleware');
const {errorMiddleware} = require('./utils/errorHandler');

const app = express();

// 1. CORS deve vir ANTES de outros middlewares
const allowedOrigins = [
  'https://prestigemotors.online',
  'https://prestige-motors-eta.vercel.app', 
  'http://localhost:5173',
  'http://localhost:3000' 
];

// Configuração CORS mais permissiva para debugging
app.use(cors({
  origin: function(origin, callback) {
    console.log('Origin da requisição:', origin); // Debug
    
    // Permitir requisições sem origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar se a origem está permitida
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Origin rejeitada:', origin);
      callback(new Error('Bloqueado pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Cache-Control',
    'Cookie',
    'Set-Cookie',
    'Access-Control-Allow-Origin'
  ],
  exposedHeaders: ['Set-Cookie', 'Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// 2. Headers adicionais para garantir CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control, Cookie, Set-Cookie');
  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie, Authorization');
  
  // Responder a requisições OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// 3. Middlewares de segurança (após CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

app.use(xss());
app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json());

// 4. Middleware personalizado (movido para depois do CORS)
app.use(preventDuplicates.default);
app.use(errorMiddleware);

// 5. Rate Limiting
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
}));

// 6. Middleware de debug para CORS
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// 7. Rotas
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/negotiations', require('./routes/negociationRoutes'));

// 8. Rota de teste CORS
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API Working Correctly!',
    endpoints: {
      users: '/api/users',
      vehicles: '/api/vehicles', // Corrigido typo
      sales: '/api/sales'
    },  
    environment: process.env.NODE_ENV,
    allowedOrigins,
    requestOrigin: req.headers.origin,
    corsHeaders: {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials')
    }
  });
});

// 9. Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;