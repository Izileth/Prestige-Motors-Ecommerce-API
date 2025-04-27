const { PrismaClient } = require('@prisma/client');
const { Prisma } = require('@prisma/client');

const prisma = new PrismaClient();

const { z } = require('zod');

const { 
    Combustivel, 
    Cambio, 
    Carroceria, 
    Categoria, 
    Classe, 
    StatusVeiculo 
} = require('@prisma/client');

const vehicleSchema = z.object({
    marca: z.string(),
    modelo: z.string(),
    anoFabricacao: z.number().int(),
    anoModelo: z.number().int(),
    preco: z.number().positive(),
    precoPromocional: z.number().positive().optional(),
    descricao: z.string().optional(),
    quilometragem: z.number().positive(),
    tipoCombustivel: z.enum(Object.values(Combustivel )),
    cambio: z.enum(Object.values(Cambio)),
    cor: z.string(),
    portas: z.number().int().min(2).max(5),
    finalPlaca: z.number().int().min(0).max(9).optional(),
    carroceria: z.enum(Object.values(Carroceria)),
    potencia: z.number().int().positive().optional(),
    motor: z.string().optional(),
    categoria: z.enum(Object.values(Categoria)),
    classe: z.enum(Object.values(Classe)),
    status: z.enum(Object.values(StatusVeiculo)).default('DISPONIVEL'),
    destaque: z.boolean().default(false),
    seloOriginal: z.boolean().default(false),
    aceitaTroca: z.boolean().default(false),
    parcelamento: z.number().positive().optional(),
    localizacaoId: z.string().optional()
});



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

const createVehicle = async (req, res) => {
    try {
        const data = vehicleSchema.parse(req.body);
        const vehicle = await prisma.vehicle.create({
        data: {
            ...data,
            vendedorId: req.user.id,
            imagens: data.imagens ? {
            create: data.imagens.map(img => ({ url: img }))
            } : undefined,
            videos: data.videos ? {
            create: data.videos.map(video => ({ url: video }))
            } : undefined
        },
        include: {
            vendedor: {
            select: {
                id: true,
                nome: true
            }
            }
        }
        });
        
        res.status(201).json(vehicle);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
        }
        handlePrismaError(error, res);
    }
};

module.exports = {
    createVehicle
}
