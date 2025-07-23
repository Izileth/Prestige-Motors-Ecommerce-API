const express = require('express');
const router = express.Router();
const {
    createNegotiation,
    getUserNegotiations,
    getNegotiationDetails,
    addMessage,
    respondToNegotiation,
    cancelNegotiation,
    getNegotiationHistory
} = require('../modules/negociation/negociationModule');
const { authenticate, authorize } = require('../middleware/authMiddleware');


// Criar nova negociação
router.post('/', authenticate, authorize(['USER', 'ADMIN']), createNegotiation);

// Listar negociações do usuário
router.get('/user', authenticate, authorize(['USER', 'ADMIN']), getUserNegotiations);

// Detalhes de uma negociação
router.get('/:negotiationId', authenticate, authorize(['USER', 'ADMIN']),getNegotiationDetails);

//Lista as mensagens de uma negociação
router.get('/:negotiationId/history', authenticate, authorize(['USER', 'ADMIN']), getNegotiationHistory);

// Adicionar mensagem
router.post('/:negotiationId/messages', authenticate, authorize(['USER', 'ADMIN']), addMessage);

// Responder à negociação (aceitar/recusar/contraproposta)
router.put('/:negotiationId/respond', authenticate, authorize(['USER', 'ADMIN']), respondToNegotiation);

// Cancelar negociação
router.delete('/:negotiationId', authenticate, authorize(['USER', 'ADMIN']), cancelNegotiation);



module.exports = router;