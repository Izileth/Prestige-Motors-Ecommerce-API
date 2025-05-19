
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const getSalesBySeller = async (req, res) => {
    try {
        const { userId } = req.params;

        if (req.user.id !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const [asSeller, asBuyer] = await Promise.all([
            prisma.venda.findMany({
                where: { vendedorId: userId },
                include: {
                    vehicle: {
                        select: {
                            marca: true,
                            modelo: true,
                            imagens: { where: { isMain: true }, take: 1 }
                        }
                    },
                    comprador: { select: { nome: true } }
                },
                orderBy: { dataVenda: 'desc' }
            }),
            prisma.venda.findMany({
                where: { compradorId: userId },
                include: {
                    vehicle: {
                        select: {
                            marca: true,
                            modelo: true,
                            imagens: { where: { isMain: true }, take: 1 }
                        }
                    },
                    vendedor: { select: { nome: true, telefone: true } }
                },
                orderBy: { dataVenda: 'desc' }
            })
        ]);

        res.json({ comoVendedor: asSeller, comoComprador: asBuyer });
    } catch (error) {
        handlePrismaError(error, res);
    }
};
module.exports = {
    getSalesBySeller
}