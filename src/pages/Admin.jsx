import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // Ajuste o caminho se necessário
import { FaDollarSign, FaShoppingBag, FaCheckCircle, FaClock, FaMotorcycle, FaStore } from "react-icons/fa";

export default function Admin() {
    const [pedidos, setPedidos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [modalPagamento, setModalPagamento] = useState({ visivel: false, pedido: null });

    // 1. Busca inicial e configuração do "Tempo Real"
    useEffect(() => {
        buscarPedidos();

        const canalRealtime = supabase
            .channel('pedidos_ao_vivo')
            .on('postgres_changes', { event: '*', schema: 'acaizera', table: 'pedidos' }, (payload) => {
                console.log('Mudança recebida!', payload);
                buscarPedidos(); 
            })
            .subscribe();

        return () => {
            supabase.removeChannel(canalRealtime);
        };
    }, []);

    const buscarPedidos = async () => {
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .select('*')
                .order('criado_em', { ascending: false });

            if (error) {
                alert(`❌ Erro ao carregar pedidos:\n${error.message}`);
                setPedidos([]);
            } else {
                setPedidos(data || []);
            }
        } catch (erro) {
            alert("❌ Erro ao conectar ao banco de dados\n" + erro.message);
            setPedidos([]);
        } finally {
            setCarregando(false);
        }
    };

    // 2. Função para mover o card de coluna ou abrir modal se for Local -> Finalizado
    const tentarMudarStatus = async (pedido, novoStatus) => {
        if (novoStatus === 'finalizado' && pedido.order_type === 'local') {
            // Intercepta e pede pagamento para consumo local
            setModalPagamento({ visivel: true, pedido });
            return;
        }
        
        await executarMudancaStatus(pedido.id, novoStatus);
    };

    const executarMudancaStatus = async (id, novoStatus, paymentMethod = null) => {
        const payload = { status: novoStatus };
        if (paymentMethod) {
            payload.payment_status = 'paid';
            payload.payment_method = paymentMethod;
        }

        const { error } = await supabase
            .from('pedidos')
            .update(payload)
            .eq('id', id);

        if (error) alert("Erro ao atualizar o status do pedido.");
    };

    const confirmarPagamentoLocal = async (metodo) => {
        if (!modalPagamento.pedido) return;
        await executarMudancaStatus(modalPagamento.pedido.id, 'finalizado', metodo);
        setModalPagamento({ visivel: false, pedido: null });
    };

    // 3. Cálculos das Métricas
    const hoje = new Date().toDateString();
    
    const pedidosDeHoje = pedidos.filter(p => new Date(p.criado_em).toDateString() === hoje);
    
    const totalPedidosHoje = pedidosDeHoje.length;
    const concluidosHoje = pedidosDeHoje.filter(p => p.status === 'finalizado').length;
    
    const faturamentoHoje = pedidosDeHoje
        .filter(p => p.status === 'finalizado')
        .reduce((acc, pedido) => acc + Number(pedido.total), 0);

    // 4. Separação para o Kanban 
    const pedidosNovos = pedidosDeHoje.filter(p => p.status === 'novo');
    const pedidosPreparo = pedidosDeHoje.filter(p => p.status === 'preparando');
    const pedidosFinalizados = pedidosDeHoje.filter(p => p.status === 'finalizado');

    const formatarHora = (dataString) => {
        return new Date(dataString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    if (carregando) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-zinc-400 text-sm font-semibold animate-pulse">Carregando pedidos...</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Pedidos do Dia</h1>

            {pedidos.length === 0 && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
                    <p className="font-semibold mb-2">ℹ️ Nenhum pedido encontrado</p>
                    <p className="text-sm">Total de pedidos: {pedidos.length}</p>
                </div>
            )}

            {/* ====== MÉTRICAS ====== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4 shadow-lg">
                    <div className="p-4 bg-purple-500/20 text-purple-500 rounded-xl">
                        <FaShoppingBag className="size-8" />
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm font-semibold">Pedidos (Hoje)</p>
                        <p className="text-2xl font-bold text-white">{totalPedidosHoje}</p>
                    </div>
                </div>

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

            {/* ====== KANBAN ====== */}
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
                                onAvançar={() => tentarMudarStatus(pedido, 'preparando')}
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
                                onAvançar={() => tentarMudarStatus(pedido, 'finalizado')}
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
                        {pedidosFinalizados.slice(0, 10).map(pedido => ( 
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

            {/* MODAL DE PAGAMENTO OBRIGATÓRIO PARA CONSUMO LOCAL */}
            {modalPagamento.visivel && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-2">Finalizar Pedido Local</h2>
                        <p className="text-sm text-zinc-400 mb-6">Selecione a forma de pagamento do cliente da <strong>Mesa {modalPagamento.pedido?.table_number}</strong> para registrar o faturamento.</p>
                        
                        <div className="flex flex-col gap-3">
                            <button onClick={() => confirmarPagamentoLocal('Pix')} className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer text-center">
                                Pagamento em Pix
                            </button>
                            <button onClick={() => confirmarPagamentoLocal('Cartao')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer text-center">
                                Pagamento no Cartão
                            </button>
                            <button onClick={() => confirmarPagamentoLocal('Dinheiro')} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer text-center">
                                Pagamento em Dinheiro
                            </button>
                        </div>

                        <button 
                            onClick={() => setModalPagamento({ visivel: false, pedido: null })} 
                            className="mt-6 w-full text-zinc-400 hover:text-white transition-colors text-sm font-semibold cursor-pointer"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function CardPedido({ pedido, hora, onAvançar, textoBotao, corBotao, finalizado }) {
    const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
    
    const resumoItens = itens.length > 0 
        ? itens.map(item => `${item.quantidade}x ${item.nome}`).join(", ")
        : "Sem itens";

    const isLocal = pedido.order_type === 'local';

    return (
        <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm hover:border-zinc-700 transition-colors relative overflow-hidden ${isLocal ? 'border-l-4 border-l-brand-banana' : 'border-l-4 border-l-purple-500'}`}>
            
            {/* BADGE TIPO DE PEDIDO */}
            <div className="absolute top-0 right-0">
                {isLocal ? (
                    <span className="bg-brand-banana text-zinc-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                        <FaStore /> Mesa {pedido.table_number || '?'}
                    </span>
                ) : (
                    <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                        <FaMotorcycle /> Delivery
                    </span>
                )}
            </div>

            <div className="flex justify-between items-start mb-2 mt-2">
                <h3 className="font-bold text-white text-lg">{pedido.cliente_nome || "Sem nome"}</h3>
                <span className="flex items-center gap-1 text-zinc-500 text-xs font-semibold">
                    <FaClock /> {hora}
                </span>
            </div>
            
            <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{resumoItens}</p>
            
            {itens.length > 0 && (
                <div className="mb-3 bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50 text-xs space-y-2">
                    {itens.map((item, idx) => (
                        <div key={idx} className="border-b border-zinc-800 pb-2 last:border-0">
                            <p className="font-semibold text-white mb-1">
                                {item.quantidade}x {item.nome}
                            </p>
                            
                            {item.frutas && item.frutas.length > 0 && (
                                <p className="text-pink-400">🍓 {item.frutas.map(f => f.nome).join(", ")}</p>
                            )}
                            {item.acompanhamentos && item.acompanhamentos.length > 0 && (
                                <p className="text-blue-400">🥣 {item.acompanhamentos.map(a => a.nome).join(", ")}</p>
                            )}
                            {item.caldas && item.caldas.length > 0 && (
                                <p className="text-amber-400">🍯 {item.caldas.map(c => c.nome).join(", ")}</p>
                            )}
                            {item.turbine && item.turbine.length > 0 && (
                                <p className="text-yellow-400">⚡ {item.turbine.map(t => t.nome).join(", ")}</p>
                            )}
                            {item.observacao && (
                                <p className="text-gray-400 italic">📝 {item.observacao}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
            
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
            {finalizado && pedido.payment_method && (
                <div className="text-center bg-green-500/10 text-green-400 text-xs py-1.5 rounded-lg border border-green-500/20 font-semibold">
                    Pago via {pedido.payment_method}
                </div>
            )}
        </div>
    );
}