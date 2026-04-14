import { useState } from "react";
import { FaTimes, FaPlus, FaMinus, FaCheck } from "react-icons/fa";

// ========================================
// OPÇÕES DE PERSONALIZAÇÃO DO AÇAÍ
// ========================================

const FRUTAS = [
    { id: "f0", nome: "Sem Frutas" },
    { id: "f1", nome: "Banana" },
    { id: "f2", nome: "Morango" },
    { id: "f3", nome: "Uva" },
];

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

const CALDAS = [
    { id: "cl0", nome: "Sem Caldas" },
    { id: "cl1", nome: "Leite Condensado" },
    { id: "cl2", nome: "Calda de Morango" },
    { id: "cl3", nome: "Calda de Caramelo" },
    { id: "cl4", nome: "Calda de Chocolate" },
    { id: "cl5", nome: "Mel" },
];

const TURBINE = [
    { id: "t1", nome: "Kit Kat", preco: 4.00 },
    { id: "t2", nome: "Ouro Branco", preco: 3.00 },
    { id: "t3", nome: "Nutella", preco: 3.00 },
];

export default function ModalPersonalizar({ produto, onConfirmar, onFechar }) {
    const [quantidade, setQuantidade] = useState(1);
    const [frutasSelecionadas, setFrutasSelecionadas] = useState([]);
    const [acompanhamentosSelecionados, setAcompanhamentosSelecionados] = useState([]);
    const [caldasSelecionadas, setCaldasSelecionadas] = useState([]);
    const [turbineSelecionados, setTurbineSelecionados] = useState([]);
    const [observacao, setObservacao] = useState("");

    const isCopoAcai = produto.tipo === "açai no copo";
    const limites = produto.limites || { frutas: 0, acompanhamentos: 0, caldas: 0 };

    // Preço dos extras (Turbine)
    const precoExtras = turbineSelecionados.reduce((total, t) => total + t.preco, 0);
    const precoUnitarioFinal = produto.preco + precoExtras;
    const precoTotalItem = precoUnitarioFinal * quantidade;

    function formatarPreco(valor) {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(valor);
    }

    // Toggle genérico com limite
    function toggleItem(item, lista, setLista, limite) {
        const existe = lista.find((i) => i.id === item.id);

        // Se "Sem Frutas" ou "Sem Caldas" for clicado, limpa a lista
        if (item.id === "f0" || item.id === "cl0") {
            if (existe) {
                setLista([]);
            } else {
                setLista([item]);
            }
            return;
        }

        // Remove "Sem Frutas"/"Sem Caldas" se estiver selecionado e agora estou adicionando algo
        const listaSemVazio = lista.filter((i) => i.id !== "f0" && i.id !== "cl0");

        if (existe) {
            setLista(listaSemVazio.filter((i) => i.id !== item.id));
        } else if (listaSemVazio.length < limite) {
            setLista([...listaSemVazio, item]);
        }
    }

    // Toggle para turbine (sem limite)
    function toggleTurbine(item) {
        const existe = turbineSelecionados.find((t) => t.id === item.id);
        if (existe) {
            setTurbineSelecionados(turbineSelecionados.filter((t) => t.id !== item.id));
        } else {
            setTurbineSelecionados([...turbineSelecionados, item]);
        }
    }

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

    // Componente de seção reutilizável
    function SecaoSelecao({ titulo, icone, itens, selecionados, setSelecionados, limite, temPreco }) {
        const countSelecionados = selecionados.filter((i) => i.id !== "f0" && i.id !== "cl0").length;

        return (
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-text-heading font-bold text-sm flex items-center gap-2">
                        {icone} {titulo}
                    </h3>
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
                <div className="flex flex-col gap-1.5">
                    {itens.map((item) => {
                        const selecionado = selecionados.some((s) => s.id === item.id);
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
                                    <span className={`w-5 h-5 rounded flex items-center justify-center text-xs border ${
                                        selecionado
                                            ? "bg-accent border-accent text-white"
                                            : "border-border-hover"
                                    }`}>
                                        {selecionado && <FaCheck className="size-2.5" />}
                                    </span>
                                    {item.nome}
                                </div>
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
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onFechar}
        >
            <div
                className="bg-bg-secondary rounded-2xl border border-border w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-modal-in overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabeçalho com imagem */}
                <div className="relative">
                    <img
                        src={produto.imagem}
                        alt={produto.nome}
                        className="w-full h-44 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary via-transparent to-transparent" />
                    <button
                        onClick={onFechar}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
                    >
                        <FaTimes className="size-4" />
                    </button>
                    <div className="absolute bottom-3 left-4 right-4">
                        <h2 className="text-text-heading text-xl font-bold">{produto.nome}</h2>
                        <p className="text-text-subtle text-xs mt-1">{produto.descricao}</p>
                    </div>
                </div>

                {/* Conteúdo scrollável */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">

                    {isCopoAcai ? (
                        <>
                            {/* === FRUTAS === */}
                            <SecaoSelecao
                                titulo="Escolha sua Fruta!"
                                icone="🍓"
                                itens={FRUTAS}
                                selecionados={frutasSelecionadas}
                                setSelecionados={setFrutasSelecionadas}
                                limite={limites.frutas}
                                temPreco={false}
                            />

                            {/* === ACOMPANHAMENTOS === */}
                            <SecaoSelecao
                                titulo="Escolha seus Acompanhamentos!"
                                icone="🥣"
                                itens={ACOMPANHAMENTOS}
                                selecionados={acompanhamentosSelecionados}
                                setSelecionados={setAcompanhamentosSelecionados}
                                limite={limites.acompanhamentos}
                                temPreco={false}
                            />

                            {/* === CALDAS === */}
                            <SecaoSelecao
                                titulo="Escolha sua Calda!"
                                icone="🍯"
                                itens={CALDAS}
                                selecionados={caldasSelecionadas}
                                setSelecionados={setCaldasSelecionadas}
                                limite={limites.caldas}
                                temPreco={false}
                            />

                            {/* === TURBINE SEU AÇAÍ === */}
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
                                                    <span className={`w-5 h-5 rounded flex items-center justify-center text-xs border ${
                                                        selecionado
                                                            ? "bg-brand-banana border-brand-banana text-zinc-900"
                                                            : "border-border-hover"
                                                    }`}>
                                                        {selecionado && <FaCheck className="size-2.5" />}
                                                    </span>
                                                    {item.nome}
                                                </div>
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
                        /* Açaí na Garrafa: sem personalização, apenas quantidade */
                        <p className="text-text-secondary text-sm text-center py-4">
                            Produto pronto — selecione a quantidade abaixo.
                        </p>
                    )}

                    {/* === OBSERVAÇÕES === */}
                    <div>
                        <h3 className="text-text-heading font-bold text-sm mb-2">
                            📝 Observações
                        </h3>
                        <textarea
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            placeholder="Ex: Sem açúcar, bem gelado, mais banana..."
                            rows={2}
                            maxLength={200}
                            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-heading text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                        />
                        <p className="text-text-muted text-xs text-right mt-1">
                            {observacao.length}/200
                        </p>
                    </div>
                </div>

                {/* Rodapé fixo: Quantidade + Botão adicionar */}
                <div className="border-t border-border p-4 flex items-center gap-4">
                    {/* Controle de quantidade */}
                    <div className="flex items-center gap-2 bg-bg-primary border border-border rounded-xl px-2 py-1">
                        <button
                            onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border text-text-heading transition-colors cursor-pointer"
                        >
                            <FaMinus className="size-3" />
                        </button>

                        <span className="text-text-heading font-bold text-base w-6 text-center">
                            {quantidade}
                        </span>

                        <button
                            onClick={() => setQuantidade(quantidade + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border text-text-heading transition-colors cursor-pointer"
                        >
                            <FaPlus className="size-3" />
                        </button>
                    </div>

                    {/* Botão adicionar */}
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
