import { MercadoPagoConfig, Payment } from 'mercadopago';

/**
 * ================================================
 * SERVICE: Mercado Pago PIX
 * ================================================
 *
 * Integração com Mercado Pago para pagamentos PIX
 * Permite gerar QR Code e receber confirmações via webhook
 *
 * FUNCIONALIDADE:
 *  - Criar pagamento PIX
 *  - Gerar QR Code
 *  - Verificar status do pagamento
 *
 * CONFIGURAÇÃO:
 *  - ACCESS_TOKEN: Deve ser configurado no .env
 *  - Webhook: Configurar endpoint no Mercado Pago para receber notificações
 *
 * @requires ACCESS_TOKEN do Mercado Pago
 * ================================================
 */

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: import.meta.env.VITE_MERCADO_PAGO_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

const payment = new Payment(client);

/**
 * Cria um pagamento PIX
 * @param {number} valorTotal - Valor em reais
 * @param {string} descricao - Descrição do pedido
 * @param {string} emailCliente - Email do cliente para receber confirmação
 * @returns {Promise<Object>} Dados do pagamento PIX
 */
export async function criarPagamentoPIX(valorTotal, descricao = 'Pedido Açai', emailCliente) {
  try {
    const body = {
      transaction_amount: valorTotal,
      description: descricao,
      payment_method_id: 'pix',
      payer: {
        email: emailCliente, // Email do cliente para receber confirmação de pagamento
      },
    };

    const requestOptions = {
      idempotencyKey: `pedido_${Date.now()}`, // Chave única para evitar duplicatas
    };

    const result = await payment.create({ body, requestOptions });

    return {
      id: result.id,
      status: result.status,
      qrCode: result.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      copiaCola: result.point_of_interaction?.transaction_data?.qr_code,
    };
  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error);
    throw error;
  }
}

/**
 * Verifica o status de um pagamento
 * @param {string} paymentId - ID do pagamento
 * @returns {Promise<string>} Status do pagamento
 */
export async function verificarStatusPagamento(paymentId) {
  try {
    const result = await payment.get({ id: paymentId });
    return result.status;
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    throw error;
  }
}