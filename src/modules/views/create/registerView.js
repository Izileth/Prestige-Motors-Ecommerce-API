const { PrismaClient } = require('@prisma/client');


const prisma = new PrismaClient();


const registerView = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.$transaction([
        prisma.vehicle.update({
            where: { id },
            data: { visualizacoes: { increment: 1 } }
        }),
        prisma.viewLog.create({
            data: {
            vehicleId: id,
            userId: req.user?.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
            }
        })
        ]);

        res.json({ success: true });
    } catch (error) {
        handlePrismaError(error, res);
    }
};

module.exports = {
    registerView
}