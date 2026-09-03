import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import LoginAdmin from "./pages/LoginAdmin";
import AdminLayout from "./pages/AdminLayout";
import Admin from "./pages/Admin";
import AdminClientes from "./pages/AdminClientes";
import AdminFinanceiro from "./pages/AdminFinanceiro";
import AdminMetricas from "./pages/AdminMetricas";

/**
 * ================================================
 * COMPONENTE RAIZ: App
 * ================================================
 * 
 * Componente principal da aplicação que gerencia:
 * - Roteamento com react-router-dom (BrowserRouter)
 * - Estado de autenticação do admin
 * - Persistência de sessão em localStorage
 * 
 * ROTAS:
 *  /                → Home (catálogo de produtos)
 *  /login-admin     → Tela de login do admin
 *  /admin           → Painel (Pedidos / Kanban)
 *  /admin/clientes  → CRM / Clientes
 *  /admin/financeiro → Financeiro
 *  /admin/metricas  → Métricas / Rankings
 * 
 * SEGURANÇA:
 * ⚠️ Usar sessionStorage ao invés de localStorage
 * ⚠️ Implementar timeout de sessão
 * ⚠️ Adicionar refresh token em produção
 * ================================================
 */

function App() {
  // ===== ESTADOS DA APLICAÇÃO =====
  
  // Armazena se admin está autenticado
  // true = pode acessar painel, false = precisa fazer login
  const [adminAutenticado, setAdminAutenticado] = useState(() => {
    return localStorage.getItem("adminAutenticado") === "true";
  });

  /**
   * Função: handleLoginSuccess
   * 
   * Chamada após autenticação bem-sucedida no LoginAdmin
   * 
   * AÇÕES:
   * 1. Marca admin como autenticado
   * (Navegação é feita pelo componente LoginAdmin via useNavigate)
   */
  const handleLoginSuccess = () => {
    setAdminAutenticado(true);
  };

  /**
   * Função: handleLogout
   * 
   * Chamada ao clicar "Sair" no painel admin
   * 
   * AÇÕES:
   * 1. Remove autenticação do localStorage
   * 2. Limpa estado de autenticação
   * (Navegação é feita pelo AdminLayout via useNavigate)
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
  };

  /**
   * Componente de guard: ProtectedRoute
   * 
   * Protege rotas que exigem autenticação de admin.
   * Se não autenticado, redireciona para /login-admin.
   */
  const ProtectedRoute = ({ children }) => {
    if (!adminAutenticado) {
      return <Navigate to="/login-admin" replace />;
    }
    return children;
  };

  // ===== RENDER DO COMPONENTE =====
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== ROTA: HOME (Catálogo de Produtos) ===== */}
        <Route path="/" element={<Home />} />

        {/* ===== ROTA: LOGIN ADMIN (Autenticação) ===== */}
        <Route
          path="/login-admin"
          element={
            adminAutenticado ? (
              <Navigate to="/admin" replace />
            ) : (
              <LoginAdmin onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* ===== ROTAS: ADMIN (Painel de Controle) ===== */}
        {/* Protegidas por ProtectedRoute — exigem autenticação */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          {/* Sub-rotas renderizadas dentro do <Outlet /> do AdminLayout */}
          <Route index element={<Admin />} />
          <Route path="clientes" element={<AdminClientes />} />
          <Route path="financeiro" element={<AdminFinanceiro />} />
          <Route path="metricas" element={<AdminMetricas />} />
        </Route>

        {/* Qualquer rota desconhecida → Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
