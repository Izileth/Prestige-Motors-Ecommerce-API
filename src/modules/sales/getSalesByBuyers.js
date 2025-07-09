const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const handlePrismaError = (error) => {
    if (error.code === 'P2025') throw { status: 404, message: 'Registro não encontrado' };
    if (error.code === 'P2002') throw { status: 409, message: 'Conflito de dados único' };
    throw { status: 500, message: 'Erro no servidor' };
};



const getPurchasesByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (req.user.id !== userId && !['ADMIN', 'USER'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const purchases = await prisma.sale.findMany({
            where: { compradorId: userId },
            include: {
                vehicle: {
                    select: {
                        marca: true,
                        modelo: true,
                        anoFabricacao: true,
                        imagens: { where: { isMain: true }, take: 1 }
                    }
                },
                vendedor: { select: { nome: true, telefone: true } }
            },
            orderBy: { dataVenda: 'desc' }
        });

        res.json(purchases);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    getPurchasesByUser
}