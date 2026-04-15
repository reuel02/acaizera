import { useEffect, useState } from "react"
import Header from "../components/Header"
import CardCatalogo from "../components/CardCatalogo"
import Carrinho from "../components/Carrinho"
import ModalPersonalizar from "../components/ModalPersonalizar"
import { supabase } from "../lib/supabase"
import { Pagamento } from "../components/Pagamento";

/**
 * ================================================
 * PÁGINA: Home
 * ================================================
 * 
 * Página principal do e-commerce: catálogo de produtos, carrinho, checkout
 * 
 * FUNCIONALIDADE:
 *  1. Carrega lista de produtos do Supabase na inicialização
 *  2. Exibe Header com logo, botão admin, carrinho
 *  3. Mostra banner de status da loja (aberto/fechado por horário)
 *  4. Filtros por tipo de produto (todos, açaí no copo, açaí na garrafa)
 *  5. Grade de produtos com cards clicáveis
 *  6. Modal de personalização para açaí no copo
 *  7. Drawer do carrinho com endereço + pagamento
 *  8. Modal PIX para finalizar pedido
 * 
 * PROPS:
 *  - acessarAdmin: () => void - Callback para botão admin (da App.jsx)
 * 
 * ESTADOS:
 *  - produtos: array - Lista de produtos do Supabase
 *  - carregando: boolean - Flag durante fetch inicial
 *  - erro: string - Mensagem de erro (se houver)
 *  - carrinho: array - Items adicionados (com chavePersonalizacao única)
 *  - isCartOpen: boolean - Drawer do carrinho visível?
 *  - produtoPersonalizando: object|null - Produto sendo customizado
 *  - exibirPagamento: boolean - Modal PIX visível?
 *  - dadosPedidoSalvo: object|null - Dados do pedido salvo (para PIX)
 *  - filtroAtivo: string - Filtro selecionado (todos/copo/garrafa)
 * 
 * LÓGICA PRINCIPAL:
 *  1. abrirPersonalizacao(): Abre modal ao clicar "Adicionar +"
 *  2. confirmarPersonalizacao(): Gera chavePersonalizacao única
 *  3. Se item com mesma chave existe: soma quantidade
 *  4. Se novo: adiciona ao carrinho
 *  5. aumentarQuantidade/diminuirQuantidade/removerItem: Gerencia carrinho
 *  6. buscarProdutos(): Fetch de produtos do Supabase
 *  7. concluirEIrParaWhatsApp(): Abre link de WhatsApp com mensagem
 * 
 * DADOS SALVOS NO SUPABASE:
 *  - Tabela 'produtos' traz: id, nome, tipo, preco, imagem, descricao, limites
 *  - Ordem por ID: 300ml < 400ml < 500ml < ...(garrafa)
 * 
 * HORÁRIO DE FUNCIONAMENTO:
 *  - Configurado: 19h (19:00) às 0h (00:00)
 *  - ⚠️ Verificação básica, sem fuso horário configurado
 * 
 * SECURITY NOTES:
 *  - ⚠️ Telefone WhatsApp hardcoded (deve ir para env vars)
 *  - 🔐 Supabase RLS policies devem estar ativas
 *  - 💡 TODO: Implementar verificação de horário no servidor
 * ================================================
 */

export default function Home({ acessarAdmin }) {
  // ===== ESTADOS DE CARREGAMENTO =====
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // ===== ESTADOS DE CARRINHO =====
  const [carrinho, setCarrinho] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ===== ESTADOS MODAIS =====
  const [produtoPersonalizando, setProdutoPersonalizando] = useState(null);
  const [exibirPagamento, setExibirPagamento] = useState(false);
  const [dadosPedidoSalvo, setDadosPedidoSalvo] = useState(null);

  // ===== FILTROS =====
  const [filtroAtivo, setFiltroAtivo] = useState("todos");

  /**
   * Abre o modal de personalização ao usuário clicar em "Adicionar +"
   * @param produto - Produto a personalizar
   */
  function abrirPersonalizacao(produto) {
    setProdutoPersonalizando(produto);
  }

  /**
   * Processa a confirmação da personalização e adiciona ao carrinho
   * 
   * LÓGICA:
   * 1. Gera chavePersonalizacao única baseada em produto + seleções
   * 2. Verifica se item com mesma chave já existe
   * 3. Se existe: suma quantidade em vez de duplicar
   * 4. Se novo: adiciona com chave única ao carrinho
   * 
   * @param produtoPersonalizado - Objeto com frutas, acompanhamentos, etc
   */
  function confirmarPersonalizacao(produtoPersonalizado) {
    // Gera ID único baseado no produto + todas as personalizações
    // Isso permite detectar se o mesmo açaí com mesmas opções foi adicionado novamente
    const chavePersonalizacao = [
      produtoPersonalizado.id,
      (produtoPersonalizado.frutas || []).map(f => f.id).sort().join(","),
      (produtoPersonalizado.acompanhamentos || []).map(a => a.id).sort().join(","),
      (produtoPersonalizado.caldas || []).map(c => c.id).sort().join(","),
      (produtoPersonalizado.turbine || []).map(t => t.id).sort().join(","),
      produtoPersonalizado.observacao,
    ].join("|");

    // Procura se item com mesma personalizacao já existe
    const itemExiste = carrinho.find((item) => item.chavePersonalizacao === chavePersonalizacao);

    if (itemExiste) {
      // Se existe: apenas soma a quantidade (não duplica item)
      const carrinhoAtualizado = carrinho.map((item) =>
        item.chavePersonalizacao === chavePersonalizacao
          ? { ...item, quantidade: item.quantidade + produtoPersonalizado.quantidade }
          : item
      );
      setCarrinho(carrinhoAtualizado);
    } else {
      // Se novo: adiciona ao carrinho com chave única
      setCarrinho([...carrinho, {
        ...produtoPersonalizado,
        chavePersonalizacao,
        preco: produtoPersonalizado.precoFinal,
      }]);
    }

    // Fecha o modal após adicionar
    setProdutoPersonalizando(null);
  }

  /**
   * Aumenta a quantidade de um item específico do carrinho
   * @param chave - chavePersonalizacao do item
   */
  function aumentarQuantidade(chave) {
    setCarrinho(carrinho.map((item) =>
      item.chavePersonalizacao === chave
        ? { ...item, quantidade: item.quantidade + 1 }
        : item
    ));
  }

  /**
   * Diminui a quantidade de um item (mínimo 1)
   * @param chave - chavePersonalizacao do item
   */
  function diminuirQuantidade(chave) {
    setCarrinho(carrinho.map((item) =>
      item.chavePersonalizacao === chave
        ? { ...item, quantidade: Math.max(1, item.quantidade - 1) }
        : item
    ));
  }

  /**
   * Remove um item completamente do carrinho
   * @param chave - chavePersonalizacao do item a remover
   */
  function removerItem(chave) {
    setCarrinho(carrinho.filter((item) => item.chavePersonalizacao !== chave));
  }

  /**
   * Busca produtos da tabela 'produtos' no Supabase
   * Ordena por ID para manter sequência (300ml, 400ml, 500ml, garrafa...)
   */
  const buscarProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('id', { ascending: true }); // Mantém ordem: 300ml, 400ml, 500ml...

      if (error) {
        throw error;
      }

      // Sucesso: salva produtos no estado
      setProdutos(data);
    } catch (error) {
      // Erro: mostra mensagem
      setErro(error.message);
    } finally {
      // Sempre tira o estado de "carregando"
      setCarregando(false);
    }
  };

  /**
   * Finaliza o pedido: abre WhatsApp e limpa carrinho
   * 
   * TODO: Usar a mensagem gerada no Carrinho.jsx para enviar ao WhatsApp real
   * TODO: Implementar confirmação de entrega no servidor
   */
  const concluirEIrParaWhatsApp = () => {
    if (!dadosPedidoSalvo) return;

    // Mensagem já foi formatada pelo Carrinho.jsx
    const mensagem = dadosPedidoSalvo.mensagem;

    // ⚠️ Telefone hardcoded (deve ser env var)
    const fone = import.meta.env.VITE_OWNER_WHATSAPP; // Telefone do dono da loja
    const link = `https://wa.me/${fone}?text=${encodeURIComponent(mensagem)}`;
    
    // Abre WhatsApp em nova aba
    window.open(link, '_blank');
    
    // Fecha modal de pagamento
    setExibirPagamento(false);
    
    // Limpa carrinho após envio
    setCarrinho([]);
  };

  /**
   * useEffect: Executa buscarProdutos() ao montar componente
   */
  useEffect(() => {
    buscarProdutos();
  }, []);

  // ===== CÁLCULOS BASEADOS EM ESTADO =====
  // Soma quantidade total de todos os items do carrinho (para badge no Header)
  const quantidadeTotalCarrinho = carrinho.reduce((total, item) => total + item.quantidade, 0);

  // Filtra produtos com base no tipo selecionado
  const produtosFiltrados = filtroAtivo === "todos"
    ? produtos
    : produtos.filter((p) => p.tipo === filtroAtivo);

  // Opções de filtro disponíveis
  const filtros = [
    { valor: "todos", label: "Todos" },
    { valor: "açai no copo", label: "Açai no copo" },
    { valor: "açai na garrafa", label: "Açai na garrafa" },
  ];

  // ===== VERIFICAÇÃO DE HORÁRIO =====
  // ⚠️ Verificação básica do horário (sem timezone)
  // Configurado: aberta de 19h às 23h59m (até meia-noite do dia seguinte)
  const horaAtual = new Date().getHours();
  const horaAbertura = 19;
  const horaFechamento = 0; // Meia-noite (início do dia seguinte)
  // Usa OR (||) porque o fechamento é no dia seguinte (0h é menor que 19h)
  const lojaAberta = horaAtual >= horaAbertura || horaAtual < horaFechamento;

  // ===== RENDERIZAÇÃO CONDICIONAL: CARREGANDO =====
  if (carregando) {
    return (
      <div className="flex justify-center items-center p-10">
        <p className="text-purple-500 font-bold animate-pulse">
          Carregando cardápio...
        </p>
      </div>
    );
  }

  // ===== RENDERIZAÇÃO PRINCIPAL =====
  return (
    <div className="min-h-screen bg-bg-primary pb-10">
      {/* ===== COMPONENTE: HEADER ===== */}
      <Header 
        quantidadeCarrinho={quantidadeTotalCarrinho} 
        onOpenCart={() => setIsCartOpen(true)} 
        onAcessarAdmin={acessarAdmin} 
      />

      {/* ===== CONTEÚDO PRINCIPAL ===== */}
      <main className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
        
        {/* ===== BANNER: STATUS DA LOJA ===== */}
        <div className={`flex items-center justify-between rounded-xl px-5 py-3 border ${lojaAberta
          ? "bg-green-500/10 border-green-500/30"
          : "bg-red-500/10 border-red-500/30"
        }`}>
          <div className="flex items-center gap-3">
            {/* Indicador piscante de status */}
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${lojaAberta ? "bg-green-500" : "bg-red-500"
              }`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${lojaAberta ? "bg-green-500" : "bg-red-500"
              }`}></span>
            </span>
            {/* Texto de status */}
            <span className={`font-bold text-sm ${lojaAberta ? "text-green-500" : "text-red-500"
            }`}>
              {lojaAberta ? "Aberto agora" : "Fechado"}
            </span>
          </div>
          {/* Horário de funcionamento */}
          <span className="text-zinc-400 text-xs font-semibold">
            🕐 Seg a Dom • {horaAbertura}h às {horaFechamento}0h
          </span>
        </div>

        {/* ===== BARRA DE FILTROS ===== */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filtros.map((f) => (
            <button
              key={f.valor}
              onClick={() => setFiltroAtivo(f.valor)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all cursor-pointer border
                ${filtroAtivo === f.valor
                  ? "bg-accent text-white border-accent shadow-md shadow-accent-shadow"
                  : "bg-bg-secondary text-text-secondary border-border hover:border-border-hover hover:text-text-heading"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ===== MENSAGEM DE ERRO (se houver) ===== */}
        {erro && <p className="text-red-500 font-bold">{erro}</p>}

        {/* ===== GRADE DE PRODUTOS ===== */}
        {produtosFiltrados.map((produto) => (
          <CardCatalogo
            key={produto.id}
            produto={produto}
            onAdicionar={() => abrirPersonalizacao(produto)}
          />
        ))}
      </main>

      {/* ===== MODAL: PERSONALIZAÇÃO DO AÇAÍ ===== */}
      {produtoPersonalizando && (
        <ModalPersonalizar
          produto={produtoPersonalizando}
          onConfirmar={confirmarPersonalizacao}
          onFechar={() => setProdutoPersonalizando(null)}
        />
      )}

      {/* ===== DRAWER: CARRINHO ===== */}
      {isCartOpen && (
        <Carrinho
          carrinho={carrinho}
          onFechar={() => setIsCartOpen(false)}
          onAumentar={aumentarQuantidade}
          onDiminuir={diminuirQuantidade}
          onRemover={removerItem}
          onDadosPedidoSalvo={setDadosPedidoSalvo}
          onExibirPagamento={(status) => {
            setExibirPagamento(status);
            // Fecha carrinho ao abrir pagamento
            if (status) setIsCartOpen(false);
          }}
        />
      )}

      {/* ===== MODAL: PAGAMENTO (PIX) ===== */}
      {exibirPagamento && dadosPedidoSalvo && (
        <Pagamento 
          valorTotal={dadosPedidoSalvo.subtotal}
          onPagamentoFeito={concluirEIrParaWhatsApp}
          onCancelar={() => setExibirPagamento(false)}
        />  
      )}
    </div>
  );
}