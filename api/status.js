/**
 * ================================================
 * API: Verificar Status de Pagamento PIX
 * ================================================
 *
 * Endpoint simples para verificar status de pagamento
 * GET /api/status?id=1326924542
 * Response: { id, status, ... }
 * ================================================
 */

import { MercadoPagoConfig, Payment } from "mercadopago";

// Inicializar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN,
  options: { timeout: 5000 },
});

const payment = new Payment(client);

export default async function handler(req, res) {
  // Apenas GET é aceito
  if (req.method !== "GET") {
    console.log(`❌ Método não permitido: ${req.method}`);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Pegar ID da query string
    const { id } = req.query;

    console.log(`📥 Requisição recebida:`, {
      method: req.method,
      paymentId: id,
    });

    if (!id) {
      console.error("❌ Payment ID (id) não fornecido!");
      return res.status(400).json({ error: "Payment ID (id) é obrigatório" });
    }

    // Debug: Verificar token
    const token = process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) {
      console.error("❌ VITE_MERCADO_PAGO_ACCESS_TOKEN não configurado!");
      return res.status(500).json({
        error: "Erro ao verificar status",
        message: "Token do Mercado Pago não configurado",
      });
    }

    console.log(`✅ Token configurado: ${token.substring(0, 20)}...`);
    console.log(`🔍 Buscando pagamento ${id} no Mercado Pago...`);

    // Buscar status do pagamento no Mercado Pago
    const result = await payment.get({ id });

    console.log(`✅ Pagamento encontrado! Status: ${result.status}`);

    return res.status(200).json({
      id: result.id,
      status: result.status,
      type: result.type,
      date_created: result.date_created,
    });
  } catch (error) {
    console.error("❌ ERRO AO VERIFICAR PAGAMENTO:", error.message);
    console.error("Stack:", error.stack);
    console.error("Erro completo:", {
      name: error.name,
      message: error.message,
      status: error.status,
      cause: error.cause,
    });

    return res.status(500).json({
      error: "Erro ao verificar status do pagamento",
      message: error.message || "Erro desconhecido",
      type: error.name,
    });
  }
}
