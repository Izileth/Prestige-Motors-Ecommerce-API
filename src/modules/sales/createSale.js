const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();
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


const createSale = async (req, res) => {
    try {
        const data = saleSchema.parse(req.body);
        
        // Verificar se o veículo está disponível
        const vehicle = await prisma.vehicle.findUnique({
        where: { id: data.vehicleId }
        });
        
        if (vehicle.status !== 'DISPONIVEL') {
        return res.status(400).json({ error: 'Veículo não está disponível para venda' });
        }
        
        const sale = await prisma.$transaction([
        prisma.sale.create({
            data: {
            ...data,
            vendedorId: req.user.id
            }
        }),
        prisma.vehicle.update({
            where: { id: data.vehicleId },
            data: { status: 'VENDIDO' }
        })
        ]);
        
        res.status(201).json(sale);
    } catch (error) {
        console.error('Erro em createSale:', error);
        res.status(500).json({ error: 'Erro ao criar vendas do usuário' });
    }
};

module.exports = {
    createSale
}