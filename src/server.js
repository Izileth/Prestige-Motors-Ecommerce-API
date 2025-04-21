
require('dotenv').config(); 
const app = require('./app');
const { connectDB } = require('./config/prisma');

const PORT = process.env.PORT || 5000;

// Iniciar conexão com o banco e depois o servidor
async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
    } catch (error) {
        console.error('❌ Falha ao iniciar o servidor:', error);
        process.exit(1);
    }
}

startServer();