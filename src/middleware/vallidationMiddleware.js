const validateVehicleData = (req, res, next) => {
    const { marca, modelo, ano, preco, descricao } = req.body;

    if (!marca || !modelo || !ano || !preco) {
        return res.status(400).json({
        message: "Por favor, preencha todos os campos obrigatórios",
        });
    }

    if (isNaN(ano) || ano < 1900 || ano > new Date().getFullYear() + 1) {
        return res.status(400).json({ message: "Ano inválido" });
    }

    if (isNaN(preco) || preco <= 0) {
        return res.status(400).json({ message: "Preço inválido" });
    }

    next();
};

const validateUserData = (req, res, next) => {
    const { nome, email, senha } = req.body;
    const isPutRequest = req.method === 'PUT';

    // Para requisições POST, todos os campos são obrigatórios
    if (!isPutRequest && (!nome || !email || !senha)) {
        return res.status(400).json({
            message: "Por favor, preencha todos os campos obrigatórios"
        });
    }
    
    // Para requisições PUT, pelo menos um campo deve ser fornecido
    if (isPutRequest && (!nome && !email && !senha)) {
        return res.status(400).json({
            message: "Por favor, forneça pelo menos um campo para atualizar"
        });
    }

    // Validações adicionais...
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Email inválido" });
        }
    }

    if (senha && senha.length < 6) {
        return res.status(400).json({
            message: "A senha deve ter pelo menos 6 caracteres"
        });
    }

    next();
};

module.exports = { validateVehicleData, validateUserData };
