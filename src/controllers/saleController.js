const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { z } = require('zod');

// Schema para validação de criação/atualização de venda
const saleSchema = z.object({
  vehicleId: z.string(),
  compradorId: z.string(),
  precoVenda: z.number().positive(),
  formaPagamento: z.string(),
  parcelas: z.number().int().positive().optional(),
  observacoes: z.string().optional()
});

// Função para tratamento de erros do Prisma
const handlePrismaError = (error) => {
  if (error.code === 'P2025') throw { status: 404, message: 'Registro não encontrado' };
  if (error.code === 'P2002') throw { status: 409, message: 'Conflito de dados único' };
  throw { status: 500, message: 'Erro no servidor' };
};

const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await prisma.venda.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            marca: true,
            modelo: true,
            anoFabricacao: true,
            imagens: {
              where: { isMain: true },
              take: 1
            }
          }
        },
        vendedor: {
          select: {
            nome: true,
            telefone: true,
            email: true
          }
        },
        comprador: {
          select: {
            nome: true,
            telefone: true,
            email: true
          }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }

    // Verifica se o usuário tem acesso (vendedor, comprador ou admin)
    if (
      req.user.role !== 'ADMIN' &&
      req.user.id !== sale.vendedorId &&
      req.user.id !== sale.compradorId
    ) {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    res.json(sale);
  } catch (error) {
    console.error('Erro em getSaleById:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
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

const getSalesByVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    // Verifica se o usuário é dono do veículo ou admin
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { vendedorId: true }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    if (req.user.id !== vehicle.vendedorId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    const sales = await prisma.venda.findMany({
      where: { vehicleId },
      orderBy: { dataVenda: 'desc' },
      select: {
        id: true,
        precoVenda: true,
        dataVenda: true,
        comprador: {
          select: {
            nome: true,
            telefone: true
          }
        }
      }
    });

    res.json(sales);
  } catch (error) {
    console.error('Erro em getSalesByVehicle:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas' });
  }
};

const getSalesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verifica se é admin ou está acessando seus próprios dados
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    const [asSeller, asBuyer] = await Promise.all([
      // Vendas onde o usuário é vendedor
      prisma.venda.findMany({
        where: { vendedorId: userId },
        orderBy: { dataVenda: 'desc' },
        include: {
          vehicle: {
            select: {
              marca: true,
              modelo: true,
              imagens: {
                where: { isMain: true },
                take: 1
              }
            }
          },
          comprador: {
            select: {
              nome: true
            }
          }
        }
      }),
      // Compras onde o usuário é comprador
      prisma.venda.findMany({
        where: { compradorId: userId },
        orderBy: { dataVenda: 'desc' },
        include: {
          vehicle: {
            select: {
              marca: true,
              modelo: true,
              imagens: {
                where: { isMain: true },
                take: 1
              }
            }
          },
          vendedor: {
            select: {
              nome: true,
              telefone: true
            }
          }
        }
      })
    ]);

    res.json({
      comoVendedor: asSeller,
      comoComprador: asBuyer
    });
  } catch (error) {
    console.error('Erro em getSalesByUser:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas do usuário' });
  }
};

// Função já existente no seu controller (mantida para referência)
const createSale = async (req, res) => {
  try {
    const saleData = saleSchema.parse(req.body);
    
    // Verifica se o veículo existe e está disponível
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: saleData.vehicleId }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    if (vehicle.status !== 'DISPONIVEL') {
      return res.status(400).json({ error: 'Veículo não está disponível para venda' });
    }

    // Verifica se o comprador existe
    const buyerExists = await prisma.user.findUnique({
      where: { id: saleData.compradorId }
    });

    if (!buyerExists) {
      return res.status(404).json({ error: 'Comprador não encontrado' });
    }

    // Transação: cria venda + atualiza status do veículo
    const [sale] = await prisma.$transaction([
      prisma.venda.create({
        data: {
          ...saleData,
          vendedorId: req.user.id // O vendedor é o usuário autenticado
        }
      }),
      prisma.vehicle.update({
        where: { id: saleData.vehicleId },
        data: { status: 'VENDIDO' }
      })
    ]);

    res.status(201).json(sale);
  } catch (error) {
    console.error('Erro em createSale:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    handlePrismaError(error);
  }
};

// No final do arquivo:
module.exports = {
   createSale,
   getSalesByUser,
   getSaleById,
   getSalesByVehicle,
   updateSale,
};