const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


const getVehicleStats = async (req, res) => {
    try {
        // Obter estatísticas agregadas
        const [marcasCount, mediaPreco, mediaKm, mediaAnoFabricacao, mediaAnoModelo] = await Promise.all([
            // Contagem por marca (sintaxe correta para groupBy)
            prisma.vehicle.groupBy({
                by: ['marca'],
                _count: {
                    marca: true
                },
                orderBy: {
                    marca: 'desc'
                }
            }),
            
            // Média de preço
            prisma.vehicle.aggregate({
                _avg: {
                    preco: true
                }
            }),
            
            // Média de km
            prisma.vehicle.aggregate({
                _avg: {
                    quilometragem: true
                }
            }),
            
            // Média de ano de fabricação
            prisma.vehicle.aggregate({
                _avg: {
                    anoFabricacao: true
                }
            }),
            
            // Média de ano do modelo
            prisma.vehicle.aggregate({
                _avg: {
                    anoModelo: true
                }
            })
        ]);
        
        res.json({
            marcas: marcasCount.map(item => ({
                marca: item.marca,
                quantidade: item._count.marca
            })),
            estatisticas: {
                precoMedio: mediaPreco._avg.preco,
                quilometragemMedia: mediaKm._avg.quilometragem,
                anoFabricacaoMedio: mediaAnoFabricacao._avg.anoFabricacao,
                anoModeloMedio: mediaAnoModelo._avg.anoModelo
            }
        });
    } catch (error) {
        console.error('Erro em getVehicleStats:', error);
        handlePrismaError(error, res);
    }
};

module.exports = {
    getVehicleStats
}