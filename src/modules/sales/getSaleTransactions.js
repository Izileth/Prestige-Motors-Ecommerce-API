const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const handlePrismaError = (error, res) => {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Registro não encontrado' });
    if (error.code === 'P2002') return res.status(409).json({ error: 'Conflito de dados único' });
    console.error('Erro no servidor:', error);
    return res.status(500).json({ error: 'Erro no servidor' });
};

const getUserTransactions = async (req, res) => {
    try {
        const { userId } = req.params;

        // Verificação de autorização
        if (req.user.id !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        // Consulta unificada usando Promise.all para paralelismo
        const [salesAsSeller, salesAsBuyer] = await Promise.all([
            // Vendas onde o usuário é vendedor
            prisma.sale.findMany({
                where: { vendedorId: userId },
                include: {
                    vehicle: {
                        select: {
                            id: true,
                            marca: true,
                            modelo: true,
                            anoFabricacao: true,
                            imagens: { where: { isMain: true }, take: 1 }
                        }
                    },
                    comprador: { 
                        select: { 
                            id: true,
                            nome: true,
                            email: true,
                            telefone: true 
                        } 
                    }
                },
                orderBy: { dataVenda: 'desc' }
            }),
            
            // Vendas onde o usuário é comprador
            prisma.sale.findMany({
                where: { compradorId: userId },
                include: {
                    vehicle: {
                        select: {
                            id: true,
                            marca: true,
                            modelo: true,
                            anoFabricacao: true,
                            imagens: { where: { isMain: true }, take: 1 }
                        }
                    },
                    vendedor: { 
                        select: { 
                            id: true,
                            nome: true,
                            email: true,
                            telefone: true 
                        } 
                    }
                },
                orderBy: { dataVenda: 'desc' }
            })
        ]);

        // Formatação consistente da resposta
        const response = {
            asSeller: salesAsSeller.map(sale => ({
                ...sale,
                vehicle: {
                    ...sale.vehicle,
                    imagemPrincipal: sale.vehicle.imagens[0]?.url || null
                },
                role: 'seller'
            })),
            asBuyer: salesAsBuyer.map(sale => ({
                ...sale,
                vehicle: {
                    ...sale.vehicle,
                    imagemPrincipal: sale.vehicle.imagens[0]?.url || null
                },
                role: 'buyer'
            }))
        };

        // Remove o array de imagens para simplificar o frontend
        response.asSeller.forEach(sale => delete sale.vehicle.imagens);
        response.asBuyer.forEach(sale => delete sale.vehicle.imagens);

        res.json(response);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    getUserTransactions
};