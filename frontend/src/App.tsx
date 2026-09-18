import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegistroPage from "./pages/RegistroPage";
import DashboardPage from "./pages/DashboardPage";
import AppLayout from "./components/layout/AppLayout";
import AgendaPage from "./pages/AgendaPage";
import ServicosPage from "./pages/ServicosPage";
import ProfissionaisPage from "./pages/ProfissionaisPage";
import ClientesPage from "./pages/ClientesPage";
import AgendamentoPublicoPage from "./pages/AgendamentoPublicoPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        {/* Página de cadastro */}
        <Route
          path="/registrar"
          element={<RegistroPage />}
        />

        {/* Página pública de agendamento */}
        <Route
          path="/agendar/:slug"
          element={<AgendamentoPublicoPage />}
        />

        {/* Área administrativa */}
        {token ? (
          <Route
            path="/*"
            element={
              <AppLayout>
                <Routes>
                  <Route
                    path="/"
                    element={<DashboardPage />}
                  />

                  <Route
                    path="/agenda"
                    element={<AgendaPage />}
                  />

                  <Route
                    path="/clientes"
                    element={<ClientesPage />}
                  />

                  <Route
                    path="/profissionais"
                    element={<ProfissionaisPage />}
                  />

                  <Route
                    path="/servicos"
                    element={<ServicosPage />}
                  />

                  <Route
                    path="/configuracoes"
                    element={<ConfiguracoesPage />}
                  />

                  <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                  />
                </Routes>
              </AppLayout>
            }
          />
        ) : (
          <Route
            path="/"
            element={<LoginPage />}
          />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;

