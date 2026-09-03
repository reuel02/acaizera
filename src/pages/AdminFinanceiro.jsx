import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { FaDollarSign, FaArrowUp, FaArrowDown, FaWallet, FaTrash, FaPlus } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Toast from "../components/Toast";

/**
 * ================================================
 * PÁGINA: AdminFinanceiro
 * ================================================
 *
 * Módulo financeiro com:
 *  - Cards de resumo: Entradas, Saídas, Saldo
 *  - Gráfico de barras: Entradas vs Custos por dia
 *  - Formulário para cadastrar custos
 *  - Lista de custos com opção de excluir
 *
 * DADOS:
 *  - RPC 'get_financial_summary' para dados do gráfico
 *  - Tabela 'costs' para CRUD de custos
 *  - Pedidos finalizados = Entradas
 * ================================================
 */

export default function AdminFinanceiro() {
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [custos, setCustos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState(30);

  // Formulário de novo custo
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [categoria, setCategoria] = useState("geral");
  const [salvando, setSalvando] = useState(false);

  // Toast
  const [toast, setToast] = useState({ visivel: false, mensagem: "", tipo: "sucesso" });

  const mostrarToast = (mensagem, tipo = "sucesso") => {
    setToast({ visivel: true, mensagem, tipo });
  };

  const buscarDados = useCallback(async () => {
    try {
      setCarregando(true);

      // Busca dados do gráfico via RPC
      const { data: financeiro, error: errFinanceiro } = await supabase.rpc(
        "get_financial_summary",
        { periodo_dias: periodo }
      );

      if (errFinanceiro) {
        console.error("Erro financeiro:", errFinanceiro);
      } else {
        // Formata para o recharts
        const formatado = (financeiro || []).map((d) => {
          const [ano, mes, dia] = d.data.split("-");
          return {
            data: `${dia}/${mes}`,
            Entradas: Number(d.entradas),
            Custos: Number(d.saidas),
          };
        });
        setDadosGrafico(formatado);
      }

      // Busca custos cadastrados
      const { data: listaCustos, error: errCustos } = await supabase
        .from("costs")
        .select("*")
        .order("date", { ascending: false })
        .limit(50);

      if (errCustos) {
        console.error("Erro custos:", errCustos);
      } else {
        setCustos(listaCustos || []);
      }
    } catch (erro) {
      console.error("Erro geral:", erro);
    } finally {
      setCarregando(false);
    }
  }, [periodo]);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  // Cálculos de resumo
  const totalEntradas = dadosGrafico.reduce((acc, d) => acc + d.Entradas, 0);
  const totalSaidas = dadosGrafico.reduce((acc, d) => acc + d.Custos, 0);
  const saldo = totalEntradas - totalSaidas;

  // Cadastrar novo custo
  const cadastrarCusto = async (e) => {
    e.preventDefault();
    if (!descricao.trim() || !valor || Number(valor) <= 0) {
      mostrarToast("Preencha todos os campos corretamente.", "erro");
      return;
    }

    setSalvando(true);
    try {
      const { error } = await supabase.from("costs").insert([
        {
          description: descricao.trim(),
          amount: Number(valor),
          date: data,
          category: categoria,
        },
      ]);

      if (error) throw error;

      mostrarToast("Custo cadastrado com sucesso!");
      setDescricao("");
      setValor("");
      setData(new Date().toISOString().split("T")[0]);
      setCategoria("geral");
      buscarDados(); // Recarrega dados
    } catch (erro) {
      console.error("Erro ao cadastrar:", erro);
      mostrarToast("Erro ao cadastrar custo.", "erro");
    } finally {
      setSalvando(false);
    }
  };

  // Excluir custo
  const excluirCusto = async (id) => {
    if (!confirm("Excluir este custo?")) return;

    try {
      const { error } = await supabase.from("costs").delete().eq("id", id);
      if (error) throw error;

      mostrarToast("Custo excluído.");
      buscarDados();
    } catch (erro) {
      console.error("Erro ao excluir:", erro);
      mostrarToast("Erro ao excluir custo.", "erro");
    }
  };

  const formatarMoeda = (v) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const periodos = [
    { valor: 7, label: "7 dias" },
    { valor: 30, label: "30 dias" },
    { valor: 90, label: "90 dias" },
  ];

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-semibold animate-pulse">
          Carregando financeiro...
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
        onFechar={() => setToast((t) => ({ ...t, visivel: false }))}
      />

      {/* Título + Filtro de período */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-white">Financeiro</h1>
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

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Entradas */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-green-500/20 text-green-500 rounded-xl">
            <FaArrowUp className="size-6" />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold">Entradas</p>
            <p className="text-xl font-bold text-green-400">{formatarMoeda(totalEntradas)}</p>
          </div>
        </div>

        {/* Saídas */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-red-500/20 text-red-500 rounded-xl">
            <FaArrowDown className="size-6" />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold">Saídas (Custos)</p>
            <p className="text-xl font-bold text-red-400">{formatarMoeda(totalSaidas)}</p>
          </div>
        </div>

        {/* Saldo */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
          <div
            className={`p-3 rounded-xl ${
              saldo >= 0 ? "bg-blue-500/20 text-blue-500" : "bg-red-500/20 text-red-500"
            }`}
          >
            <FaWallet className="size-6" />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold">Saldo</p>
            <p
              className={`text-xl font-bold ${
                saldo >= 0 ? "text-blue-400" : "text-red-400"
              }`}
            >
              {formatarMoeda(saldo)}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Entradas vs Custos</h2>
        {dadosGrafico.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="data" stroke="#71717a" tick={{ fontSize: 11 }} />
              <YAxis stroke="#71717a" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                formatter={(value) => formatarMoeda(value)}
              />
              <Legend />
              <Bar dataKey="Entradas" fill="#4ade80" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Custos" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-zinc-500 text-center py-10">Sem dados para o período selecionado</p>
        )}
      </div>

      {/* Grid: Formulário + Lista de Custos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário Novo Custo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaPlus className="text-purple-400" />
            Registrar Custo
          </h2>
          <form onSubmit={cadastrarCusto} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Descrição do custo *"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Valor (R$) *"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                min="0"
                step="0.01"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors cursor-pointer"
            >
              <option value="geral">Geral</option>
              <option value="aluguel">Aluguel</option>
              <option value="insumos">Insumos</option>
              <option value="energia">Energia</option>
              <option value="funcionarios">Funcionários</option>
              <option value="marketing">Marketing</option>
              <option value="manutencao">Manutenção</option>
              <option value="outros">Outros</option>
            </select>
            <button
              type="submit"
              disabled={salvando}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-sm"
            >
              {salvando ? "Salvando..." : "Cadastrar Custo"}
            </button>
          </form>
        </div>

        {/* Lista de Custos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaDollarSign className="text-red-400" />
            Custos Recentes
          </h2>
          {custos.length === 0 ? (
            <p className="text-zinc-500 text-center py-10 text-sm">
              Nenhum custo cadastrado
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
              {custos.map((custo) => (
                <div
                  key={custo.id}
                  className="flex items-center justify-between bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 group hover:border-zinc-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {custo.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-zinc-500 text-xs">
                        {new Date(custo.date + "T12:00:00").toLocaleDateString("pt-BR")}
                      </span>
                      <span className="text-purple-400/60 text-xs font-semibold px-1.5 py-0.5 bg-purple-500/10 rounded">
                        {custo.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 font-bold text-sm whitespace-nowrap">
                      - {formatarMoeda(custo.amount)}
                    </span>
                    <button
                      onClick={() => excluirCusto(custo.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <FaTrash className="size-3.5" />
                    </button>
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
