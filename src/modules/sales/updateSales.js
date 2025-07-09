
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { z } = require('zod');



const { categoria} = require('@prisma/client')


const saleSchema = z.object({
    vehicleId: z.string(),
    compradorId: z.string(),
    precoVenda: z.number().positive(),
    formaPagamento: z.string(),
    categoria: z.enum(Object.values(categoria)),
    parcelas: z.number().int().positive().optional(),
    observacoes: z.string().optional()
});


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
        const existingSale = await prisma.sale.findUnique({
            where: { id },
            select: { 
                vendedorId: true, 
                compradorId: true,
                status: true
            }
        });

        if (!existingSale) {
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        // 2. Verifica permissões (admin OU dono da venda)
        const isAdmin = req.user.role === 'ADMIN';
        const isOwner = req.user.id === existingSale.vendedorId;
        
        if (!isAdmin && !isOwner) {
            return res.status(403).json({ 
                error: 'Apenas administradores ou o vendedor podem atualizar esta venda' 
            });
        }

        // 3. Verifica se a venda pode ser editada (ex: não está cancelada)
        if (existingSale.status === 'CANCELADA') {
            return res.status(400).json({ 
                error: 'Vendas canceladas não podem ser editadas' 
            });
        }

        // 4. Restrições para usuários não-administradores
        if (!isAdmin) {
            // Remove campos que só admin pode editar
            delete updateData.status;
            delete updateData.categoriaVeiculo;
            
            // Validações adicionais para usuário comum
            if (updateData.precoVenda) {
                return res.status(403).json({
                    error: 'Apenas administradores podem alterar o preço de venda'
                });
            }
        }

        // 5. Atualiza a venda
        const updatedSale = await prisma.sale.update({
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
            return res.status(400).json({ 
                error: 'Dados inválidos', 
                details: error.errors 
            });
        }
        handlePrismaError(error, res);
    }
};

module.exports = {
    updateSale
}