import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Pencil,
  MoreVertical,
  CircleSlash,
  CircleCheck,
} from "lucide-react";
import "./AgendaPage.css";
import api from "../services/api";

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
}

interface Servico {
  id: string;
  nome: string;
  duracaoMinutos: number;
  preco: number;
  ativo: boolean;
}

interface ProfissionalServico {
  id: string;
  nome: string;
  duracaoMinutos: number;
  preco: number;
  ativo: boolean;
}

interface Profissional {
  id: string;
  nome: string;
  ativo: boolean;
  servicos: ProfissionalServico[];
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

interface HorarioDisponivel {
  dataHoraInicio: string;
  dataHoraFim: string;
}

function AgendaPage() {
  const [dataSelecionada, setDataSelecionada] =
    useState(new Date());

  const [novoAgendamento, setNovoAgendamento] =
    useState(false);

  const [agendamentoEditandoId, setAgendamentoEditandoId] =
    useState<string | null>(null);

  const [menuAberto, setMenuAberto] =
    useState<string | null>(null);

  const [clientes, setClientes] =
    useState<Cliente[]>([]);

  const [servicos, setServicos] =
    useState<Servico[]>([]);

  const [profissionais, setProfissionais] =
    useState<Profissional[]>([]);

  const [agendamentos, setAgendamentos] =
    useState<Agendamento[]>([]);

  const [clienteId, setClienteId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [profissionalId, setProfissionalId] =
    useState("");

  const [horario, setHorario] = useState("");
  const [observacao, setObservacao] = useState("");

  const [horariosDisponiveis, setHorariosDisponiveis] =
    useState<HorarioDisponivel[]>([]);

  const [carregandoHorarios, setCarregandoHorarios] =
    useState(false);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    function atualizarAoVoltar() {
      if (
        document.visibilityState === "visible" &&
        !novoAgendamento &&
        !salvando
      ) {
        carregarDados();
      }
    }

    window.addEventListener(
      "focus",
      atualizarAoVoltar
    );

    document.addEventListener(
      "visibilitychange",
      atualizarAoVoltar
    );

    return () => {
      window.removeEventListener(
        "focus",
        atualizarAoVoltar
      );

      document.removeEventListener(
        "visibilitychange",
        atualizarAoVoltar
      );
    };
  }, [novoAgendamento, salvando]);

  useEffect(() => {
    if (
      novoAgendamento &&
      servicoId &&
      profissionalId
    ) {
      carregarHorariosDisponiveis();
    } else {
      setHorariosDisponiveis([]);
    }
  }, [
    novoAgendamento,
    servicoId,
    profissionalId,
    dataSelecionada,
    agendamentoEditandoId,
  ]);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [
        clientesResposta,
        servicosResposta,
        profissionaisResposta,
        agendamentosResposta,
      ] = await Promise.all([
        api.get<Cliente[]>("/Clientes"),
        api.get<Servico[]>("/Servicos"),
        api.get<Profissional[]>("/Profissionais"),
        api.get<Agendamento[]>("/Agendamentos"),
      ]);

      setClientes(clientesResposta.data);
      setServicos(servicosResposta.data);
      setProfissionais(
        profissionaisResposta.data
      );
      setAgendamentos(
        agendamentosResposta.data
      );
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível carregar os dados da agenda."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function carregarHorariosDisponiveis() {
    try {
      setCarregandoHorarios(true);
      setErro("");

      const data =
        formatarDataParaInput(
          dataSelecionada
        );

      const resposta =
        await api.get<HorarioDisponivel[]>(
          "/Agendamentos/disponibilidade",
          {
            params: {
              servicoId,
              profissionalId,
              data,
              agendamentoId:
                agendamentoEditandoId ||
                undefined,
            },
          }
        );

      setHorariosDisponiveis(
        resposta.data
      );

      if (
        agendamentoEditandoId &&
        horario &&
        !resposta.data.some(
          (x) =>
            formatarHorarioDisponivel(
              x.dataHoraInicio
            ) === horario
        )
      ) {
        const agendamentoAtual =
          agendamentos.find(
            (x) =>
              x.id ===
              agendamentoEditandoId
          );

        if (agendamentoAtual) {
          setHorariosDisponiveis(
            (horarios) => [
              {
                dataHoraInicio:
                  agendamentoAtual.dataHoraInicio,
                dataHoraFim:
                  agendamentoAtual.dataHoraFim,
              },
              ...horarios,
            ]
          );
        }
      }
    } catch (error: any) {
      setHorariosDisponiveis([]);

      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível carregar os horários disponíveis."
      );
    } finally {
      setCarregandoHorarios(false);
    }
  }

  const profissionaisDisponiveis =
    useMemo(() => {
      if (!servicoId) {
        return profissionais.filter(
          (profissional) =>
            profissional.ativo
        );
      }

      return profissionais.filter(
        (profissional) =>
          profissional.ativo &&
          profissional.servicos?.some(
            (servico) =>
              servico.id === servicoId &&
              servico.ativo
          )
      );
    }, [
      profissionais,
      servicoId,
    ]);

  function mudarDia(dias: number) {
    setDataSelecionada(
      (dataAtual) => {
        const novaData =
          new Date(dataAtual);

        novaData.setDate(
          novaData.getDate() + dias
        );

        return novaData;
      }
    );
  }

  function formatarDataParaInput(
    data: Date
  ) {
    const ano =
      data.getFullYear();

    const mes = String(
      data.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
      data.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function dataIgual(
    dataHora: string,
    data: Date
  ) {
    const dataAgendamento =
      new Date(dataHora);

    return (
      dataAgendamento.getFullYear() ===
        data.getFullYear() &&
      dataAgendamento.getMonth() ===
        data.getMonth() &&
      dataAgendamento.getDate() ===
        data.getDate()
    );
  }

  function formatarHorario(
    dataHora: string
  ) {
    return new Date(
      dataHora
    ).toLocaleTimeString(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function formatarHorarioDisponivel(
    dataHora: string
  ) {
    return new Date(
      dataHora
    ).toLocaleTimeString(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function formatarDataHora(
    data: Date,
    hora: string
  ) {
    const [
      horas,
      minutos,
    ] = hora.split(":");

    const ano =
      data.getFullYear();

    const mes =
      data.getMonth() + 1;

    const dia =
      data.getDate();

    const dataHora =
      new Date(
        ano,
        mes - 1,
        dia,
        Number(horas),
        Number(minutos),
        0,
        0
      );

    return dataHora;
  }

  function abrirNovoAgendamento() {
    setAgendamentoEditandoId(null);

    setClienteId("");
    setServicoId("");
    setProfissionalId("");
    setHorario("");
    setObservacao("");

    setHorariosDisponiveis([]);

    setErro("");
    setMenuAberto(null);

    setNovoAgendamento(true);
  }

  function abrirEdicaoAgendamento(
    agendamento: Agendamento
  ) {
    if (
      agendamento.status.toLowerCase() ===
      "cancelado"
    ) {
      return;
    }

    setMenuAberto(null);
    setErro("");

    setAgendamentoEditandoId(
      agendamento.id
    );

    setClienteId(
      agendamento.clienteId
    );

    setServicoId(
      agendamento.servicoId
    );

    setProfissionalId(
      agendamento.profissionalId
    );

    const dataAgendamento =
      new Date(
        agendamento.dataHoraInicio
      );

    setDataSelecionada(
      dataAgendamento
    );

    const horas = String(
      dataAgendamento.getHours()
    ).padStart(2, "0");

    const minutos = String(
      dataAgendamento.getMinutes()
    ).padStart(2, "0");

    setHorario(
      `${horas}:${minutos}`
    );

    setObservacao(
      agendamento.observacao || ""
    );

    setNovoAgendamento(true);
  }

  async function salvarAgendamento() {
    setErro("");

    if (!clienteId) {
      setErro(
        "Selecione o cliente."
      );
      return;
    }

    if (!servicoId) {
      setErro(
        "Selecione o serviço."
      );
      return;
    }

    if (!profissionalId) {
      setErro(
        "Selecione o profissional."
      );
      return;
    }

    if (!horario) {
      setErro(
        "Selecione o horário."
      );
      return;
    }

    try {
      setSalvando(true);

      const dataHoraInicio =
        formatarDataHora(
          dataSelecionada,
          horario
        );

      const dadosAgendamento = {
        clienteId,
        servicoId,
        profissionalId,
        dataHoraInicio:
          dataHoraInicio.toISOString(),
        observacao:
          observacao.trim() || null,
      };

      if (agendamentoEditandoId) {
        await api.put(
          `/Agendamentos/${agendamentoEditandoId}`,
          dadosAgendamento
        );
      } else {
        await api.post(
          "/Agendamentos",
          dadosAgendamento
        );
      }

      setNovoAgendamento(false);
      setAgendamentoEditandoId(null);
      setHorariosDisponiveis([]);

      await carregarDados();
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          (agendamentoEditandoId
            ? "Não foi possível atualizar o agendamento."
            : "Não foi possível salvar o agendamento.")
      );
    } finally {
      setSalvando(false);
    }
  }

  // =========================================================
  // CANCELAR + WHATSAPP
  // =========================================================

  async function cancelarAgendamento(
    agendamento: Agendamento
  ) {
    setMenuAberto(null);
    setErro("");

    try {
      await api.put(
        `/Agendamentos/${agendamento.id}/cancelar`
      );

      await carregarDados();

      const telefone =
        agendamento.clienteTelefone.replace(
          /\D/g,
          ""
        );

      if (!telefone) {
        setErro(
          "Agendamento cancelado, mas o cliente não possui telefone cadastrado."
        );
        return;
      }

      const data =
        new Date(
          agendamento.dataHoraInicio
        ).toLocaleDateString(
          "pt-BR",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }
        );

      const hora =
        new Date(
          agendamento.dataHoraInicio
        ).toLocaleTimeString(
          "pt-BR",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        );

      const mensagem =
        `Olá, ${agendamento.clienteNome}!\n\n` +
        `Informamos que seu agendamento foi cancelado.\n\n` +
        `Data: ${data}\n` +
        `Horário: ${hora}\n` +
        `Serviço: ${agendamento.servicoNome}\n` +
        `Profissional: ${agendamento.profissionalNome}\n\n` +
        `Se desejar, entre em contato conosco para realizar um novo agendamento.`;

      const url =
        `https://wa.me/55${telefone}?text=${encodeURIComponent(
          mensagem
        )}`;

      window.location.href = url;
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível cancelar o agendamento."
      );
    }
  }

  async function confirmarAgendamento(
    agendamento: Agendamento
  ) {
    setMenuAberto(null);
    setErro("");

    try {
      await api.put(
        `/Agendamentos/${agendamento.id}/confirmar`
      );

      await carregarDados();

      const telefone =
        agendamento.clienteTelefone.replace(
          /\D/g,
          ""
        );

      if (!telefone) {
        setErro(
          "Agendamento confirmado, mas o cliente não possui telefone cadastrado."
        );
        return;
      }

      const data =
        new Date(
          agendamento.dataHoraInicio
        ).toLocaleDateString(
          "pt-BR",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }
        );

      const hora =
        new Date(
          agendamento.dataHoraInicio
        ).toLocaleTimeString(
          "pt-BR",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        );

      const mensagem =
        `Olá, ${agendamento.clienteNome}!\n\n` +
        `Seu agendamento foi confirmado.\n\n` +
        `Data: ${data}\n` +
        `Horário: ${hora}\n` +
        `Serviço: ${agendamento.servicoNome}\n` +
        `Profissional: ${agendamento.profissionalNome}\n\n` +
        `Esperamos você!`;

      const url =
        `https://wa.me/55${telefone}?text=${encodeURIComponent(
          mensagem
        )}`;

      window.location.href = url;
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível confirmar o agendamento."
      );
    }
  }

  async function ativarAgendamento(
    agendamento: Agendamento
  ) {
    setMenuAberto(null);
    setErro("");

    try {
      await api.put(
        `/Agendamentos/${agendamento.id}/ativar`
      );

      await carregarDados();
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível reativar o agendamento."
      );
    }
  }

  function fecharFormulario() {
    if (salvando) {
      return;
    }

    setNovoAgendamento(false);
    setAgendamentoEditandoId(null);
    setHorariosDisponiveis([]);
    setErro("");
  }

  const agendamentosDoDia =
    useMemo(() => {
      return agendamentos
        .filter((agendamento) =>
          dataIgual(
            agendamento.dataHoraInicio,
            dataSelecionada
          )
        )
        .sort(
          (a, b) =>
            new Date(
              a.dataHoraInicio
            ).getTime() -
            new Date(
              b.dataHoraInicio
            ).getTime()
        );
    }, [
      agendamentos,
      dataSelecionada,
    ]);

  const diaSemana =
    dataSelecionada.toLocaleDateString(
      "pt-BR",
      {
        weekday: "long",
      }
    );

  const dataFormatada =
    dataSelecionada.toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "long",
      }
    );

  const hoje = new Date();

  const ehHoje =
    dataSelecionada.getFullYear() ===
      hoje.getFullYear() &&
    dataSelecionada.getMonth() ===
      hoje.getMonth() &&
    dataSelecionada.getDate() ===
      hoje.getDate();

  return (
    <div className="agenda-page">

      <header className="agenda-header">
        <div>
          <p className="font-tabular agenda-eyebrow">
            GESTÃO
          </p>

          <h1 className="font-display agenda-title">
            Agenda
          </h1>

          <p className="agenda-description">
            Gerencie os horários do seu dia.
          </p>
        </div>

        <button
          className="agenda-new-button"
          onClick={
            abrirNovoAgendamento
          }
        >
          <Plus />
          <span>
            Novo agendamento
          </span>
        </button>
      </header>

      {erro &&
        !novoAgendamento && (
          <p className="cliente-form-erro">
            {erro}
          </p>
        )}

      <section className="agenda-date-navigation">

        <button
          className="agenda-date-button"
          onClick={() =>
            mudarDia(-1)
          }
        >
          <ChevronLeft />
        </button>

        <div className="agenda-date">
          <p className="font-tabular">
            {diaSemana.toUpperCase()}
          </p>

          <strong className="font-display">
            {dataFormatada}
          </strong>
        </div>

        <button
          className="agenda-date-button"
          onClick={() =>
            mudarDia(1)
          }
        >
          <ChevronRight />
        </button>

      </section>

      <section className="agenda-day">

        <div className="agenda-day-header">
          <div>
            <p className="font-tabular agenda-card-label">
              {ehHoje
                ? "HOJE"
                : "DIA"}
            </p>

            <h2 className="font-display">
              Horários
            </h2>
          </div>

          <span className="agenda-count">
            {agendamentosDoDia.length}{" "}
            {agendamentosDoDia.length ===
            1
              ? "agendamento"
              : "agendamentos"}
          </span>
        </div>

        {carregando ? (
          <div className="agenda-empty">
            <p className="font-display agenda-empty-title">
              Carregando agenda...
            </p>
          </div>
        ) : agendamentosDoDia.length ===
          0 ? (
          <div className="agenda-empty">

            <p className="font-display agenda-empty-title">
              Nenhum agendamento
            </p>

            <p className="agenda-empty-description">
              Os horários agendados para este dia
              aparecerão aqui.
            </p>

          </div>
        ) : (
          <div className="agenda-lista">

            {agendamentosDoDia.map(
              (agendamento) => {

                const status =
                  agendamento.status.toLowerCase();

                const cancelado =
                  status === "cancelado";

                const pendente =
                  status === "pendente";

                return (
                  <article
                    key={
                      agendamento.id
                    }
                    className="agenda-item"
                  >

                    <div className="agenda-item-main">

                      <div className="agenda-item-top">

                        <span className="agenda-item-horario font-tabular">
                          {formatarHorario(
                            agendamento.dataHoraInicio
                          )}
                        </span>

                        <span
                          className={`agenda-status ${
                            cancelado
                              ? "inativo"
                              : pendente
                              ? "pendente"
                              : "ativo"
                          }`}
                        >
                          {agendamento.status.toUpperCase()}
                        </span>

                      </div>

                      <div className="agenda-item-info">

                        <h3 className="font-display">
                          {
                            agendamento.clienteNome
                          }
                          {" · "}
                          {
                            agendamento.servicoNome
                          }
                        </h3>

                        <p>
                          Profissional:{" "}
                          {
                            agendamento.profissionalNome
                          }
                        </p>

                      </div>

                    </div>

                    <div className="agenda-item-actions">

                      <button
                        className="agenda-edit-button"
                        type="button"
                        aria-label="Editar agendamento"
                        onClick={() =>
                          abrirEdicaoAgendamento(
                            agendamento
                          )
                        }
                        disabled={
                          cancelado
                        }
                      >
                        <Pencil />
                      </button>

                      <div className="agenda-more-wrapper">

                        <button
                          className="agenda-more-button"
                          type="button"
                          aria-label="Mais opções"
                          onClick={() =>
                            setMenuAberto(
                              menuAberto ===
                                agendamento.id
                                ? null
                                : agendamento.id
                            )
                          }
                        >
                          <MoreVertical />
                        </button>

                        {menuAberto ===
                          agendamento.id && (
                          <div className="agenda-actions-menu">

                            {pendente && (
                              <button
                                type="button"
                                className="ativar"
                                onClick={() =>
                                  confirmarAgendamento(
                                    agendamento
                                  )
                                }
                              >
                                <CircleCheck />
                                <span>
                                  Confirmar
                                </span>
                              </button>
                            )}

                            {!cancelado && (
                              <button
                                type="button"
                                className="cancelar"
                                onClick={() =>
                                  cancelarAgendamento(
                                    agendamento
                                  )
                                }
                              >
                                <CircleSlash />
                                <span>
                                  Cancelar
                                </span>
                              </button>
                            )}

                            {cancelado && (
                              <button
                                type="button"
                                className="ativar"
                                onClick={() =>
                                  ativarAgendamento(
                                    agendamento
                                  )
                                }
                              >
                                <CircleCheck />
                                <span>
                                  Reativar
                                </span>
                              </button>
                            )}

                          </div>
                        )}

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>

      {novoAgendamento && (
        <div className="agendamento-form">

          <div className="agendamento-form-header">

            <div>
              <p className="font-tabular agenda-eyebrow">
                AGENDA
              </p>

              <h2 className="font-display">
                {agendamentoEditandoId
                  ? "Editar agendamento"
                  : "Novo agendamento"}
              </h2>
            </div>

            <button
              className="agendamento-close-button"
              onClick={
                fecharFormulario
              }
              aria-label="Fechar"
              disabled={salvando}
            >
              <X />
            </button>

          </div>

          <div className="agendamento-form-fields">

            <div className="agendamento-field">
              <label htmlFor="cliente">
                Cliente
              </label>

              <select
                id="cliente"
                value={clienteId}
                onChange={(event) =>
                  setClienteId(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Selecione o cliente
                </option>

                {clientes
                  .filter(
                    (cliente) =>
                      cliente.ativo
                  )
                  .map(
                    (cliente) => (
                      <option
                        key={
                          cliente.id
                        }
                        value={
                          cliente.id
                        }
                      >
                        {cliente.nome}
                      </option>
                    )
                  )}
              </select>
            </div>

            <div className="agendamento-field">
              <label htmlFor="servico">
                Serviço
              </label>

              <select
                id="servico"
                value={servicoId}
                onChange={(event) => {
                  const novoServicoId =
                    event.target.value;

                  setServicoId(
                    novoServicoId
                  );

                  setHorario("");

                  if (
                    novoServicoId
                  ) {
                    const profissionalAtual =
                      profissionais.find(
                        (profissional) =>
                          profissional.id ===
                          profissionalId
                      );

                    const profissionalAtende =
                      profissionalAtual?.servicos?.some(
                        (servico) =>
                          servico.id ===
                            novoServicoId &&
                          servico.ativo
                      );

                    if (
                      !profissionalAtende
                    ) {
                      const novoProfissional =
                        profissionais.find(
                          (profissional) =>
                            profissional.ativo &&
                            profissional.servicos?.some(
                              (servico) =>
                                servico.id ===
                                  novoServicoId &&
                                servico.ativo
                            )
                        );

                      setProfissionalId(
                        novoProfissional?.id ||
                          ""
                      );
                    }
                  } else {
                    setProfissionalId("");
                  }
                }}
              >
                <option value="">
                  Selecione o serviço
                </option>

                {servicos
                  .filter(
                    (servico) =>
                      servico.ativo
                  )
                  .map(
                    (servico) => (
                      <option
                        key={
                          servico.id
                        }
                        value={
                          servico.id
                        }
                      >
                        {servico.nome}
                      </option>
                    )
                  )}
              </select>
            </div>

            <div className="agendamento-field">
              <label htmlFor="profissional">
                Profissional
              </label>

              <select
                id="profissional"
                value={
                  profissionalId
                }
                onChange={(event) => {
                  setProfissionalId(
                    event.target.value
                  );

                  setHorario("");
                }}
                disabled={
                  !servicoId
                }
              >
                <option value="">
                  {!servicoId
                    ? "Selecione primeiro o serviço"
                    : "Selecione o profissional"}
                </option>

                {profissionaisDisponiveis.map(
                  (profissional) => (
                    <option
                      key={
                        profissional.id
                      }
                      value={
                        profissional.id
                      }
                    >
                      {
                        profissional.nome
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="agendamento-field">
              <label htmlFor="data">
                Data Agendamento
              </label>

              <input
                id="data"
                type="date"
                value={formatarDataParaInput(
                  dataSelecionada
                )}
                onClick={(e) => {
                  e.currentTarget.showPicker();
                }}
                onKeyDown={(e) => {
                  e.preventDefault();
                }}
                onChange={(event) => {
                  setDataSelecionada(
                    new Date(
                      `${event.target.value}T12:00:00`
                    )
                  );

                  setHorario("");
                }}
              />
            </div>

            <div className="agendamento-field">
              <label htmlFor="horario">
                Horário
              </label>

              <select
                id="horario"
                value={horario}
                onChange={(event) =>
                  setHorario(
                    event.target.value
                  )
                }
                disabled={
                  carregandoHorarios ||
                  !profissionalId ||
                  !servicoId
                }
              >
                <option value="">
                  {carregandoHorarios
                    ? "Carregando horários..."
                    : "Selecione o horário"}
                </option>

                {horariosDisponiveis.map(
                  (
                    horarioDisponivel
                  ) => (
                    <option
                      key={
                        horarioDisponivel.dataHoraInicio
                      }
                      value={formatarHorarioDisponivel(
                        horarioDisponivel.dataHoraInicio
                      )}
                    >
                      {formatarHorarioDisponivel(
                        horarioDisponivel.dataHoraInicio
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            {erro && (
              <p className="cliente-form-erro">
                {erro}
              </p>
            )}

          </div>

          <div className="agendamento-form-actions">

            <button
              className="agendamento-cancel-button"
              onClick={
                fecharFormulario
              }
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              className="agendamento-save-button"
              onClick={
                salvarAgendamento
              }
              disabled={salvando}
            >
              {salvando
                ? "Salvando..."
                : agendamentoEditandoId
                ? "Salvar alterações"
                : "Salvar agendamento"}
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default AgendaPage;

