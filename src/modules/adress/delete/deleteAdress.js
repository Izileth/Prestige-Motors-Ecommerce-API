const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        // 1. Verificar se o endereço existe usando findUnique
        const addressExists = await prisma.endereco.findUnique({
        where: { id: addressId },
        select: { id: true },
        });

        if (!addressExists) {
        return res.status(404).json({
            success: false,
            error: "address_not_found",
            message: "Endereço não encontrado",
        });
        }

        // 2. Atualizar o createdAt se for nulo (usando update)
        try {
        await prisma.endereco.update({
            where: { id: addressId },
            data: {
            createdAt: new Date(),
            },
        });
        } catch (updateError) {
        // Ignora erros de atualização (pode ser que createdAt já esteja válido)
        console.log("Ignorando erro de atualização:", updateError.message);
        }

        // 3. Agora deletar normalmente
        await prisma.endereco.delete({
        where: { id: addressId },
        });

        res.json({
        success: true,
        message: "Endereço deletado com sucesso",
        });
    } catch (error) {
        console.error("Erro detalhado:", {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
        });

        // Tratamento específico para erros do Prisma
        if (error.code === "P2025") {
        return res.status(404).json({
            success: false,
            error: "address_not_found",
            message: "Endereço não encontrado",
        });
        }

        res.status(500).json({
        success: false,
        error: "database_error",
        message: "Erro ao processar a solicitação",
        });
    }
};

module.exports = {
    deleteAddress
}