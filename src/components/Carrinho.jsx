import { useState } from "react";
import { FaTrash, FaPlus, FaMinus, FaTimes, FaMapMarkerAlt, FaUser } from "react-icons/fa";
import { FaWhatsapp } from "react-icons/fa";

export default function Carrinho({ carrinho, onFechar, onAumentar, onDiminuir, onRemover }) {
    const [nome, setNome] = useState("");
    const [rua, setRua] = useState("");
    const [numero, setNumero] = useState("");
    const [bairro, setBairro] = useState("");
    const [complemento, setComplemento] = useState("");
    const [referencia, setReferencia] = useState("");

    // Calcula o subtotal somando (preco * quantidade) de cada item
    const subtotal = carrinho.reduce((total, item) => total + item.preco * item.quantidade, 0);

    // Formata um número para o padrão BRL
    function formatarPreco(valor) {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(valor);
    }

    // Valida campos obrigatórios
    const enderecoValido = rua.trim() && numero.trim() && bairro.trim();
    const podeFinalizar = carrinho.length > 0 && nome.trim() && enderecoValido;

    // Monta a mensagem e abre o WhatsApp
    function finalizarPedido(dadosCliente) {
        if (!podeFinalizar) return;

        const enderecoFormatado = `${rua.trim()}, ${numero.trim()} - ${bairro.trim()}` +
            (complemento.trim() ? `\nCompl: ${complemento.trim()}` : "") +
            (referencia.trim() ? `\nRef: ${referencia.trim()}` : "");

        const linhas = carrinho.map((item) => {
            let linha = `${item.quantidade}x ${item.nome} — ${formatarPreco(item.preco * item.quantidade)}`;

            // Frutas
            if (item.frutas && item.frutas.length > 0) {
                linha += `\n   🍓 Frutas: ${item.frutas.map(f => f.nome).join(", ")}`;
            }

            // Acompanhamentos
            if (item.acompanhamentos && item.acompanhamentos.length > 0) {
                linha += `\n   🥣 Acomp: ${item.acompanhamentos.map(a => a.nome).join(", ")}`;
            }

            // Caldas
            if (item.caldas && item.caldas.length > 0) {
                linha += `\n   🍯 Caldas: ${item.caldas.map(c => c.nome).join(", ")}`;
            }

            // Turbine (extras pagos)
            if (item.turbine && item.turbine.length > 0) {
                linha += `\n   ⚡ Extras: ${item.turbine.map(t => t.nome).join(", ")}`;
            }

            // Observação
            if (item.observacao) {
                linha += `\n   📝 ${item.observacao}`;
            }

            return linha;
        });

        const mensagem =
            `*NOVO PEDIDO* 🍇\n` +
            `👤 *Cliente:* ${nome.trim()}\n\n` +
            `${linhas.join("\n\n")}\n\n` +
            `-----------------------------------\n` +
            `*Total: ${formatarPreco(subtotal)}*\n\n` +
            `📍 *Endereço de entrega:*\n` +
            `${enderecoFormatado}`;

        // 1. Preparamos o objeto para o Supabase
        const novoPedido = {
            cliente_nome: dadosCliente.nome,
            cliente_endereco: dadosCliente.endereco,
            total: carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0),
            itens: carrinho, // O Supabase salva o array como JSONB automaticamente
            status: 'novo'
        }

        // 2. Salvamos na tabela 'pedidos'
        const { data, error } = await supabase
            .from('pedidos')
            .insert([novoPedido])
            .select()

        if (error) throw error

        const telefone = "5513997385581"; // Trocar pelo número real
        const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, "_blank");
    }

    return (
        // Overlay escuro atrás do painel
        <div
            className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm"
            onClick={onFechar}
        >
            {/* Painel lateral — stopPropagation evita fechar ao clicar dentro dele */}
            <aside
                className="relative w-full max-w-md h-full bg-bg-secondary border-l border-border flex flex-col shadow-2xl animate-slide-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ====== CABEÇALHO ====== */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <h2 className="text-text-heading text-xl font-bold">Seu Pedido</h2>
                    <button
                        onClick={onFechar}
                        className="text-text-muted hover:text-text-heading transition-colors cursor-pointer"
                    >
                        <FaTimes className="size-5" />
                    </button>
                </div>

                {/* ====== LISTA DE ITENS (scrollável) ====== */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {carrinho.length === 0 ? (
                        <p className="text-text-muted text-center mt-10">
                            Seu carrinho está vazio 🛒
                        </p>
                    ) : (
                        carrinho.map((item) => (
                            <div
                                key={item.chavePersonalizacao}
                                className="bg-bg-primary rounded-lg p-3 border border-border"
                            >
                                {/* Linha principal: imagem + nome + controles */}
                                <div className="flex items-center gap-3">
                                    {/* Miniatura */}
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

                                    {/* Controles de quantidade */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onDiminuir(item.chavePersonalizacao)}
                                            className="w-7 h-7 flex items-center justify-center rounded-md bg-border hover:bg-border-hover text-text-heading transition-colors cursor-pointer"
                                        >
                                            <FaMinus className="size-3" />
                                        </button>

                                        <span className="text-text-heading font-bold text-sm w-5 text-center">
                                            {item.quantidade}
                                        </span>

                                        <button
                                            onClick={() => onAumentar(item.chavePersonalizacao)}
                                            className="w-7 h-7 flex items-center justify-center rounded-md bg-border hover:bg-border-hover text-text-heading transition-colors cursor-pointer"
                                        >
                                            <FaPlus className="size-3" />
                                        </button>
                                    </div>

                                    {/* Botão remover */}
                                    <button
                                        onClick={() => onRemover(item.chavePersonalizacao)}
                                        className="text-text-muted hover:text-red-500 transition-colors ml-1 cursor-pointer"
                                    >
                                        <FaTrash className="size-4" />
                                    </button>
                                </div>

                                {/* Detalhes de personalização */}
                                {(item.frutas?.length > 0 || item.acompanhamentos?.length > 0 || item.caldas?.length > 0 || item.turbine?.length > 0 || item.observacao) && (
                                    <div className="mt-2 pt-2 border-t border-border/50 flex flex-col gap-1">
                                        {item.frutas?.length > 0 && (
                                            <p className="text-pink-400 text-xs">
                                                🍓 {item.frutas.map(f => f.nome).join(", ")}
                                            </p>
                                        )}
                                        {item.acompanhamentos?.length > 0 && (
                                            <p className="text-blue-400 text-xs">
                                                🥣 {item.acompanhamentos.map(a => a.nome).join(", ")}
                                            </p>
                                        )}
                                        {item.caldas?.length > 0 && (
                                            <p className="text-amber-400 text-xs">
                                                🍯 {item.caldas.map(c => c.nome).join(", ")}
                                            </p>
                                        )}
                                        {item.turbine?.length > 0 && (
                                            <p className="text-yellow-400 text-xs">
                                                ⚡ {item.turbine.map(t => t.nome).join(", ")}
                                            </p>
                                        )}
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

                {/* ====== RODAPÉ FIXO: NOME + ENDEREÇO + SUBTOTAL + BOTÃO WHATSAPP ====== */}
                <div className="border-t border-border p-5 flex flex-col gap-4">
                    {/* Campo de nome */}
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

                    {/* Campos de endereço estruturados */}
                    <div className="flex flex-col gap-2">
                        <label className="text-text-secondary font-semibold text-sm flex items-center gap-2">
                            <FaMapMarkerAlt className="text-accent" />
                            Endereço de entrega
                        </label>

                        {/* Rua */}
                        <input
                            type="text"
                            value={rua}
                            onChange={(e) => setRua(e.target.value)}
                            placeholder="Rua / Avenida *"
                            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                        />

                        {/* Número + Bairro (lado a lado) */}
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

                        {/* Complemento + Referência */}
                        <input
                            type="text"
                            value={complemento}
                            onChange={(e) => setComplemento(e.target.value)}
                            placeholder="Complemento (apto, bloco...)"
                            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                        />
                        <input
                            type="text"
                            value={referencia}
                            onChange={(e) => setReferencia(e.target.value)}
                            placeholder="Ponto de referência"
                            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                        />

                        {carrinho.length > 0 && (!nome.trim() || !enderecoValido) && (
                            <p className="text-red-400 text-xs">* Preencha o nome, rua, número e bairro para finalizar</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-text-secondary font-semibold">Subtotal</span>
                        <span className="text-text-heading text-xl font-extrabold">
                            {formatarPreco(subtotal)}
                        </span>
                    </div>

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