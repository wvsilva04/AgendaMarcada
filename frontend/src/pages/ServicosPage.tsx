import { useEffect, useState } from "react";
import {
  Plus,
  X,
  Pencil,
  MoreVertical,
  CircleSlash,
  Trash2,
} from "lucide-react";
import "./ServicosPage.css";
import api from "../services/api";

interface Servico {
  id: string;
  nome: string;
  duracaoMinutos: number;
  preco: number;
  ativo: boolean;
}

function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [novoServico, setNovoServico] = useState(false);
  const [servicoEditando, setServicoEditando] =
    useState<Servico | null>(null);

  const [nome, setNome] = useState("");
  const [duracao, setDuracao] = useState("");
  const [preco, setPreco] = useState("");

  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [alterandoStatus, setAlterandoStatus] =
    useState<string | null>(null);
  const [menuAberto, setMenuAberto] =
    useState<string | null>(null);

  useEffect(() => {
    carregarServicos();
  }, []);

  async function carregarServicos() {
    try {
      const token = localStorage.getItem("token");

      const resposta = await api.get("/Servicos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setServicos(resposta.data);
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível carregar os serviços."
      );
    } finally {
      setCarregando(false);
    }
  }

  function limparFormulario() {
    setNome("");
    setDuracao("");
    setPreco("");
    setErro("");
  }

  function fecharFormulario() {
    setNovoServico(false);
    setServicoEditando(null);
    limparFormulario();
  }

  function abrirNovoServico() {
    limparFormulario();
    setServicoEditando(null);
    setNovoServico(true);
  }

  function abrirEdicao(servico: Servico) {
    setServicoEditando(servico);
    setNome(servico.nome);

    setDuracao(
      servico.duracaoMinutos.toString()
    );

    setPreco(
      servico.preco.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    );

    setErro("");
    setNovoServico(true);
  }

  async function alterarStatus(servico: Servico) {
    try {
      setAlterandoStatus(servico.id);

      const token = localStorage.getItem("token");

      const resposta = await api.patch(
        `/Servicos/${servico.id}/status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setServicos((servicosAtuais) =>
        servicosAtuais.map((item) =>
          item.id === servico.id
            ? {
                ...item,
                ativo: resposta.data.ativo,
              }
            : item
        )
      );
    } catch (error: any) {
      alert(
        error.response?.data?.mensagem ||
          "Não foi possível alterar o status do serviço."
      );
    } finally {
      setAlterandoStatus(null);
    }
  }

  async function excluirServico(servico: Servico) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o serviço "${servico.nome}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await api.delete(
        `/Servicos/${servico.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setServicos((servicosAtuais) =>
        servicosAtuais.filter(
          (item) => item.id !== servico.id
        )
      );

      alert("Serviço excluído com sucesso.");
    } catch (error: any) {
      alert(
        error.response?.data?.mensagem ||
          "Não foi possível excluir o serviço."
      );
    }
  }

  async function salvarServico() {
    setErro("");

    if (!nome.trim()) {
      setErro("Informe o nome do serviço.");
      return;
    }

    if (!duracao) {
      setErro("Informe a duração do serviço.");
      return;
    }

    const duracaoNumero = Number(duracao);

    if (
      duracaoNumero < 1 ||
      duracaoNumero > 180
    ) {
      setErro(
        "A duração deve estar entre 1 e 180 minutos."
      );
      return;
    }

    if (!preco) {
      setErro("Informe o preço do serviço.");
      return;
    }

    const precoNumero = Number(
      preco
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim()
    );

    if (
      precoNumero < 0 ||
      precoNumero > 99999.99
    ) {
      setErro(
        "O preço deve estar entre R$ 0,00 e R$ 99.999,99."
      );
      return;
    }

    setSalvando(true);

    try {
      const token = localStorage.getItem("token");

      if (servicoEditando) {
        const resposta = await api.put(
          `/Servicos/${servicoEditando.id}`,
          {
            nome: nome.trim(),
            duracaoMinutos: duracaoNumero,
            preco: precoNumero,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setServicos((servicosAtuais) =>
          servicosAtuais.map((servico) =>
            servico.id === servicoEditando.id
              ? resposta.data
              : servico
          )
        );

        fecharFormulario();

        alert("Serviço alterado com sucesso.");
      } else {
        await api.post(
          "/Servicos",
          {
            nome: nome.trim(),
            duracaoMinutos: duracaoNumero,
            preco: precoNumero,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        fecharFormulario();

        alert("Serviço cadastrado com sucesso.");

        await carregarServicos();
      }
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível salvar o serviço."
      );
    } finally {
      setSalvando(false);
    }
  }

  function formatarPreco(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <div className="servicos-page">
      <header className="servicos-header">
        <div>
          <p className="font-tabular servicos-eyebrow">
            GESTÃO
          </p>

          <h1 className="font-display servicos-title">
            Serviços
          </h1>

          <p className="servicos-description">
            Cadastre os serviços oferecidos pela sua empresa.
          </p>
        </div>

        <button
          className="servicos-new-button"
          onClick={abrirNovoServico}
        >
          <Plus />
          <span>Novo serviço</span>
        </button>
      </header>

      <section className="servicos-list">
        {carregando ? (
          <div className="servicos-empty">
            <p className="servicos-empty-description">
              Carregando serviços...
            </p>
          </div>
        ) : servicos.length === 0 ? (
          <div className="servicos-empty">
            <p className="font-display servicos-empty-title">
              Nenhum serviço cadastrado
            </p>

            <p className="servicos-empty-description">
              Cadastre seu primeiro serviço para começar a receber agendamentos.
            </p>
          </div>
        ) : (
          <div className="servicos-items">
            {servicos.map((servico) => (
              <div
                key={servico.id}
                className="servico-item"
              >
                <div className="servico-item-info">
                  <div className="servico-item-top">
                    <p className="font-display servico-item-nome">
                      {servico.nome}
                    </p>

                    <span
                      className={`servico-status-badge ${
                        servico.ativo
                          ? "ativo"
                          : "inativo"
                      }`}
                    >
                      {servico.ativo
                        ? "ATIVO"
                        : "INATIVO"}
                    </span>
                  </div>

                  <p className="servico-item-preco">
                    {formatarPreco(servico.preco)}
                  </p>

                  <p className="servico-item-detalhes">
                    {servico.duracaoMinutos} minutos
                  </p>
                </div>

                <div className="servico-item-actions">
                  <button
                    className="servico-edit-button"
                    onClick={() =>
                      abrirEdicao(servico)
                    }
                    aria-label={`Editar ${servico.nome}`}
                    title="Editar"
                  >
                    <Pencil />
                  </button>

                  <div className="servico-more-wrapper">
                    <button
                      className="servico-more-button"
                      onClick={() =>
                        setMenuAberto(
                          menuAberto === servico.id
                            ? null
                            : servico.id
                        )
                      }
                      aria-label={`Mais ações para ${servico.nome}`}
                      title="Mais ações"
                    >
                      <MoreVertical />
                    </button>

                    {menuAberto === servico.id && (
                      <div className="servico-actions-menu">
                        <button
                          type="button"
                          onClick={() => {
                            alterarStatus(servico);
                            setMenuAberto(null);
                          }}
                          disabled={
                            alterandoStatus ===
                            servico.id
                          }
                        >
                          <CircleSlash />

                          {servico.ativo
                            ? "Inativar"
                            : "Ativar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMenuAberto(null);
                            excluirServico(servico);
                          }}
                        >
                          <Trash2 />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {novoServico && (
        <div className="servico-form">
          <div className="servico-form-header">
            <div>
              <p className="font-tabular servicos-eyebrow">
                SERVIÇOS
              </p>

              <h2 className="font-display">
                {servicoEditando
                  ? "Editar serviço"
                  : "Novo serviço"}
              </h2>
            </div>

            <button
              className="servico-close-button"
              onClick={fecharFormulario}
              aria-label="Fechar"
            >
              <X />
            </button>
          </div>

          <div className="servico-form-fields">
            <div className="servico-field">
              <label htmlFor="nome-servico">
                Nome
              </label>

              <input
                id="nome-servico"
                type="text"
                placeholder="Nome do serviço"
                value={nome}
                onChange={(e) =>
                  setNome(e.target.value)
                }
              />
            </div>

            <div className="servico-field">
              <label htmlFor="duracao-servico">
                Duração (minutos)
              </label>

              <input
                id="duracao-servico"
                type="text"
                inputMode="numeric"
                placeholder="Ex.: 50"
                value={duracao}
                onChange={(e) => {
                  let valor =
                    e.target.value.replace(/\D/g, "");

                  if (valor === "") {
                    setDuracao("");
                    return;
                  }

                  const numero = Number(valor);

                  if (numero > 180) {
                    valor = "180";
                  }

                  setDuracao(valor);
                }}
              />
            </div>

            <div className="servico-field">
              <label htmlFor="preco-servico">
                Preço
              </label>

              <input
                id="preco-servico"
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={preco}
                onChange={(e) => {
                  let valor =
                    e.target.value.replace(/\D/g, "");

                  if (!valor) {
                    setPreco("");
                    return;
                  }

                  let numero =
                    Number(valor) / 100;

                  if (numero > 99999.99) {
                    numero = 99999.99;
                  }

                  setPreco(
                    numero.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  );
                }}
              />
            </div>

            {erro && (
              <p className="erro-login">
                {erro}
              </p>
            )}
          </div>

          <div className="servico-form-actions">
            <button
              className="servico-cancel-button"
              onClick={fecharFormulario}
            >
              Cancelar
            </button>

            <button
              className="servico-save-button"
              onClick={salvarServico}
              disabled={salvando}
            >
              {salvando
                ? "Salvando..."
                : servicoEditando
                ? "Salvar alterações"
                : "Salvar serviço"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default ServicosPage;