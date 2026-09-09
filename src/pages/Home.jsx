import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
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
 *  2. Carrega horários de funcionamento de store_settings
 *  3. Exibe Header com logo, botão admin, carrinho
 *  4. Mostra banner de status da loja (aberto/fechado por horário real)
 *  5. Grade de produtos com cards clicáveis
 *  6. Modal de personalização para açaí no copo
 *  7. Drawer do carrinho com endereço + pagamento
 *  8. Modal PIX para finalizar pedido
 *  9. Bloqueio de carrinho/personalização quando loja fechada
 * ================================================
 */

export default function Home() {
  const navigate = useNavigate();

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

  // ===== HORÁRIO DE FUNCIONAMENTO (store_settings) =====
  const [lojaAberta, setLojaAberta] = useState(true);
  const [horarioTexto, setHorarioTexto] = useState("");

  /**
   * Abre o modal de personalização ao usuário clicar em "Adicionar +"
   * Bloqueado quando a loja está fechada.
   * @param produto - Produto a personalizar
   */
  function abrirPersonalizacao(produto) {
    if (!lojaAberta) return; // Bloqueia quando fechado
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

  const [pagamentoAprovado, setPagamentoAprovado] = useState(false);

  /**
   * Confirma o pagamento e salva o pedido no banco
   * @param {string} paymentId - ID do pagamento Mercado Pago (enviado pelo webhook)
   */
  const confirmarPagamento = async (paymentId) => {
    if (!dadosPedidoSalvo) return;

    try {
      // Salva o pedido no Supabase após confirmação de pagamento
      const { error } = await supabase
        .from('pedidos')
        .insert([{
          cliente_nome: dadosPedidoSalvo.cliente_nome,
          cliente_endereco: dadosPedidoSalvo.cliente_endereco,
          cliente_email: dadosPedidoSalvo.cliente_email,
          cliente_telefone: dadosPedidoSalvo.cliente_telefone || '',
          total: dadosPedidoSalvo.total,
          itens: dadosPedidoSalvo.itens,
          payment_id: paymentId,
          status: 'novo',
          criado_em: dadosPedidoSalvo.criado_em
        }]);

      if (error) throw error;

      // Exibe feedback visual de sucesso
      setPagamentoAprovado(true);

      // Redireciona para o WhatsApp após 3 segundos
      setTimeout(() => {
        concluirEIrParaWhatsApp();
      }, 3000);
    } catch (error) {
      alert("Erro ao confirmar pagamento. Tente novamente.");
      console.error(error);
    }
  };

  /**
   * Finaliza o pedido: abre WhatsApp e limpa carrinho
   */
  const concluirEIrParaWhatsApp = () => {
    if (!dadosPedidoSalvo) return;

    // Mensagem já foi formatada pelo Carrinho.jsx
    const mensagem = dadosPedidoSalvo.mensagem;

    // ⚠️ Telefone hardcoded (deve ser env var)
    const fone = import.meta.env.VITE_OWNER_WHATSAPP; // Telefone do dono da loja
    const link = `https://wa.me/${fone}?text=${encodeURIComponent(mensagem)}`;
    
    // Altera a URL atual em vez de abrir nova aba para evitar bloqueador de pop-ups (já que está num setTimeout)
    window.location.href = link;
    
    // Fecha modal de pagamento e reseta sucesso
    setExibirPagamento(false);
    setPagamentoAprovado(false);
    
    // Limpa carrinho após envio
    setCarrinho([]);
  };

  /**
   * useEffect: Executa buscarProdutos() e buscarHorarios() ao montar componente
   */
  useEffect(() => {
    buscarProdutos();
    buscarHorarios();
  }, []);

  /**
   * Busca horários de store_settings e verifica se a loja está aberta agora
   */
  const buscarHorarios = async () => {
    try {
      const agora = new Date();
      const diaSemana = agora.getDay(); // 0=Dom, 1=Seg, ...

      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('dia_semana', diaSemana)
        .single();

      if (error || !data) {
        // Se não encontrou configuração, assume aberto
        setLojaAberta(true);
        setHorarioTexto("Horário não configurado");
        return;
      }

      // Se o dia está marcado como fechado
      if (!data.aberto) {
        setLojaAberta(false);
        setHorarioTexto("Fechado hoje");
        return;
      }

      // Verificar hora atual vs hora_abertura e hora_fechamento
      const horaAtualStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
      const abertura = data.hora_abertura?.slice(0, 5) || "19:00";
      const fechamento = data.hora_fechamento?.slice(0, 5) || "00:00";

      let aberto = false;
      if (fechamento <= abertura) {
        // Horário cruza meia-noite (ex: 19:00 - 00:00)
        aberto = horaAtualStr >= abertura || horaAtualStr < fechamento;
      } else {
        // Horário no mesmo dia (ex: 08:00 - 18:00)
        aberto = horaAtualStr >= abertura && horaAtualStr < fechamento;
      }

      setLojaAberta(aberto);
      setHorarioTexto(`${abertura.replace(':', 'h')} às ${fechamento === '00:00' ? '00h' : fechamento.replace(':', 'h')}`);
    } catch (erro) {
      console.error('Erro ao buscar horários:', erro);
      setLojaAberta(true); // Em caso de erro, não bloqueia
    }
  };

  // ===== CÁLCULOS BASEADOS EM ESTADO =====
  // Soma quantidade total de todos os items do carrinho (para badge no Header)
  const quantidadeTotalCarrinho = carrinho.reduce((total, item) => total + item.quantidade, 0);

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
        onAcessarAdmin={() => navigate("/login-admin")} 
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
            🕐 {horarioTexto || "Carregando..."}
          </span>
        </div>

        {/* ===== MENSAGEM DE ERRO (se houver) ===== */}
        {erro && <p className="text-red-500 font-bold">{erro}</p>}

        {/* ===== GRADE DE PRODUTOS ===== */}
        {produtos.map((produto) => (
          <CardCatalogo
            key={produto.id}
            produto={produto}
            onAdicionar={() => abrirPersonalizacao(produto)}
            disabled={!lojaAberta}
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

      {/* ===== MODAL: PAGAMENTO APROVADO ===== */}
      {pagamentoAprovado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
          <div className="bg-zinc-900 rounded-3xl p-8 flex flex-col items-center justify-center max-w-sm w-full border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.2)] animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-2">Pagamento Aprovado!</h2>
            <p className="text-zinc-400 text-center mb-6">
              Seu pedido foi salvo com sucesso.
            </p>
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-green-500 font-semibold animate-pulse text-center">
                Redirecionando para o WhatsApp...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: PAGAMENTO (PIX / Cartão) ===== */}
      {exibirPagamento && dadosPedidoSalvo && !pagamentoAprovado && (
        <Pagamento 
          valorTotal={dadosPedidoSalvo.subtotal}
          emailCliente={dadosPedidoSalvo.cliente_email}
          onPagamentoFeito={confirmarPagamento}
          onCancelar={() => setExibirPagamento(false)}
        />  
      )}
    </div>
  );
}