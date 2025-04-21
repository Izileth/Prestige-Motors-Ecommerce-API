exports.createAddress = async (req, res) => {
    try {
        const address = await prisma.endereco.create({
        data: {
            ...req.body,
            userId: req.user.id
        }
        });
        
        res.status(201).json(address);
    } catch (error) {
        // Tratamento de erros
    }
    };

    exports.getUserAddresses = async (req, res) => {
    try {
        const addresses = await prisma.endereco.findMany({
        where: { userId: req.user.id }
        });
        
        res.json(addresses);
    } catch (error) {
        // Tratamento de erros
    }
};