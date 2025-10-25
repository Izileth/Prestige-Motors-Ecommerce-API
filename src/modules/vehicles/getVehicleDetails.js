const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();

const handlePrismaError = (error, res) => {
    console.error('Erro Prisma:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Erro conhecido do Prisma
        switch (error.code) {
            case 'P2002': // Violação de unicidade
                return res.status(409).json({ message: 'Conflito: registro com este valor já existe.' });
            case 'P2025': // Registro não encontrado
                return res.status(404).json({ message: 'Registro não encontrado.' });
            case 'P2003': // Violação de chave estrangeira
                return res.status(400).json({ message: 'Referência inválida.' });
            default:
                return res.status(400).json({ message: `Erro na requisição: ${error.code}` });
        }
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        // Erro de validação
        return res.status(400).json({ message: 'Dados inválidos fornecidos.' });
    }
    
    // Erro genérico
    return res.status(500).json({ message: 'Erro no servidor' });
};

const getVehicleDetails = async (req, res) => {
    try {
        const { identifier } = req.params;

        if (!identifier) {
            return res.status(400).json({ message: 'ID ou slug do veículo não fornecido' });
        }

        const vehicle = await prisma.vehicle.findFirst({
            where: {
                OR: [
                    { id: identifier },
                    { slug: identifier }
                ]
            },
            include: {
                vendedor: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true,
                        avatar: true
                    }
                },
                imagens: true,
                videos: true,
                localizacao: true,
                avaliacoes: {
                    include: {
                        user: {
                            select: {
                                nome: true,
                                avatar: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }
        
    
        try {
            await prisma.viewLog.create({
                data: {
                    vehicleId: vehicleId,
                    userId: req.user?.id,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });
            
            await prisma.vehicle.update({
                where: { id: vehicleId },
                data: { visualizacoes: { increment: 1 } }
            });
        } catch (logError) {
      
            console.error('Erro ao registrar visualização:', logError);
        }
        
        res.json(vehicle);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    getVehicleDetails
};