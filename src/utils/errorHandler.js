
const handlePrismaError = (error, res) => {
    console.error('=== ERRO CAPTURADO ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Tipo do erro:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    
    // Erros específicos do Prisma
    if (error.code) {
        console.error('Código do Prisma:', error.code);
        console.error('Meta:', error.meta);
        
        switch (error.code) {
        case 'P2002':
            return res.status(409).json({
            error: 'Conflito de dados únicos',
            message: 'Já existe um registro com esses dados',
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
            field: error.meta?.target || 'campo desconhecido'
            });

        case 'P2025':
            return res.status(404).json({
            error: 'Registro não encontrado',
            message: 'O registro solicitado não existe no banco de dados',
            code: 'RECORD_NOT_FOUND'
            });

        case 'P2003':
            return res.status(400).json({
            error: 'Violação de chave estrangeira',
            message: 'Referência a um registro que não existe',
            code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
            field: error.meta?.field_name || 'campo desconhecido'
            });

        case 'P2006':
            return res.status(400).json({
            error: 'Valor inválido',
            message: 'O valor fornecido não é válido para o campo',
            code: 'INVALID_VALUE',
            field: error.meta?.field_name || 'campo desconhecido'
            });

        case 'P2007':
            return res.status(400).json({
            error: 'Erro de validação',
            message: 'Os dados fornecidos não passaram na validação',
            code: 'VALIDATION_ERROR'
            });

        case 'P2008':
            return res.status(400).json({
            error: 'Erro na consulta',
            message: 'Falha ao processar a consulta no banco de dados',
            code: 'QUERY_PARSING_ERROR'
            });

        case 'P2009':
            return res.status(400).json({
            error: 'Erro na validação da consulta',
            message: 'A consulta contém erros de validação',
            code: 'QUERY_VALIDATION_ERROR'
            });

        case 'P2010':
            return res.status(500).json({
            error: 'Erro na execução',
            message: 'Falha na execução da consulta',
            code: 'RAW_QUERY_FAILED'
            });

        case 'P2011':
            return res.status(400).json({
            error: 'Violação de constraint',
            message: 'Violação de restrição de nulidade',
            code: 'NULL_CONSTRAINT_VIOLATION',
            field: error.meta?.field_name || 'campo desconhecido'
            });

        case 'P2012':
            return res.status(400).json({
            error: 'Valor obrigatório ausente',
            message: 'Um valor obrigatório está faltando',
            code: 'MISSING_REQUIRED_VALUE',
            field: error.meta?.field_name || 'campo desconhecido'
            });

        case 'P2013':
            return res.status(400).json({
            error: 'Argumento obrigatório ausente',
            message: 'Um argumento obrigatório está faltando na consulta',
            code: 'MISSING_REQUIRED_ARGUMENT',
            field: error.meta?.field_name || 'campo desconhecido'
            });

        case 'P2014':
            return res.status(400).json({
            error: 'Violação de relação',
            message: 'A mudança violaria uma relação obrigatória',
            code: 'RELATION_VIOLATION',
            relation: error.meta?.relation_name || 'relação desconhecida'
            });

        case 'P2015':
            return res.status(404).json({
            error: 'Registro relacionado não encontrado',
            message: 'Um registro relacionado obrigatório não foi encontrado',
            code: 'RELATED_RECORD_NOT_FOUND',
            field: error.meta?.field_name || 'campo desconhecido'
            });

        case 'P2016':
            return res.status(400).json({
            error: 'Erro de interpretação da consulta',
            message: 'Erro ao interpretar a consulta',
            code: 'QUERY_INTERPRETATION_ERROR'
            });

        case 'P2017':
            return res.status(400).json({
            error: 'Registros não conectados',
            message: 'Os registros para a conexão não estão conectados',
            code: 'RECORDS_NOT_CONNECTED',
            relation: error.meta?.relation_name || 'relação desconhecida'
            });

        case 'P2018':
            return res.status(400).json({
            error: 'Registros conectados obrigatórios não encontrados',
            message: 'Registros conectados obrigatórios não foram encontrados',
            code: 'REQUIRED_CONNECTED_RECORDS_NOT_FOUND',
            relation: error.meta?.relation_name || 'relação desconhecida'
            });

        case 'P2019':
            return res.status(400).json({
            error: 'Erro de entrada',
            message: 'Erro de entrada na consulta',
            code: 'INPUT_ERROR'
            });

        case 'P2020':
            return res.status(400).json({
            error: 'Valor fora do range',
            message: 'O valor está fora do range permitido',
            code: 'VALUE_OUT_OF_RANGE',
            field: error.meta?.field_name || 'campo desconhecido'
            });

        case 'P2021':
            return res.status(404).json({
            error: 'Tabela não encontrada',
            message: 'A tabela não existe no banco de dados',
            code: 'TABLE_NOT_FOUND',
            table: error.meta?.table || 'tabela desconhecida'
            });

        case 'P2022':
            return res.status(404).json({
            error: 'Coluna não encontrada',
            message: 'A coluna não existe na tabela',
            code: 'COLUMN_NOT_FOUND',
            column: error.meta?.column || 'coluna desconhecida'
            });

        case 'P2023':
            return res.status(400).json({
            error: 'Dados inconsistentes',
            message: 'Dados inconsistentes na coluna',
            code: 'INCONSISTENT_COLUMN_DATA',
            column: error.meta?.column || 'coluna desconhecida'
            });

        case 'P2024':
            return res.status(408).json({
            error: 'Timeout na conexão',
            message: 'Timeout ao obter conexão com o banco de dados',
            code: 'TIMED_OUT_FETCHING_CONNECTION'
            });

        case 'P2025':
            return res.status(404).json({
            error: 'Operação falhou',
            message: 'A operação falhou porque depende de um ou mais registros que não foram encontrados',
            code: 'OPERATION_FAILED_MISSING_RECORDS'
            });

        case 'P2026':
            return res.status(400).json({
            error: 'Recurso não suportado',
            message: 'O recurso atual não é suportado para o banco de dados',
            code: 'UNSUPPORTED_FEATURE'
            });

        case 'P2027':
            return res.status(500).json({
            error: 'Múltiplos erros',
            message: 'Múltiplos erros ocorreram durante a execução',
            code: 'MULTIPLE_ERRORS'
            });

        default:
            return res.status(500).json({
            error: 'Erro de banco de dados',
            message: 'Erro não identificado no banco de dados',
            code: 'UNKNOWN_PRISMA_ERROR',
            prismaCode: error.code
            });
        }
    }

    // Erros de validação do Prisma
    if (error.name === 'PrismaClientValidationError') {
        return res.status(400).json({
        error: 'Erro de validação',
        message: 'Dados inválidos foram fornecidos',
        code: 'VALIDATION_ERROR',
        details: error.message
        });
    }

    // Erros de conexão do Prisma
    if (error.name === 'PrismaClientKnownRequestError') {
        return res.status(500).json({
        error: 'Erro de requisição conhecida',
        message: 'Erro conhecido do Prisma Client',
        code: 'KNOWN_REQUEST_ERROR'
        });
    }

    // Erros desconhecidos do Prisma
    if (error.name === 'PrismaClientUnknownRequestError') {
        return res.status(500).json({
        error: 'Erro desconhecido do Prisma',
        message: 'Erro desconhecido do Prisma Client',
        code: 'UNKNOWN_REQUEST_ERROR'
        });
    }

    // Erros de inicialização do Prisma
    if (error.name === 'PrismaClientInitializationError') {
        return res.status(500).json({
        error: 'Erro de inicialização',
        message: 'Falha na inicialização do Prisma Client',
        code: 'INITIALIZATION_ERROR'
        });
    }

    // Erros de runtime do Prisma
    if (error.name === 'PrismaClientRustPanicError') {
        return res.status(500).json({
        error: 'Erro crítico do Prisma',
        message: 'Erro crítico interno do Prisma',
        code: 'RUST_PANIC_ERROR'
        });
    }

    // Erros de JWT
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
        error: 'Token inválido',
        message: 'O token JWT fornecido é inválido',
        code: 'INVALID_JWT_TOKEN'
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
        error: 'Token expirado',
        message: 'O token JWT expirou',
        code: 'EXPIRED_JWT_TOKEN'
        });
    }

    // Erros de validação personalizados
    if (error.name === 'ValidationError') {
        return res.status(400).json({
        error: 'Erro de validação',
        message: error.message,
        code: 'CUSTOM_VALIDATION_ERROR'
        });
    }

    // Erros de autorização
    if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
        error: 'Não autorizado',
        message: 'Você não tem permissão para acessar este recurso',
        code: 'UNAUTHORIZED_ACCESS'
        });
    }

    // Erros de permissão
    if (error.name === 'ForbiddenError') {
        return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para realizar esta ação',
        code: 'FORBIDDEN_ACCESS'
        });
    }

    // Erro genérico
    return res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro inesperado no servidor',
        code: 'INTERNAL_SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack
        })
    });
};

/**
 * Middleware para capturar erros não tratados
 */
const errorMiddleware = (error, req, res, next) => {
  // Log do erro
    console.error('=== ERRO NÃO TRATADO ===');
    console.error('URL:', req.originalUrl);
    console.error('Método:', req.method);
    console.error('IP:', req.ip);
    console.error('User-Agent:', req.get('User-Agent'));
    console.error('Body:', req.body);
    console.error('Params:', req.params);
    console.error('Query:', req.query);
    
    // Usar o handler de erro
    handlePrismaError(error, res);
};

/**
 * Função para criar erros personalizados
 */
const createError = (name, message, statusCode = 500) => {
    const error = new Error(message);
    error.name = name;
    error.statusCode = statusCode;
    return error;
};

/**
 * Wrapper para funções async que automaticamente captura erros
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    handlePrismaError,
    errorMiddleware,
    createError,
    asyncHandler
};