
const crypto = require('crypto');

class DuplicateRequestPreventer {
    constructor(options = {}) {
        this.pendingRequests = new Map();
        this.config = {
            // Tempo limite para considerar uma requisição como "travada"
            timeout: options.timeout || 30000, // 30 segundos
            
            // Incluir user ID na chave (para usuários autenticados)
            includeUserId: options.includeUserId !== false,
            
            // Incluir IP na chave
            includeIp: options.includeIp !== false,
            
            // Incluir parâmetros da rota na chave
            includeParams: options.includeParams !== false,
            
            // Incluir query params na chave
            includeQuery: options.includeQuery || false,
            
            // Incluir body na chave (para POST/PUT)
            includeBody: options.includeBody || false,
            
            // Log de debugging
            debug: options.debug || false,
            
            // Mensagem personalizada
            message: options.message || 'Requisição duplicada detectada. Aguarde a conclusão da primeira requisição.',
            
            // Status code para requisições duplicadas
            statusCode: options.statusCode || 429,
            
            // Função customizada para gerar chave
            keyGenerator: options.keyGenerator || null
        };
        
        // Limpar requisições antigas periodicamente
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000); // 1 minuto
    }
    
    /**
     * Gera uma chave única para a requisição
     */
    generateKey(req) {
        if (this.config.keyGenerator) {
            return this.config.keyGenerator(req);
        }
        
        const parts = [];
        
        // Método HTTP
        parts.push(req.method);
        
        // Rota base (sem parâmetros)
        parts.push(req.route?.path || req.path);
        
        // IP do cliente
        if (this.config.includeIp) {
            const ip = req.ip || req.connection.remoteAddress || 'unknown';
            parts.push(ip);
        }
        
        // User ID (se disponível)
        if (this.config.includeUserId && req.user?.id) {
            parts.push(req.user.id);
        }
        
        // Parâmetros da rota
        if (this.config.includeParams && req.params) {
            const params = Object.keys(req.params)
                .sort()
                .map(key => `${key}:${req.params[key]}`)
                .join('|');
            if (params) parts.push(params);
        }
        
        // Query parameters
        if (this.config.includeQuery && req.query) {
            const query = Object.keys(req.query)
                .sort()
                .map(key => `${key}:${req.query[key]}`)
                .join('|');
            if (query) parts.push(query);
        }
        
        // Body (para POST/PUT)
        if (this.config.includeBody && req.body && Object.keys(req.body).length > 0) {
            const bodyHash = crypto
                .createHash('md5')
                .update(JSON.stringify(req.body))
                .digest('hex');
            parts.push(bodyHash);
        }
        
        // Criar hash final
        const keyString = parts.join('::');
        return crypto.createHash('sha256').update(keyString).digest('hex');
    }
    
    /**
     * Limpa requisições antigas/expiradas
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, data] of this.pendingRequests.entries()) {
            if (now - data.timestamp > this.config.timeout) {
                this.pendingRequests.delete(key);
                cleaned++;
                
                if (this.config.debug) {
                    console.log(`[DuplicateRequestPreventer] Limpeza: removida requisição expirada ${key}`);
                }
            }
        }
        
        if (this.config.debug && cleaned > 0) {
            console.log(`[DuplicateRequestPreventer] Limpeza: ${cleaned} requisições removidas`);
        }
    }
    
    /**
     * Middleware principal
     */
    middleware() {
        return (req, res, next) => {
            const key = this.generateKey(req);
            const now = Date.now();
            
            if (this.config.debug) {
                console.log(`[DuplicateRequestPreventer] Chave gerada: ${key}`);
                console.log(`[DuplicateRequestPreventer] Requisições pendentes: ${this.pendingRequests.size}`);
            }
            
            // Verificar se já existe uma requisição pendente
            if (this.pendingRequests.has(key)) {
                const pending = this.pendingRequests.get(key);
                
                // Verificar se não expirou
                if (now - pending.timestamp < this.config.timeout) {
                    if (this.config.debug) {
                        console.log(`[DuplicateRequestPreventer] Requisição duplicada bloqueada: ${key}`);
                    }
                    
                    return res.status(this.config.statusCode).json({
                        error: 'duplicate_request',
                        message: this.config.message,
                        retryAfter: Math.ceil((this.config.timeout - (now - pending.timestamp)) / 1000)
                    });
                } else {
                    // Remover requisição expirada
                    this.pendingRequests.delete(key);
                }
            }
            
            // Registrar nova requisição
            this.pendingRequests.set(key, {
                timestamp: now,
                method: req.method,
                path: req.path,
                ip: req.ip || req.connection.remoteAddress,
                userId: req.user?.id || null
            });
            
            if (this.config.debug) {
                console.log(`[DuplicateRequestPreventer] Nova requisição registrada: ${key}`);
            }
            
            // Remover da lista quando a requisição terminar
            const originalSend = res.send;
            const originalJson = res.json;
            const originalEnd = res.end;
            
            const cleanup = () => {
                this.pendingRequests.delete(key);
                if (this.config.debug) {
                    console.log(`[DuplicateRequestPreventer] Requisição finalizada: ${key}`);
                }
            };
            
            res.send = function(...args) {
                cleanup();
                return originalSend.apply(this, args);
            };
            
            res.json = function(...args) {
                cleanup();
                return originalJson.apply(this, args);
            };
            
            res.end = function(...args) {
                cleanup();
                return originalEnd.apply(this, args);
            };
            
            // Cleanup em caso de erro ou timeout
            res.on('close', cleanup);
            res.on('finish', cleanup);
            
            next();
        };
    }
    
    /**
     * Método para destruir o middleware e limpar recursos
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.pendingRequests.clear();
    }
    
    /**
     * Estatísticas do middleware
     */
    getStats() {
        return {
            pendingRequests: this.pendingRequests.size,
            requests: Array.from(this.pendingRequests.entries()).map(([key, data]) => ({
                key: key.substring(0, 8) + '...',
                method: data.method,
                path: data.path,
                ip: data.ip,
                userId: data.userId,
                age: Date.now() - data.timestamp
            }))
        };
    }
}

// Instância global (opcional)
const globalDuplicatePreventer = new DuplicateRequestPreventer({
    debug: process.env.NODE_ENV === 'development',
    timeout: 30000, // 30 segundos
    includeUserId: true,
    includeIp: true,
    includeParams: true
});

// Middleware pré-configurado para diferentes cenários
const preventDuplicates = {
    // Configuração padrão
    default: globalDuplicatePreventer.middleware(),
    
    // Para rotas de autenticação (inclui body)
    auth: new DuplicateRequestPreventer({
        includeBody: true,
        includeUserId: false,
        timeout: 10000,
        message: 'Aguarde antes de tentar fazer login novamente'
    }).middleware(),
    
    // Para rotas de upload (timeout maior)
    upload: new DuplicateRequestPreventer({
        timeout: 120000, // 2 minutos
        includeBody: true,
        message: 'Upload em progresso. Aguarde a conclusão.'
    }).middleware(),
    
    // Para rotas de relatórios (timeout maior, inclui query)
    reports: new DuplicateRequestPreventer({
        timeout: 60000, // 1 minuto
        includeQuery: true,
        message: 'Relatório sendo gerado. Aguarde a conclusão.'
    }).middleware(),
    
    // Para rotas críticas (timeout menor)
    critical: new DuplicateRequestPreventer({
        timeout: 10000, // 10 segundos
        message: 'Operação crítica em andamento. Aguarde.'
    }).middleware()
};

module.exports = {
    DuplicateRequestPreventer,
    preventDuplicates,
    globalDuplicatePreventer
};

