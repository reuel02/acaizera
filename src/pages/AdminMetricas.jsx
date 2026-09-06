import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { FaTrophy, FaStar, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import Toast from "../components/Toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/**
 * ================================================
 * PÁGINA: AdminMetricas
 * ================================================
 *
 * Módulo de métricas e analytics:
 *  - Ranking de produtos mais vendidos (gráfico de barras)
 *  - Ranking de complementos mais adicionados (por tipo)
 *  - Cards de lucro por produto (preço venda - cost_price)
 *
 * DADOS:
 *  - RPC 'get_products_ranking' para ranking de produtos
 *  - RPC 'get_complements_ranking' para ranking de complementos
 *  - Tabela 'produtos' para cost_price
 * ================================================
 */

const CORES_BARRAS = [
  "#a855f7", "#c084fc", "#e879f9", "#f0abfc",
  "#d946ef", "#a78bfa", "#818cf8", "#6366f1",
  "#8b5cf6", "#7c3aed",
];

const CORES_COMPLEMENTOS = {
  fruta: "#f472b6",
  acompanhamento: "#60a5fa",
  calda: "#fbbf24",
  turbine: "#facc15",
};

const LABELS_TIPO = {
  fruta: "🍓 Frutas",
  acompanhamento: "🥣 Acompanhamentos",
  calda: "🍯 Caldas",
  turbine: "⚡ Turbine",
};

export default function AdminMetricas() {
  const [rankingProdutos, setRankingProdutos] = useState([]);
  const [rankingComplementos, setRankingComplementos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState(30);

  // Estado de edição de custo
  const [editandoId, setEditandoId] = useState(null);
  const [custoEditando, setCustoEditando] = useState("");
  const [salvandoCusto, setSalvandoCusto] = useState(false);

  // Toast
  const [toast, setToast] = useState({ visivel: false, mensagem: "", tipo: "sucesso" });

  const mostrarToast = (mensagem, tipo = "sucesso") => {
    setToast({ visivel: true, mensagem, tipo });
  };

  const buscarDados = useCallback(async () => {
    try {
      setCarregando(true);

      // Ranking de produtos
      const { data: dataProdutos, error: errProdutos } = await supabase.rpc(
        "get_products_ranking",
        { periodo_dias: periodo }
      );

      if (errProdutos) {
        console.error("Erro ranking produtos:", errProdutos);
      } else {
        setRankingProdutos(
          (dataProdutos || []).map((p) => ({
            nome: p.nome,
            quantidade: Number(p.quantidade_vendida),
            receita: Number(p.receita_total),
          }))
        );
      }

      // Ranking de complementos
      const { data: dataCompl, error: errCompl } = await supabase.rpc(
        "get_complements_ranking",
        { periodo_dias: periodo }
      );

      if (errCompl) {
        console.error("Erro ranking complementos:", errCompl);
      } else {
        setRankingComplementos(dataCompl || []);
      }

      // Busca produtos com cost_price
      const { data: produtosData, error: errProd } = await supabase
        .from("produtos")
        .select("id, nome, preco, cost_price");

      if (!errProd) {
        setProdutos(produtosData || []);
      }
    } catch (erro) {
      console.error("Erro:", erro);
    } finally {
      setCarregando(false);
    }
  }, [periodo]);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  const formatarMoeda = (v) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  // Agrupar complementos por tipo
  const complementosPorTipo = rankingComplementos.reduce((acc, item) => {
    if (!acc[item.tipo]) acc[item.tipo] = [];
    acc[item.tipo].push(item);
    return acc;
  }, {});

  // Calcular lucro por produto (cruzando ranking com custo)
  const lucroPorProduto = rankingProdutos.map((rp) => {
    const prod = produtos.find(
      (p) => p.nome?.toLowerCase() === rp.nome?.toLowerCase()
    );
    const costPrice = prod?.cost_price || 0;
    const precoVenda = prod?.preco || 0;
    const lucroPorUnidade = precoVenda - costPrice;
    const lucroTotal = lucroPorUnidade * rp.quantidade;

    return {
      nome: rp.nome,
      quantidade: rp.quantidade,
      precoVenda,
      costPrice,
      lucroPorUnidade,
      lucroTotal,
    };
  });

  /**
   * Converte string formatada em R$ para número
   * Ex: "R$ 5,50" -> 5.5 | "3.50" -> 3.5 | "4,75" -> 4.75
   */
  const parseMoeda = (valor) => {
    if (typeof valor === 'number') return valor;
    let limpo = String(valor)
      .replace(/R\$\s?/g, '')
      .trim();
    
    // Se tem vírgula, trata como separador decimal brasileiro
    if (limpo.includes(',')) {
      limpo = limpo.replace(/\./g, ''); // remove pontos de milhar
      limpo = limpo.replace(',', '.');  // troca vírgula decimal por ponto
    }
    // Se só tem ponto, mantém como decimal (formato inglês)
    
    const resultado = parseFloat(limpo);
    return isNaN(resultado) ? 0 : resultado;
  };

  const iniciarEdicaoCusto = (produto) => {
    setEditandoId(produto.id);
    setCustoEditando(
      produto.cost_price
        ? String(produto.cost_price).replace('.', ',')
        : ''
    );
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setCustoEditando("");
  };

  const salvarCusto = async (produtoId) => {
    const valorNumerico = parseMoeda(custoEditando);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      mostrarToast("Informe um valor válido maior que zero. Ex: 5,50", "erro");
      return;
    }

    setSalvandoCusto(true);
    try {
      const { error, data: updated } = await supabase
        .from('produtos')
        .update({ cost_price: valorNumerico })
        .eq('id', produtoId)
        .select();

      if (error) throw error;

      // Atualiza o estado local imediatamente para feedback visual instantâneo
      setProdutos(prev => prev.map(p => 
        p.id === produtoId ? { ...p, cost_price: valorNumerico } : p
      ));

      mostrarToast(`Custo atualizado para ${formatarMoeda(valorNumerico)}!`);
      setEditandoId(null);
      setCustoEditando("");
    } catch (erro) {
      console.error("Erro ao salvar custo:", erro);
      mostrarToast("Erro ao salvar custo do produto.", "erro");
    } finally {
      setSalvandoCusto(false);
    }
  };

  const periodos = [
    { valor: 7, label: "7 dias" },
    { valor: 30, label: "30 dias" },
    { valor: 90, label: "90 dias" },
    { valor: 365, label: "1 ano" },
  ];

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-semibold animate-pulse">
          Carregando métricas...
        </p>
      </div>
    );
  }

  return (
    <div>
      <Toast
        mensagem={toast.mensagem}
        tipo={toast.tipo}
        visivel={toast.visivel}
        onFechar={() => setToast(t => ({ ...t, visivel: false }))}
      />
      {/* Título + Filtro de período */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-white">Métricas</h1>
        <div className="flex gap-2">
          {periodos.map((p) => (
            <button
              key={p.valor}
              onClick={() => setPeriodo(p.valor)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
                periodo === p.valor
                  ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico: Ranking de Produtos */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FaTrophy className="text-amber-400" />
          Produtos Mais Vendidos
        </h2>
        {rankingProdutos.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={rankingProdutos}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis type="number" stroke="#a1a1aa" tick={{ fontSize: 12, fill: '#e4e4e7' }} />
              <YAxis
                type="category"
                dataKey="nome"
                stroke="#a1a1aa"
                tick={{ fontSize: 12, fill: '#e4e4e7' }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#27272a",
                  border: "1px solid #52525b",
                  borderRadius: "12px",
                  color: "#fff",
                  fontWeight: "bold"
                }}
                itemStyle={{ color: "#e4e4e7" }}
                formatter={(value, name) =>
                  name === "receita"
                    ? formatarMoeda(value)
                    : `${value} un.`
                }
              />
              <Bar dataKey="quantidade" radius={[0, 6, 6, 0]}>
                {rankingProdutos.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={CORES_BARRAS[idx % CORES_BARRAS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-zinc-500 text-center py-10">
            Sem dados para o período selecionado
          </p>
        )}
      </div>

      {/* Grid: Complementos + Lucro por Produto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Complementos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaStar className="text-purple-400" />
            Complementos Mais Populares
          </h2>
          {Object.keys(complementosPorTipo).length === 0 ? (
            <p className="text-zinc-500 text-center py-10 text-sm">Sem dados</p>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(complementosPorTipo).map(([tipo, itens]) => (
                <div key={tipo}>
                  <h3
                    className="text-sm font-bold mb-2"
                    style={{ color: CORES_COMPLEMENTOS[tipo] || "#a855f7" }}
                  >
                    {LABELS_TIPO[tipo] || tipo}
                  </h3>
                  <div className="flex flex-col gap-1">
                    {itens.slice(0, 5).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 rounded-lg"
                      >
                        <span className="text-zinc-300 text-sm">
                          {idx + 1}. {item.nome}
                        </span>
                        <span className="text-zinc-400 text-xs font-bold">
                          {item.vezes_adicionado}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lucro por Produto */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            💰 Lucro por Produto
          </h2>
          {lucroPorProduto.length === 0 ? (
            <p className="text-zinc-500 text-center py-10 text-sm">Sem dados</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
              {lucroPorProduto.map((p, idx) => {
                const prodOriginal = produtos.find(
                  (pr) => pr.nome?.toLowerCase() === p.nome?.toLowerCase()
                );
                const isEditando = editandoId === prodOriginal?.id;

                return (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {p.nome}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span>Vendido: {p.quantidade}x</span>
                      {isEditando ? (
                        <span className="flex items-center gap-1">
                          Custo:
                          <input
                            type="text"
                            value={custoEditando}
                            onChange={(e) => setCustoEditando(e.target.value)}
                            placeholder="Ex: 5,50"
                            className="w-20 bg-zinc-700 border border-zinc-600 rounded-md px-2 py-0.5 text-white text-xs focus:outline-none focus:border-purple-500 transition-colors"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') salvarCusto(prodOriginal.id);
                              if (e.key === 'Escape') cancelarEdicao();
                            }}
                          />
                        </span>
                      ) : (
                        <span>Custo: {formatarMoeda(p.costPrice)}</span>
                      )}
                      <span>Venda: {formatarMoeda(p.precoVenda)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Lucro/un</p>
                      <p
                        className={`text-sm font-bold ${
                          p.lucroPorUnidade >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {formatarMoeda(p.lucroPorUnidade)}
                      </p>
                      <p
                        className={`text-xs font-semibold ${
                          p.lucroTotal >= 0 ? "text-green-400/70" : "text-red-400/70"
                        }`}
                      >
                        Total: {formatarMoeda(p.lucroTotal)}
                      </p>
                    </div>
                    {isEditando ? (
                      <div className="flex flex-col gap-1 ml-2">
                        <button
                          onClick={() => salvarCusto(prodOriginal.id)}
                          disabled={salvandoCusto}
                          className="text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors cursor-pointer"
                          title="Salvar"
                        >
                          {salvandoCusto ? (
                            <div className="w-3.5 h-3.5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                          ) : (
                            <FaSave className="size-3.5" />
                          )}
                        </button>
                        <button
                          onClick={cancelarEdicao}
                          disabled={salvandoCusto}
                          className="text-zinc-400 hover:text-red-400 disabled:opacity-50 transition-colors cursor-pointer"
                          title="Cancelar"
                        >
                          <FaTimes className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      prodOriginal && (
                        <button
                          onClick={() => iniciarEdicaoCusto(prodOriginal)}
                          className="text-zinc-600 hover:text-purple-400 transition-colors cursor-pointer ml-2"
                          title="Editar custo"
                        >
                          <FaEdit className="size-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
