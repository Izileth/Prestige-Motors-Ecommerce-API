// middleware/routeLogger.js

const routeLogger = (req, res, next) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    // Log da requisição de entrada
    console.log('\n🌐 === NOVA REQUISIÇÃO ===');
    console.log(`Timestamp: ${timestamp}`);
    console.log(`${req.method} ${req.originalUrl}`);
    console.log(`IP: ${req.ip || req.connection.remoteAddress}`);
    console.log(`User-Agent: ${req.get('User-Agent') || 'N/A'}`);
    console.log(`Content-Type: ${req.get('Content-Type') || 'N/A'}`);
    
    // Log dos headers de autenticação (sem mostrar o token completo)
    if (req.get('Authorization')) {
        const auth = req.get('Authorization');
        const tokenPreview = auth.length > 20 ? `${auth.substring(0, 20)}...` : auth;
        console.log(`Authorization: ${tokenPreview}`);
    }
    
    // Log dos parâmetros
    if (Object.keys(req.params).length > 0) {
        console.log(`Params:`, req.params);
    }
    
    // Log do query string
    if (Object.keys(req.query).length > 0) {
        console.log(`Query:`, req.query);
    }
    
    // Log do body (evitando dados sensíveis)
    if (Object.keys(req.body).length > 0) {
        const sanitizedBody = { ...req.body };
        
        // Ocultar campos sensíveis
        ['password', 'token', 'secret'].forEach(field => {
            if (sanitizedBody[field]) {
                sanitizedBody[field] = '***oculto***';
            }
        });
        
        console.log(`Body:`, sanitizedBody);
    }
    
    // Interceptar a resposta para log
    const originalSend = res.send;
    
    res.send = function(data) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('\n📤 === RESPOSTA ENVIADA ===');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Duração: ${duration}ms`);
        console.log(`Content-Length: ${data ? data.length : 0} bytes`);
        
        // Log do conteúdo da resposta (limitado para não poluir)
        if (data && data.length < 1000) {
            try {
                const jsonData = JSON.parse(data);
                console.log(`Response:`, jsonData);
            } catch (e) {
                console.log(`Response (text): ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
            }
        } else if (data) {
            console.log(`Response: [Dados grandes - ${data.length} bytes]`);
        }
        
        console.log('=== FIM DA REQUISIÇÃO ===\n');
        
        originalSend.call(this, data);
    };
    
    // Interceptar erros
    const originalStatus = res.status;
    res.status = function(code) {
        if (code >= 400) {
            console.log(`⚠️ Status de erro detectado: ${code}`);
        }
        return originalStatus.call(this, code);
    };
    
    next();
};

module.exports = {
    routeLogger
}