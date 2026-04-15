import { useState } from "react";
import { FaTimes, FaPlus, FaMinus, FaCheck } from "react-icons/fa";

/**
 * ================================================
 * OPTIONS ARRAYS: Dados de personalização do açaí
 * ================================================
 */

// Opções de frutas disponíveis para o açaí no copo
const FRUTAS = [
    { id: "f0", nome: "Sem Frutas" },
    { id: "f1", nome: "Banana" },
    { id: "f2", nome: "Morango" },
    { id: "f3", nome: "Uva" },
];

// Opções de acompanhamentos crunchies para adicionar ao açaí
const ACOMPANHAMENTOS = [
    { id: "a1", nome: "Sucrilhos" },
    { id: "a2", nome: "Ovomaltine" },
    { id: "a3", nome: "Confete" },
    { id: "a4", nome: "Chocoball" },
    { id: "a5", nome: "Paçoca" },
    { id: "a6", nome: "Amendoim" },
    { id: "a7", nome: "Leite em Pó" },
    { id: "a8", nome: "Granola" },
];

// Opções de caldas/molhos para adicionar
const CALDAS = [
    { id: "cl0", nome: "Sem Caldas" },
    { id: "cl1", nome: "Leite Condensado" },
    { id: "cl2", nome: "Calda de Morango" },
    { id: "cl3", nome: "Calda de Caramelo" },
    { id: "cl4", nome: "Calda de Chocolate" },
    { id: "cl5", nome: "Mel" },
];

// Itens extras premium com custo adicional (Turbine)
const TURBINE = [
    { id: "t1", nome: "Kit Kat", preco: 4.00 },
    { id: "t2", nome: "Ouro Branco", preco: 3.00 },
    { id: "t3", nome: "Nutella", preco: 3.00 },
];

/**
 * ================================================
 * COMPONENTE: ModalPersonalizar
 * ================================================
 * 
 * Modal para customizar açaí (selecionar frutas, acompanhamentos, caldas, extras)
 * 
 * FUNCIONALIDADE:
 *  - Exibe imagem, nome e descrição do produto
 *  - Para "açaí no copo": permite seleção de frutas, acompanhamentos, caldas, extras (turbine)
 *  - Para "açaí na garrafa": apenas seleciona quantidade (produto pronto)
 *  - Controle de quantidade com botões +/-
 *  - Seção de observações (até 200 caracteres)
 *  - Calcula preço final com base em extras selecionados
 *  - Mostra preço total no botão "Adicionar"
 * 
 * PROPS:
 *  - produto: { id, nome, tipo, preco, imagem, descricao, limites: { frutas, acompanhamentos, caldas } }
 *  - onConfirmar: (item) => void - Callback ao adicionar ao carrinho
 *  - onFechar: () => void - Callback ao fechar modal (click no X ou background)
 * 
 * ESTADOS:
 *  - quantidade: number - Quantidade de unidades a adicionar
 *  - frutasSelecionadas: array - Frutas escolhidas
 *  - acompanhamentosSelecionados: array - Acompanhamentos escolhidos
 *  - caldasSelecionadas: array - Caldas escolhidas
 *  - turbineSelecionados: array - Extras premium (com preço)
 *  - observacao: string - Anotações do cliente (até 200 chars)
 * 
 * REGRAS DE NEGÓCIO:
 *  - Limites de seleção por categoria (frutas, acompanhamentos, caldas)
 *  - "Sem Frutas"/"Sem Caldas" limpa seleção anterior quando clicado
 *  - Turbine não tem limite (pode adicionar quantos quiser)
 *  - Preço final = preço base + sum(turbine prices) * quantidade
 * 
 * DESIGN:
 *  - Modal centralized com overlay preto + backdrop blur
 *  - Imagem do produto em destaque no topo (com gradient overlay)
 *  - Conteúdo scrollável para acomodar muitas opções
 *  - Rodapé fixo com controle de quantidade + botão confirmar
 *  - Componente `SecaoSelecao` reutilizável para cada categoria
 * ================================================
 */

export default function ModalPersonalizar({ produto, onConfirmar, onFechar }) {
  // ===== ESTADOS DE SELEÇÃO =====
  const [quantidade, setQuantidade] = useState(1);
  const [frutasSelecionadas, setFrutasSelecionadas] = useState([]);
  const [acompanhamentosSelecionados, setAcompanhamentosSelecionados] = useState([]);
  const [caldasSelecionadas, setCaldasSelecionadas] = useState([]);
  const [turbineSelecionados, setTurbineSelecionados] = useState([]);
  const [observacao, setObservacao] = useState("");

  // ===== LÓGICA: Verifica tipo de açaí para habilitar personalização =====
  // "açai no copo" permite editar (frutas, acompanhamentos, caldas, turbine)
  // "açai na garrafa" é pré-pronto, apenas seleciona quantidade
  const isCopoAcai = produto.tipo === "açai no copo";
  
  // Busca limites de seleção (máximo items por categoria) do produto
  const limites = produto.limites || { frutas: 0, acompanhamentos: 0, caldas: 0 };

  // ===== CÁLCULO DE PREÇO =====
  // Calcula soma dos preços dos turbines selecionados
  const precoExtras = turbineSelecionados.reduce((total, t) => total + t.preco, 0);
  
  // Preço unitário = preço base + extras
  const precoUnitarioFinal = produto.preco + precoExtras;
  
  // Preço total = (preço base + extras) * quantidade
  const precoTotalItem = precoUnitarioFinal * quantidade;

  /**
   * Formata número como moeda brasileira (R$ X,XX)
   * Usa Intl.NumberFormat para respeitar localização
   */
  function formatarPreco(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(valor);
  }

  /**
   * Toggle genérico para frutas/acompanhamentos/caldas com limite
   * 
   * LÓGICA:
   * 1. Se item é "Sem Frutas"/"Sem Caldas": clica = limpa lista ou seleciona só esse
   * 2. Se item já existe: remove da lista
   * 3. Se item é novo e tem espaço (< limite): adiciona à lista
   * 4. Remove "Sem Frutas"/"Sem Caldas" automaticamente ao adicionar outro item
   * 
   * @param item - Item a adicionar/remover
   * @param lista - Array de items atuais
   * @param setLista - Setter do estado
   * @param limite - Máximo de items permitidos (ex: 3 frutas max)
   */
  function toggleItem(item, lista, setLista, limite) {
    const existe = lista.find((i) => i.id === item.id);

    // CASO 1: Clicou em "Sem Frutas" ou "Sem Caldas" — limpa tudo ou seleciona só esse
    if (item.id === "f0" || item.id === "cl0") {
        if (existe) {
            // Se já estava selecionado, remove
            setLista([]);
        } else {
            // Se não estava, limpa e seleciona só esse
            setLista([item]);
        }
        return;
    }

    // CASO 2: Remove "Sem Frutas"/"Sem Caldas" se estiver na lista
    // (pois agora o usuário está adicionando um item específico)
    const listaSemVazio = lista.filter((i) => i.id !== "f0" && i.id !== "cl0");

    if (existe) {
        // Item já selecionado: remove
        setLista(listaSemVazio.filter((i) => i.id !== item.id));
    } else if (listaSemVazio.length < limite) {
        // Item novo e espaço disponível: adiciona
        setLista([...listaSemVazio, item]);
    }
    // Se atingiu limite: não faz nada (botão está disabled visualmente)
  }

  /**
   * Toggle para turbine (extras premium)
   * Sem limite de quantidade, mas com custo adicional
   * 
   * @param item - Item turbine a adicionar/remover
   */
  function toggleTurbine(item) {
    const existe = turbineSelecionados.find((t) => t.id === item.id);
    if (existe) {
      // Já selecionado: remove
      setTurbineSelecionados(turbineSelecionados.filter((t) => t.id !== item.id));
    } else {
      // Novo: adiciona
      setTurbineSelecionados([...turbineSelecionados, item]);
    }
  }

  /**
   * Confirma seleção e chama callback com objeto do item personalizando
   * Organiza todos os dados de seleção para enviar ao carrinho
   */
  function confirmar() {
    onConfirmar({
      ...produto,
      quantidade,
      frutas: frutasSelecionadas,
      acompanhamentos: acompanhamentosSelecionados,
      caldas: caldasSelecionadas,
      turbine: turbineSelecionados,
      // Mantém compatibilidade com o Carrinho
      complementos: turbineSelecionados,
      removidos: [],
      observacao: observacao.trim(),
      precoFinal: precoUnitarioFinal,
    });
  }

  /**
   * Componente reutilizável para seção de seleção
   * Renderiza título, limite, e lista de botões com checkboxes
   * 
   * @param titulo - Nome da seção
   * @param icone - Emoji para visual
   * @param itens - Array de opções
   * @param selecionados - Item atuais selecionados
   * @param setSelecionados - Setter do estado
   * @param limite - Máximo permitido
   * @param temPreco - Se mostra preço (true apenas para turbine)
   */
  function SecaoSelecao({ titulo, icone, itens, selecionados, setSelecionados, limite, temPreco }) {
    // Conta items reais selecionados (exclui "Sem X")
    const countSelecionados = selecionados.filter((i) => i.id !== "f0" && i.id !== "cl0").length;

    return (
      <div>
        {/* Cabeçalho: Título + Badge de limite */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-text-heading font-bold text-sm flex items-center gap-2">
            {icone} {titulo}
          </h3>
          {/* Badge mostra X/Limite (ex: 2/3) */}
          {limite > 0 && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              countSelecionados >= limite
                ? "bg-accent/20 text-accent"
                : "bg-border text-text-secondary"
            }`}>
              {countSelecionados}/{limite}
            </span>
          )}
        </div>

        {/* Lista de items (botões com checkbox) */}
        <div className="flex flex-col gap-1.5">
          {itens.map((item) => {
            // Verifica se item está selecionado
            const selecionado = selecionados.some((s) => s.id === item.id);
            
            // Verifica se atingiu limite e item não é "Sem X"
            const atingiuLimite = countSelecionados >= limite && !selecionado && item.id !== "f0" && item.id !== "cl0";

            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item, selecionados, setSelecionados, limite)}
                disabled={atingiuLimite}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all cursor-pointer ${
                  selecionado
                    ? "border-accent/50 bg-accent/10 text-text-heading"
                    : atingiuLimite
                      ? "border-border bg-bg-primary text-text-muted cursor-not-allowed opacity-50"
                      : "border-border bg-bg-primary text-text-secondary hover:border-border-hover"
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Checkbox customizável com check icon */}
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-xs border ${
                    selecionado
                      ? "bg-accent border-accent text-white"
                      : "border-border-hover"
                  }`}>
                    {selecionado && <FaCheck className="size-2.5" />}
                  </span>
                  {item.nome}
                </div>
                {/* Preço extra (se turbine) */}
                <span className="text-text-subtle text-xs">
                  {temPreco && item.preco > 0
                    ? `+ ${formatarPreco(item.preco)}`
                    : "R$ 0,00"
                  }
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    // ===== OVERLAY + MODAL CONTAINER =====
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onFechar}
    >
      {/* Modal principal: branco, com animação de entrada */}
      <div
        className="bg-bg-secondary rounded-2xl border border-border w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-modal-in overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Previne fechar ao clicar dentro
      >
        {/* ===== SEÇÃO: CABEÇALHO COM IMAGEM ===== */}
        <div className="relative">
          {/* Imagem do produto em destaque */}
          <img
            src={produto.imagem}
            alt={produto.nome}
            className="w-full h-44 object-cover"
          />
          
          {/* Gradient overlay (fade para preto na parte inferior) */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary via-transparent to-transparent" />
          
          {/* Botão X para fechar */}
          <button
            onClick={onFechar}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
          >
            <FaTimes className="size-4" />
          </button>
          
          {/* Título + Descrição sobreposto na imagem */}
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-text-heading text-xl font-bold">{produto.nome}</h2>
            <p className="text-text-subtle text-xs mt-1">{produto.descricao}</p>
          </div>
        </div>

        {/* ===== SEÇÃO: CONTEÚDO SCROLLÁVEL ===== */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">

          {/* RENDERIZAÇÃO CONDICIONAL: Por tipo de producto */}
          {isCopoAcai ? (
            <>
              {/* ===== AÇAÍ NO COPO: Com personalização ===== */}

              {/* Seção: Frutas */}
              <SecaoSelecao
                titulo="Escolha sua Fruta!"
                icone="🍓"
                itens={FRUTAS}
                selecionados={frutasSelecionadas}
                setSelecionados={setFrutasSelecionadas}
                limite={limites.frutas}
                temPreco={false}
              />

              {/* Seção: Acompanhamentos */}
              <SecaoSelecao
                titulo="Escolha seus Acompanhamentos!"
                icone="🥣"
                itens={ACOMPANHAMENTOS}
                selecionados={acompanhamentosSelecionados}
                setSelecionados={setAcompanhamentosSelecionados}
                limite={limites.acompanhamentos}
                temPreco={false}
              />

              {/* Seção: Caldas */}
              <SecaoSelecao
                titulo="Escolha sua Calda!"
                icone="🍯"
                itens={CALDAS}
                selecionados={caldasSelecionadas}
                setSelecionados={setCaldasSelecionadas}
                limite={limites.caldas}
                temPreco={false}
              />

              {/* ===== SEÇÃO: TURBINE (EXTRAS COM CUSTO) ===== */}
              <div>
                <h3 className="text-text-heading font-bold text-sm mb-2 flex items-center gap-2">
                  ⚡ Turbine seu Açaí!
                </h3>
                <div className="flex flex-col gap-1.5">
                  {TURBINE.map((item) => {
                    const selecionado = turbineSelecionados.some((s) => s.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleTurbine(item)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all cursor-pointer ${
                          selecionado
                            ? "border-brand-banana/50 bg-brand-banana/10 text-text-heading"
                            : "border-border bg-bg-primary text-text-secondary hover:border-border-hover"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {/* Checkbox para turbine */}
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-xs border ${
                            selecionado
                              ? "bg-brand-banana border-brand-banana text-zinc-900"
                              : "border-border-hover"
                          }`}>
                            {selecionado && <FaCheck className="size-2.5" />}
                          </span>
                          {item.nome}
                        </div>
                        {/* Preço do extra em destaque (amarelo) */}
                        <span className="text-brand-banana font-semibold text-xs">
                          + {formatarPreco(item.preco)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* ===== AÇAÍ NA GARRAFA: Sem personalização ===== */
            <p className="text-text-secondary text-sm text-center py-4">
              Produto pronto — selecione a quantidade abaixo.
            </p>
          )}

          {/* ===== SEÇÃO: OBSERVAÇÕES DO CLIENTE ===== */}
          <div>
            <h3 className="text-text-heading font-bold text-sm mb-2">
              📝 Observações
            </h3>
            {/* Textarea para anotações especiais (até 200 chars) */}
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Sem açúcar, bem gelado, mais banana..."
              rows={2}
              maxLength={200}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
            />
            {/* Contador de caracteres */}
            <p className="text-text-muted text-xs text-right mt-1">
              {observacao.length}/200
            </p>
          </div>
        </div>

        {/* ===== SEÇÃO: RODAPÉ FIXO (Quantidade + Botão) ===== */}
        <div className="border-t border-border p-4 flex items-center gap-4">
          {/* Controle de quantidade: Botões -/+ */}
          <div className="flex items-center gap-2 bg-bg-primary border border-border rounded-xl px-2 py-1">
            {/* Botão decremento */}
            <button
              onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border text-text-heading transition-colors cursor-pointer"
            >
              <FaMinus className="size-3" />
            </button>

            {/* Display de quantidade */}
            <span className="text-text-heading font-bold text-base w-6 text-center">
              {quantidade}
            </span>

            {/* Botão incremento */}
            <button
              onClick={() => setQuantidade(quantidade + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border text-text-heading transition-colors cursor-pointer"
            >
              <FaPlus className="size-3" />
            </button>
          </div>

          {/* Botão Adicionar com preço total */}
          <button
            onClick={confirmar}
            className="flex-1 bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-accent-shadow flex items-center justify-center gap-2"
          >
            Adicionar {formatarPreco(precoTotalItem)}
          </button>
        </div>
      </div>
    </div>
  );
}
