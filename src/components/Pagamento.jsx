import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

// Inicializar Mercado Pago
initMercadoPago(import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY, { locale: 'pt-BR' });

/**
 * ================================================
 * COMPONENTE: Pagamento (Modal)
 * ================================================
 * 
 * FIX: Loop infinito corrigido.
 * - Polling limitado (máx 60 tentativas × 5s = 5 min) para status pending/in_process
 * - Cleanup automático ao desmontar (clearInterval)
 * - Se status já for approved na resposta inicial, pula direto para onPagamentoFeito
 * ================================================
 */

const MAX_TENTATIVAS_POLLING = 60; // 60 × 5s = 5 minutos
const INTERVALO_POLLING_MS = 5000; // 5 segundos

export function Pagamento({ valorTotal, emailCliente, onPagamentoFeito, onCancelar }) {
  const [pixData, setPixData] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [verificando, setVerificando] = useState(false);

  // Estado para polling de cartão pendente
  const [aguardandoCartao, setAguardandoCartao] = useState(null); // { paymentId, tentativas }
  const [statusCartao, setStatusCartao] = useState(null); // 'polling' | 'approved' | 'rejected' | 'timeout'
  const intervalRef = useRef(null);

  // Ref para sempre ter o callback mais recente (evita stale closure no setInterval)
  const onPagamentoFeitoRef = useRef(onPagamentoFeito);
  useEffect(() => {
    onPagamentoFeitoRef.current = onPagamentoFeito;
  }, [onPagamentoFeito]);

  // Cleanup do polling ao desmontar o componente
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Função de verificação reutilizável
  const verificarStatusCartao = async (paymentId) => {
    try {
      const response = await fetch(`/api/status?id=${paymentId}`);
      const data = await response.json();

      if (data.status === 'approved' || data.status === 'paid') {
        // Pagamento aprovado! Limpa interval e segue para conclusão
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setStatusCartao('approved');
        onPagamentoFeitoRef.current(paymentId);
        return true; // Resolvido
      }

      if (data.status === 'rejected' || data.status === 'cancelled') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setStatusCartao('rejected');
        return true; // Resolvido
      }

      return false; // Ainda pendente
    } catch (error) {
      console.error("Erro ao verificar status do pagamento:", error);
      return false;
    }
  };

  // Polling automático quando aguardandoCartao está ativo
  useEffect(() => {
    if (!aguardandoCartao) return;

    // Limpa interval anterior se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setStatusCartao('polling');

    // Verificação imediata antes de iniciar o intervalo
    verificarStatusCartao(aguardandoCartao.paymentId).then((resolvido) => {
      if (resolvido) return; // Já resolveu na primeira tentativa

      // Inicia polling periódico
      intervalRef.current = setInterval(async () => {
        const resolvido = await verificarStatusCartao(aguardandoCartao.paymentId);
        if (resolvido) return;

        // Ainda pendente: incrementa tentativas
        setAguardandoCartao(prev => {
          if (!prev) return null;
          const novasTentativas = prev.tentativas + 1;
          if (novasTentativas >= MAX_TENTATIVAS_POLLING) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setStatusCartao('timeout');
            return null;
          }
          return { ...prev, tentativas: novasTentativas };
        });
      }, INTERVALO_POLLING_MS);
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [aguardandoCartao?.paymentId]); // Só re-executa se o paymentId mudar

  // Configuração do Brick
  const initialization = {
    amount: parseFloat(valorTotal),
  };

  const customization = {
    paymentMethods: {
      creditCard: "all",
      bankTransfer: "all", // Habilita PIX no Brasil
      maxInstallments: 1, // Trava em "Apenas a vista" conforme solicitado
    },
    visual: {
      style: {
        theme: "dark", // Combina com o app
      },
    }
  };

  const onSubmit = async ({ selectedPaymentMethod, formData }) => {
    // Garantir que o e-mail do payer vá no formData (MP exige email válido para aprovar cartão)
    if (!formData.payer) formData.payer = {};
    formData.payer.email = formData.payer.email || emailCliente || "cliente@acaizera.com.br";

    return new Promise((resolve, reject) => {
      fetch("/api/pagamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            alert("Erro ao processar pagamento: " + data.message);
            reject();
            return;
          }

          if (data.status === 'approved' || data.status === 'paid') {
            // Sucesso imediato: pula qualquer tela de aguardo
            resolve();
            onPagamentoFeito(data.id);
          } else if (data.qrCode) {
            resolve(); // PIX gerado
            setPixData(data);
          } else if (data.status === 'in_process' || data.status === 'pending') {
            // Pagamento em análise — inicia polling limitado em vez de loop infinito
            resolve();
            setAguardandoCartao({ paymentId: data.id, tentativas: 0 });
          } else if (data.status === 'rejected') {
            reject(); 
            console.warn("Pagamento recusado:", data.status_detail);
          } else {
            alert(`Pagamento não aprovado. Status: ${data.status}`);
            reject();
          }
        })
        .catch((error) => {
          console.error("Erro na requisição de pagamento", error);
          alert("Falha de rede ao processar o pagamento.");
          reject();
        });
    });
  };

  const onError = async (error) => {
    console.error("Erro no Brick do Mercado Pago", error);
  };

  const copiarPix = () => {
    if (!pixData?.copiaCola) return;
    navigator.clipboard.writeText(pixData.copiaCola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const verificarStatusPix = async () => {
    if (!pixData?.id) return;
    setVerificando(true);
    try {
      const response = await fetch(`/api/status?id=${pixData.id}`);
      const data = await response.json();
      if (data.status === 'approved') {
        onPagamentoFeito(pixData.id);
      } else {
        alert("O PIX ainda não foi confirmado. Aguarde mais alguns segundos e tente novamente.");
      }
    } catch (error) {
      alert("Erro ao verificar status.");
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-6 shadow-2xl border border-purple-500/30 my-8">
        
        {/* TELA: Aguardando confirmação de cartão (FIX do loop infinito) */}
        {aguardandoCartao && statusCartao === 'polling' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-6" />
            <h2 className="text-xl font-bold text-white text-center mb-2">Processando Pagamento</h2>
            <p className="text-zinc-400 text-sm text-center mb-4">
              Seu pagamento está sendo analisado. Aguarde a confirmação automática...
            </p>
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 mb-4">
              <p className="text-zinc-500 text-xs text-center">
                Verificação {aguardandoCartao.tentativas}/{MAX_TENTATIVAS_POLLING} • Tempo restante: ~{Math.ceil((MAX_TENTATIVAS_POLLING - aguardandoCartao.tentativas) * INTERVALO_POLLING_MS / 60000)} min
              </p>
            </div>
            <p className="text-zinc-500 text-xs text-center mb-4">
              Não feche esta tela. A confirmação será automática.
            </p>
            <button 
              onClick={() => verificarStatusCartao(aguardandoCartao.paymentId)}
              className="w-full py-2.5 rounded-xl font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 transition-all cursor-pointer text-sm"
            >
              Verificar Agora
            </button>
          </div>
        )}

        {/* TELA: Pagamento rejeitado após polling */}
        {statusCartao === 'rejected' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-2">Pagamento Recusado</h2>
            <p className="text-zinc-400 text-sm text-center mb-6">
              O pagamento foi recusado pela operadora. Tente novamente com outro cartão ou método de pagamento.
            </p>
            <button 
              onClick={() => { setAguardandoCartao(null); setStatusCartao(null); }}
              className="w-full py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* TELA: Timeout do polling */}
        {statusCartao === 'timeout' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-2">Tempo Esgotado</h2>
            <p className="text-zinc-400 text-sm text-center mb-6">
              Não foi possível confirmar o pagamento no tempo limite. Se o valor for debitado e aprovado posteriormente, entre em contato com a loja apresentando o comprovante.
            </p>
            <button 
              onClick={onCancelar}
              className="w-full py-3 rounded-xl font-bold bg-zinc-700 hover:bg-zinc-600 text-white transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Se gerou PIX, mostra a UI do PIX customizada */}
        {!aguardandoCartao && !statusCartao && pixData && (
          <div>
            <h2 className="text-xl font-bold text-white text-center mb-2">Pague com PIX</h2>
            <p className="text-zinc-400 text-sm text-center mb-6">
              Escaneie o QR Code ou copie o código abaixo.
            </p>

            <div className="flex justify-center mb-6 p-4 bg-white rounded-xl mx-auto w-fit">
              <QRCodeSVG 
                value={pixData.qrCode} 
                size={200} 
                level="M"
                includeMargin={true}
              />
            </div>

            <div className="text-center mb-6">
              <p className="text-zinc-400 text-sm">Valor da compra</p>
              <p className="text-3xl font-bold text-green-500">
                R$ {Number(valorTotal || 0).toFixed(2).replace('.', ',')}
              </p>
            </div>

            <button 
              onClick={copiarPix}
              className="w-full mb-4 py-3 rounded-xl font-bold bg-zinc-800 text-white border border-zinc-700 transition-all cursor-pointer"
            >
              {copiado ? '✓ Código Copiado!' : '📄 Copiar PIX Copia e Cola'}
            </button>

            <button 
              onClick={verificarStatusPix}
              disabled={verificando}
              className="w-full mb-4 py-3 rounded-xl font-bold bg-brand-banana text-zinc-900 transition-all cursor-pointer hover:bg-yellow-400 disabled:opacity-50"
            >
              {verificando ? 'Verificando...' : 'Já Paguei (Verificar)'}
            </button>
          </div>
        )}

        {/* Brick do Mercado Pago (formulário de Cartão/Pix) */}
        {!aguardandoCartao && !statusCartao && !pixData && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Pagamento Seguro</h2>
              <button onClick={onCancelar} className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm">
                Cancelar
              </button>
            </div>
            {/* O Mercado Pago Payment Brick lida com todo o formulário de Cartão/Pix */}
            <Payment
              initialization={initialization}
              customization={customization}
              onSubmit={onSubmit}
              onError={onError}
            />
          </div>
        )}

      </div>
    </div>
  );
}