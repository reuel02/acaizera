/**
 * ================================================
 * SERVICE: Mercado Pago PIX
 * ================================================
 *
 * Integração com Mercado Pago para pagamentos PIX
 * Permite gerar QR Code e receber confirmações via webhook
 *
 * FUNCIONALIDADE:
 *  - Criar pagamento PIX (via endpoint serverless)
 *  - Gerar QR Code
 *  - Verificar status do pagamento
 *
 * NOTA: Criação de pagamento é feita no servidor (/api/pagamentos)
 * Verificação é feita no servidor (/api/webhooks/mercadopago)
 * ================================================
 */

// Importações não são necessárias aqui (backend only)

/**
 * Cria um pagamento PIX chamando endpoint serverless
 * @param {number} valorTotal - Valor em reais
 * @param {string} descricao - Descrição do pedido
 * @param {string} emailCliente - Email do cliente para receber confirmação
 * @returns {Promise<Object>} Dados do pagamento PIX
 */
export async function criarPagamentoPIX(
  valorTotal,
  descricao = "Pedido Açai",
  emailCliente,
) {
  try {
    // Chamar endpoint serverless na Vercel
    const response = await fetch("/api/pagamentos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valor: valorTotal,
        descricao: descricao,
        email: emailCliente,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao criar pagamento PIX");
    }

    const dados = await response.json();

    console.log("✅ Pagamento PIX criado:", dados.id);

    return dados;
  } catch (error) {
    console.error("Erro ao criar pagamento PIX:", error);
    throw error;
  }
}

/**
 * Verifica o status de um pagamento chamando endpoint serverless
 * @param {string} paymentId - ID do pagamento
 * @returns {Promise<string>} Status do pagamento
 */
export async function verificarStatusPagamento(paymentId) {
  try {
    const response = await fetch(`/api/status?id=${paymentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Erro ao verificar status do pagamento",
      );
    }

    const dados = await response.json();
    console.log("✅ Status verificado:", dados.status);
    return dados.status;
  } catch (error) {
    console.error("Erro ao verificar status:", error);
    throw error;
  }
}
