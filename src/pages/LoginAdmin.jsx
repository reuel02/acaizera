import { useState } from "react";

/**
 * ================================================
 * COMPONENTE: LoginAdmin
 * ================================================
 * Página de autenticação do painel administrativo
 * 
 * FUNCIONALIDADE:
 *  - Realiza login com email e senha
 *  - Valida credenciais contra variáveis de ambiente
 *  - Salva estado de autenticação em localStorage
 *  - Chama callback ao login bem-sucedido
 * 
 * SEGURANÇA:
 *  ✅ Credenciais em variáveis de ambiente (.env.local)
 *  ⚠️ localStorage não é seguro para produção
 *  💡 Em produção, usar JWT ou Supabase Auth
 * 
 * Props:
 *  - onLoginSuccess: () => void - Callback após autenticação
 * ================================================
 */

export default function LoginAdmin({ onLoginSuccess }) {
  // ===== ESTADOS DO FORMULÁRIO =====
  const [email, setEmail] = useState(""); // Email digitado pelo usuário
  const [senha, setSenha] = useState(""); // Senha digitada pelo usuário
  const [erro, setErro] = useState(""); // Mensagem de erro de autenticação
  const [carregando, setCarregando] = useState(false); // Flag para desabilitar inputs durante requisição

  /**
   * Função: handleLogin
   * Autentica o usuário contra credenciais salvas em variáveis de ambiente
   * 
   * FLUXO:
   * 1. Previne comportamento padrão do formulário
   * 2. Limpa erros anteriores
   * 3. Carrega credenciais de .env.local
   * 4. Compara email e senha do formulário
   * 5. Se válido: salva em localStorage e chama callback
   * 6. Se inválido: exibe mensagem de erro
   * 
   * 🔐 NOTAS SOBRE SEGURANÇA:
   *  - Credenciais são comparadas localmente (sem servidor)
   *  - localStorage não criptografa dados (não usar em produção)
   *  - Não há rate limiting (adicione em produção!)
   *  - Ideal: implementar com backend + JWT
   */
  const handleLogin = async (e) => {
    e.preventDefault(); // Previne reload da página
    setErro(""); // Limpa mensagens de erro anteriores
    setCarregando(true); // Desabilita inputs e muda texto do botão

    // ===== COMPARAÇÃO DE CREDENCIAIS =====
    // Carrega do arquivo .env.local (nunca versionado no Git)
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    const adminSenha = import.meta.env.VITE_ADMIN_SENHA;

    // Valida email e senha
    if (email === adminEmail && senha === adminSenha) {
      // ✅ AUTENTICAÇÃO BEM-SUCEDIDA
      // Salva flag no localStorage (apenas indicador, sem dados sensíveis)
      localStorage.setItem("adminAutenticado", "true");
      localStorage.setItem("adminEmail", email);
      
      // Chama função callback passada via props
      onLoginSuccess();
    } else {
      // ❌ FALHA NA AUTENTICAÇÃO
      // Exibe mensagem genérica (não revela qual campo está errado)
      setErro("Email ou senha incorretos");
    }

    setCarregando(false); // Reabilita inputs
  };

  // ===== RENDER DO COMPONENTE =====
  return (
    // Container principal com fundo gradiente dark
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-zinc-900 to-black p-4">
      {/* Card de login centralizado */}
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-8 shadow-2xl">
          
          {/* ===== SEÇÃO: CABEÇALHO ===== */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Acaizera</h1>
            <p className="text-purple-400 text-sm">Painel Administrativo</p>
          </div>

          {/* ===== SEÇÃO: FORMULÁRIO DE LOGIN ===== */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Exibe alerta de erro se houver falha na autenticação */}
            {erro && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {erro}
              </div>
            )}

            {/* INPUT: Email do Administrador */}
            <div>
              <label className="block text-zinc-300 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@dominio.com"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                disabled={carregando} // Desabilita durante autenticação
              />
            </div>

            {/* INPUT: Senha do Administrador */}
            <div>
              <label className="block text-zinc-300 text-sm font-medium mb-2">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                disabled={carregando} // Desabilita durante autenticação
              />
            </div>

            {/* BOTÃO: Submissão do Formulário */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 text-white font-bold rounded-lg transition-colors duration-200 cursor-pointer"
            >
              {carregando ? "Autenticando..." : "Entrar no Painel"}
            </button>
          </form>

          {/* ===== SEÇÃO: INSTRUÇÕES DE CONFIGURAÇÃO ===== */}
          <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-xs">
            <p className="font-semibold mb-1">🔐 Configure suas credenciais em .env.local:</p>
            <p className="break-words">VITE_ADMIN_EMAIL=seu_email@aqui.com</p>
            <p className="break-words">VITE_ADMIN_SENHA=sua_senha_forte_aqui</p>
            <p className="mt-2 text-blue-300">⚠️ NUNCA versione .env com credenciais reais!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
