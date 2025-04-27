
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();



const handlePrismaError = (error) => {
    if (error.code === 'P2025') throw { status: 404, message: 'Registro não encontrado' };
    if (error.code === 'P2002') throw { status: 409, message: 'Conflito de dados único' };
    throw { status: 500, message: 'Erro no servidor' };
};


const updateSale = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = saleSchema.partial().parse(req.body);

        // 1. Verifica se a venda existe e obtém os IDs relevantes
        const existingSale = await prisma.venda.findUnique({
        where: { id },
        select: { vendedorId: true, compradorId: true }
        });

        if (!existingSale) {
        return res.status(404).json({ error: 'Venda não encontrada' });
        }

        // 2. Verifica permissões (apenas admin pode atualizar vendas)
        if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Apenas administradores podem atualizar vendas' });
        }

        // 3. Atualiza a venda
        const updatedSale = await prisma.venda.update({
        where: { id },
        data: updateData,
        include: {
            vehicle: { select: { marca: true, modelo: true } },
            comprador: { select: { nome: true } }
        }
        });

        res.json(updatedSale);
    } catch (error) {
        console.error('Erro em updateSale:', error);
        if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
        }
        handlePrismaError(error);
    }
};

module.exports = {
    updateSale
}