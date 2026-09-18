import { useEffect, useState } from "react";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  CalendarDays,
  Users,
  UserRound,
  Scissors,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import "./AppLayout.css";
import api from "../../services/api";

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [nomeEmpresa, setNomeEmpresa] = useState("Minha empresa");

  useEffect(() => {
    async function carregarEmpresa() {
      try {
        const resposta = await api.get("/Auth/me");

        setNomeEmpresa(
          resposta.data.empresa.nomeNegocio
        );
      } catch {
        setNomeEmpresa("Minha empresa");
      }
    }

    carregarEmpresa();
  }, []);

  return (
    <div className="app-layout">
      {mobileOpen && (
        <div
          className="layout-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-logo">
          <span className="font-display">
            AgendaMarcada <span></span>
          </span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-group">
            <p className="sidebar-group-title">
              VISÃO GERAL
            </p>

            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <LayoutDashboard />
              <span>Dashboard</span>
            </NavLink>
          </div>

          <div className="sidebar-group">
            <p className="sidebar-group-title">
              GESTÃO
            </p>

            <NavLink
              to="/agenda"
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <CalendarDays />
              <span>Agenda</span>
            </NavLink>

            <NavLink
              to="/clientes"
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <Users />
              <span>Clientes</span>
            </NavLink>

            <NavLink
              to="/profissionais"
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <UserRound />
              <span>Profissionais</span>
            </NavLink>

            <NavLink
              to="/servicos"
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <Scissors />
              <span>Serviços</span>
            </NavLink>
          </div>

          <div className="sidebar-group">
            <p className="sidebar-group-title">
              SISTEMA
            </p>

            <NavLink
              to="/configuracoes"
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <Settings />
              <span>Configurações</span>
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <p>{nomeEmpresa}</p>
            <span>Administrador</span>
          </div>

          <button
            className="menu-item logout"
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
          >
            <LogOut />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="layout-main">
        <header className="layout-header">
          <button
            className="mobile-menu-button"
            onClick={() =>
              setMobileOpen((value) => !value)
            }
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </header>

        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;

