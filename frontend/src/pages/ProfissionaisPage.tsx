import { useEffect, useState } from "react";
import {
  Plus,
  UserRound,
  X,
  Pencil,
  MoreVertical,
  Trash2,
  CircleSlash,
} from "lucide-react";
import "./ProfissionaisPage.css";
import api from "../services/api";

interface Servico {
  id: string;
  nome: string;
  duracaoMinutos: number;
  preco: number;
  ativo: boolean;
}

interface HorarioTrabalho {
  id: string;
  profissionalId?: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  ativo: boolean;
}

interface Profissional {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  ativo: boolean;
  servicos: Servico[];
  horarios: HorarioTrabalho[];
}

interface HorarioDia {
  diaSemana: number;
  nome: string;
  abreviado: string;
  ativo: boolean;
  horarioId: string | null;
  horaInicio: string;
  horaFim: string;
}

const diasSemana = [
  { diaSemana: 1, nome: "Segunda-feira", abreviado: "Seg" },
  { diaSemana: 2, nome: "Terça-feira", abreviado: "Ter" },
  { diaSemana: 3, nome: "Quarta-feira", abreviado: "Qua" },
  { diaSemana: 4, nome: "Quinta-feira", abreviado: "Qui" },
  { diaSemana: 5, nome: "Sexta-feira", abreviado: "Sex" },
  { diaSemana: 6, nome: "Sábado", abreviado: "Sáb" },
  { diaSemana: 0, nome: "Domingo", abreviado: "Dom" },
];

function criarHorariosIniciais(): HorarioDia[] {
  return diasSemana.map((dia) => ({
    ...dia,
    ativo: false,
    horarioId: null,
    horaInicio: "",
    horaFim: "",
  }));
}

function ProfissionaisPage() {
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);

  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>(
    []
  );

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  const [horarios, setHorarios] = useState<HorarioDia[]>(
    criarHorariosIniciais()
  );

  const [carregandoServicos, setCarregandoServicos] = useState(false);
  const [carregandoProfissionais, setCarregandoProfissionais] =
    useState(false);
  const [carregandoHorario, setCarregandoHorario] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  useEffect(() => {
    carregarProfissionais();
  }, []);

  useEffect(() => {
    if (formularioAberto) {
      carregarServicos();
    }
  }, [formularioAberto]);

  async function carregarProfissionais() {
    try {
      setCarregandoProfissionais(true);
      setErro("");

      const token = localStorage.getItem("token");

      const resposta = await api.get("/Profissionais", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfissionais(resposta.data);
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível carregar os profissionais."
      );
    } finally {
      setCarregandoProfissionais(false);
    }
  }

  async function carregarServicos() {
    try {
      setCarregandoServicos(true);
      setErro("");

      const token = localStorage.getItem("token");

      const resposta = await api.get("/Servicos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setServicos(
        resposta.data.filter((servico: Servico) => servico.ativo)
      );
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível carregar os serviços."
      );
    } finally {
      setCarregandoServicos(false);
    }
  }

  async function carregarHorarios(profissionalId: string) {
    try {
      setCarregandoHorario(true);

      const token = localStorage.getItem("token");

      const resposta = await api.get(
        `/HorariosTrabalho/${profissionalId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const horariosBanco: HorarioTrabalho[] = resposta.data;

      setHorarios(
        diasSemana.map((dia) => {
          const horario = horariosBanco.find(
            (item) =>
              item.diaSemana === dia.diaSemana &&
              item.ativo
          );

          return {
            ...dia,
            ativo: !!horario,
            horarioId: horario?.id || null,
            horaInicio: horario
              ? horario.horaInicio.substring(0, 5)
              : "",
            horaFim: horario
              ? horario.horaFim.substring(0, 5)
              : "",
          };
        })
      );
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível carregar os horários de trabalho."
      );
    } finally {
      setCarregandoHorario(false);
    }
  }

  function alternarServico(servicoId: string) {
    setServicosSelecionados((atual) => {
      if (atual.includes(servicoId)) {
        return atual.filter((id) => id !== servicoId);
      }

      return [...atual, servicoId];
    });
  }

  function alternarDia(diaSemana: number) {
    setHorarios((atual) =>
      atual.map((dia) =>
        dia.diaSemana === diaSemana
          ? {
              ...dia,
              ativo: !dia.ativo,
              horaInicio: !dia.ativo
                ? dia.horaInicio || "09:00"
                : "",
              horaFim: !dia.ativo
                ? dia.horaFim || "18:00"
                : "",
            }
          : dia
      )
    );
  }

  function alterarHorario(
    diaSemana: number,
    campo: "horaInicio" | "horaFim",
    valor: string
  ) {
    setHorarios((atual) =>
      atual.map((dia) =>
        dia.diaSemana === diaSemana
          ? {
              ...dia,
              [campo]: valor,
            }
          : dia
      )
    );
  }

  function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 2) {
      return numeros;
    }

    if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(
      7
    )}`;
  }

  function limparFormulario() {
    setNome("");
    setTelefone("");
    setEmail("");
    setServicosSelecionados([]);
    setHorarios(criarHorariosIniciais());
    setErro("");
    setEditandoId(null);
  }

  function abrirNovoProfissional() {
    limparFormulario();
    setFormularioAberto(true);
  }

  async function abrirEdicao(profissional: Profissional) {
    setNome(profissional.nome);
    setTelefone(profissional.telefone || "");
    setEmail(profissional.email || "");

    setServicosSelecionados(
      profissional.servicos?.map((servico) => servico.id) || []
    );

    setHorarios(criarHorariosIniciais());

    setEditandoId(profissional.id);
    setErro("");
    setMenuAberto(null);
    setFormularioAberto(true);

    await carregarHorarios(profissional.id);
  }

  async function salvarHorarios(
    profissionalId: string,
    token: string
  ) {
    for (const dia of horarios) {
      if (dia.ativo) {
        if (!dia.horaInicio || !dia.horaFim) {
          throw new Error(
            `Informe o horário de início e fim de ${dia.nome}.`
          );
        }

        if (dia.horaInicio >= dia.horaFim) {
          throw new Error(
            `O horário inicial deve ser anterior ao horário final de ${dia.nome}.`
          );
        }

        const dadosHorario = {
          diaSemana: dia.diaSemana,
          horaInicio: `${dia.horaInicio}:00`,
          horaFim: `${dia.horaFim}:00`,
        };

        if (dia.horarioId) {
          await api.put(
            `/HorariosTrabalho/${dia.horarioId}`,
            dadosHorario,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } else {
          await api.post(
            `/HorariosTrabalho/${profissionalId}`,
            dadosHorario,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }
      } else if (dia.horarioId) {
        await api.delete(
          `/HorariosTrabalho/${dia.horarioId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    }
  }

  async function salvarProfissional() {
    setErro("");

    if (!nome.trim()) {
      setErro("Informe o nome do profissional.");
      return;
    }

    if (servicosSelecionados.length === 0) {
      setErro("Selecione pelo menos um serviço.");
      return;
    }

    const diasAtivos = horarios.filter(
      (dia) => dia.ativo
    );

    for (const dia of diasAtivos) {
      if (!dia.horaInicio || !dia.horaFim) {
        setErro(
          `Informe o horário de início e fim de ${dia.nome}.`
        );
        return;
      }

      if (dia.horaInicio >= dia.horaFim) {
        setErro(
          `O horário inicial deve ser anterior ao horário final de ${dia.nome}.`
        );
        return;
      }
    }

    try {
      setSalvando(true);

      const token = localStorage.getItem("token");

      const dados = {
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        servicoIds: servicosSelecionados,
      };

      let profissionalId = editandoId;

      if (editandoId) {
        await api.put(
          `/Profissionais/${editandoId}`,
          dados,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        const resposta = await api.post(
          "/Profissionais",
          dados,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        profissionalId = resposta.data.id;
      }

      if (profissionalId) {
        await salvarHorarios(profissionalId, token || "");
      }

      limparFormulario();
      setFormularioAberto(false);

      await carregarProfissionais();
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          error.message ||
          "Não foi possível salvar o profissional."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function alterarStatus(profissional: Profissional) {
    try {
      setProcessandoId(profissional.id);
      setMenuAberto(null);
      setErro("");

      const token = localStorage.getItem("token");

      await api.patch(
        `/Profissionais/${profissional.id}/status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await carregarProfissionais();
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível alterar o status do profissional."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  async function excluirProfissional(profissional: Profissional) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o profissional "${profissional.nome}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      setProcessandoId(profissional.id);
      setMenuAberto(null);
      setErro("");

      const token = localStorage.getItem("token");

      await api.delete(
        `/Profissionais/${profissional.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await carregarProfissionais();
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível excluir o profissional."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  function formatarHorarios(profissional: Profissional) {
    if (!profissional.horarios?.length) {
      return null;
    }

    return profissional.horarios
      .sort((a, b) => a.diaSemana - b.diaSemana)
      .map((horario) => {
        const dia = diasSemana.find(
          (item) => item.diaSemana === horario.diaSemana
        );

        if (!dia) {
          return null;
        }

        return `${dia.abreviado} ${horario.horaInicio.substring(
          0,
          5
        )}–${horario.horaFim.substring(0, 5)}`;
      })
      .filter(Boolean)
      .join("  ·  ");
  }

  return (
    <div className="profissionais-page">
      <header className="profissionais-header">
        <div>
          <p className="font-tabular profissionais-eyebrow">
            GESTÃO
          </p>

          <h1 className="font-display profissionais-title">
            Profissionais
          </h1>

          <p className="profissionais-description">
            Gerencie os profissionais que atendem seus clientes.
          </p>
        </div>

        <button
          className="profissionais-new-button"
          onClick={abrirNovoProfissional}
        >
          <Plus />
          Novo profissional
        </button>
      </header>

      {erro && !formularioAberto && (
        <p className="profissional-form-erro">
          {erro}
        </p>
      )}

      {carregandoProfissionais ? (
        <section className="profissionais-empty">
          <p className="profissionais-empty-description">
            Carregando profissionais...
          </p>
        </section>
      ) : profissionais.length === 0 ? (
        <section className="profissionais-empty">
          <UserRound
            className="profissionais-empty-icon"
            strokeWidth={1.5}
          />

          <p className="profissionais-empty-title">
            Nenhum profissional cadastrado
          </p>

          <p className="profissionais-empty-description">
            Cadastre os profissionais que farão parte da sua agenda.
          </p>
        </section>
      ) : (
        <section className="profissionais-lista">
          {profissionais.map((profissional) => {
            const horariosFormatados =
              formatarHorarios(profissional);

            return (
              <article
                key={profissional.id}
                className="profissional-card"
              >
                <div className="profissional-card-header">
                  <div className="profissional-card-identificacao">
                    <div className="profissional-card-top">
                      <h2 className="font-display">
                        {profissional.nome}
                      </h2>

                      <span
                        className={`profissional-status ${
                          profissional.ativo
                            ? "ativo"
                            : "inativo"
                        }`}
                      >
                        {profissional.ativo
                          ? "ATIVO"
                          : "INATIVO"}
                      </span>
                    </div>

                    {profissional.telefone && (
                      <p className="profissional-card-info">
                        {profissional.telefone}
                      </p>
                    )}

                    {profissional.email && (
                      <p className="profissional-card-info">
                        {profissional.email}
                      </p>
                    )}
                  </div>
                </div>

                {profissional.servicos?.length > 0 && (
                  <div className="profissional-card-servicos">
                    <p className="profissional-card-servicos-label">
                      Serviços
                    </p>

                    <div className="profissional-card-servicos-lista">
                      {profissional.servicos.map((servico) => (
                        <span
                          key={servico.id}
                          className="profissional-card-servico"
                        >
                          {servico.nome}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="profissional-card-actions">
                  <button
                    type="button"
                    className="profissional-edit-button"
                    onClick={() =>
                      abrirEdicao(profissional)
                    }
                    disabled={
                      processandoId === profissional.id
                    }
                    title="Editar"
                  >
                    <Pencil />
                  </button>

                  <div className="profissional-more-wrapper">
                    <button
                      type="button"
                      className="profissional-more-button"
                      onClick={() =>
                        setMenuAberto(
                          menuAberto === profissional.id
                            ? null
                            : profissional.id
                        )
                      }
                      disabled={
                        processandoId === profissional.id
                      }
                      title="Mais ações"
                    >
                      <MoreVertical />
                    </button>

                    {menuAberto === profissional.id && (
                      <div className="profissional-actions-menu">
                        <button
                          type="button"
                          onClick={() =>
                            alterarStatus(profissional)
                          }
                          disabled={
                            processandoId ===
                            profissional.id
                          }
                        >
                          <CircleSlash />
                          {profissional.ativo
                            ? "Inativar"
                            : "Ativar"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            excluirProfissional(
                              profissional
                            )
                          }
                          disabled={
                            processandoId ===
                            profissional.id
                          }
                        >
                          <Trash2 />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {horariosFormatados && (
                  <div className="profissional-card-horarios">
                    <p className="profissional-card-horarios-label">
                      Horários
                    </p>

                    <p className="profissional-card-horarios-texto">
                      {horariosFormatados}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {formularioAberto && (
        <div className="profissional-form">
          <div className="profissional-form-header">
            <div>
              <p className="font-tabular profissional-form-eyebrow">
                PROFISSIONAL
              </p>

              <h2 className="font-display">
                {editandoId
                  ? "Editar profissional"
                  : "Novo profissional"}
              </h2>
            </div>

            <button
              type="button"
              className="profissional-close-button"
              onClick={() => {
                limparFormulario();
                setFormularioAberto(false);
              }}
              aria-label="Fechar"
              disabled={salvando}
            >
              <X />
            </button>
          </div>

          <div className="profissional-form-fields">
            <div className="profissional-field">
              <label htmlFor="nome-profissional">
                Nome
              </label>

              <input
                id="nome-profissional"
                type="text"
                placeholder="Nome do profissional"
                value={nome}
                onChange={(e) =>
                  setNome(e.target.value)
                }
              />
            </div>

            <div className="profissional-field">
              <label htmlFor="telefone-profissional">
                Telefone
              </label>

              <input
                id="telefone-profissional"
                type="tel"
                inputMode="numeric"
                placeholder="(21) 99999-9999"
                value={telefone}
                onChange={(e) =>
                  setTelefone(
                    formatarTelefone(e.target.value)
                  )
                }
              />
            </div>

            <div className="profissional-field">
              <label htmlFor="email-profissional">
                E-mail
              </label>

              <input
                id="email-profissional"
                type="email"
                placeholder="profissional@email.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </div>

            <div className="profissional-field">
              <label>
                Serviços que realiza
              </label>

              {carregandoServicos ? (
                <p className="profissional-servicos-status">
                  Carregando serviços...
                </p>
              ) : servicos.length === 0 ? (
                <p className="profissional-servicos-status">
                  Nenhum serviço ativo cadastrado.
                </p>
              ) : (
                <div className="profissional-servicos-lista">
                  {servicos.map((servico) => {
                    const selecionado =
                      servicosSelecionados.includes(
                        servico.id
                      );

                    return (
                      <button
                        key={servico.id}
                        type="button"
                        className={`profissional-servico-option ${
                          selecionado
                            ? "selecionado"
                            : ""
                        }`}
                        onClick={() =>
                          alternarServico(
                            servico.id
                          )
                        }
                      >
                        <span className="profissional-servico-checkbox">
                          {selecionado ? "✓" : ""}
                        </span>

                        <span>{servico.nome}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="profissional-field">
              <label>
                Horários de trabalho
              </label>

              {carregandoHorario ? (
                <p className="profissional-servicos-status">
                  Carregando horários...
                </p>
              ) : (
                <div className="profissional-horarios">
                  {horarios.map((dia) => (
                    <div
                      key={dia.diaSemana}
                      className={`profissional-horario-linha ${
                        dia.ativo
                          ? "ativo"
                          : "inativo"
                      }`}
                    >
                      <button
                        type="button"
                        className={`profissional-dia-toggle ${
                          dia.ativo
                            ? "selecionado"
                            : ""
                        }`}
                        onClick={() =>
                          alternarDia(
                            dia.diaSemana
                          )
                        }
                        aria-label={`${
                          dia.ativo
                            ? "Desativar"
                            : "Ativar"
                        } ${dia.nome}`}
                      >
                        <span>
                          {dia.ativo ? "✓" : ""}
                        </span>
                      </button>

                      <div className="profissional-dia-nome">
                        <strong>
                          {dia.nome}
                        </strong>
                      </div>

                      {dia.ativo ? (
                        <div className="profissional-horario-inputs">
                          <input
                            type="time"
                            value={dia.horaInicio}
                            onChange={(e) =>
                              alterarHorario(
                                dia.diaSemana,
                                "horaInicio",
                                e.target.value
                              )
                            }
                          />

                          <span>até</span>

                          <input
                            type="time"
                            value={dia.horaFim}
                            onChange={(e) =>
                              alterarHorario(
                                dia.diaSemana,
                                "horaFim",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      ) : (
                        <span className="profissional-dia-folga">
                          Folga
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {erro && (
              <p className="profissional-form-erro">
                {erro}
              </p>
            )}
          </div>

          <div className="profissional-form-actions">
            <button
              type="button"
              className="profissional-cancel-button"
              onClick={() => {
                limparFormulario();
                setFormularioAberto(false);
              }}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="profissional-save-button"
              onClick={salvarProfissional}
              disabled={salvando}
            >
              {salvando
                ? "Salvando..."
                : editandoId
                ? "Salvar alterações"
                : "Salvar profissional"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfissionaisPage;

