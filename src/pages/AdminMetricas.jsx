import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { FaTrophy, FaStar } from "react-icons/fa";
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
              {lucroPorProduto.map((p, idx) => (
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
                      <span>Custo: {formatarMoeda(p.costPrice)}</span>
                      <span>Venda: {formatarMoeda(p.precoVenda)}</span>
                    </div>
                  </div>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
