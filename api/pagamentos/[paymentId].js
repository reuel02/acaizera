/**
 * ================================================
 * API: Verificar Status de Pagamento PIX
 * ================================================
 *
 * Endpoint para verificar status de pagamento
 * GET /api/pagamentos/[paymentId]
 * Response: { id, status, ... }
 * ================================================
 */

const { MercadoPagoConfig, Payment } = require("mercadopago");

// Inicializar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN,
  options: { timeout: 5000 },
});

const payment = new Payment(client);

export default async function handler(req, res) {
  // Apenas GET é aceito
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { paymentId } = req.query;

    if (!paymentId) {
      return res.status(400).json({ error: "Payment ID é obrigatório" });
    }

    console.log(`🔍 Verificando status do pagamento: ${paymentId}`);

    // Buscar status do pagamento no Mercado Pago
    const result = await payment.get({ id: paymentId });

    console.log(`✅ Status do pagamento ${paymentId}: ${result.status}`);

    return res.status(200).json({
      id: result.id,
      status: result.status,
      type: result.type,
      date_created: result.date_created,
    });
  } catch (error) {
    console.error("❌ Erro ao verificar status:", error);

    return res.status(500).json({
      error: "Erro ao verificar status do pagamento",
      message: error.message,
    });
  }
}
