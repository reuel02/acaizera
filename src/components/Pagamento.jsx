import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { criarPagamentoPIX, verificarStatusPagamento } from '../services/mercadoPago';

/**
 * ================================================
 * COMPONENTE: Pagamento (Modal)
 * ================================================
 * 
 * Modal para exibir QR Code de PIX via Mercado Pago e confirmar pagamento
 * 
 * FUNCIONALIDADE:
 *  - Cria pagamento PIX via Mercado Pago
 *  - Exibe código visual (QR Code SVG)
 *  - Funcionalidade "Copiar Copia e Cola" com feedback visual
 *  - Verifica status do pagamento antes de confirmar
 *  - Botão para cancelar operação
 * 
 * PROPS:
 *  - valorTotal: number - Valor total em reais para o PIX
 *  - emailCliente: string - Email do cliente
 *  - onPagamentoFeito: (paymentId) => void - Callback ao confirmar pagamento (recebe payment_id)
 *  - onCancelar: () => void - Callback ao cancelar (voltar no carrinho)
 * 
 * ESTADOS:
 *  - dadosPagamento: object - Dados do pagamento PIX do Mercado Pago
 *  - copiado: boolean - Flag visual para feedback de cópia
 *  - statusPagamento: string - Status atual do pagamento
 *  - verificado: boolean - Se já tentou verificar o pagamento
 * 
 * DEPENDÊNCIAS:
 *  - Mercado Pago SDK configurado com ACCESS_TOKEN
 *  - Webhook configurado no Mercado Pago (opcional para notificações automáticas)
 * ================================================
 */

export function Pagamento({ valorTotal, emailCliente, onPagamentoFeito, onCancelar }) {
  // Estado para armazenar os dados do pagamento PIX
  const [dadosPagamento, setDadosPagamento] = useState(null);
  
  // Flag para mostrar feedback de cópia
  const [copiado, setCopiado] = useState(false);

  // Estado para verificar status do pagamento
  const [verificado, setVerificado] = useState(false);

  /**
   * useEffect: Cria pagamento PIX quando componente monta ou valorTotal muda
   */
  useEffect(() => {
    const criarPagamento = async () => {
      try {
        const dados = await criarPagamentoPIX(valorTotal, 'Pedido de Açaí', emailCliente);
        setDadosPagamento(dados);
      } catch (error) {
        console.error('Erro ao criar pagamento PIX:', error);
        alert('Erro ao gerar QR Code PIX. Tente novamente.');
      }
    };

    if (valorTotal > 0) {
      criarPagamento();
    }
  }, [valorTotal, emailCliente]);

  /**
   * Copia o código PIX para clipboard e mostra feedback visual
   */
  const copiarPix = () => {
    if (!dadosPagamento?.copiaCola) return;
    
    navigator.clipboard.writeText(dadosPagamento.copiaCola);
    
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  /**
   * Verifica o status do pagamento no Mercado Pago
   */
  const verificarPagamento = async () => {
    if (!dadosPagamento?.id) return;

    try {
      console.log(`🔍 Verificando pagamento: ${dadosPagamento.id}`);
      const status = await verificarStatusPagamento(dadosPagamento.id);
      console.log(`✅ Status retornado: ${status}`);
      setVerificado(true);

      if (status === 'approved') {
        // Pagamento confirmado, passa o payment_id para o callback
        onPagamentoFeito(dadosPagamento.id);
      } else {
        alert('Pagamento ainda não foi confirmado. Aguarde alguns instantes e tente novamente.');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar pagamento:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        status: error.status,
        cause: error.cause,
      });
      alert(`Erro ao verificar pagamento: ${error.message}`);
    }
  };

  return (
    // Overlay preto + Modal centralizado
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      
      {/* Container do modal com borda roxa (brand) */}
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-6 shadow-2xl border border-purple-500/30">
        
        {/* ===== SEÇÃO: TÍTULO ===== */}
        <h2 className="text-xl font-bold text-white text-center mb-2">Finalizar Pagamento</h2>
        <p className="text-zinc-400 text-sm text-center mb-6">
          Escaneie o QR Code ou copie o código abaixo.
        </p>

        {/* ===== SEÇÃO: QR CODE ===== */}
        {/* Container branco para destacar o QR Code */}
        <div className="flex justify-center mb-6 p-4 bg-white rounded-xl mx-auto w-fit">
          {/* QRCodeSVG só renderiza se houver dados de pagamento válidos */}
          {dadosPagamento?.qrCode && (
            <QRCodeSVG 
              value={dadosPagamento.qrCode} 
              size={200} 
              level="M"
              includeMargin={true}
            />
          )}
        </div>

        {/* ===== SEÇÃO: VALOR TOTAL ===== */}
        <div className="text-center mb-6">
          <p className="text-zinc-400 text-sm">Valor da compra</p>
          {/* Formata valor: substitui . por , para padrão brasileiro */}
          <p className="text-3xl font-bold text-green-500">
            R$ {Number(valorTotal || 0).toFixed(2).replace('.', ',')}
          </p>
        </div>

        {/* ===== SEÇÃO: BOTÃO COPIAR ===== */}
        {/* Button com feedback visual (muda de texto quando copiado) */}
        <button 
          onClick={copiarPix}
          className="w-full mb-4 py-3 rounded-xl font-bold bg-zinc-800 text-white border border-zinc-700 transition-all"
        >
          {/* Mostra checkmark quando copiado, caso contrário mostra ícone de documento */}
          {copiado ? '✓ Código Copiado!' : '📄 Copiar PIX Copia e Cola'}
        </button>

        {/* ===== SEÇÃO: BOTÕES FINAIS ===== */}
        <div className="flex gap-2">
          {/* Botão Voltar: cancela operação e volta ao carrinho */}
          <button 
            onClick={onCancelar}
            className="w-1/3 py-3 rounded-xl font-bold bg-zinc-800 text-zinc-300"
          >
            Voltar
          </button>
          
          {/* Botão Confirmar: verifica status do pagamento antes de enviar */}
          <button 
            onClick={verificarPagamento}
            disabled={!dadosPagamento}
            className="w-2/3 py-3 rounded-xl font-bold bg-purple-600 text-white disabled:bg-gray-600"
          >
            {verificado ? 'Verificando...' : 'Já Paguei → Verificar'}
          </button>
        </div>
      </div>
    </div>
  );
}