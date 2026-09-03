import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

// Inicializar Mercado Pago
initMercadoPago(import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY, { locale: 'pt-BR' });

/**
 * ================================================
 * COMPONENTE: Pagamento (Modal)
 * ================================================
 */

export function Pagamento({ valorTotal, emailCliente, onPagamentoFeito, onCancelar }) {
  const [pixData, setPixData] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [verificando, setVerificando] = useState(false);

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
    // Garantir que o e-mail do payer vá no formData
    if (!formData.payer) formData.payer = {};
    if (!formData.payer.email) formData.payer.email = emailCliente;

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

          if (data.status === 'approved') {
            resolve(); // Sucesso absoluto
            onPagamentoFeito(data.id);
          } else if (data.qrCode) {
            resolve(); // PIX gerado
            setPixData(data);
          } else if (data.status === 'in_process' || data.status === 'pending') {
            // Pagamento em análise antifraude
            resolve(); // Resolve pro Brick mostrar a tela dele de "Estamos analisando"
            alert("Seu pagamento entrou em análise (pendente). O pedido NÃO foi gerado. Se o valor for debitado e aprovado posteriormente, entre em contato com a loja apresentando o comprovante.");
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
        
        {/* Se gerou PIX, mostra a UI do PIX customizada, senão mostra o Brick */}
        {pixData ? (
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
        ) : (
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