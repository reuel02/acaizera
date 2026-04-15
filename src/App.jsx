import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import LoginAdmin from "./pages/LoginAdmin";

/**
 * ================================================
 * COMPONENTE RAIZ: App
 * ================================================
 * 
 * Componente principal da aplicação que gerencia:
 * - Roteamento entre páginas (Home, LoginAdmin, Admin)
 * - Estado de autenticação do admin
 * - Persistência de sessão em localStorage
 * 
 * FLUXO:
 * 1. Home (página de vendas) → Acesso a admin
 * 2. LoginAdmin (autenticação) → Validação
 * 3. Admin (painel de controle) → Gerenciar pedidos
 * 
 * SEGURANÇA:
 * ⚠️ Usar sessionStorage ao invés de localStorage
 * ⚠️ Implementar timeout de sessão
 * ⚠️ Adicionar refresh token em produção
 * ================================================
 */

function App() {
  // ===== ESTADOS DA APLICAÇÃO =====
  
  // Controla qual página está sendo exibida
  // Valores: "home", "login-admin", "admin"
  const [paginaAtual, setPaginaAtual] = useState("home");
  
  // Armazena se admin está autenticado
  // true = pode acessar painel, false = precisa fazer login
  const [adminAutenticado, setAdminAutenticado] = useState(false);

  /**
   * useEffect: Verificar autenticação ao carregar
   * 
   * FUNCIONALIDADE:
   *  - Executa uma única vez ao montar o componente
   *  - Verifica se há sessão salva em localStorage
   *  - Se existe: restaura estado autenticado
   *  - Se não existe: mantém na página inicial
   * 
   * 🔍 DEBUGAR:
   *  console.log("Admin autenticado ao carregar?", autenticado);
   * 
   * 🔐 MELHORIAS:
   *  - Usar sessionStorage (apaga ao fechar aba)
   *  - Implementar verificação de expiração
   *  - Validar token JWT (se implementar em produção)
   */
  useEffect(() => {
    // Verifica se localStorage tem flag de autenticação
    const autenticado = localStorage.getItem("adminAutenticado") === "true";
    
    // Atualiza estado com valor salvo
    setAdminAutenticado(autenticado);
    
    // Se estava autenticado, vai direto pro admin
    // (Apenas para UX, segurança deve vir do backend)
    if (autenticado) {
      setPaginaAtual("admin");
    }
  }, []); // Array vazio = executa apenas na montagem

  /**
   * Função: handleLoginSuccess
   * 
   * Chamada após autenticação bem-sucedida no LoginAdmin
   * 
   * AÇÕES:
   * 1. Move para página do painel admin
   * 2. Marca admin como autenticado
   */
  const handleLoginSuccess = () => {
    setAdminAutenticado(true);
    setPaginaAtual("admin");
  };

  /**
   * Função: handleLogout
   * 
   * Chamada ao clicar "Sair" no painel admin
   * 
   * AÇÕES:
   * 1. Remove autenticação do localStorage
   * 2. Volta para página inicial
   * 3. Limpa estado de autenticação
   * 
   * 🔐 SEGURANÇA:
   *  - Certifique-se que dados sensíveis foram removidos
   *  - Ideal: chamar endpoint de logout no backend
   */
  const handleLogout = () => {
    // Remove todas as flags de autenticação
    localStorage.removeItem("adminAutenticado");
    localStorage.removeItem("adminEmail");
    
    // Volta ao estado não autenticado
    setAdminAutenticado(false);
    setPaginaAtual("home");
  };

  /**
   * Função: irParaAdmin
   * 
   * Gerencia acesso ao painel admin
   * 
   * LÓGICA:
   * - Se NÃO autenticado: vai para tela de login
   * - Se JÁ autenticado: vai direto para painel
   * 
   * CHAMADA POR:
   * - Clique no botão de engrenagem ⚙️ na header
   */
  const irParaAdmin = () => {
    if (!adminAutenticado) {
      // Não está autenticado: mostra tela de login
      setPaginaAtual("login-admin");
    } else {
      // Já está autenticado: vai direto para admin
      setPaginaAtual("admin");
    }
  };

  // ===== RENDER DO COMPONENTE =====
  // Renderiza condicional baseado em paginaAtual
  return (
    <div>
      {/* ===== PÁGINA: HOME (Catálogo de Produtos) ===== */}
      {paginaAtual === "home" && (
        <Home 
          acessarAdmin={irParaAdmin} // Passa função para abreir painel
        />
      )}

      {/* ===== PÁGINA: LOGIN ADMIN (Autenticação) ===== */}
      {paginaAtual === "login-admin" && (
        <LoginAdmin 
          onLoginSuccess={handleLoginSuccess} // Callback após login
        />
      )}

      {/* ===== PÁGINA: ADMIN (Painel de Controle) ===== */}
      {/* Renderiza apenas se:
          1. paginaAtual === "admin" E
          2. adminAutenticado === true
          
          Isso previne acesso direto ao painel sem autenticação
          */}
      {paginaAtual === "admin" && adminAutenticado && (
        <Admin 
          onLogout={handleLogout} // Callback para logout
        />
      )}
    </div>
  );
}

export default App;
