/**
 * ================================================
 * UTILITÁRIO: WhatsApp — Mensagens de Retenção
 * ================================================
 *
 * Funções para gerar links do WhatsApp com mensagens
 * amigáveis de retenção de clientes.
 *
 * FUNCIONALIDADE:
 *  - Formata número de telefone para padrão internacional
 *  - Gera mensagem personalizada com nome do cliente
 *  - Abre WhatsApp em nova aba sem tirar o admin da página
 *
 * DEPENDÊNCIAS: Nenhuma (vanilla JS)
 * ================================================
 */

/**
 * Formata um número de telefone brasileiro para o padrão internacional
 * Remove caracteres especiais e garante o prefixo +55
 * 
 * @param {string} telefone - Telefone (qualquer formato)
 * @returns {string} Telefone formatado (ex: "5513999999999")
 */
export function formatarTelefone(telefone) {
  if (!telefone) return "";

  // Remove tudo que não é número
  let limpo = telefone.replace(/\D/g, "");

  // Se já começa com 55, mantém; senão, adiciona
  if (!limpo.startsWith("55")) {
    limpo = "55" + limpo;
  }

  return limpo;
}

/**
 * Gera uma mensagem amigável de retenção para enviar ao cliente
 * 
 * @param {string} nomeCliente - Nome do cliente
 * @param {number} diasSemPedir - Quantidade de dias desde o último pedido
 * @returns {string} Mensagem formatada
 */
export function gerarMensagemRetencao(nomeCliente, diasSemPedir) {
  const nome = nomeCliente?.split(" ")[0] || "Cliente"; // Pega só o primeiro nome

  if (diasSemPedir <= 7) {
    return `Oi ${nome}! 😊🍇 Tudo bem? Sentimos sua falta por aqui! Que tal um açaí fresquinho hoje? Estamos com novidades no cardápio! 💜`;
  }

  if (diasSemPedir <= 30) {
    return `Oi ${nome}! 💜 Notamos que faz ${diasSemPedir} dias que você não pede seu açaí... Sentimos sua falta! Que tal matar a saudade? Temos opções incríveis esperando por você! 🍇✨`;
  }

  return `Oi ${nome}! 😊 Faz tempo que não nos vemos (${diasSemPedir} dias)! A Açaizera sente sua falta demais! 💜 Volte quando quiser, temos novidades deliciosas no cardápio esperando por você! 🍇🥣`;
}

/**
 * Gera o link completo do WhatsApp e abre em nova aba
 * 
 * @param {string} telefone - Telefone do cliente
 * @param {string} nomeCliente - Nome do cliente
 * @param {number} diasSemPedir - Dias desde o último pedido
 */
export function abrirWhatsAppRetencao(telefone, nomeCliente, diasSemPedir) {
  const numero = formatarTelefone(telefone);

  if (!numero || numero.length < 12) {
    alert("Número de telefone inválido ou não cadastrado.");
    return;
  }

  const mensagem = gerarMensagemRetencao(nomeCliente, diasSemPedir);
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;

  window.open(url, "_blank");
}
