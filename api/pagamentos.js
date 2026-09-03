import { MercadoPagoConfig, Payment } from "mercadopago";

export default async function handler(req, res) {
  // Apenas POST é aceito
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const formData = req.body;

    // Debug: Verificar se token existe
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      console.error("❌ MERCADO_PAGO_ACCESS_TOKEN não configurado!");
      return res.status(500).json({
        error: "Erro ao criar pagamento",
        message: "Token do Mercado Pago não configurado",
      });
    }

    // Inicializar Mercado Pago com access token
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
      options: { timeout: 10000 },
    });

    const payment = new Payment(client);

    console.log(`💳 Processando pagamento...`, formData);

    const requestOptions = {
      idempotencyKey: `pedido_${Date.now()}_${Math.random()}`,
    };

    console.log("📤 Enviando requisição ao Mercado Pago...", {
      body: formData,
      requestOptions,
    });

    const result = await payment.create({ body: formData, requestOptions });

    console.log(`✅ Pagamento criado com sucesso: ID ${result.id}`, result);

    // Retornar os dados consolidados para o frontend (Brick)
    return res.status(200).json({
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      qrCode: result.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      copiaCola: result.point_of_interaction?.transaction_data?.qr_code,
    });
  } catch (error) {
    console.error("❌ Erro ao processar pagamento:", error);
    
    // Retornar erro com mais detalhes para o Brick
    return res.status(500).json({
      error: "Erro ao criar pagamento",
      message: error.message || "Erro desconhecido",
      type: error.name,
    });
  }
}
