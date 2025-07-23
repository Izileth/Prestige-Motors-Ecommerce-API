const validateAuth = (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    next();
};

module.exports = { validateAuth };