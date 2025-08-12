const { Resend } = require("resend")

class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY)
    this.fromEmail = process.env.FROM_EMAIL || "Prestige Motors <noreply@prestigemotors.online>"
    this.appName = process.env.SERVICE_NAME || "Prestige Motors"
    this.appUrl = process.env.FRONTEND_URL || "https://prestigemotors.online"
  }

  generateBuyerTemplate(negotiationData) {
    const { comprador, vehicle, precoOfertado, precoSolicitado, negotiationId, comentario } = negotiationData

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Oferta Enviada - ${this.appName}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                    line-height: 1.7; 
                    color: #1a1a1a; 
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    padding: 40px 20px;
                }
                
                .container { 
                    max-width: 580px;
                    margin: 0 auto;
                    background: #ffffff; 
                    border-radius: 24px; 
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04);
                }
                
                .header { 
                    background: linear-gradient(135deg, #000000 0%, #2d3748 100%);
                    color: white;
                    padding: 48px 40px;
                    text-align: center;
                    position: relative;
                }
                
                .header::before {
                    content: '';
                    position: absolute;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 60px;
                    height: 4px;
                    background: #ffffff;
                    border-radius: 2px;
                    opacity: 0.3;
                }
                
                .logo { 
                    font-size: 32px; 
                    font-weight: 800; 
                    letter-spacing: -0.02em;
                    margin-bottom: 16px;
                }
                
                .header-title {
                    font-size: 24px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    opacity: 0.95;
                }
                
                .status-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255,255,255,0.15);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .status-indicator::before {
                    content: '';
                    width: 8px;
                    height: 8px;
                    background: #10b981;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .content {
                    padding: 48px 40px;
                }
                
                .greeting {
                    font-size: 18px;
                    font-weight: 500;
                    margin-bottom: 24px;
                    color: #2d3748;
                }
                
                .description {
                    font-size: 16px;
                    color: #4a5568;
                    margin-bottom: 40px;
                    line-height: 1.6;
                }
                
                .vehicle-card {
                    background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                    border-radius: 20px;
                    padding: 32px;
                    margin: 32px 0;
                    position: relative;
                    border: 1px solid rgba(0,0,0,0.06);
                }
                
                .vehicle-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(90deg, #000000 0%, #4a5568 100%);
                    border-radius: 20px 20px 0 0;
                }
                
                .vehicle-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: #1a202c;
                    margin-bottom: 24px;
                    letter-spacing: -0.01em;
                }
                
                .price-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin: 24px 0;
                    padding: 24px;
                    background: #ffffff;
                    border-radius: 16px;
                    border: 1px solid rgba(0,0,0,0.08);
                }
                
                .price-item {
                    text-align: center;
                    position: relative;
                }
                
                .price-item:not(:last-child)::after {
                    content: '';
                    position: absolute;
                    right: -10px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 1px;
                    height: 40px;
                    background: rgba(0,0,0,0.1);
                }
                
                .price-label {
                    font-size: 11px;
                    color: #718096;
                    text-transform: uppercase;
                    font-weight: 600;
                    letter-spacing: 0.8px;
                    margin-bottom: 8px;
                }
                
                .price-value {
                    font-size: 20px;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                }
                
                .price-original { color: #718096; }
                .price-offer { color: #059669; }
                .price-difference { color: #dc2626; }
                
                .comment-section {
                    background: #fffbeb;
                    border: 1px solid #fbbf24;
                    border-radius: 16px;
                    padding: 24px;
                    margin: 24px 0;
                    position: relative;
                }
                
                .comment-section::before {
                    content: '';
                    position: absolute;
                    top: 16px;
                    left: 16px;
                    width: 16px;
                    height: 16px;
                    background: #f59e0b;
                    border-radius: 3px;
                    transform: rotate(45deg);
                }
                
                .comment-label {
                    font-weight: 600;
                    color: #92400e;
                    margin-bottom: 12px;
                    margin-left: 32px;
                }
                
                .comment-text {
                    color: #78350f;
                    font-style: italic;
                    line-height: 1.6;
                    margin-left: 32px;
                }
                
                .cta-section {
                    text-align: center;
                    margin: 48px 0;
                }
                
                .btn-primary {
                    display: inline-block;
                    background: linear-gradient(135deg, #000000 0%, #374151 100%);
                    color: white;
                    padding: 16px 32px;
                    text-decoration: none;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 16px;
                    letter-spacing: -0.01em;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                
                .info-panel {
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    border-radius: 16px;
                    padding: 32px;
                    margin: 32px 0;
                    border: 1px solid rgba(14, 165, 233, 0.2);
                }
                
                .info-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #0c4a6e;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .info-title::before {
                    content: '';
                    width: 20px;
                    height: 20px;
                    background: #0ea5e9;
                    border-radius: 4px;
                    position: relative;
                }
                
                .info-title::after {
                    content: '';
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 2px;
                    margin-left: -14px;
                    margin-top: 6px;
                }
                
                .info-list {
                    list-style: none;
                    color: #075985;
                }
                
                .info-list li {
                    padding: 8px 0;
                    padding-left: 24px;
                    position: relative;
                }
                
                .info-list li::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 6px;
                    height: 6px;
                    background: #0ea5e9;
                    border-radius: 50%;
                }
                
                .footer {
                    background: #f8fafc;
                    padding: 32px 40px;
                    text-align: center;
                    border-top: 1px solid rgba(0,0,0,0.06);
                }
                
                .negotiation-id {
                    font-weight: 700;
                    color: #2d3748;
                    margin-bottom: 12px;
                    font-size: 15px;
                }
                
                .footer-text {
                    color: #718096;
                    font-size: 14px;
                    line-height: 1.5;
                }
                
                .footer-text:not(:last-child) {
                    margin-bottom: 8px;
                }
                
                @media (max-width: 600px) {
                    body { padding: 20px 10px; }
                    .container { border-radius: 16px; }
                    .header, .content { padding: 32px 24px; }
                    .vehicle-card { padding: 24px; }
                    .price-grid { grid-template-columns: 1fr; gap: 16px; }
                    .price-item::after { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">${this.appName}</div>
                    <h1 class="header-title">Sua oferta foi enviada com sucesso</h1>
                    <div class="status-indicator">Negociação Aberta</div>
                </div>
                
                <div class="content">
                    <p class="greeting">Olá <strong>${comprador.nome}</strong>,</p>
                    
                    <p class="description">Sua oferta foi enviada com sucesso! O vendedor foi notificado e você receberá um email assim que ele responder.</p>
                    
                    <div class="vehicle-card">
                        <div class="vehicle-title">${vehicle.marca} ${vehicle.modelo} ${vehicle.anoFabricacao}</div>
                        
                        <div class="price-grid">
                            <div class="price-item">
                                <div class="price-label">Preço Original</div>
                                <div class="price-value price-original">R$ ${precoSolicitado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div class="price-item">
                                <div class="price-label">Sua Oferta</div>
                                <div class="price-value price-offer">R$ ${precoOfertado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div class="price-item">
                                <div class="price-label">Diferença</div>
                                <div class="price-value price-difference">R$ ${Math.abs(precoSolicitado - precoOfertado).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                            </div>
                        </div>
                        
                        ${
                          comentario
                            ? `
                        <div class="comment-section">
                            <div class="comment-label">Seu comentário:</div>
                            <p class="comment-text">"${comentario}"</p>
                        </div>
                        `
                            : ""
                        }
                    </div>
                    
                    <div class="cta-section">
                        <a href="${this.appUrl}/negociacoes/${negotiationId}" class="btn-primary">
                            Acompanhar Negociação
                        </a>
                    </div>
                    
                    <div class="info-panel">
                        <h3 class="info-title">Próximos Passos</h3>
                        <ul class="info-list">
                            <li>O vendedor foi notificado sobre sua oferta</li>
                            <li>Você receberá um email quando ele responder</li>
                            <li>Acompanhe o status na sua área de negociações</li>
                        </ul>
                    </div>
                </div>
                
                <div class="footer">
                    <p class="negotiation-id">ID da Negociação: #${negotiationId}</p>
                    <p class="footer-text">Este é um email automático, não responda a esta mensagem.</p>
                    <p class="footer-text">© 2024 ${this.appName}. Todos os direitos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        `
  }

  // Template para o vendedor (dono do veículo)
  generateSellerTemplate(negotiationData) {
    const { comprador, vendedor, vehicle, precoOfertado, precoSolicitado, negotiationId, comentario } = negotiationData

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nova Oferta Recebida - ${this.appName}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                    line-height: 1.7; 
                    color: #1a1a1a; 
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    padding: 40px 20px;
                }
                
                .container { 
                    max-width: 580px;
                    margin: 0 auto;
                    background: #ffffff; 
                    border-radius: 24px; 
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04);
                }
                
                .header { 
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                    color: white;
                    padding: 48px 40px;
                    text-align: center;
                    position: relative;
                }
                
                .header::before {
                    content: '';
                    position: absolute;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 60px;
                    height: 4px;
                    background: #ffffff;
                    border-radius: 2px;
                    opacity: 0.3;
                }
                
                .logo { 
                    font-size: 32px; 
                    font-weight: 800; 
                    letter-spacing: -0.02em;
                    margin-bottom: 16px;
                }
                
                .header-title {
                    font-size: 24px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    opacity: 0.95;
                }
                
                .status-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255,255,255,0.15);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .status-indicator::before {
                    content: '';
                    width: 8px;
                    height: 8px;
                    background: #fbbf24;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .content {
                    padding: 48px 40px;
                }
                
                .alert-banner {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border: 1px solid #f59e0b;
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 32px;
                    text-align: center;
                    position: relative;
                }
                
                .alert-banner::before {
                    content: '';
                    position: absolute;
                    top: 16px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 20px;
                    height: 20px;
                    background: #f59e0b;
                    border-radius: 50%;
                    animation: alertPulse 1.5s infinite;
                }
                
                .alert-banner::after {
                    content: '';
                    position: absolute;
                    top: 22px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 50%;
                }
                
                @keyframes alertPulse {
                    0%, 100% { transform: translateX(-50%) scale(1); }
                    50% { transform: translateX(-50%) scale(1.1); }
                }
                
                .alert-text {
                    font-weight: 600;
                    color: #92400e;
                    margin-top: 32px;
                }
                
                .greeting {
                    font-size: 18px;
                    font-weight: 500;
                    margin-bottom: 24px;
                    color: #2d3748;
                }
                
                .description {
                    font-size: 16px;
                    color: #4a5568;
                    margin-bottom: 40px;
                    line-height: 1.6;
                }
                
                .vehicle-card {
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                    border-radius: 20px;
                    padding: 32px;
                    margin: 32px 0;
                    position: relative;
                    border: 1px solid rgba(34, 197, 94, 0.2);
                }
                
                .vehicle-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(90deg, #059669 0%, #047857 100%);
                    border-radius: 20px 20px 0 0;
                }
                
                .vehicle-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: #1a202c;
                    margin-bottom: 24px;
                    letter-spacing: -0.01em;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .vehicle-title::before {
                    content: '';
                    width: 16px;
                    height: 16px;
                    background: #059669;
                    border-radius: 3px;
                    transform: rotate(45deg);
                }
                
                .buyer-info {
                    background: #ffffff;
                    padding: 20px;
                    border-radius: 12px;
                    margin: 20px 0;
                    border: 1px solid rgba(0,0,0,0.08);
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .buyer-info::before {
                    content: '';
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    border-radius: 50%;
                    flex-shrink: 0;
                    position: relative;
                }
                
                .buyer-info::after {
                    content: '';
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    background: white;
                    border-radius: 50%;
                    margin-left: -28px;
                    margin-top: 12px;
                }
                
                .buyer-text {
                    font-weight: 600;
                    color: #374151;
                }
                
                .price-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin: 24px 0;
                    padding: 24px;
                    background: #ffffff;
                    border-radius: 16px;
                    border: 1px solid rgba(0,0,0,0.08);
                }
                
                .price-item {
                    text-align: center;
                    position: relative;
                }
                
                .price-item:not(:last-child)::after {
                    content: '';
                    position: absolute;
                    right: -10px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 1px;
                    height: 40px;
                    background: rgba(0,0,0,0.1);
                }
                
                .price-label {
                    font-size: 11px;
                    color: #718096;
                    text-transform: uppercase;
                    font-weight: 600;
                    letter-spacing: 0.8px;
                    margin-bottom: 8px;
                }
                
                .price-value {
                    font-size: 20px;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                }
                
                .price-original { color: #3b82f6; }
                .price-offer { color: #059669; }
                .price-difference { color: #dc2626; }
                
                .comment-section {
                    background: #eff6ff;
                    border: 1px solid #3b82f6;
                    border-radius: 16px;
                    padding: 24px;
                    margin: 24px 0;
                    position: relative;
                }
                
                .comment-section::before {
                    content: '';
                    position: absolute;
                    top: 16px;
                    left: 16px;
                    width: 16px;
                    height: 16px;
                    background: #3b82f6;
                    border-radius: 50%;
                }
                
                .comment-section::after {
                    content: '';
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 50%;
                }
                
                .comment-label {
                    font-weight: 600;
                    color: #1e40af;
                    margin-bottom: 12px;
                    margin-left: 32px;
                }
                
                .comment-text {
                    color: #1e3a8a;
                    font-style: italic;
                    line-height: 1.6;
                    margin-left: 32px;
                }
                
                .actions-section {
                    text-align: center;
                    margin: 48px 0;
                    padding: 32px;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-radius: 20px;
                    border: 1px solid rgba(0,0,0,0.06);
                }
                
                .actions-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #1a202c;
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                }
                
                .actions-title::before {
                    content: '';
                    width: 20px;
                    height: 20px;
                    background: #6366f1;
                    border-radius: 50%;
                    position: relative;
                }
                
                .actions-title::after {
                    content: '';
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 50%;
                    margin-left: -14px;
                }
                
                .btn-group {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-bottom: 20px;
                }
                
                .btn {
                    display: inline-block;
                    padding: 14px 24px;
                    text-decoration: none;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 15px;
                    letter-spacing: -0.01em;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                
                .btn-accept { 
                    background: linear-gradient(135deg, #059669 0%, #047857 100%); 
                    color: white; 
                }
                
                .btn-counter { 
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                    color: white; 
                }
                
                .btn-view { 
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                    color: white; 
                    width: 100%;
                    margin-top: 12px;
                }
                
                .reminder-panel {
                    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                    border: 1px solid #f87171;
                    border-radius: 16px;
                    padding: 32px;
                    margin: 32px 0;
                }
                
                .reminder-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #991b1b;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .reminder-title::before {
                    content: '';
                    width: 0;
                    height: 0;
                    border-left: 10px solid transparent;
                    border-right: 10px solid transparent;
                    border-bottom: 12px solid #dc2626;
                }
                
                .reminder-list {
                    list-style: none;
                    color: #7f1d1d;
                }
                
                .reminder-list li {
                    padding: 8px 0;
                    padding-left: 24px;
                    position: relative;
                }
                
                .reminder-list li::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 6px;
                    height: 6px;
                    background: #dc2626;
                    border-radius: 50%;
                }
                
                .footer {
                    background: #f8fafc;
                    padding: 32px 40px;
                    text-align: center;
                    border-top: 1px solid rgba(0,0,0,0.06);
                }
                
                .negotiation-id {
                    font-weight: 700;
                    color: #2d3748;
                    margin-bottom: 12px;
                    font-size: 15px;
                }
                
                .footer-text {
                    color: #718096;
                    font-size: 14px;
                    line-height: 1.5;
                }
                
                .footer-text:not(:last-child) {
                    margin-bottom: 8px;
                }
                
                @media (max-width: 600px) {
                    body { padding: 20px 10px; }
                    .container { border-radius: 16px; }
                    .header, .content { padding: 32px 24px; }
                    .vehicle-card, .actions-section { padding: 24px; }
                    .price-grid { grid-template-columns: 1fr; gap: 16px; }
                    .price-item::after { display: none; }
                    .btn-group { flex-direction: column; }
                    .btn { width: 100%; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">${this.appName}</div>
                    <h1 class="header-title">Você recebeu uma nova oferta</h1>
                    <div class="status-indicator">Aguardando Resposta</div>
                </div>
                
                <div class="content">
                    <div class="alert-banner">
                        <div class="alert-text"><strong>Ação necessária:</strong> Um interessado fez uma oferta pelo seu veículo!</div>
                    </div>
                    
                    <p class="greeting">Olá <strong>${vendedor.nome}</strong>,</p>
                    
                    <p class="description">Você recebeu uma nova oferta para o seu veículo. Veja os detalhes abaixo:</p>
                    
                    <div class="vehicle-card">
                        <div class="vehicle-title">${vehicle.marca} ${vehicle.modelo} ${vehicle.anoFabricacao}</div>
                        
                        <div class="buyer-info">
                            <div class="buyer-text"><strong>Interessado:</strong> ${comprador.nome}</div>
                        </div>
                        
                        <div class="price-grid">
                            <div class="price-item">
                                <div class="price-label">Preço Anunciado</div>
                                <div class="price-value price-original">R$ ${precoSolicitado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div class="price-item">
                                <div class="price-label">Oferta Recebida</div>
                                <div class="price-value price-offer">R$ ${precoOfertado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div class="price-item">
                                <div class="price-label">Diferença</div>
                                <div class="price-value price-difference">
                                    ${precoOfertado < precoSolicitado ? "-" : "+"}R$ ${Math.abs(precoSolicitado - precoOfertado).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                        
                        ${
                          comentario
                            ? `
                        <div class="comment-section">
                            <div class="comment-label">Mensagem do interessado:</div>
                            <p class="comment-text">"${comentario}"</p>
                        </div>
                        `
                            : ""
                        }
                    </div>
                    
                    <div class="actions-section">
                        <h3 class="actions-title">Como você gostaria de responder?</h3>
                        <div class="btn-group">
                            <a href="${this.appUrl}/negociacoes/${negotiationId}?action=accept" class="btn btn-accept">
                                Aceitar Oferta
                            </a>
                            <a href="${this.appUrl}/negociacoes/${negotiationId}?action=counter" class="btn btn-counter">
                                Fazer Contra-Oferta
                            </a>
                        </div>
                        <a href="${this.appUrl}/negociacoes/${negotiationId}" class="btn btn-view">
                            Ver Negociação Completa
                        </a>
                    </div>
                    
                    <div class="reminder-panel">
                        <h4 class="reminder-title">Lembre-se</h4>
                        <ul class="reminder-list">
                            <li>Responda rapidamente para manter o interessado engajado</li>
                            <li>Negociações ativas vendem mais rápido</li>
                            <li>Seja educado e profissional na comunicação</li>
                        </ul>
                    </div>
                </div>
                
                <div class="footer">
                    <p class="negotiation-id">ID da Negociação: #${negotiationId}</p>
                    <p class="footer-text">Este é um email automático, não responda a esta mensagem.</p>
                    <p class="footer-text">© 2024 ${this.appName}. Todos os direitos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        `
  }

  async sendNegotiationEmails(negotiationData) {
    try {
      const { comprador, vendedor } = negotiationData

      console.log("📧 Enviando emails de negociação...")
      console.log("Para comprador:", comprador.email)
      console.log("Para vendedor:", vendedor.email)

      // Email para o comprador (confirmação da oferta)
      const buyerEmail = {
        from: this.fromEmail,
        to: comprador.email,
        subject: `Sua oferta foi enviada - ${negotiationData.vehicle.marca} ${negotiationData.vehicle.modelo}`,
        html: this.generateBuyerTemplate(negotiationData),
      }

      // Email para o vendedor (nova oferta recebida)
      const sellerEmail = {
        from: this.fromEmail,
        to: vendedor.email,
        subject: `Nova oferta recebida - ${negotiationData.vehicle.marca} ${negotiationData.vehicle.modelo}`,
        html: this.generateSellerTemplate(negotiationData),
      }

      // Enviar ambos os emails em paralelo
      const [buyerResult, sellerResult] = await Promise.allSettled([
        this.resend.emails.send(buyerEmail),
        this.resend.emails.send(sellerEmail),
      ])

      // Log dos resultados
      if (buyerResult.status === "fulfilled") {
        console.log("✅ Email para comprador enviado:", buyerResult.value.id)
      } else {
        console.error("❌ Erro ao enviar email para comprador:", buyerResult.reason)
      }

      if (sellerResult.status === "fulfilled") {
        console.log("✅ Email para vendedor enviado:", sellerResult.value.id)
      } else {
        console.error("❌ Erro ao enviar email para vendedor:", sellerResult.reason)
      }

      return {
        success: true,
        buyerEmail: buyerResult.status === "fulfilled" ? buyerResult.value : null,
        sellerEmail: sellerResult.status === "fulfilled" ? sellerResult.value : null,
        errors: [
          ...(buyerResult.status === "rejected" ? [{ type: "buyer", error: buyerResult.reason }] : []),
          ...(sellerResult.status === "rejected" ? [{ type: "seller", error: sellerResult.reason }] : []),
        ],
      }
    } catch (error) {
      console.error("❌ Erro geral no envio de emails:", error)
      throw error
    }
  }
}

module.exports = new EmailService()
