import { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaTimes } from "react-icons/fa";

/**
 * ================================================
 * COMPONENTE: Toast (Notificação)
 * ================================================
 *
 * Notificação flutuante reutilizável com auto-dismiss.
 *
 * PROPS:
 *  - mensagem: string - Texto da notificação
 *  - tipo: "sucesso" | "erro" - Define cor e ícone
 *  - visivel: boolean - Controla exibição
 *  - onFechar: () => void - Callback ao fechar/dismiss
 *  - duracao: number (default: 3000) - Tempo em ms antes de auto-dismiss
 * ================================================
 */

export default function Toast({ mensagem, tipo = "sucesso", visivel, onFechar, duracao = 3000 }) {
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    if (visivel) {
      setSaindo(false);
      const timer = setTimeout(() => {
        setSaindo(true);
        setTimeout(onFechar, 300); // Espera a animação de saída
      }, duracao);

      return () => clearTimeout(timer);
    }
  }, [visivel, duracao, onFechar]);

  if (!visivel && !saindo) return null;

  const cores = {
    sucesso: "bg-green-500/20 border-green-500/50 text-green-400",
    erro: "bg-red-500/20 border-red-500/50 text-red-400",
  };

  const icones = {
    sucesso: <FaCheckCircle className="size-5 flex-shrink-0" />,
    erro: <FaTimesCircle className="size-5 flex-shrink-0" />,
  };

  return (
    <div
      className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300
        ${cores[tipo]}
        ${saindo ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"}
      `}
      style={{ animation: !saindo ? "toast-in 0.3s ease-out" : undefined }}
    >
      {icones[tipo]}
      <span className="text-sm font-semibold">{mensagem}</span>
      <button
        onClick={() => {
          setSaindo(true);
          setTimeout(onFechar, 300);
        }}
        className="ml-2 hover:opacity-70 transition-opacity cursor-pointer"
      >
        <FaTimes className="size-3" />
      </button>
    </div>
  );
}
