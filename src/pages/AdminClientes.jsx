import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { FaWhatsapp, FaSearch, FaUsers } from "react-icons/fa";
import { abrirWhatsAppRetencao } from "../utils/whatsapp";

/**
 * ================================================
 * PÁGINA: AdminClientes (CRM)
 * ================================================
 *
 * Módulo de gestão de clientes com foco em retenção.
 *
 * FUNCIONALIDADE:
 *  - Lista de clientes agregada (nome, telefone, pedidos, último pedido, dias sem pedir)
 *  - Busca/filtro por nome
 *  - Indicador visual de inatividade (verde/amarelo/vermelho)
 *  - Botão WhatsApp para enviar mensagem de retenção personalizada
 *
 * DADOS:
 *  - Chama RPC 'get_customers_summary' do Supabase
 *  - Dados são agregados no banco (performance)
 * ================================================
 */

export default function AdminClientes() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  const buscarClientes = useCallback(async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase.rpc("get_customers_summary");

      if (error) {
        console.error("❌ Erro ao buscar clientes:", error);
        alert(`Erro ao carregar clientes: ${error.message}`);
        setClientes([]);
      } else {
        setClientes(data || []);
      }
    } catch (erro) {
      console.error("❌ Erro:", erro);
      setClientes([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarClientes();
  }, [buscarClientes]);

  // Filtra clientes pela busca
  const clientesFiltrados = clientes.filter((c) =>
    c.cliente_nome?.toLowerCase().includes(busca.toLowerCase())
  );

  // Cor do indicador de dias sem pedir
  const corDias = (dias) => {
    if (dias <= 7) return "text-green-400 bg-green-500/10";
    if (dias <= 30) return "text-amber-400 bg-amber-500/10";
    return "text-red-400 bg-red-500/10";
  };

  // Formatar data
  const formatarData = (data) => {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  // Formatar telefone: 13997385581 -> (13) 99738-5581
  const formatarTelefone = (tel) => {
    if (!tel) return "Não informado";
    // Remove tudo que não é dígito
    const digitos = tel.replace(/\D/g, '');
    
    if (digitos.length === 11) {
      // Celular com DDD: (XX) XXXXX-XXXX
      return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
    } else if (digitos.length === 10) {
      // Fixo com DDD: (XX) XXXX-XXXX
      return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
    } else if (digitos.length === 13 && digitos.startsWith('55')) {
      // Com código do país +55: (XX) XXXXX-XXXX
      return `(${digitos.slice(2, 4)}) ${digitos.slice(4, 9)}-${digitos.slice(9)}`;
    }
    // Se não se encaixa, retorna como está
    return tel;
  };

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-semibold animate-pulse">
          Carregando clientes...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Título + Contador */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white">Clientes</h1>
          <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-bold">
            {clientes.length}
          </span>
        </div>

        {/* Campo de Busca */}
        <div className="relative w-full max-w-xs">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 size-4" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Tabela de Clientes */}
      {clientesFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
          <FaUsers className="size-12 opacity-30" />
          <p className="font-semibold">
            {busca ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Header da tabela - desktop */}
          <div className="hidden md:grid md:grid-cols-6 gap-4 px-6 py-4 bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            <span className="col-span-2">Cliente</span>
            <span>Telefone</span>
            <span className="text-center">Pedidos</span>
            <span className="text-center">Último Pedido</span>
            <span className="text-center">Ação</span>
          </div>

          {/* Linhas da tabela */}
          {clientesFiltrados.map((cliente, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-6 gap-2 md:gap-4 px-6 py-4 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors items-center"
            >
              {/* Nome */}
              <div className="col-span-1 md:col-span-2">
                <p className="text-white font-semibold text-sm truncate">
                  {cliente.cliente_nome}
                </p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-bold ${corDias(
                    cliente.dias_sem_pedir
                  )}`}
                >
                  {cliente.dias_sem_pedir === 0
                    ? "Pediu hoje"
                    : `${cliente.dias_sem_pedir} dias sem pedir`}
                </span>
              </div>

              {/* Telefone */}
              <div className="text-zinc-400 text-sm">
                <span className="md:hidden text-zinc-500 text-xs font-semibold mr-2">
                  Tel:
                </span>
                {formatarTelefone(cliente.cliente_telefone)}
              </div>

              {/* Total Pedidos */}
              <div className="md:text-center">
                <span className="md:hidden text-zinc-500 text-xs font-semibold mr-2">
                  Pedidos:
                </span>
                <span className="text-white font-bold text-sm">
                  {cliente.total_pedidos}
                </span>
              </div>

              {/* Último Pedido */}
              <div className="md:text-center">
                <span className="md:hidden text-zinc-500 text-xs font-semibold mr-2">
                  Último:
                </span>
                <span className="text-zinc-400 text-sm">
                  {formatarData(cliente.ultimo_pedido)}
                </span>
              </div>

              {/* Botão WhatsApp */}
              <div className="md:text-center mt-2 md:mt-0">
                <button
                  onClick={() =>
                    abrirWhatsAppRetencao(
                      cliente.cliente_telefone,
                      cliente.cliente_nome,
                      cliente.dias_sem_pedir
                    )
                  }
                  disabled={!cliente.cliente_telefone}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-green-600/30"
                >
                  <FaWhatsapp className="size-4" />
                  Mensagem
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
