const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar nova negociação
const createNegotiation = async (req, res) => {
    try {
        const { vehicleId, precoOfertado, comentario } = req.body;
        const userId = req.user.id;

        // Verifica se o veículo existe e está disponível
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            include: { vendedor: true }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        if (vehicle.status !== 'DISPONIVEL' || !vehicle.aceitaNegociacao) {
            return res.status(400).json({ error: 'Este veículo não está disponível para negociação' });
        }

        // Não permitir que o vendedor negocie consigo mesmo
        if (vehicle.vendedorId === userId) {
            return res.status(400).json({ error: 'Você não pode negociar seu próprio veículo' });
        }

        // Cria a negociação
        const negotiation = await prisma.negociations.create({
            data: {
                vehicleId,
                compradorId: userId,
                vendedorId: vehicle.vendedorId,
                precoSolicitado: vehicle.preco,
                precoOfertado,
                status: 'ABERTA',
                mensagens: {
                    create: {
                        autorId: userId,
                        conteudo: comentario || `Oferta inicial de R$ ${precoOfertado}`,
                        tipo: 'OFERTA'
                    }
                }
            },
            include: {
                vehicle: {
                    select: {
                        marca: true,
                        modelo: true,
                        anoFabricacao: true,
                        preco: true
                    }
                },
                comprador: {
                    select: {
                        nome: true,
                        avatar: true
                    }
                },
                vendedor: {
                    select: {
                        nome: true,
                        avatar: true
                    }
                },
                mensagens: true
            }
        });

        res.status(201).json(negotiation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar negociação' });
    }
};

// Listar negociações do usuário
const getUserNegotiations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        const negotiations = await prisma.negociations.findMany({
            where: {
                OR: [
                    { compradorId: userId },
                    { vendedorId: userId }
                ],
                ...(status && { status })
            },
            include: {
                vehicle: {
                    select: {
                        marca: true,
                        modelo: true,
                        anoFabricacao: true,
                        imagens: {
                            where: { isMain: true },
                            take: 1
                        }
                    }
                },
                comprador: {
                    select: {
                        nome: true,
                        avatar: true
                    }
                },
                vendedor: {
                    select: {
                        nome: true,
                        avatar: true
                    }
                },
                _count: {
                    select: { mensagens: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json(negotiations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar negociações' });
    }
};

// Detalhes de uma negociação específica
const getNegotiationDetails = async (req, res) => {
    try {
        const { negotiationId } = req.params;
        const userId = req.user.id;

        const negotiation = await prisma.negociations.findUnique({
            where: { id: negotiationId },
            include: {
                vehicle: {
                    select: {
                        id: true,
                        marca: true,
                        modelo: true,
                        anoFabricacao: true,
                        preco: true,
                        imagens: { take: 3 }
                    }
                },
                comprador: {
                    select: {
                        id: true,
                        nome: true,
                        avatar: true,
                        telefone: true
                    }
                },
                vendedor: {
                    select: {
                        id: true,
                        nome: true,
                        avatar: true,
                        telefone: true
                    }
                },
                mensagens: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        autor: {
                            select: {
                                nome: true,
                                avatar: true
                            }
                        }
                    }
                }
            }
        });

        if (!negotiation) {
            return res.status(404).json({ error: 'Negociação não encontrada' });
        }

        // Verificar se o usuário tem acesso a esta negociação
        if (negotiation.compradorId !== userId && negotiation.vendedorId !== userId) {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        res.json(negotiation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar detalhes da negociação' });
    }
};

// Adicionar mensagem à negociação
const addMessage = async (req, res) => {
    try {
        const { negotiationId } = req.params;
        const { conteudo, tipo } = req.body;
        const userId = req.user.id;

        // Verifica se a negociação existe e o usuário tem acesso
        const negotiation = await prisma.negociations.findUnique({
            where: { id: negotiationId },
            select: { compradorId: true, vendedorId: true, status: true }
        });

        if (!negotiation) {
            return res.status(404).json({ error: 'Negociação não encontrada' });
        }

        if (negotiation.compradorId !== userId && negotiation.vendedorId !== userId) {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        if (negotiation.status !== 'ABERTA' && negotiation.status !== 'CONTRA_OFERTA') {
            return res.status(400).json({ error: 'Esta negociação está fechada para novas mensagens' });
        }

        const message = await prisma.mensage.create({
            data: {
                negociacaoId: negotiationId,
                autorId: userId,
                conteudo,
                tipo: tipo || 'TEXTO'
            },
            include: {
                autor: {
                    select: {
                        nome: true,
                        avatar: true
                    }
                }
            }
        });

        // Atualiza a data de atualização da negociação
        await prisma.negociations.update({
            where: { id: negotiationId },
            data: { updatedAt: new Date() }
        });

        res.status(201).json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
};

// Responder à negociação (aceitar, recusar, contraproposta)
const respondToNegotiation = async (req, res) => {
    try {
        const { negotiationId } = req.params;
        const { action, precoNegociado, motivo } = req.body;
        const userId = req.user.id;

        const negotiation = await prisma.negociations.findUnique({
            where: { id: negotiationId },
            include: { vehicle: true }
        });

        if (!negotiation) {
            return res.status(404).json({ error: 'Negociação não encontrada' });
        }

        // Verificar se o usuário é o vendedor
        if (negotiation.vendedorId !== userId) {
            return res.status(403).json({ error: 'Apenas o vendedor pode responder à negociação' });
        }

        if (negotiation.status !== 'ABERTA' && negotiation.status !== 'CONTRA_OFERTA') {
            return res.status(400).json({ error: 'Esta negociação já foi respondida' });
        }

        let updateData = {};
        let messageContent = '';

        switch (action) {
            case 'ACCEPT':
                updateData = {
                    status: 'ACEITA',
                    precoNegociado: precoNegociado || negotiation.precoOfertado,
                    dataFechamento: new Date()
                };
                messageContent = 'Negociação aceita';
                break;

            case 'REJECT':
                updateData = {
                    status: 'RECUSADA',
                    motivoRecusa: motivo || 'Negociação recusada',
                    dataFechamento: new Date()
                };
                messageContent = motivo || 'Negociação recusada';
                break;

            case 'COUNTER':
                if (!precoNegociado) {
                    return res.status(400).json({ error: 'Preço negociado é obrigatório para contraproposta' });
                }
                updateData = {
                    status: 'CONTRA_OFERTA',
                    precoNegociado
                };
                messageContent = `Contraproposta de R$ ${precoNegociado}`;
                break;

            default:
                return res.status(400).json({ error: 'Ação inválida' });
        }

        // Atualiza a negociação e cria mensagem
        const [updatedNegotiation, message] = await prisma.$transaction([
            prisma.negociations.update({
                where: { id: negotiationId },
                data: updateData
            }),
            prisma.mensage.create({
                data: {
                    negociacaoId: negotiationId,
                    autorId: userId,
                    conteudo: messageContent,
                    tipo: action === 'COUNTER' ? 'CONTRA_OFERTA' : 'SISTEMA'
                }
            })
        ]);

        res.json(updatedNegotiation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao responder à negociação' });
    }
};

// Cancelar negociação
const cancelNegotiation = async (req, res) => {
    try {
        const { negotiationId } = req.params;
        const userId = req.user.id;

        const negotiation = await prisma.negociations.findUnique({
            where: { id: negotiationId }
        });

        if (!negotiation) {
            return res.status(404).json({ error: 'Negociação não encontrada' });
        }

        // Apenas comprador pode cancelar
        if (negotiation.compradorId !== userId) {
            return res.status(403).json({ error: 'Apenas o comprador pode cancelar a negociação' });
        }

        if (negotiation.status !== 'ABERTA' && negotiation.status !== 'CONTRA_OFERTA') {
            return res.status(400).json({ error: 'Esta negociação não pode ser cancelada' });
        }

        const updatedNegotiation = await prisma.negociations.update({
            where: { id: negotiationId },
            data: {
                status: 'CANCELADA',
                dataFechamento: new Date(),
                motivoRecusa: 'Negociação cancelada pelo comprador'
            }
        });

        res.json(updatedNegotiation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao cancelar negociação' });
    }
}

const checkNegotiationExpiration = async (req, res, next) => {
    const { negotiationId } = req.params;
    
    const negotiation = await prisma.negociations.findUnique({
        where: { id: negotiationId }
    });

    if (negotiation && negotiation.dataExpiracao && new Date() > negotiation.dataExpiracao) {
        await prisma.negociations.update({
            where: { id: negotiationId },
            data: { 
                status: 'EXPIRADA',
                motivoRecusa: 'Negociação expirada por falta de resposta'
            }
        });
        
        // Criar mensagem de sistema
        await prisma.mensage.create({
            data: {
                negociacaoId: negotiationId,
                autorId: negotiation.vendedorId, // Ou sistema user
                conteudo: 'Negociação expirada automaticamente por falta de resposta',
                tipo: 'SISTEMA'
            }
        });
    }
    
    next();
};

// Atualizar tempo médio de resposta (chamar após cada mensagem do vendedor)
const updateResponseTime = async (negotiationId) => {
    const messages = await prisma.mensage.findMany({
        where: { negociacaoId },
        orderBy: { createdAt: 'asc' }
    });

    let totalResponseTime = 0;
    let responseCount = 0;
    let lastVendorMessage = null;

    for (const message of messages) {
        if (message.autorId === negotiation.vendedorId) {
            if (lastVendorMessage) {
                const responseTime = (message.createdAt - lastVendorMessage.createdAt) / (1000 * 60); // em minutos
                totalResponseTime += responseTime;
                responseCount++;
            }
            lastVendorMessage = message;
        } else {
            lastVendorMessage = null;
        }
    }

    const averageResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : null;

    await prisma.negociations.update({
        where: { id: negotiationId },
        data: { tempoMedioResposta: averageResponseTime }
    });

    // Atualizar taxa de aceitação do vendedor
    if (averageResponseTime) {
        await updateVendorAcceptanceRate(negotiation.vendedorId);
    }
};

// Atualizar taxa de aceitação do vendedor
const updateVendorAcceptanceRate = async (vendorId) => {
    const stats = await prisma.negociations.aggregate({
        where: { vendedorId: vendorId },
        _count: { id: true },
        _avg: { tempoMedioResposta: true }
    });

    await prisma.user.update({
        where: { id: vendorId },
        data: { 
            taxaAceitacao: stats._count.id > 0 ? 
                (stats._count.id / (stats._count.id + await prisma.negociations.count({
                    where: { 
                        vendedorId: vendorId,
                        status: { in: ['RECUSADA', 'EXPIRADA', 'CANCELADA'] }
                    }
                }))) * 100 : null
        }
    });
};;

const registerHistory = async (negotiationId, action, userId, details = {}) => {
    await prisma.historicoNegociacao.create({
        data: {
            negociacaoId,
            acao: action,
            detalhes: details,
            usuarioId: userId
        }
    });
};


const getNegotiationHistory = async (req, res) => {
    try {
        const { negotiationId } = req.params;
        const userId = req.user.id;

        // Verificar se usuário tem acesso
        const negotiation = await prisma.negociations.findUnique({
            where: { id: negotiationId },
            select: { compradorId: true, vendedorId: true }
        });

        if (!negotiation || (negotiation.compradorId !== userId && negotiation.vendedorId !== userId)) {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const history = await prisma.historicoNegociacao.findMany({
            where: { negociacaoId },
            include: {
                usuario: {
                    select: {
                        nome: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
};


module.exports = {
    createNegotiation,
    getUserNegotiations,
    getNegotiationDetails,
    addMessage,
    respondToNegotiation,
    cancelNegotiation,
    updateResponseTime,
    checkNegotiationExpiration,
    registerHistory,
    getNegotiationHistory
};