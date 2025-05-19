// scripts/fixMongoEnums.js
const { PrismaClient } = require('@prisma/client');
const { MongoClient } = require('mongodb');

async function forceResetEnums() {
  let mongoClient;
  try {
    console.log('🚀 Conectando ao MongoDB...');
    
    // 1. Conexão direta com MongoDB
    mongoClient = new MongoClient(process.env.DATABASE_URL);
    await mongoClient.connect();
    const db = mongoClient.db();
    
    // 2. Atualização em massa para carroceria
    const carroceriaUpdate = await db.collection('Vehicle').updateMany(
      { 
        $or: [
          { carroceria: { $in: ['buggy', 'Buggy'] } },
          { carroceria: { $nin: [
            'HATCH', 'SEDAN', 'SUV', 'PICAPE', 'COUPE',
            'CONVERSIVEL', 'PERUA', 'MINIVAN', 'VAN', 
            'BUGGY', 'OFFROAD'
          ]}
        }
      ]},
      { $set: { carroceria: 'BUGGY' } }
    );
    
    console.log(`✅ ${carroceriaUpdate.modifiedCount} veículos atualizados`);

    // 3. Atualização para categoria (se necessário)
    const categoriaUpdate = await db.collection('Vehicle').updateMany(
      { categoria: 'HOT_HATCH' },
      { $set: { categoria: 'HOT_HATCH' } }
    );

    // 4. Verificação final
    const carroceriaStats = await db.collection('Vehicle').aggregate([
      { $group: { _id: '$carroceria', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();

    console.log('📊 Estatísticas de carroceria:');
    carroceriaStats.forEach(s => console.log(`- ${s._id}: ${s.count}`));

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    if (mongoClient) await mongoClient.close();
    console.log('🔌 Conexão com MongoDB encerrada');
  }
}

forceResetEnums();