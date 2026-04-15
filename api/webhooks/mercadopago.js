/**
 * ================================================
 * WEBHOOK: Mercado Pago (Vercel Serverless)
 * ================================================
 *
 * Recebe notificações do Mercado Pago quando:
 *  - Pagamento é aprovado
 *  - Pagamento é rejeitado
 *  - Pagamento está pendente
 *
 * Atualiza status do pedido automaticamente no Supabase
 *
 * DEPLOY: Esta função roda em Vercel de graça
 * URL: https://seu-dominio.vercel.app/api/webhooks/mercadopago
 * ================================================
 */

import { createClient } from "@supabase/supabase-js";

// Inicializar Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
);

/**
 * Função serverless que recebe POST do Mercado Pago
 */
export default async function handler(req, res) {
  // Apenas POST é aceito
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data, type, action } = req.body;

    console.log("📬 Webhook recebido do Mercado Pago:", { type, action });

    // Verifica se é notificação de pagamento
    if (type === "payment" && action === "payment.updated") {
      const paymentId = data.id;

      console.log(`💳 Processando pagamento ID: ${paymentId}`);

      // Aqui você pode fazer:
      // 1. Buscar o pagamento no MP para confirmar
      // 2. Atualizar o pedido no Supabase
      // 3. Enviar email de confirmação
      // 4. Integrar com WhatsApp (opcional)

      // Exemplo: Buscar o pagamento (requer SDK do MP no backend)
      // Por enquanto, apenas logamos a notificação

      // Atualiza pedido se tiver payment_id registrado
      const { data: pedido, error: erroFetch } = await supabase
        .from("pedidos")
        .select("id, status")
        .eq("payment_id", paymentId)
        .single();

      if (erroFetch && erroFetch.code !== "PGRST116") {
        throw erroFetch;
      }

      if (pedido) {
        const novoStatus = data.status === "approved" ? "pago" : "pendente";

        const { error: erroUpdate } = await supabase
          .from("pedidos")
          .update({
            status: novoStatus,
            payment_status: data.status,
            payment_date: new Date().toISOString(),
          })
          .eq("id", pedido.id);

        if (erroUpdate) throw erroUpdate;

        console.log(`✅ Pedido ${pedido.id} atualizado para ${novoStatus}`);
      }
    }

    // Responder ao Mercado Pago (importante!)
    return res.status(200).json({ success: true, received: true });
  } catch (error) {
    console.error("❌ Erro no webhook:", error);

    // Ainda responder 200 para MP não ficar tentando novamente
    return res.status(200).json({
      success: false,
      error: error.message,
    });
  }
}
