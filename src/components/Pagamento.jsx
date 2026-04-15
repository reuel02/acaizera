import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { gerarPayloadPix } from '../services/gerarPix';

/**
 * ================================================
 * COMPONENTE: Pagamento (Modal)
 * ================================================
 * 
 * Modal para exibir QR Code de PIX e confirmar pagamento
 * 
 * FUNCIONALIDADE:
 *  - Gera QR Code PIX baseado no valor total
 *  - Exibe código visual (QR Code SVG)
 *  - Funcionalidade "Copiar Copia e Cola" com feedback visual
 *  - Botão para confirmar pagamento recebido
 *  - Botão para cancelar operação
 * 
 * PROPS:
 *  - valorTotal: number - Valor total em reais para o PIX
 *  - onPagamentoFeito: () => void - Callback ao confirmar pagamento (enviar pedido)
 *  - onCancelar: () => void - Callback ao cancelar (voltar no carrinho)
 * 
 * ESTADOS:
 *  - codigoPix: string - Código PIX completo (payload)
 *  - copiado: boolean - Flag visual para feedback de cópia
 * 
 * DADOS HARDCODED (⚠️ MELHORAR):
 *  - Chave PIX, Nome, Cidade estão hardcoded
 *  - TODO: Mover para variáveis de ambiente (.env)
 *  - TODO: Implementar validação de dados antes de gerar QR
 * 
 * SEGURANÇA:
 *  - ⚠️ Chave PIX exposta no frontend (transferir para backend)
 *  - 🔐 Future: Implementar geração de QR no servidor
 * ================================================
 */

export function Pagamento({ valorTotal, onPagamentoFeito, onCancelar }) {
  // Estado para armazenar o código PIX gerado
  const [codigoPix, setCodigoPix] = useState('');
  
  // Flag para mostrar feedback de "Copiado!" temporariamente
  const [copiado, setCopiado] = useState(false);

  /**
   * useEffect: Gera QR Code PIX quando componente monta ou valorTotal muda
   * WARNING: Dados estão hardcoded. Considere mover para env vars
   */
  useEffect(() => {
    // IMPORTANTE: Coloque os dados reais da conta do seu amigo aqui (sem acentos)
    const chave = "54614797822"; 
    const nome = "Reuel dos Santos Ferreia Andrade"; 
    const cidade = "Santos"; 

    // Gera payload PIX com os dados e valor
    const payload = gerarPayloadPix(chave, nome, cidade, valorTotal);
    setCodigoPix(payload);
  }, [valorTotal]);

  /**
   * Copia o código PIX para clipboard e mostra feedback visual
   * Após 3 segundos, volta ao estado normal
   */
  const copiarPix = () => {
    // Copia o código para a área de transferência
    navigator.clipboard.writeText(codigoPix);
    
    // Mostra visual de sucesso
    setCopiado(true);
    
    // Remove visual após 3 segundos
    setTimeout(() => setCopiado(false), 3000);
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
          {/* QRCodeSVG só renderiza se houver payload válido (string não vazia) */}
          {typeof codigoPix === 'string' && codigoPix.length > 0 && (
            <QRCodeSVG 
              value={codigoPix} 
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
          
          {/* Botão Confirmar: marca pedido como pago e finaliza compra */}
          <button 
            onClick={onPagamentoFeito}
            className="w-2/3 py-3 rounded-xl font-bold bg-purple-600 text-white"
          >
            Já Paguei → Enviar
          </button>
        </div>
      </div>
    </div>
  );
}