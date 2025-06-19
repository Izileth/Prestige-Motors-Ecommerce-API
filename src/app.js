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
  'https://vortex-motors-services.vercel.app', // Teste 1
  'https://prestige-motors-eta.vercel.app', // Teste 2
  'http://localhost:5173' // Para desenvolvimento
];

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requisições sem origin (como apps mobile ou curl)
    if (!origin) return callback(null, true);
    
    // Verificar se a origem está na lista de permitidos
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
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
    'Set-Cookie'
  ],
  exposedHeaders: ['Set-Cookie', 'Authorization'],
  optionsSuccessStatus: 200
}));

// 3. Middleware personalizado para headers adicionais (OPCIONAL)
app.use((req, res, next) => {
  res.header('Permissions-Policy', 'interest-cohort=()');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie, Authorization');
  
  // Certificar-se de que o Preflight OPTIONS funcione corretamente
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
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
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API Working Correctly!',
    endpoints: {
      users: '/api/users',
      vehciles: '/api/vehicles',
      sales: '/api/sales'
    },  
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