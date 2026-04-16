import { useState } from "react";
import { FaTrash, FaPlus, FaMinus, FaTimes, FaMapMarkerAlt, FaUser } from "react-icons/fa";
import { FaWhatsapp } from "react-icons/fa";

import { MdEmail } from "react-icons/md";

/**
 * ================================================
 * COMPONENTE: Carrinho (Drawer/Sidebar Modal)
 * ================================================
 * 
 * Painel lateral mostrando itens do carrinho com:
 *  - Lista de products com controle de quantidade
 *  - Detalhes de personalização (frutas, acompanhamentos, caldas, extras)
 *  - Formulário de dados do cliente (nome + endereço)
 *  - Subtotal e botão para enviar ao WhatsApp + Supabase
 * 
 * FUNCIONALIDADE:
 *  1. Exibe itens do carrinho com miniatura, nome, preço, quantidade
 *  2. Permite +/- quantidade ou remover item
 *  3. Mostra detalhes de personalização (se existem)
 *  4. Coleta dados: nome, rua, número, bairro, complemento, referência
 *  5. Valida campos obrigatórios antes de finalizar
 *  6. Salva pedido no Supabase tabela 'pedidos'
 *  7. Prepara mensagem WhatsApp formatada com detalhes
 *  8. Chama callback onExibirPagamento para exibir modal PIX
 * 
 * PROPS:
 *  - carrinho: array - Lista de items { nome, preco, quantidade, imagem, frutas, ... }
 *  - onFechar: () => void - Fechar o drawer
 *  - onAumentar: (chavePersonalizacao) => void - Aumentar quantidade
 *  - onDiminuir: (chavePersonalizacao) => void - Diminuir quantidade
 *  - onRemover: (chavePersonalizacao) => void - Remover item
 *  - onExibirPagamento: (bool) => void - Mostrar modal PIX
 *  - onDadosPedidoSalvo: (pedidoData) => void - Callback com dados do pedido salvo
 * 
 * ESTADOS:
 *  - nome: string - Nome do cliente
 *  - rua: string - Via de acesso
 *  - numero: string - Número do endereço
 *  - bairro: string - Bairro
 *  - complemento: string - Apto, bloco, etc
 *  - referencia: string - Ponto de referência
 *  - erro: string - Mensagem de erro (se houver)
 * 
 * VALIDAÇÃO:
 *  - Nome não vazio (obrigatório para envio)
 *  - Endereço: rua, número, bairro (obrigatórios)
 *  - Carrinho não vazio (lógico: ao menos 1 item)
 * 
 * INTEGRAÇÃO SUPABASE:
 *  - INSERT na tabela 'pedidos' com campos:
 *    { cliente_nome, cliente_endereco, total, itens (JSONB), status }
 *  - Em caso de erro: captura e mostra alerta
 * 
 * DESIGN:
 *  - Drawer desliza do lado direito (animate-slide-in)
 *  - Overlay escuro semi-transparente para contraste
 *  - Conteúdo scrollável (lista de items)
 *  - Rodapé fixo com formulário + botão
 * ================================================
 */

export default function Carrinho({ carrinho, onFechar, onAumentar, onDiminuir, onRemover, onExibirPagamento, onDadosPedidoSalvo }) {
  // ===== ESTADOS DE FORMULÁRIO =====
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [complemento, setComplemento] = useState("");
  const [referencia, setReferencia] = useState("");


  // ===== CÁLCULOS =====
  // Calcula o subtotal: soma (preco * quantidade) de cada item
  const subtotal = carrinho.reduce((total, item) => total + item.preco * item.quantidade, 0);

  /**
   * Formata número para moeda BRL
   * Exemplo: 19.90 → "R$ 19,90"
   */
  function formatarPreco(valor) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  // ===== VALIDAÇÃO DO FORMULÁRIO =====
  // Endereço é válido se rua, número e bairro estão preenchidos (não vazios)
  const enderecoValido = rua.trim() && numero.trim() && bairro.trim();
  
  // Email é válido se tem @ (validação simples)
  const emailValido = email.trim().includes('@');
  
  // Pode finalizar se: carrinho tem items, nome foi digitado, email válido e endereço completo
  const podeFinalizar = carrinho.length > 0 && nome.trim() && emailValido && enderecoValido;

  /**
   * Finaliza o pedido:
   * 1. Valida dados
   * 2. Monta a mensagem WhatsApp com todos os detalhes
   * 3. Salva na tabela 'pedidos' do Supabase
   * 4. Chama callbacks para ir ao pagamento
   * 
   * TODO: Usar a mensagem para enviar ao WhatsApp (atualmente usa Supabase)
   * TODO: Implementar rate limiting para evitar pedidos duplicados
   */
  async function finalizarPedido() {
    try {
      if (!podeFinalizar) return;

      // Mount endereço formatado com todas as informações
      const enderecoFormatado = `${rua.trim()}, ${numero.trim()} - ${bairro.trim()}` +
        (complemento.trim() ? `\nCompl: ${complemento.trim()}` : "") +
        (referencia.trim() ? `\nRef: ${referencia.trim()}` : "");

      // Monta lista de items para mensagem WhatsApp
      // Cada item inclui personalização se existir
      const linhas = carrinho.map((item) => {
        let linha = `${item.quantidade}x ${item.nome} — ${formatarPreco(item.preco * item.quantidade)}`;

        // Frutas selecionadas
        if (item.frutas && item.frutas.length > 0) {
          linha += `\n   🍓 Frutas: ${item.frutas.map(f => f.nome).join(", ")}`;
        }

        // Acompanhamentos selecionados
        if (item.acompanhamentos && item.acompanhamentos.length > 0) {
          linha += `\n   🥣 Acomp: ${item.acompanhamentos.map(a => a.nome).join(", ")}`;
        }

        // Caldas selecionadas
        if (item.caldas && item.caldas.length > 0) {
          linha += `\n   🍯 Caldas: ${item.caldas.map(c => c.nome).join(", ")}`;
        }

        // Extras premium (turbine) com custo
        if (item.turbine && item.turbine.length > 0) {
          linha += `\n   ⚡ Extras: ${item.turbine.map(t => t.nome).join(", ")}`;
        }

        // Observações do cliente
        if (item.observacao) {
          linha += `\n   📝 ${item.observacao}`;
        }

        return linha;
      });

      // Monta mensagem completa para WhatsApp (formatado com Markdown)
      const mensagem =
        `*NOVO PEDIDO* 🍇\n` +
        `👤 *Cliente:* ${nome.trim()}\n\n` +
        `${linhas.join("\n\n")}\n\n` +
        `-----------------------------------\n` +
        `*Total: ${formatarPreco(subtotal)}*\n\n` +
        `📍 *Endereço de entrega:*\n` +
        `${enderecoFormatado}`;

      // Prepara objeto para salvar no Supabase (mas não salva ainda)
      // ⚠️ IMPORTANTE: Inclui criado_em para manter histórico de pedidos por data
      const novoPedido = {
        cliente_nome: nome,
        cliente_endereco: enderecoFormatado,
        cliente_email: email,
        total: subtotal,
        itens: carrinho, // Supabase salva como JSONB automaticamente
        status: 'novo',
        criado_em: new Date().toISOString() // Timestamp: essencial para filtro de data no admin
      };

      // NÃO SALVA MAIS AQUI - será salvo após confirmação de pagamento

      // Chama callback com dados preparados + mensagem
      onDadosPedidoSalvo({ ...novoPedido, subtotal, mensagem });

      // Exibe modal de pagamento PIX
      onExibirPagamento(true);
    } catch (error) {
      // Erro ao salvar: mostra alerta e loga no console
      console.log(error.message);
      alert("Ocorreu um erro ao processar o seu pedido. Tente novamente.");
    }
  }

  return (
    // ===== OVERLAY (Background escuro) =====
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={onFechar}
    >
      {/* ===== DRAWER SIDEBAR (Painel lateral) ===== */}
      <aside
        className="relative w-full max-w-md h-full bg-bg-secondary border-l border-border flex flex-col shadow-2xl animate-slide-in"
        onClick={(e) => e.stopPropagation()} // Previne fechar ao clicar no drawer
      >
        {/* ===== SEÇÃO: CABEÇALHO ===== */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-text-heading text-xl font-bold">Seu Pedido</h2>
          {/* Botão fechar (X) */}
          <button
            onClick={onFechar}
            className="text-text-muted hover:text-text-heading transition-colors cursor-pointer"
          >
            <FaTimes className="size-5" />
          </button>
        </div>

        {/* ===== SEÇÃO: LISTA DE ITENS (SCROLLÁVEL) ===== */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {carrinho.length === 0 ? (
            // Carrinho vazio
            <p className="text-text-muted text-center mt-10">
              Seu carrinho está vazio 🛒
            </p>
          ) : (
            // Lista de items do carrinho
            carrinho.map((item) => (
              <div
                key={item.chavePersonalizacao}
                className="bg-bg-primary rounded-lg p-3 border border-border"
              >
                {/* ===== LINHA PRINCIPAL: Imagem + Nome + Controles ===== */}
                <div className="flex items-center gap-3">
                  {/* Miniatura do produto */}
                  <img
                    src={item.imagem}
                    alt={item.nome}
                    className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                  />

                  {/* Nome + Preço unitário */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-text-heading font-semibold text-sm truncate">
                      {item.nome}
                    </h3>
                    <p className="text-accent text-xs mt-0.5">
                      {formatarPreco(item.preco)} cada
                    </p>
                  </div>

                  {/* Controles de quantidade: -/número/+ */}
                  <div className="flex items-center gap-2">
                    {/* Botão diminuir */}
                    <button
                      onClick={() => onDiminuir(item.chavePersonalizacao)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-border hover:bg-border-hover text-text-heading transition-colors cursor-pointer"
                    >
                      <FaMinus className="size-3" />
                    </button>

                    {/* Display de quantidade */}
                    <span className="text-text-heading font-bold text-sm w-5 text-center">
                      {item.quantidade}
                    </span>

                    {/* Botão incremento */}
                    <button
                      onClick={() => onAumentar(item.chavePersonalizacao)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-border hover:bg-border-hover text-text-heading transition-colors cursor-pointer"
                    >
                      <FaPlus className="size-3" />
                    </button>
                  </div>

                  {/* Botão remover item */}
                  <button
                    onClick={() => onRemover(item.chavePersonalizacao)}
                    className="text-text-muted hover:text-red-500 transition-colors ml-1 cursor-pointer"
                  >
                    <FaTrash className="size-4" />
                  </button>
                </div>

                {/* ===== DETALHES DE PERSONALIZAÇÃO (se existem) ===== */}
                {(item.frutas?.length > 0 || item.acompanhamentos?.length > 0 || item.caldas?.length > 0 || item.turbine?.length > 0 || item.observacao) && (
                  <div className="mt-2 pt-2 border-t border-border/50 flex flex-col gap-1">
                    {/* Frutas selecionadas */}
                    {item.frutas?.length > 0 && (
                      <p className="text-pink-400 text-xs">
                        🍓 {item.frutas.map(f => f.nome).join(", ")}
                      </p>
                    )}
                    {/* Acompanhamentos selecionados */}
                    {item.acompanhamentos?.length > 0 && (
                      <p className="text-blue-400 text-xs">
                        🥣 {item.acompanhamentos.map(a => a.nome).join(", ")}
                      </p>
                    )}
                    {/* Caldas selecionadas */}
                    {item.caldas?.length > 0 && (
                      <p className="text-amber-400 text-xs">
                        🍯 {item.caldas.map(c => c.nome).join(", ")}
                      </p>
                    )}
                    {/* Extras premium com custo */}
                    {item.turbine?.length > 0 && (
                      <p className="text-yellow-400 text-xs">
                        ⚡ {item.turbine.map(t => t.nome).join(", ")}
                      </p>
                    )}
                    {/* Observação do cliente */}
                    {item.observacao && (
                      <p className="text-text-subtle text-xs italic">
                        📝 {item.observacao}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ===== SEÇÃO: RODAPÉ FIXO (Formulário + Botão) ===== */}
        <div className="border-t border-border p-5 flex flex-col gap-4">
          {/* ===== CAMPO: NOME DO CLIENTE ===== */}
          <div className="flex flex-col gap-2">
            <label htmlFor="nome" className="text-text-secondary font-semibold text-sm flex items-center gap-2">
              <FaUser className="text-accent" />
              Seu nome
            </label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite seu nome..."
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          {/* ===== CAMPO: EMAIL DO CLIENTE ===== */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-text-secondary font-semibold text-sm flex items-center gap-2">
              <MdEmail className="text-accent" />
              Seu email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          {/* ===== CAMPOS: ENDEREÇO ===== */}
          <div className="flex flex-col gap-2">
            <label className="text-text-secondary font-semibold text-sm flex items-center gap-2">
              <FaMapMarkerAlt className="text-accent" />
              Endereço de entrega
            </label>

            {/* Rua/Avenida */}
            <input
              type="text"
              value={rua}
              onChange={(e) => setRua(e.target.value)}
              placeholder="Rua / Avenida *"
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />

            {/* Número + Bairro (lado a lado em layout compacto) */}
            <div className="flex gap-2">
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Nº *"
                className="w-24 bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Bairro *"
                className="flex-1 bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
            </div>

            {/* Complemento (opcional: apto, bloco, etc) */}
            <input
              type="text"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              placeholder="Complemento (apto, bloco...)"
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />

            {/* Ponto de referência (opcional) */}
            <input
              type="text"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ponto de referência"
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />

            {/* Aviso de campos obrigatórios faltando */}
            {carrinho.length > 0 && (!nome.trim() || !enderecoValido) && (
              <p className="text-red-400 text-xs">* Preencha o nome, rua, número e bairro para finalizar</p>
            )}
          </div>

          {/* ===== SUBTOTAL ===== */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary font-semibold">Subtotal</span>
            <span className="text-text-heading text-xl font-extrabold">
              {formatarPreco(subtotal)}
            </span>
          </div>

          {/* ===== BOTÃO FINALIZAR ===== */}
          {/* Disabled se não passou na validação (sem nome/endereço ou carrinho vazio) */}
          <button
            onClick={finalizarPedido}
            disabled={!podeFinalizar}
            className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-lg transition-all cursor-pointer shadow-lg"
          >
            <FaWhatsapp className="size-6" />
            Finalizar pelo WhatsApp
          </button>
        </div>
      </aside>
    </div>
  );
}