import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaUsers,
  FaChartLine,
  FaChartBar,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";

/**
 * ================================================
 * LAYOUT: AdminLayout (Sidebar + Outlet)
 * ================================================
 *
 * Layout wrapper para todo o painel administrativo.
 * Renderiza uma Sidebar responsiva com links de navegação
 * e um <Outlet /> para as sub-páginas.
 *
 * PROPS:
 *  - onLogout: () => void - Callback para sair do painel
 *
 * ROTAS DA SIDEBAR:
 *  - /admin           → Pedidos (Kanban)
 *  - /admin/clientes  → CRM / Clientes
 *  - /admin/financeiro → Financeiro
 *  - /admin/metricas  → Métricas / Rankings
 * ================================================
 */

const menuItems = [
  { path: "/admin", label: "Pedidos", icon: FaClipboardList, end: true },
  { path: "/admin/clientes", label: "Clientes", icon: FaUsers },
  { path: "/admin/financeiro", label: "Financeiro", icon: FaChartLine },
  { path: "/admin/metricas", label: "Métricas", icon: FaChartBar },
];

export default function AdminLayout({ onLogout }) {
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* ===== OVERLAY MOBILE ===== */}
      {sidebarAberta && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-64 
          bg-zinc-900 border-r border-zinc-800 
          flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarAberta ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo / Título */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h1 className="text-xl font-bold text-white">Açaizera</h1>
            <p className="text-purple-400 text-xs font-semibold">Painel Admin</p>
          </div>
          {/* Botão fechar sidebar (mobile) */}
          <button
            onClick={() => setSidebarAberta(false)}
            className="lg:hidden text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <FaTimes className="size-5" />
          </button>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setSidebarAberta(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white border border-transparent"
                }`
              }
            >
              <item.icon className="size-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Botão Logout */}
        <div className="p-3 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer border border-transparent hover:border-red-500/30"
          >
            <FaSignOutAlt className="size-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* ===== CONTEÚDO PRINCIPAL ===== */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header Mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarAberta(true)}
            className="text-white p-2 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <FaBars className="size-5" />
          </button>
          <h1 className="text-white font-bold">Açaizera Admin</h1>
          <div className="w-9" /> {/* Spacer para centralizar título */}
        </header>

        {/* Área de Conteúdo (renderiza a sub-rota ativa) */}
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
