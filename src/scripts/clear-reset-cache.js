const redisClient = require('../config/redis');

async function clearVehicleCache() {
    try {
        console.log('🔍 Buscando chaves de cache de veículos...\n');
        
        // Busca todas as chaves que começam com "vehicles:"
        const keys = await redisClient.keys('vehicles:*');
        
        console.log(`📦 Encontradas ${keys.length} chaves no cache\n`);
        
        if (keys.length > 0) {
            console.log('Chaves encontradas:');
            keys.forEach((key, index) => {
                console.log(`  ${index + 1}. ${key}`);
            });
            
            console.log('\n🗑️  Deletando todas as chaves...');
            
            // Deleta todas as chaves
            await redisClient.del(...keys);
            
            console.log(`\n✅ Cache limpo com sucesso!`);
            console.log(`   ${keys.length} chaves foram removidas`);
        } else {
            console.log('ℹ️  Nenhum cache encontrado para limpar');
        }
        
        console.log('\n✨ Agora você pode listar os veículos e verá os dados atualizados!');
        
    } catch (error) {
        console.error('❌ Erro ao limpar cache:', error);
        console.error('Stack:', error.stack);
    } finally {
        await redisClient.quit();
        process.exit(0);
    }
}

clearVehicleCache();