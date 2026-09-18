import { useEffect, useState, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import "./AgendamentoPublicoPage.css";

interface Empresa {
  id: string;
  nomeNegocio: string;
  slug: string;
  logoUrl: string | null;
  descricao: string | null;
}

interface Servico {
  id: string;
  nome: string;
  duracaoMinutos: number;
  preco: number;
}

interface Profissional {
  id: string;
  nome: string;
}

interface HorarioDisponivel {
  dataHoraInicio: string;
  dataHoraFim: string;
}

function AgendamentoPublicoPage() {
  const { slug } = useParams<{ slug: string }>();

  const [empresa, setEmpresa] =
    useState<Empresa | null>(null);

  const [servicos, setServicos] =
    useState<Servico[]>([]);

  const [profissionais, setProfissionais] =
    useState<Profissional[]>([]);

  const [servicoSelecionado, setServicoSelecionado] =
    useState<Servico | null>(null);

  const [profissionalSelecionado, setProfissionalSelecionado] =
    useState<Profissional | null>(null);

  const [dataSelecionada, setDataSelecionada] =
    useState("");

  const [horariosDisponiveis, setHorariosDisponiveis] =
    useState<HorarioDisponivel[]>([]);

  const [horarioSelecionado, setHorarioSelecionado] =
    useState<HorarioDisponivel | null>(null);

  const [nomeCliente, setNomeCliente] =
    useState("");

  const [telefoneCliente, setTelefoneCliente] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [carregandoProfissionais, setCarregandoProfissionais] =
    useState(false);

  const [carregandoHorarios, setCarregandoHorarios] =
    useState(false);

  const [confirmandoAgendamento, setConfirmandoAgendamento] =
    useState(false);

  const [agendamentoConfirmado, setAgendamentoConfirmado] =
    useState(false);

  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        const respostaEmpresa = await api.get(
          `/Empresas/publica/${slug}`
        );

        setEmpresa(respostaEmpresa.data);

        const respostaServicos = await api.get(
          `/Servicos/publicos/${slug}`
        );

        setServicos(respostaServicos.data);
      } catch {
        setErro(
          "Não foi possível carregar os dados da empresa."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [slug]);

  async function selecionarServico(servico: Servico) {
    setServicoSelecionado(servico);
    setProfissionalSelecionado(null);
    setProfissionais([]);
    setDataSelecionada("");
    setHorariosDisponiveis([]);
    setHorarioSelecionado(null);
    setNomeCliente("");
    setTelefoneCliente("");
    setAgendamentoConfirmado(false);
    setErro("");

    try {
      setCarregandoProfissionais(true);

      const resposta = await api.get(
        `/Profissionais/publicos/${slug}/${servico.id}`
      );

      setProfissionais(resposta.data);
    } catch {
      setErro(
        "Não foi possível carregar os profissionais."
      );
    } finally {
      setCarregandoProfissionais(false);
    }
  }

  function selecionarProfissional(
    profissional: Profissional
  ) {
    setProfissionalSelecionado(profissional);
    setDataSelecionada("");
    setHorariosDisponiveis([]);
    setHorarioSelecionado(null);
    setNomeCliente("");
    setTelefoneCliente("");
    setAgendamentoConfirmado(false);
    setErro("");
  }

  async function selecionarData(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const data = event.target.value;

    const hoje = new Date();

    const hojeLocal =
      `${hoje.getFullYear()}-${String(
        hoje.getMonth() + 1
      ).padStart(2, "0")}-${String(
        hoje.getDate()
      ).padStart(2, "0")}`;

    // Impede data anterior a hoje,
    // inclusive quando digitada manualmente.
    if (data && data < hojeLocal) {
      setDataSelecionada("");
      setHorariosDisponiveis([]);
      setHorarioSelecionado(null);
      setErro(
        "Escolha uma data a partir de hoje."
      );
      return;
    }

    setDataSelecionada(data);
    setHorariosDisponiveis([]);
    setHorarioSelecionado(null);
    setAgendamentoConfirmado(false);
    setErro("");

    if (
      !data ||
      !servicoSelecionado ||
      !profissionalSelecionado
    ) {
      return;
    }

    try {
      setCarregandoHorarios(true);

      const resposta = await api.get(
        `/Agendamentos/disponibilidade-publica/${slug}`,
        {
          params: {
            servicoId: servicoSelecionado.id,
            profissionalId:
              profissionalSelecionado.id,
            data,
          },
        }
      );

      setHorariosDisponiveis(resposta.data);
    } catch {
      setErro(
        "Não foi possível carregar os horários disponíveis."
      );
    } finally {
      setCarregandoHorarios(false);
    }
  }

  function selecionarHorario(
    horario: HorarioDisponivel
  ) {
    setHorarioSelecionado(horario);
    setAgendamentoConfirmado(false);
    setErro("");
  }

  function formatarHorario(dataHora: string) {
    return new Date(dataHora).toLocaleTimeString(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function formatarData(dataHora: string) {
  return new Date(dataHora).toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

  function formatarTelefone(valor: string) {
    const numeros = valor
      .replace(/\D/g, "")
      .slice(0, 11);

    if (numeros.length <= 2) {
      return numeros;
    }

    if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(
      2,
      7
    )}-${numeros.slice(7)}`;
  }

  async function confirmarAgendamento() {
    if (
      !slug ||
      !servicoSelecionado ||
      !profissionalSelecionado ||
      !horarioSelecionado ||
      !nomeCliente.trim() ||
      !telefoneCliente.trim()
    ) {
      return;
    }

    try {
      setConfirmandoAgendamento(true);
      setErro("");

      await api.post(
        `/Agendamentos/publico/${slug}`,
        {
          servicoId: servicoSelecionado.id,
          profissionalId:
            profissionalSelecionado.id,
          dataHoraInicio:
            horarioSelecionado.dataHoraInicio,
          nome: nomeCliente.trim(),
          telefone: telefoneCliente.trim(),
        }
      );

      setAgendamentoConfirmado(true);
      setHorariosDisponiveis([]);
    } catch (error: any) {
      if (error.response?.status === 409) {
        setErro(
          "Esse horário acabou de ser ocupado. Escolha outro horário."
        );

        setHorarioSelecionado(null);

        if (
          dataSelecionada &&
          servicoSelecionado &&
          profissionalSelecionado
        ) {
          const resposta = await api.get(
            `/Agendamentos/disponibilidade-publica/${slug}`,
            {
              params: {
                servicoId:
                  servicoSelecionado.id,
                profissionalId:
                  profissionalSelecionado.id,
                data: dataSelecionada,
              },
            }
          );

          setHorariosDisponiveis(
            resposta.data
          );
        }
      } else {
        setErro(
          error.response?.data?.mensagem ||
            "Não foi possível realizar o agendamento."
        );
      }
    } finally {
      setConfirmandoAgendamento(false);
    }
  }

  if (carregando) {
    return (
      <div className="agendamento-publico-page">
        <p className="agendamento-publico-mensagem">
          Carregando...
        </p>
      </div>
    );
  }

  if (erro && !empresa) {
    return (
      <div className="agendamento-publico-page">
        <p className="agendamento-publico-erro">
          {erro}
        </p>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="agendamento-publico-page">
        <p className="agendamento-publico-erro">
          Empresa não encontrada.
        </p>
      </div>
    );
  }

  return (
    <div className="agendamento-publico-page">

      {/* CABEÇALHO */}

      <header className="agendamento-publico-header">

        <p className="agendamento-publico-eyebrow">
          AGENDAMENTO ONLINE
        </p>

        <h1 className="agendamento-publico-title">
          {empresa.nomeNegocio}
        </h1>

        {empresa.descricao && (
          <p className="agendamento-publico-descricao">
            {empresa.descricao}
          </p>
        )}

      </header>

      {/* FLUXO DE AGENDAMENTO */}

      {!agendamentoConfirmado && (
        <>
          {/* SERVIÇO */}

          <section className="agendamento-publico-etapa">

            <p className="agendamento-publico-etapa-label">
              01 · SERVIÇO
            </p>

            <h2 className="agendamento-publico-etapa-title">
              Escolha um serviço
            </h2>

            {servicos.length === 0 ? (
              <p className="agendamento-publico-mensagem">
                Nenhum serviço disponível.
              </p>
            ) : (
              <div className="agendamento-publico-servicos">

                {servicos.map((servico) => (
                  <button
                    key={servico.id}
                    type="button"
                    className={`agendamento-publico-servico ${
                      servicoSelecionado?.id ===
                      servico.id
                        ? "selecionado"
                        : ""
                    }`}
                    onClick={() =>
                      selecionarServico(servico)
                    }
                  >

                    <span className="agendamento-publico-servico-nome">
                      {servico.nome}
                    </span>

                    <span className="agendamento-publico-servico-info">
                      {servico.duracaoMinutos} minutos
                    </span>

                    <span className="agendamento-publico-servico-info">
                      R$ {servico.preco.toFixed(2)}
                    </span>

                  </button>
                ))}

              </div>
            )}

          </section>

          {/* PROFISSIONAL */}

          {servicoSelecionado && (
            <section className="agendamento-publico-etapa">

              <p className="agendamento-publico-etapa-label">
                02 · PROFISSIONAL
              </p>

              <h2 className="agendamento-publico-etapa-title">
                Escolha um profissional
              </h2>

              {carregandoProfissionais ? (
                <p className="agendamento-publico-mensagem">
                  Carregando profissionais...
                </p>
              ) : profissionais.length === 0 ? (
                <p className="agendamento-publico-mensagem">
                  Nenhum profissional disponível para
                  este serviço.
                </p>
              ) : (
                <div className="agendamento-publico-profissionais">

                  {profissionais.map(
                    (profissional) => (
                      <button
                        key={profissional.id}
                        type="button"
                        className={`agendamento-publico-profissional ${
                          profissionalSelecionado?.id ===
                          profissional.id
                            ? "selecionado"
                            : ""
                        }`}
                        onClick={() =>
                          selecionarProfissional(
                            profissional
                          )
                        }
                      >
                        {profissional.nome}
                      </button>
                    )
                  )}

                </div>
              )}

            </section>
          )}

          {/* DATA E HORÁRIO */}

          {profissionalSelecionado && (
            <section className="agendamento-publico-etapa">

              <p className="agendamento-publico-etapa-label">
                03 · DATA E HORÁRIO
              </p>

              <h2 className="agendamento-publico-etapa-title">
                Quando você quer agendar?
              </h2>

              <div className="agendamento-publico-campo">

                <label htmlFor="dataAgendamento">
                  Data
                </label>

                <input
                  id="dataAgendamento"
                  className="agendamento-publico-data"
                  type="date"
                  value={dataSelecionada}
                  onChange={selecionarData}
                  onClick={(e) => {
                    e.currentTarget.showPicker();
                  }}
                  onKeyDown={(e) => {
                    e.preventDefault();
                  }}
                  min={
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                />

              </div>

              {carregandoHorarios && (
                <p className="agendamento-publico-mensagem">
                  Carregando horários...
                </p>
              )}

              {!carregandoHorarios &&
                dataSelecionada &&
                horariosDisponiveis.length === 0 && (
                  <p className="agendamento-publico-mensagem">
                    Nenhum horário disponível para esta
                    data.
                  </p>
                )}

              {horariosDisponiveis.length > 0 && (
                <div>

                  <p className="agendamento-publico-etapa-label">
                    HORÁRIOS DISPONÍVEIS
                  </p>

                  <div className="agendamento-publico-horarios">

                    {horariosDisponiveis.map(
                      (horario) => (
                        <button
                          key={
                            horario.dataHoraInicio
                          }
                          type="button"
                          className={`agendamento-publico-horario ${
                            horarioSelecionado?.dataHoraInicio ===
                            horario.dataHoraInicio
                              ? "selecionado"
                              : ""
                          }`}
                          onClick={() =>
                            selecionarHorario(
                              horario
                            )
                          }
                        >
                          {formatarHorario(
                            horario.dataHoraInicio
                          )}
                        </button>
                      )
                    )}

                  </div>

                </div>
              )}

            </section>
          )}

          {/* DADOS DO CLIENTE */}

          {horarioSelecionado && (
            <section className="agendamento-publico-etapa">

              <p className="agendamento-publico-etapa-label">
                04 · SEUS DADOS
              </p>

              <h2 className="agendamento-publico-etapa-title">
                Finalize seu agendamento
              </h2>

              <p className="agendamento-publico-mensagem">
                Horário escolhido:{" "}
                <strong>
                  {formatarHorario(
                    horarioSelecionado.dataHoraInicio
                  )}
                </strong>
              </p>

              <div className="agendamento-publico-campo">

                <label htmlFor="nomeCliente">
                  Nome
                </label>

                <input
                  id="nomeCliente"
                  type="text"
                  value={nomeCliente}
                  onChange={(e) =>
                    setNomeCliente(
                      e.target.value
                    )
                  }
                  placeholder="Seu nome"
                />

              </div>

              <div className="agendamento-publico-campo">

                <label htmlFor="telefoneCliente">
                  Telefone
                </label>

                <input
                  id="telefoneCliente"
                  type="tel"
                  value={telefoneCliente}
                  onChange={(e) =>
                    setTelefoneCliente(
                      formatarTelefone(
                        e.target.value
                      )
                    )
                  }
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                  maxLength={15}
                />

              </div>

              <button
                type="button"
                className="agendamento-publico-confirmar"
                disabled={
                  confirmandoAgendamento ||
                  !nomeCliente.trim() ||
                  !telefoneCliente.trim()
                }
                onClick={
                  confirmarAgendamento
                }
              >
                {confirmandoAgendamento
                  ? "Agendando..."
                  : "Confirmar agendamento"}
              </button>

            </section>
          )}
        </>
      )}

      {/* SUCESSO */}

      {agendamentoConfirmado && (
        <section className="agendamento-publico-sucesso">

          <div className="agendamento-publico-sucesso-icone">
            ✓
          </div>

          <h2>
            Solicitação de agendamento enviada!
          </h2>

          <p>
            Seu horário foi reservado e aguarda confirmação.
          </p>

          <p>
            Serviço:{" "}            
            {servicoSelecionado?.nome}
          </p>  
          <p>
            Profissional:{" "}   
            {profissionalSelecionado?.nome}
          </p>

          <p>
            Data:{" "}
            {horarioSelecionado &&
              formatarData(
                horarioSelecionado.dataHoraInicio
              )}
          </p>
          <p>
            Horário:{" "}
            {horarioSelecionado &&
              formatarHorario(
                horarioSelecionado.dataHoraInicio
              )}
          </p>

        </section>
      )}

      {erro && (
        <p className="agendamento-publico-erro">
          {erro}
        </p>
      )}

    </div>
  );
}

export default AgendamentoPublicoPage;
