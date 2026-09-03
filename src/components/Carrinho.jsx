import { useState } from "react";
import { FaTrash, FaPlus, FaMinus, FaTimes, FaMapMarkerAlt, FaUser, FaPhone, FaMotorcycle, FaStore } from "react-icons/fa";
import { FaWhatsapp } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { supabase } from "../lib/supabase";
import Toast from "./Toast";

/**
 * ================================================
 * COMPONENTE: Carrinho (Drawer/Sidebar Modal)
 * ================================================
 */

export default function Carrinho({ carrinho, onFechar, onAumentar, onDiminuir, onRemover, onExibirPagamento, onDadosPedidoSalvo }) {
  // ===== ESTADOS DE FORMULÁRIO =====
  const [orderType, setOrderType] = useState("delivery"); // 'delivery' | 'local'
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [complemento, setComplemento] = useState("");
  const [referencia, setReferencia] = useState("");
  const [mesa, setMesa] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visivel: false, mensagem: "", tipo: "sucesso" });

  // ===== CÁLCULOS =====
  const subtotal = carrinho.reduce((total, item) => total + item.preco * item.quantidade, 0);

  function formatarPreco(valor) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  // ===== VALIDAÇÃO DO FORMULÁRIO =====
  const enderecoValido = orderType === 'local' || (rua.trim() && numero.trim() && bairro.trim());
  const emailValido = orderType === 'local' || email.trim().includes('@');
  const mesaValida = orderType === 'delivery' || mesa.trim();
  const podeFinalizar = carrinho.length > 0 && nome.trim() && telefone.trim() && enderecoValido && emailValido && mesaValida && !loading;

  async function finalizarPedido() {
    try {
      if (!podeFinalizar) return;
      setLoading(true);

      const novoPedido = {
        cliente_nome: nome.trim(),
        cliente_telefone: telefone.trim(),
        total: subtotal,
        itens: carrinho, 
        status: 'novo',
        order_type: orderType,
        payment_status: 'pending',
        criado_em: new Date().toISOString() 
      };

      if (orderType === "delivery") {
        const enderecoFormatado = `${rua.trim()}, ${numero.trim()} - ${bairro.trim()}` +
          (complemento.trim() ? `\nCompl: ${complemento.trim()}` : "") +
          (referencia.trim() ? `\nRef: ${referencia.trim()}` : "");

        novoPedido.cliente_endereco = enderecoFormatado;
        novoPedido.cliente_email = email;

        const linhas = carrinho.map((item) => {
          let linha = `${item.quantidade}x ${item.nome} — ${formatarPreco(item.preco * item.quantidade)}`;
          if (item.frutas && item.frutas.length > 0) linha += `\n   🍓 Frutas: ${item.frutas.map(f => f.nome).join(", ")}`;
          if (item.acompanhamentos && item.acompanhamentos.length > 0) linha += `\n   🥣 Acomp: ${item.acompanhamentos.map(a => a.nome).join(", ")}`;
          if (item.caldas && item.caldas.length > 0) linha += `\n   🍯 Caldas: ${item.caldas.map(c => c.nome).join(", ")}`;
          if (item.turbine && item.turbine.length > 0) linha += `\n   ⚡ Extras: ${item.turbine.map(t => t.nome).join(", ")}`;
          if (item.observacao) linha += `\n   📝 ${item.observacao}`;
          return linha;
        });

        const mensagem =
          `*NOVO PEDIDO (DELIVERY)* 🍇\n` +
          `👤 *Cliente:* ${nome.trim()}\n\n` +
          `${linhas.join("\n\n")}\n\n` +
          `-----------------------------------\n` +
          `*Total: ${formatarPreco(subtotal)}*\n\n` +
          `📞 *Telefone:* ${telefone.trim()}\n` +
          `📍 *Endereço de entrega:*\n${enderecoFormatado}`;

        onDadosPedidoSalvo({ ...novoPedido, subtotal, mensagem });
        onExibirPagamento(true);
      } else {
        // Pedido no Local (Mesa)
        novoPedido.table_number = mesa.trim();
        novoPedido.cliente_endereco = 'Consumo no Local - Mesa ' + mesa.trim();
        novoPedido.cliente_email = '';

        const { error } = await supabase.from('pedidos').insert([novoPedido]);
        if (error) throw error;

        setToast({ visivel: true, mensagem: "Pedido enviado para a cozinha com sucesso!", tipo: "sucesso" });
        setTimeout(() => {
          onFechar();
          // Recarregar a pág após fechar para limpar o carrinho ou emitir evento (idealmente)
          window.location.reload(); 
        }, 2000);
      }
    } catch (error) {
      console.log(error.message);
      setToast({ visivel: true, mensagem: "Ocorreu um erro ao processar o seu pedido.", tipo: "erro" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Toast
        mensagem={toast.mensagem}
        tipo={toast.tipo}
        visivel={toast.visivel}
        onFechar={() => setToast({ ...toast, visivel: false })}
      />
      
      <div
        className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm"
        onClick={onFechar}
      >
        <aside
          className="relative w-full max-w-md h-full bg-bg-secondary border-l border-border flex flex-col shadow-2xl animate-slide-in"
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-text-heading text-xl font-bold">Seu Pedido</h2>
            <button
              onClick={onFechar}
              className="text-text-muted hover:text-text-heading transition-colors cursor-pointer"
            >
              <FaTimes className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {carrinho.length === 0 ? (
              <p className="text-text-muted text-center mt-10">
                Seu carrinho está vazio 🛒
              </p>
            ) : (
              carrinho.map((item) => (
                <div key={item.chavePersonalizacao} className="bg-bg-primary rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-3">
                    <img src={item.imagem} alt={item.nome} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-text-heading font-semibold text-sm truncate">{item.nome}</h3>
                      <p className="text-accent text-xs mt-0.5">{formatarPreco(item.preco)} cada</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onDiminuir(item.chavePersonalizacao)} className="w-7 h-7 flex items-center justify-center rounded-md bg-border hover:bg-border-hover text-text-heading cursor-pointer"><FaMinus className="size-3" /></button>
                      <span className="text-text-heading font-bold text-sm w-5 text-center">{item.quantidade}</span>
                      <button onClick={() => onAumentar(item.chavePersonalizacao)} className="w-7 h-7 flex items-center justify-center rounded-md bg-border hover:bg-border-hover text-text-heading cursor-pointer"><FaPlus className="size-3" /></button>
                    </div>
                    <button onClick={() => onRemover(item.chavePersonalizacao)} className="text-text-muted hover:text-red-500 transition-colors ml-1 cursor-pointer"><FaTrash className="size-4" /></button>
                  </div>
                  {(item.frutas?.length > 0 || item.acompanhamentos?.length > 0 || item.caldas?.length > 0 || item.turbine?.length > 0 || item.observacao) && (
                    <div className="mt-2 pt-2 border-t border-border/50 flex flex-col gap-1">
                      {item.frutas?.length > 0 && <p className="text-pink-400 text-xs">🍓 {item.frutas.map(f => f.nome).join(", ")}</p>}
                      {item.acompanhamentos?.length > 0 && <p className="text-blue-400 text-xs">🥣 {item.acompanhamentos.map(a => a.nome).join(", ")}</p>}
                      {item.caldas?.length > 0 && <p className="text-amber-400 text-xs">🍯 {item.caldas.map(c => c.nome).join(", ")}</p>}
                      {item.turbine?.length > 0 && <p className="text-yellow-400 text-xs">⚡ {item.turbine.map(t => t.nome).join(", ")}</p>}
                      {item.observacao && <p className="text-text-subtle text-xs italic">📝 {item.observacao}</p>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border p-5 flex flex-col gap-4">
            
            {/* TABS DE SELEÇÃO DO TIPO DE PEDIDO */}
            <div className="flex bg-bg-primary p-1 rounded-xl border border-border">
              <button
                onClick={() => setOrderType("delivery")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  orderType === "delivery" 
                    ? "bg-accent text-white shadow-md" 
                    : "text-text-secondary hover:text-text-heading"
                }`}
              >
                <FaMotorcycle /> Delivery
              </button>
              <button
                onClick={() => setOrderType("local")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  orderType === "local" 
                    ? "bg-brand-banana text-zinc-900 shadow-md" 
                    : "text-text-secondary hover:text-text-heading"
                }`}
              >
                <FaStore /> No Local
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="nome" className="text-text-secondary font-semibold text-sm flex items-center gap-2">
                <FaUser className="text-accent" /> Seu nome
              </label>
              <input type="text" id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Digite seu nome..." className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="telefone" className="text-text-secondary font-semibold text-sm flex items-center gap-2">
                <FaPhone className="text-accent" /> Seu telefone
              </label>
              <input type="tel" id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" />
            </div>

            {orderType === "delivery" && (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-text-secondary font-semibold text-sm flex items-center gap-2">
                    <MdEmail className="text-accent" /> Seu email
                  </label>
                  <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu.email@exemplo.com" className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-text-secondary font-semibold text-sm flex items-center gap-2">
                    <FaMapMarkerAlt className="text-accent" /> Endereço de entrega
                  </label>
                  <input type="text" value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua / Avenida *" className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" />
                  <div className="flex gap-2 mb-2">
                    <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Nº *" className="w-24 bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" />
                    <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro *" className="flex-1 bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" />
                  </div>
                  <input type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Complemento (apto, bloco...)" className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" />
                  <input type="text" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ponto de referência" className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" />
                </div>
              </>
            )}

            {orderType === "local" && (
              <div className="flex flex-col gap-2">
                <label htmlFor="mesa" className="text-text-secondary font-semibold text-sm flex items-center gap-2">
                  <FaStore className="text-brand-banana" /> Número da Mesa
                </label>
                <input type="text" id="mesa" value={mesa} onChange={(e) => setMesa(e.target.value)} placeholder="Ex: 05" className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm focus:outline-none focus:ring-2 focus:ring-brand-banana/50 focus:border-brand-banana transition-all" />
              </div>
            )}

            {carrinho.length > 0 && !podeFinalizar && (
              <p className="text-red-400 text-xs">* Preencha todos os campos obrigatórios (*)</p>
            )}

            <div className="flex items-center justify-between mt-2">
              <span className="text-text-secondary font-semibold">Subtotal</span>
              <span className="text-text-heading text-xl font-extrabold">{formatarPreco(subtotal)}</span>
            </div>

            {orderType === "delivery" ? (
              <button
                onClick={finalizarPedido}
                disabled={!podeFinalizar || loading}
                className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-lg transition-all cursor-pointer shadow-lg"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FaWhatsapp className="size-6" /> Ir para Pagamento
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={finalizarPedido}
                disabled={!podeFinalizar || loading}
                className="w-full flex items-center justify-center gap-3 bg-brand-banana hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-900 font-bold py-3 rounded-xl text-lg transition-all cursor-pointer shadow-lg"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FaStore className="size-6" /> Enviar pedido para preparo
                  </>
                )}
              </button>
            )}

          </div>
        </aside>
      </div>
    </>
  );
}