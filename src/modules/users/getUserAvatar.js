const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const uploadAvatar = async (req, res) => {
    const startTime = Date.now();
    const { id } = req.params;
    
    console.log('=== INÍCIO UPLOAD AVATAR ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`User ID: ${id}`);
    console.log(`Method: ${req.method} ${req.path}`);
    console.log(`User-Agent: ${req.get('User-Agent')}`);
    
    try {
        // Log dos dados da requisição
        console.log('📝 Dados da requisição:');
        console.log(`- Body keys: ${Object.keys(req.body)}`);
        console.log(`- Files: ${req.file ? 'Arquivo presente' : 'Nenhum arquivo'}`);
        
        if (req.file) {
            console.log('📎 Detalhes do arquivo:');
            console.log(`- Original name: ${req.file.originalname}`);
            console.log(`- Mimetype: ${req.file.mimetype}`);
            console.log(`- Size: ${req.file.size} bytes (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
            console.log(`- Field name: ${req.file.fieldname}`);
        }
        
        // Verificar se o arquivo foi enviado
        if (!req.file) {
            console.log('❌ ERRO: Nenhum arquivo enviado');
            return res.status(400).json({ 
                error: 'Nenhum arquivo foi enviado' 
            });
        }

        console.log('🔍 Verificando se usuário existe...');
        
        // Verificar se o usuário existe
        const userExists = await prisma.user.findUnique({
            where: { id }
        });

        if (!userExists) {
            console.log(`❌ ERRO: Usuário ${id} não encontrado no banco`);
            return res.status(404).json({ 
                error: 'Usuário não encontrado' 
            });
        }

        console.log('✅ Usuário encontrado:');
        console.log(`- ID: ${userExists.id}`);
        console.log(`- Email: ${userExists.email || 'N/A'}`);
        console.log(`- Avatar atual: ${userExists.avatar || 'Nenhum'}`);

        console.log('☁️ Processando upload no Cloudinary...');
        console.log('(O Multer + CloudinaryStorage está fazendo o upload automaticamente)');
        
        // O Multer + CloudinaryStorage já fez o upload!
        const avatarUrl = req.file.path;
        
        console.log('✅ Upload no Cloudinary concluído:');
        console.log(`- URL gerada: ${avatarUrl}`);
        console.log(`- Public ID: ${req.file.filename || 'N/A'}`);
        
        console.log('💾 Atualizando avatar no banco de dados...');
        
        // Atualizar o avatar do usuário no banco
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { avatar: avatarUrl }
        });

        console.log('✅ Banco de dados atualizado com sucesso');
        console.log(`- Novo avatar URL: ${updatedUser.avatar}`);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`⏱️ Tempo total de processamento: ${duration}ms`);
        console.log('=== UPLOAD AVATAR CONCLUÍDO COM SUCESSO ===');

        res.status(200).json({ 
            success: true,
            message: 'Avatar atualizado com sucesso',
            avatarUrl: avatarUrl,
            processingTime: `${duration}ms`,
            user: {
                id: updatedUser.id,
                avatar: updatedUser.avatar
            }
        });

    } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('💥 ERRO DURANTE UPLOAD DO AVATAR:');
        console.log(`- Timestamp: ${new Date().toISOString()}`);
        console.log(`- User ID: ${id}`);
        console.log(`- Tempo até erro: ${duration}ms`);
        console.log(`- Tipo do erro: ${error.constructor.name}`);
        console.log(`- Mensagem: ${error.message}`);
        console.log(`- Stack trace:`, error.stack);
        
        // Log adicional para erros específicos
        if (error.code) {
            console.log(`- Código do erro: ${error.code}`);
        }
        
        if (error.errno) {
            console.log(`- Errno: ${error.errno}`);
        }
        
        if (error.meta) {
            console.log(`- Metadata:`, error.meta);
        }
        
        console.log('=== FIM LOG DE ERRO ===');
        
        res.status(500).json({ 
            error: 'Erro interno do servidor ao fazer upload do avatar',
            timestamp: new Date().toISOString(),
            processingTime: `${duration}ms`,
            details: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                type: error.constructor.name,
                code: error.code || 'N/A'
            } : undefined
        });
    }
};

// Função para "deletar" avatar - apenas remove a referência do banco
const deleteUserAvatar = async (req, res) => {
    const startTime = Date.now();
    const { id } = req.params;
    
    console.log('=== INÍCIO REMOÇÃO AVATAR ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`User ID: ${id}`);
    console.log(`Method: ${req.method} ${req.path}`);
    
    try {
        console.log('🔍 Verificando se usuário existe...');
        
        // Verificar se o usuário existe
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            console.log(`❌ ERRO: Usuário ${id} não encontrado para remoção`);
            return res.status(404).json({ 
                error: 'Usuário não encontrado' 
            });
        }

        console.log('✅ Usuário encontrado:');
        console.log(`- ID: ${user.id}`);
        console.log(`- Avatar atual: ${user.avatar || 'Nenhum'}`);

        if (!user.avatar) {
            console.log('⚠️ AVISO: Usuário não possui avatar para remover');
            return res.status(400).json({ 
                error: 'Usuário não possui avatar para remover' 
            });
        }

        console.log('🗑️ Removendo referência do avatar no banco...');
        
        // Apenas remover a referência do banco de dados
        await prisma.user.update({
            where: { id },
            data: { avatar: null }
        });

        console.log('✅ Avatar removido do banco com sucesso');
        console.log('ℹ️ Nota: Arquivo permanece no Cloudinary até ser substituído');
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`⏱️ Tempo total de processamento: ${duration}ms`);
        console.log('=== REMOÇÃO AVATAR CONCLUÍDA ===');

        res.status(200).json({ 
            success: true,
            message: 'Avatar removido do perfil com sucesso',
            processingTime: `${duration}ms`
        });

    } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('💥 ERRO DURANTE REMOÇÃO DO AVATAR:');
        console.log(`- Timestamp: ${new Date().toISOString()}`);
        console.log(`- User ID: ${id}`);
        console.log(`- Tempo até erro: ${duration}ms`);
        console.log(`- Tipo do erro: ${error.constructor.name}`);
        console.log(`- Mensagem: ${error.message}`);
        console.log(`- Stack trace:`, error.stack);
        
        console.log('=== FIM LOG DE ERRO DE REMOÇÃO ===');
        
        res.status(500).json({ 
            error: 'Erro interno do servidor ao remover avatar',
            timestamp: new Date().toISOString(),
            processingTime: `${duration}ms`,
            details: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                type: error.constructor.name
            } : undefined
        });
    }
};

module.exports = {
    uploadAvatar,
    deleteUserAvatar
};