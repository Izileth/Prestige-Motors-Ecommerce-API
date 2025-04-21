const isOwnerOrAdmin = (req, res, next) => {
    const { id } = req.params;

    if (req.user.id === id || req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Você não tem permissão para acessar este recurso.' });
    }
};