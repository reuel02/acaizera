import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // Ajuste o caminho se necessário
import { FaDollarSign, FaShoppingBag, FaCheckCircle, FaClock, FaSignOutAlt } from "react-icons/fa";

export default function Admin({ onLogout }) {
    const [pedidos, setPedidos] = useState([]);
    const [carregando, setCarregando] = useState(true);

    // 1. Busca inicial e configuração do "Tempo Real"
    useEffect(() => {
        buscarPedidos();

        // Inscreve o painel para ouvir mudanças no banco ao vivo
        const canalRealtime = supabase
            .channel('pedidos_ao_vivo')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
                console.log('Mudança recebida!', payload);
                buscarPedidos(); // Recarrega a lista se algo mudar
            })
            .subscribe();

        return () => {
            supabase.removeChannel(canalRealtime);
        };
    }, []);

    const buscarPedidos = async () => {
        try {
            console.log("Tentando buscar pedidos do Supabase...");
            
            const { data, error } = await supabase
                .from('pedidos')
                .select('*')
                .order('criado_em', { ascending: false }); // Mais recentes primeiro

            if (error) {
                console.error("❌ ERRO ao buscar pedidos:", error);
                console.error("Código do erro:", error.code);
                console.error("Detalhes:", error.details);
                alert(`❌ Erro ao carregar pedidos:\n${error.message}\n\nVerifique se a tabela 'pedidos' existe no Supabase!`);
                setPedidos([]);
            } else {
                console.log("✅ Pedidos carregados com sucesso:", data);
                console.log("Quantidade de pedidos:", data?.length || 0);
                setPedidos(data || []);
            }
        } catch (erro) {
            console.error("❌ Erro na busca de pedidos:", erro);
            alert("❌ Erro ao conectar ao banco de dados\n" + erro.message);
            setPedidos([]);
        } finally {
            setCarregando(false);
        }
    };

    // 2. Função para mover o card de coluna
    const mudarStatus = async (id, novoStatus) => {
        const { error } = await supabase
            .from('pedidos')
            .update({ status: novoStatus })
            .eq('id', id);

        if (error) alert("Erro ao atualizar o status do pedido.");
        // Não precisamos de um setPedidos aqui porque o Realtime vai avisar o useEffect para atualizar a tela
    };

    // 3. Cálculos das Métricas (Matemática pura com JavaScript)
    const hoje = new Date().toDateString();
    
    // Filtramos apenas os pedidos feitos "hoje" para as métricas não acumularem eternamente
    const pedidosDeHoje = pedidos.filter(p => new Date(p.criado_em).toDateString() === hoje);
    
    const totalPedidosHoje = pedidosDeHoje.length;
    const concluidosHoje = pedidosDeHoje.filter(p => p.status === 'finalizado').length;
    
    // Soma o 'total' apenas dos pedidos finalizados
    const faturamentoHoje = pedidosDeHoje
        .filter(p => p.status === 'finalizado')
        .reduce((acc, pedido) => acc + Number(pedido.total), 0);

    // 4. Separação para o Kanban (apenas pedidos de hoje)
    const pedidosNovos = pedidosDeHoje.filter(p => p.status === 'novo');
    const pedidosPreparo = pedidosDeHoje.filter(p => p.status === 'preparando');
    const pedidosFinalizados = pedidosDeHoje.filter(p => p.status === 'finalizado');

    // Função auxiliar para formatar a hora (Ex: 19:35)
    const formatarHora = (dataString) => {
        return new Date(dataString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    if (carregando) return <div className="text-white p-10 text-center animate-pulse">Carregando painel de controle... Verificando Supabase...</div>;

    return (
        <div className="min-h-screen bg-zinc-950 p-6 font-sans">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white">Painel de Controle</h1>
                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        <FaSignOutAlt /> Sair
                    </button>
                )}
            </div>

            {/* DEBUG: Mostrar se há dados */}
            {pedidos.length === 0 && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
                    <p className="font-semibold mb-2">ℹ️ Nenhum pedido encontrado</p>
                    <p className="text-sm">Verifique se há pedidos na tabela 'pedidos' do Supabase. Total de pedidos: {pedidos.length}</p>
                    <p className="text-xs text-blue-300 mt-2">Abra o console (F12) para ver detalhes do erro.</p>
                </div>
            )}

            {/* ====== MÉTRICAS (TOPO) ====== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Card Faturamento */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4 shadow-lg">
                    <div className="p-4 bg-green-500/20 text-green-500 rounded-xl">
                        <FaDollarSign className="size-8" />
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm font-semibold">Faturamento (Hoje)</p>
                        <p className="text-2xl font-bold text-white">
                            R$ {faturamentoHoje.toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                </div>

                {/* Card Total de Pedidos */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4 shadow-lg">
                    <div className="p-4 bg-purple-500/20 text-purple-500 rounded-xl">
                        <FaShoppingBag className="size-8" />
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm font-semibold">Pedidos (Hoje)</p>
                        <p className="text-2xl font-bold text-white">{totalPedidosHoje}</p>
                    </div>
                </div>

                {/* Card Concluídos */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4 shadow-lg">
                    <div className="p-4 bg-blue-500/20 text-blue-500 rounded-xl">
                        <FaCheckCircle className="size-8" />
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm font-semibold">Concluídos (Hoje)</p>
                        <p className="text-2xl font-bold text-white">{concluidosHoje}</p>
                    </div>
                </div>
            </div>

            {/* ====== KANBAN (COLUNAS) ====== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                
                {/* Coluna 1: NOVOS */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 min-h-[500px]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-purple-400">Novos Recebidos</h2>
                        <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-md text-xs font-bold">{pedidosNovos.length}</span>
                    </div>
                    <div className="flex flex-col gap-4">
                        {pedidosNovos.map(pedido => (
                            <CardPedido 
                                key={pedido.id} 
                                pedido={pedido} 
                                hora={formatarHora(pedido.criado_em)}
                                onAvançar={() => mudarStatus(pedido.id, 'preparando')}
                                textoBotao="Aceitar e Preparar →"
                                corBotao="bg-amber-600 hover:bg-amber-500"
                            />
                        ))}
                    </div>
                </div>

                {/* Coluna 2: PREPARANDO */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 min-h-[500px]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-amber-400">Em Preparo</h2>
                        <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded-md text-xs font-bold">{pedidosPreparo.length}</span>
                    </div>
                    <div className="flex flex-col gap-4">
                        {pedidosPreparo.map(pedido => (
                            <CardPedido 
                                key={pedido.id} 
                                pedido={pedido} 
                                hora={formatarHora(pedido.criado_em)}
                                onAvançar={() => mudarStatus(pedido.id, 'finalizado')}
                                textoBotao="Marcar como Pronto ✓"
                                corBotao="bg-green-600 hover:bg-green-500"
                            />
                        ))}
                    </div>
                </div>

                {/* Coluna 3: FINALIZADOS */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 min-h-[500px]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-green-400">Prontos / Entregues</h2>
                        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-md text-xs font-bold">{pedidosFinalizados.length}</span>
                    </div>
                    <div className="flex flex-col gap-4">
                        {pedidosFinalizados.slice(0, 10).map(pedido => ( // Mostra só os 10 últimos para não lotar a tela
                            <CardPedido 
                                key={pedido.id} 
                                pedido={pedido} 
                                hora={formatarHora(pedido.criado_em)}
                                finalizado={true}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

// Componente do Card de Pedido para deixar o código mais limpo
function CardPedido({ pedido, hora, onAvançar, textoBotao, corBotao, finalizado }) {
    // Valida se itens existe e é um array
    const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
    
    // Resume os itens para mostrar no card (Ex: "1x Copo 500ml, 2x Barca")
    const resumoItens = itens.length > 0 
        ? itens.map(item => `${item.quantidade}x ${item.nome}`).join(", ")
        : "Sem itens";

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm hover:border-zinc-700 transition-colors">
            {/* ===== CABEÇALHO: NOME E HORA ===== */}
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-white text-lg">{pedido.cliente_nome || "Sem nome"}</h3>
                <span className="flex items-center gap-1 text-zinc-500 text-xs font-semibold">
                    <FaClock /> {hora}
                </span>
            </div>
            
            {/* ===== RESUMO DE ITENS ===== */}
            <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{resumoItens}</p>
            
            {/* ===== DETALHES DE PERSONALIZAÇÃO POR ITEM ===== */}
            {itens.length > 0 && (
                <div className="mb-3 bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50 text-xs space-y-2">
                    {itens.map((item, idx) => (
                        <div key={idx} className="border-b border-zinc-800 pb-2 last:border-0">
                            {/* Nome e quantidade */}
                            <p className="font-semibold text-white mb-1">
                                {item.quantidade}x {item.nome}
                            </p>
                            
                            {/* Frutas */}
                            {item.frutas && item.frutas.length > 0 && (
                                <p className="text-pink-400">
                                    🍓 {item.frutas.map(f => f.nome).join(", ")}
                                </p>
                            )}
                            
                            {/* Acompanhamentos */}
                            {item.acompanhamentos && item.acompanhamentos.length > 0 && (
                                <p className="text-blue-400">
                                    🥣 {item.acompanhamentos.map(a => a.nome).join(", ")}
                                </p>
                            )}
                            
                            {/* Caldas */}
                            {item.caldas && item.caldas.length > 0 && (
                                <p className="text-amber-400">
                                    🍯 {item.caldas.map(c => c.nome).join(", ")}
                                </p>
                            )}
                            
                            {/* Extras (Turbine) */}
                            {item.turbine && item.turbine.length > 0 && (
                                <p className="text-yellow-400">
                                    ⚡ {item.turbine.map(t => t.nome).join(", ")}
                                </p>
                            )}
                            
                            {/* Observações */}
                            {item.observacao && (
                                <p className="text-gray-400 italic">
                                    📝 {item.observacao}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
            
            {/* ===== ENDEREÇO E TOTAL ===== */}
            <div className="flex justify-between items-center mb-4 gap-2">
                <span className="text-xs text-zinc-500 bg-zinc-950 px-2 py-1 rounded-md flex-1 break-words">
                    {pedido.cliente_endereco || "Sem endereço"}
                </span>
                <span className="font-bold text-green-400 whitespace-nowrap">
                    R$ {Number(pedido.total || 0).toFixed(2).replace('.', ',')}
                </span>
            </div>

            {!finalizado && (
                <button 
                    onClick={onAvançar}
                    className={`w-full py-2 rounded-lg text-white font-bold text-sm transition-colors cursor-pointer ${corBotao}`}
                >
                    {textoBotao}
                </button>
            )}
        </div>
    );
}