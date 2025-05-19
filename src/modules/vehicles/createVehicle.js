const { PrismaClient } = require('@prisma/client');
const { Prisma } = require('@prisma/client');
const { uploadImages } = require('../../services/uploadService'); // Importe o serviço de upload

const prisma = new PrismaClient();

const { z } = require('zod');



const vehicleSchema = z.object({
    marca: z.string(),
    modelo: z.string(),
    anoFabricacao: z.number().int(),
    anoModelo: z.number().int(),
    preco: z.number().positive(),
    precoPromocional: z.number().positive().optional(),
    descricao: z.string().optional(),
    quilometragem: z.number().positive(),
    tipoCombustivel: z.enum(Object(Prisma.combustivel)),
    cambio: z.enum(Object(Prisma.cambio)),
    cor: z.string(),
    portas: z.number().int().min(2).max(5),
    finalPlaca: z.number().int().min(0).max(9).optional(),
    carroceria: z.enum(Object(Prisma.carroceria)),
    potencia: z.number().int().positive().optional(),
    motor: z.string().optional(),
    categoria: z.enum(Object(Prisma.categoria)),
    classe: z.enum(Object(Prisma.classe)),
    status: z.enum(Object(Prisma.statusVeiculo)).default('DISPONIVEL'),
    destaque: z.boolean().default(false),
    seloOriginal: z.boolean().default(false),
    aceitaTroca: z.boolean().default(false),
    parcelamento: z.number().positive().optional(),
    localizacaoId: z.string().optional(),
    imagens: z.array(z.object({
        url: z.string().url(),
        isMain: z.boolean().optional(),
        ordem: z.number().optional()
    })).optional(),
    videos: z.array(z.string().url()).optional()
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
        // Extrair dados básicos do veículo
        const vehicleData = { ...req.body };
        delete vehicleData.imagens; // Removemos temporariamente as imagens para processá-las separadamente
        
        // Validar os dados do veículo
        const validatedData = vehicleSchema.omit({ imagens: true }).parse(vehicleData);
        
        // Processar uploads de imagens, se houver
        let imagensInfo = [];
        if (req.files && req.files.length > 0) {
            try {
                console.log('Processando', req.files.length, 'imagens');
                // Fazer upload das imagens para o Cloudinary
                const uploadedImages = await uploadImages(req.files);
                
                // Mapear as imagens enviadas para o formato esperado pelo banco
                imagensInfo = uploadedImages.map((img, index) => ({
                    url: img.secure_url,
                    publicId: img.public_id,
                    isMain: index === 0,  // Primeira imagem como principal
                    ordem: index
                }));
                
                console.log('Imagens processadas:', imagensInfo);
            } catch (uploadError) {
                console.error('Erro ao fazer upload das imagens:', uploadError);
                return res.status(500).json({ message: 'Erro ao fazer upload das imagens', error: uploadError.message });
            }
        }
        
        // Criar o veículo com as imagens relacionadas
        const vehicle = await prisma.vehicle.create({
            data: {
                ...validatedData,
                vendedorId: req.user.id,
                imagens: {
                    create: imagensInfo
                }
            },
            include: {
                vendedor: {
                    select: {
                        id: true,
                        nome: true 
                    }
                },
                imagens: {
                    select: {
                        id: true,
                        url: true,
                        isMain: true,
                        ordem: true
                    }
                },
            }
        });
        
        res.status(201).json(vehicle);
    } catch (error) {
        console.error('Erro ao criar veículo:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
        }
        handlePrismaError(error, res);
    }
};

module.exports = {
    createVehicle
};