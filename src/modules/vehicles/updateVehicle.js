const { PrismaClient } = require('@prisma/client');
const { Prisma } = require('@prisma/client');
const { generateUniqueSlug, slugify } = require('../../utils/slugUtils');
const prisma = new PrismaClient();

const { z } = require('zod');


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
const updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se o veículo existe
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            select: {
                id: true,
                vendedorId: true,
                marca: true,
                modelo: true,
                anoFabricacao: true
            }
        });

        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }

        // Verificar se o usuário é o proprietário do veículo ou um admin
        if (vehicle.vendedorId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Acesso negado: você não tem permissão para atualizar este veículo' });
        }

        const updateData = {};
        const validatedData = req.body;

        // Mapear campos do request para o modelo do banco de dados
        let shouldUpdateSlug = false;
        if (validatedData.marca !== undefined) {
            updateData.marca = validatedData.marca;
            if (validatedData.marca !== vehicle.marca) shouldUpdateSlug = true;
        }
        if (validatedData.modelo !== undefined) {
            updateData.modelo = validatedData.modelo;
            if (validatedData.modelo !== vehicle.modelo) shouldUpdateSlug = true;
        }
        if (validatedData.anoFabricacao !== undefined) {
            updateData.anoFabricacao = validatedData.anoFabricacao;
            if (validatedData.anoFabricacao !== vehicle.anoFabricacao) shouldUpdateSlug = true;
        }
        if (validatedData.anoModelo !== undefined) updateData.anoModelo = validatedData.anoModelo; 
        if (validatedData.preco !== undefined) updateData.preco = validatedData.preco;
        if (validatedData.precoPromocional !== undefined) updateData.precoPromocional = validatedData.precoPromocional;
        if (validatedData.descricao !== undefined) updateData.descricao = validatedData.descricao;
        if (validatedData.quilometragem !== undefined) updateData.quilometragem = validatedData.quilometragem;
        if (validatedData.tipoCombustivel !== undefined) updateData.tipoCombustivel = validatedData.tipoCombustivel;
        if (validatedData.cambio !== undefined) updateData.cambio = validatedData.cambio;
        if (validatedData.cor !== undefined) updateData.cor = validatedData.cor;
        if (validatedData.portas !== undefined) updateData.portas = validatedData.portas;
        if (validatedData.finalPlaca !== undefined) updateData.finalPlaca = validatedData.finalPlaca;
        if (validatedData.carroceria !== undefined) updateData.carroceria = validatedData.carroceria;
        if (validatedData.potencia !== undefined) updateData.potencia = validatedData.potencia;
        if (validatedData.motor !== undefined) updateData.motor = validatedData.motor;
        if (validatedData.categoria !== undefined) updateData.categoria = validatedData.categoria;
        if (validatedData.classe !== undefined) updateData.classe = validatedData.classe;
        if (validatedData.status !== undefined) updateData.status = validatedData.status;
        if (validatedData.destaque !== undefined) updateData.destaque = validatedData.destaque;
        if (validatedData.seloOriginal !== undefined) updateData.seloOriginal = validatedData.seloOriginal;
        if (validatedData.aceitaTroca !== undefined) updateData.aceitaTroca = validatedData.aceitaTroca;
        if (validatedData.parcelamento !== undefined) updateData.parcelamento = validatedData.parcelamento;
        if (validatedData.localizacaoId !== undefined) updateData.localizacaoId = validatedData.localizacaoId;

        if (shouldUpdateSlug) {
            const baseSlug = slugify(
                `${updateData.marca || vehicle.marca}-${updateData.modelo || vehicle.modelo}-${updateData.anoFabricacao || vehicle.anoFabricacao}`, 
                { 
                    lower: true,
                    strict: true, 
                    locale: 'pt'
                }
            );
            const uniqueSlug = await generateUniqueSlug(baseSlug, id);
            updateData.slug = uniqueSlug;
        }

        // Atualizar veículo
        const updatedVehicle = await prisma.vehicle.update({
            where: { id },
            data: updateData
        });

        res.json({
            message: 'Veículo atualizado com sucesso',
            vehicle: updatedVehicle
        });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = { updateVehicle };