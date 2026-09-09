import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { FaClock, FaSave } from "react-icons/fa";
import Toast from "../components/Toast";

/**
 * ================================================
 * PÁGINA: AdminConfiguracoes
 * ================================================
 *
 * Gerencia os horários de funcionamento da loja.
 * Lê e grava na tabela `store_settings` do Supabase.
 *
 * FUNCIONALIDADE:
 *  - Lista os 7 dias da semana com toggle aberto/fechado
 *  - Inputs de hora de abertura e fechamento por dia
 *  - Botão único "Salvar Horários" com UPSERT
 *  - Toast de feedback e loading states
 * ================================================
 */

const DIAS_SEMANA = [
  { valor: 0, label: "Domingo" },
  { valor: 1, label: "Segunda-feira" },
  { valor: 2, label: "Terça-feira" },
  { valor: 3, label: "Quarta-feira" },
  { valor: 4, label: "Quinta-feira" },
  { valor: 5, label: "Sexta-feira" },
  { valor: 6, label: "Sábado" },
];

// Estado padrão para cada dia (usado se tabela estiver vazia)
const HORARIO_PADRAO = {
  aberto: true,
  hora_abertura: "19:00",
  hora_fechamento: "00:00",
};

export default function AdminConfiguracoes() {
  const [horarios, setHorarios] = useState(
    DIAS_SEMANA.map((d) => ({
      dia_semana: d.valor,
      ...HORARIO_PADRAO,
    }))
  );
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState({ visivel: false, mensagem: "", tipo: "sucesso" });

  const mostrarToast = (mensagem, tipo = "sucesso") => {
    setToast({ visivel: true, mensagem, tipo });
  };

  // Busca horários do Supabase
  const buscarHorarios = useCallback(async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .order("dia_semana", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Mescla dados do banco com o array de dias
        setHorarios(
          DIAS_SEMANA.map((d) => {
            const encontrado = data.find((h) => h.dia_semana === d.valor);
            return encontrado
              ? {
                  dia_semana: encontrado.dia_semana,
                  aberto: encontrado.aberto,
                  hora_abertura: encontrado.hora_abertura?.slice(0, 5) || "19:00",
                  hora_fechamento: encontrado.hora_fechamento?.slice(0, 5) || "00:00",
                }
              : { dia_semana: d.valor, ...HORARIO_PADRAO };
          })
        );
      }
    } catch (erro) {
      console.error("Erro ao buscar horários:", erro);
      mostrarToast("Erro ao carregar horários.", "erro");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarHorarios();
  }, [buscarHorarios]);

  // Atualiza um campo de um dia específico
  const atualizarDia = (diaSemana, campo, valor) => {
    setHorarios((prev) =>
      prev.map((h) =>
        h.dia_semana === diaSemana ? { ...h, [campo]: valor } : h
      )
    );
  };

  // Salva todos os horários via UPSERT
  const salvarHorarios = async () => {
    setSalvando(true);
    try {
      const payload = horarios.map((h) => ({
        dia_semana: h.dia_semana,
        aberto: h.aberto,
        hora_abertura: h.hora_abertura,
        hora_fechamento: h.hora_fechamento,
        atualizado_em: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("store_settings")
        .upsert(payload, { onConflict: "dia_semana" });

      if (error) throw error;

      mostrarToast("Horários salvos com sucesso!");
    } catch (erro) {
      console.error("Erro ao salvar horários:", erro);
      const msgErro = erro.message || erro.details || "Erro desconhecido";
      mostrarToast(`Erro ao salvar: ${msgErro}`, "erro");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-semibold animate-pulse">
          Carregando configurações...
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

      {/* Título */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white">Configurações</h1>
          <FaClock className="text-purple-400 size-6" />
        </div>

        <button
          onClick={salvarHorarios}
          disabled={salvando}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
        >
          {salvando ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <FaSave className="size-4" />
          )}
          {salvando ? "Salvando..." : "Salvar Horários"}
        </button>
      </div>

      {/* Card de Horários */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-white font-bold text-lg">🕐 Horário de Funcionamento</h2>
          <p className="text-zinc-500 text-xs mt-1">
            Configure os horários de abertura e fechamento para cada dia da semana.
          </p>
        </div>

        <div className="divide-y divide-zinc-800/50">
          {horarios.map((h) => {
            const diaInfo = DIAS_SEMANA.find((d) => d.valor === h.dia_semana);
            return (
              <div
                key={h.dia_semana}
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-zinc-800/30 transition-colors flex-wrap"
              >
                {/* Nome do dia */}
                <div className="w-36">
                  <p className="text-white font-semibold text-sm">{diaInfo?.label}</p>
                </div>

                {/* Toggle Aberto/Fechado */}
                <button
                  type="button"
                  onClick={() => atualizarDia(h.dia_semana, "aberto", !h.aberto)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                    h.aberto ? "bg-green-500" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      h.aberto ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>

                <span
                  className={`text-xs font-bold w-16 ${
                    h.aberto ? "text-green-400" : "text-zinc-500"
                  }`}
                >
                  {h.aberto ? "Aberto" : "Fechado"}
                </span>

                {/* Inputs de horário */}
                <div className={`flex items-center gap-2 ${!h.aberto ? "opacity-30 pointer-events-none" : ""}`}>
                  <label className="text-zinc-500 text-xs">Abre:</label>
                  <input
                    type="time"
                    value={h.hora_abertura}
                    onChange={(e) => atualizarDia(h.dia_semana, "hora_abertura", e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <label className="text-zinc-500 text-xs">Fecha:</label>
                  <input
                    type="time"
                    value={h.hora_fechamento}
                    onChange={(e) => atualizarDia(h.dia_semana, "hora_fechamento", e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
