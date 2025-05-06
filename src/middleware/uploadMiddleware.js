const uploadMiddleware = (req, res, next) => {
    // Converte removedImages para array (se for string JSON)
    if (typeof req.body.removedImages === 'string') {
        try {
        req.body.removedImages = JSON.parse(req.body.removedImages);
        } catch {
        req.body.removedImages = [];
        }
    }
    
    // Garante que é sempre um array
    if (!Array.isArray(req.body.removedImages)) {
        req.body.removedImages = [];
    }

    next();
};

module.exports = {
    uploadMiddleware
};