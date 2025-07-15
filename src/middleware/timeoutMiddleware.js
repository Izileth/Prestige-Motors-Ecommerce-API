const getUserStatsWithTimeout = async (req, res) => {
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            res.status(408).json({ message: 'Timeout na requisição' });
        }
    }, 30000); // 30 segundos

    try {
        await getUserStats(req, res);
    } finally {
        clearTimeout(timeout);
    }
};

module.exports = {
    getUserStatsWithTimeout
}