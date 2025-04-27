const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                cpf: true,
                dataNascimento: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                vehicles: {
                    select: {
                        id: true,
                        marca: true,
                        modelo: true,
                        preco: true,
                        anoFabricacao: true, 
                        anoModelo: true     
                    }                   
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Verificar se o usuário está acessando seus próprios dados ou é um admin
        if (req.user.id !== id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Acesso negado' });
        }
   
        res.json(user);
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports ={
    getUserById
}