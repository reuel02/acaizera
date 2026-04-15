/**
 * ================================================
 * API: Criar Pagamento PIX (Vercel Serverless)
 * ================================================
 *
 * Endpoint para criar pagamentos PIX via Mercado Pago
 * Recebe requisição do frontend e retorna QR Code
 *
 * POST /api/pagamentos
 * Body: { valor, descricao, email }
 * Response: { id, qrCode, copiaCola, ... }
 * ================================================
 */

const { MercadoPagoConfig, Payment } = require("mercadopago");

// Inicializar Mercado Pago com access token
const client = new MercadoPagoConfig({
  accessToken: process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN,
  options: { timeout: 5000 },
});

const payment = new Payment(client);

export default async function handler(req, res) {
  // Apenas POST é aceito
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { valor, descricao = "Pedido Açaí", email } = req.body;

    // Validar inputs
    if (!valor || !email) {
      return res.status(400).json({ error: "Valor e email são obrigatórios" });
    }

    if (valor <= 0) {
      return res.status(400).json({ error: "Valor deve ser maior que 0" });
    }

    console.log(`💳 Criando pagamento PIX: R$ ${valor} para ${email}`);

    // Criar pagamento no Mercado Pago
    const body = {
      transaction_amount: parseFloat(valor),
      description: descricao,
      payment_method_id: "pix",
      payer: {
        email: email,
      },
    };

    const requestOptions = {
      idempotencyKey: `pedido_${Date.now()}_${Math.random()}`,
    };

    const result = await payment.create({ body, requestOptions });

    console.log(`✅ Pagamento criado com sucesso: ID ${result.id}`);

    // Retornar dados do QR Code
    return res.status(200).json({
      id: result.id,
      status: result.status,
      qrCode: result.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64:
        result.point_of_interaction?.transaction_data?.qr_code_base64,
      copiaCola: result.point_of_interaction?.transaction_data?.qr_code,
    });
  } catch (error) {
    console.error("❌ Erro ao criar pagamento:", error);

    // Retornar erro com mais detalhes
    return res.status(500).json({
      error: "Erro ao criar pagamento PIX",
      message: error.message,
    });
  }
}
