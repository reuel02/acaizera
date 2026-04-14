import { useEffect, useState } from "react"
import Header from "../components/Header"
import CardCatalogo from "../components/CardCatalogo"
import Carrinho from "../components/Carrinho"
import ModalPersonalizar from "../components/ModalPersonalizar"

export default function Home() {
    const [produtos, setProdutos] = useState([])
    const [erro, setErro] = useState("")
    const [carrinho, setCarrinho] = useState([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [produtoPersonalizando, setProdutoPersonalizando] = useState(null)

    // Abre o modal de personalização ao clicar em "Adicionar +"
    function abrirPersonalizacao(produto) {
        setProdutoPersonalizando(produto)
    }

    // Recebe o produto personalizado do modal e adiciona ao carrinho
    function confirmarPersonalizacao(produtoPersonalizado) {
        // Gera um ID único baseado no produto + personalizações
        const chavePersonalizacao = [
            produtoPersonalizado.id,
            (produtoPersonalizado.frutas || []).map(f => f.id).sort().join(","),
            (produtoPersonalizado.acompanhamentos || []).map(a => a.id).sort().join(","),
            (produtoPersonalizado.caldas || []).map(c => c.id).sort().join(","),
            (produtoPersonalizado.turbine || []).map(t => t.id).sort().join(","),
            produtoPersonalizado.observacao,
        ].join("|");

        const itemExiste = carrinho.find((item) => item.chavePersonalizacao === chavePersonalizacao);

        if (itemExiste) {
            const carrinhoAtualizado = carrinho.map((item) =>
                item.chavePersonalizacao === chavePersonalizacao
                    ? { ...item, quantidade: item.quantidade + produtoPersonalizado.quantidade }
                    : item
            );
            setCarrinho(carrinhoAtualizado);
        } else {
            setCarrinho([...carrinho, {
                ...produtoPersonalizado,
                chavePersonalizacao,
                preco: produtoPersonalizado.precoFinal,
            }]);
        }

        setProdutoPersonalizando(null);
    }

    function aumentarQuantidade(chave) {
        setCarrinho(carrinho.map((item) =>
            item.chavePersonalizacao === chave
                ? { ...item, quantidade: item.quantidade + 1 }
                : item
        ))
    }

    function diminuirQuantidade(chave) {
        setCarrinho(carrinho.map((item) =>
            item.chavePersonalizacao === chave
                ? { ...item, quantidade: Math.max(1, item.quantidade - 1) }
                : item
        ))
    }

    function removerItem(chave) {
        setCarrinho(carrinho.filter((item) => item.chavePersonalizacao !== chave))
    }

    useEffect(() => {
        async function buscarDados() {
            try {
                const resposta = await fetch("/dados.json")

                if (!resposta.ok) throw new Error("Erro em buscar os dados.")

                const dados = await resposta.json()

                setProdutos(dados)
            } catch (error) {
                setErro(error.message)
            }

        }
        buscarDados()
    }, [])

    const [filtroAtivo, setFiltroAtivo] = useState("todos")

    // Calcula a quantidade total somando a propriedade "quantidade" de todos os itens do carrinho
    const quantidadeTotalCarrinho = carrinho.reduce((total, item) => total + item.quantidade, 0);

    // Filtra os produtos de acordo com o tipo selecionado
    const produtosFiltrados = filtroAtivo === "todos"
        ? produtos
        : produtos.filter((p) => p.tipo === filtroAtivo);

    const filtros = [
        { valor: "todos", label: "Todos" },
        { valor: "açai no copo", label: "Açai no copo" },
        { valor: "açai na garrafa", label: "Açai na garrafa" },
    ];

    // Verifica se a loja está aberta (horário de funcionamento: 18h às 23h)
    const horaAtual = new Date().getHours();
    const horaAbertura = 19;
    const horaFechamento = 0;
    const lojaAberta = horaAtual >= horaAbertura && horaAtual < horaFechamento;

    return (
        <div className="min-h-screen bg-bg-primary pb-10">
            <Header quantidadeCarrinho={quantidadeTotalCarrinho} onOpenCart={() => setIsCartOpen(true)} />

            <main className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
                {/* Banner de status da loja */}
                <div className={`flex items-center justify-between rounded-xl px-5 py-3 border ${lojaAberta
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30"
                    }`}>
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${lojaAberta ? "bg-green-500" : "bg-red-500"
                                }`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${lojaAberta ? "bg-green-500" : "bg-red-500"
                                }`}></span>
                        </span>
                        <span className={`font-bold text-sm ${lojaAberta ? "text-green-500" : "text-red-500"
                            }`}>
                            {lojaAberta ? "Aberto agora" : "Fechado"}
                        </span>
                    </div>
                    <span className="text-zinc-400 text-xs font-semibold">
                        🕐 Seg a Dom • {horaAbertura}h às {horaFechamento}h
                    </span>
                </div>

                {/* Barra de filtros */}
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

                {erro && <p className="text-red-500 font-bold">{erro}</p>}
                {produtosFiltrados.map((produto) => (
                    <CardCatalogo
                        key={produto.id}
                        produto={produto}
                        onAdicionar={() => abrirPersonalizacao(produto)}
                    />
                ))}
            </main>

            {/* Modal de personalização */}
            {produtoPersonalizando && (
                <ModalPersonalizar
                    produto={produtoPersonalizando}
                    onConfirmar={confirmarPersonalizacao}
                    onFechar={() => setProdutoPersonalizando(null)}
                />
            )}

            {isCartOpen && (
                <Carrinho
                    carrinho={carrinho}
                    onFechar={() => setIsCartOpen(false)}
                    onAumentar={aumentarQuantidade}
                    onDiminuir={diminuirQuantidade}
                    onRemover={removerItem}
                />
            )}
        </div>
    )
}