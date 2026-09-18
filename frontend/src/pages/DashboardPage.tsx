import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Users,
  Copy,
  Check,
} from "lucide-react";
import "./DashboardPage.css";
import api from "../services/api";

interface Empresa {
  id: string;
  nomeNegocio: string;
  slug: string;
  logoUrl: string | null;
  descricao: string | null;
}

interface AuthMeResponse {
  usuario: {
    id: string;
    nome: string;
    email: string;
    perfil: string;
  };
  empresa: Empresa;
}

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
}

interface Agendamento {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  servicoId: string;
  servicoNome: string;
  servicoDuracaoMinutos: number;
  servicoPreco: number;
  profissionalId: string;
  profissionalNome: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  status: string;
  observacao: string | null;
}

function DashboardPage() {
  const [empresa, setEmpresa] =
    useState<Empresa | null>(null);

  const [clientes, setClientes] =
    useState<Cliente[]>([]);

  const [agendamentos, setAgendamentos] =
    useState<Agendamento[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  const [linkCopiado, setLinkCopiado] =
    useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [
        empresaResposta,
        clientesResposta,
        agendamentosResposta,
      ] = await Promise.all([
        api.get<AuthMeResponse>("/Auth/me"),
        api.get<Cliente[]>("/Clientes"),
        api.get<Agendamento[]>("/Agendamentos"),
      ]);

      setEmpresa(
        empresaResposta.data.empresa
      );

      setClientes(
        clientesResposta.data
      );

      setAgendamentos(
        agendamentosResposta.data
      );
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível carregar o dashboard."
      );
    } finally {
      setCarregando(false);
    }
  }

  const hoje = new Date();

  const agendamentosHoje = useMemo(() => {
    return agendamentos.filter(
      (agendamento) => {
        const data =
          new Date(
            agendamento.dataHoraInicio
          );

        return (
          data.getFullYear() ===
            hoje.getFullYear() &&
          data.getMonth() ===
            hoje.getMonth() &&
          data.getDate() ===
            hoje.getDate() &&
          agendamento.status.toLowerCase() !==
            "cancelado"
        );
      }
    );
  }, [agendamentos]);

  const agendamentosConfirmados =
    useMemo(() => {
      const agora = new Date();

      return agendamentos.filter(
        (agendamento) => {
          const data =
            new Date(
              agendamento.dataHoraInicio
            );

          return (
            data >= agora &&
            agendamento.status.toLowerCase() ===
              "confirmado"
          );
        }
      );
    }, [agendamentos]);

  const agendamentosPendentes =
    useMemo(() => {
      const agora = new Date();

      return agendamentos.filter(
        (agendamento) => {
          const data =
            new Date(
              agendamento.dataHoraInicio
            );

          return (
            data >= agora &&
            agendamento.status.toLowerCase() ===
              "pendente"
          );
        }
      );
    }, [agendamentos]);

  const proximosAgendamentos = useMemo(() => {
    const agora = new Date();

    return agendamentos
      .filter((agendamento) => {
        const data =
          new Date(
            agendamento.dataHoraInicio
          );

        return (
          data >= agora &&
          agendamento.status.toLowerCase() !==
            "cancelado"
        );
      })
      .sort(
        (a, b) =>
          new Date(
            a.dataHoraInicio
          ).getTime() -
          new Date(
            b.dataHoraInicio
          ).getTime()
      );
  }, [agendamentos]);

  const linkAgendamento =
    empresa
      ? `${window.location.origin}/agendar/${empresa.slug}`
      : "";

  async function copiarLink() {
    if (!linkAgendamento) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        linkAgendamento
      );

      setLinkCopiado(true);

      setTimeout(() => {
        setLinkCopiado(false);
      }, 2000);
    } catch {
      setErro(
        "Não foi possível copiar o link."
      );
    }
  }

  function formatarHorario(
    dataHora: string
  ) {
    return new Date(
      dataHora
    ).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatarData(
    dataHora: string
  ) {
    return new Date(
      dataHora
    ).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  return (
    <div className="dashboard-page">

      {/* CABEÇALHO */}

      <header className="dashboard-header">
        <p className="font-tabular dashboard-eyebrow">
          VISÃO GERAL
        </p>

        <h1 className="font-display dashboard-title">
          Dashboard
        </h1>

        <p className="dashboard-description">
          Resumo da sua agenda.
        </p>
      </header>

      {erro && (
        <p className="dashboard-error">
          {erro}
        </p>
      )}

      {/* LINK DE AGENDAMENTO */}

      {empresa && (
        <section className="dashboard-link-card">
          <div>
            <p className="font-tabular dashboard-card-label">
              LINK DE AGENDAMENTO
            </p>

            <p className="dashboard-link">
              {linkAgendamento}
            </p>

            <p className="dashboard-card-description">
              Envie este link para seus clientes
              fazerem o próprio agendamento.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-copy-button"
            onClick={copiarLink}
          >
            {linkCopiado ? (
              <>
                <Check />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy />
                <span>Copiar link</span>
              </>
            )}
          </button>
        </section>
      )}

      {/* DESTAQUE DO DIA */}

      <section className="dashboard-highlight">
        <div className="dashboard-highlight-content">
          <div>
            <p className="font-tabular dashboard-card-label">
              AGENDAMENTOS DE HOJE
            </p>

            <strong className="font-display dashboard-highlight-value">
              {carregando
                ? "—"
                : agendamentosHoje.length}
            </strong>

            <p className="dashboard-card-description">
              {carregando
                ? "Carregando..."
                : agendamentosHoje.length ===
                  0
                ? "Nenhum agendamento para hoje."
                : agendamentosHoje.length ===
                  1
                ? "1 agendamento para hoje."
                : `${agendamentosHoje.length} agendamentos para hoje.`}
            </p>
          </div>

          <CalendarDays
            className="dashboard-highlight-icon"
            strokeWidth={1.5}
          />
        </div>
      </section>

      {/* INDICADORES */}

      <section className="dashboard-grid">

        {/* AGENDADOS */}

        <div className="dashboard-stat">
          <CalendarDays
            className="dashboard-stat-icon"
            strokeWidth={1.75}
          />

          <p className="font-display dashboard-stat-value">
            {carregando
              ? "—"
              : agendamentosConfirmados.length}
          </p>

          <p className="dashboard-stat-description">
            Agendados
          </p>
        </div>

        {/* PENDENTES */}

        <div className="dashboard-stat">
          <Clock
            className="dashboard-stat-icon"
            strokeWidth={1.75}
          />

          <p className="font-display dashboard-stat-value">
            {carregando
              ? "—"
              : agendamentosPendentes.length}
          </p>

          <p className="dashboard-stat-description">
            Pendentes
          </p>
        </div>

        {/* CLIENTES */}

        <div className="dashboard-stat">
          <Users
            className="dashboard-stat-icon"
            strokeWidth={1.75}
          />

          <p className="font-display dashboard-stat-value">
            {carregando
              ? "—"
              : clientes.filter(
                  (cliente) =>
                    cliente.ativo
                ).length}
          </p>

          <p className="dashboard-stat-description">
            Clientes cadastrados
          </p>
        </div>

      </section>

      {/* PRÓXIMOS HORÁRIOS */}

      <section className="dashboard-section">

        <div className="dashboard-section-header">
          <div>
            <p className="font-tabular dashboard-eyebrow">
              AGENDA
            </p>

            <h2 className="font-display dashboard-section-title">
              Próximos horários
            </h2>
          </div>
        </div>

        {carregando ? (
          <div className="dashboard-empty">
            <p className="font-display dashboard-empty-title">
              Carregando agenda...
            </p>
          </div>
        ) : proximosAgendamentos.length ===
          0 ? (
          <div className="dashboard-empty">

            <CalendarDays
              className="dashboard-empty-icon"
              strokeWidth={1.5}
            />

            <p className="dashboard-empty-title">
              Sua agenda está vazia
            </p>

            <p className="dashboard-empty-description">
              Quando houver agendamentos,
              eles aparecerão aqui.
            </p>

          </div>
        ) : (
          <div className="dashboard-next-list">

            {proximosAgendamentos
              .slice(0, 5)
              .map((agendamento) => (
                <article
                  key={agendamento.id}
                  className="dashboard-next-item"
                >
                  <div className="dashboard-next-time">
                    <span className="font-display">
                      {formatarHorario(
                        agendamento.dataHoraInicio
                      )}
                    </span>

                    <small>
                      {formatarData(
                        agendamento.dataHoraInicio
                      )}
                    </small>
                  </div>

                  <div className="dashboard-next-info">
                    <h3 className="font-display">
                      {agendamento.clienteNome}
                    </h3>

                    <p>
                      {agendamento.servicoNome}
                      {" · "}
                      {agendamento.profissionalNome}
                    </p>

                    <span
                      className={`dashboard-next-status ${
                        agendamento.status.toLowerCase() ===
                        "pendente"
                          ? "pendente"
                          : "confirmado"
                      }`}
                    >
                      {agendamento.status.toUpperCase()}
                    </span>
                  </div>
                </article>
              ))}

          </div>
        )}

      </section>

    </div>
  );
}

export default DashboardPage;
