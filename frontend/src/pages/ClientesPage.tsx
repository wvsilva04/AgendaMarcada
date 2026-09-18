import { useEffect, useState } from "react";
import {
  Plus,
  UsersRound,
  X,
  Pencil,
  MoreVertical,
  Trash2,
  CircleSlash,
} from "lucide-react";
import "./ClientesPage.css";
import api from "../services/api";

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
  dataCadastro: string;
  dataAtualizacao: string | null;
}

function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [formularioAberto, setFormularioAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await api.get<Cliente[]>("/Clientes");

      setClientes(resposta.data);
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível carregar os clientes."
      );
    } finally {
      setCarregando(false);
    }
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
    setErro("");
    setEditandoId(null);
  }

  function abrirNovoCliente() {
    limparFormulario();
    setFormularioAberto(true);
  }

  function abrirEdicao(cliente: Cliente) {
    setNome(cliente.nome);
    setTelefone(cliente.telefone);
    setEditandoId(cliente.id);
    setErro("");
    setMenuAberto(null);
    setFormularioAberto(true);
  }

  async function salvarCliente() {
    setErro("");

    if (!nome.trim()) {
      setErro("Informe o nome do cliente.");
      return;
    }

    if (!telefone.trim()) {
      setErro("Informe o telefone do cliente.");
      return;
    }

    try {
      setProcessandoId(editandoId);

      const dados = {
        nome: nome.trim(),
        telefone: telefone.trim(),
      };

      if (editandoId) {
        await api.put(`/Clientes/${editandoId}`, dados);
      } else {
        await api.post("/Clientes", dados);
      }

      limparFormulario();
      setFormularioAberto(false);

      await carregarClientes();
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível salvar o cliente."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  async function alterarStatus(cliente: Cliente) {
    try {
      setProcessandoId(cliente.id);
      setMenuAberto(null);
      setErro("");

      await api.patch(`/Clientes/${cliente.id}/status`);

      await carregarClientes();
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível alterar o status do cliente."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  async function excluirCliente(cliente: Cliente) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o cliente "${cliente.nome}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      setProcessandoId(cliente.id);
      setMenuAberto(null);
      setErro("");

      await api.delete(`/Clientes/${cliente.id}`);

      await carregarClientes();
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível excluir o cliente."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <div className="clientes-page">
      <header className="clientes-header">
        <div>
          <p className="font-tabular clientes-eyebrow">
            GESTÃO
          </p>

          <h1 className="font-display clientes-title">
            Clientes
          </h1>

          <p className="clientes-description">
            Gerencie os clientes da sua empresa.
          </p>
        </div>

        <button
          className="clientes-new-button"
          onClick={abrirNovoCliente}
        >
          <Plus />
          Novo cliente
        </button>
      </header>

      {erro && !formularioAberto && (
        <p className="cliente-form-erro">
          {erro}
        </p>
      )}

      {carregando ? (
        <section className="clientes-empty">
          <p className="clientes-empty-description">
            Carregando clientes...
          </p>
        </section>
      ) : clientes.length === 0 ? (
        <section className="clientes-empty">
          <UsersRound
            className="clientes-empty-icon"
            strokeWidth={1.5}
          />

          <p className="clientes-empty-title">
            Nenhum cliente cadastrado
          </p>

          <p className="clientes-empty-description">
            Cadastre os clientes que farão parte da sua agenda.
          </p>
        </section>
      ) : (
        <section className="clientes-lista">
          {clientes.map((cliente) => (
            <article
              key={cliente.id}
              className="cliente-card"
            >
              <div className="cliente-card-identificacao">
                <div className="cliente-card-top">
                  <h2 className="font-display">
                    {cliente.nome}
                  </h2>

                  <span
                    className={`cliente-status ${
                      cliente.ativo ? "ativo" : "inativo"
                    }`}
                  >
                    {cliente.ativo ? "ATIVO" : "INATIVO"}
                  </span>
                </div>

                <p className="cliente-card-info">
                  {cliente.telefone}
                </p>
              </div>

              <div className="cliente-card-actions">
                <button
                  type="button"
                  className="cliente-edit-button"
                  onClick={() => abrirEdicao(cliente)}
                  disabled={processandoId === cliente.id}
                  title="Editar"
                >
                  <Pencil />
                </button>

                <div className="cliente-more-wrapper">
                  <button
                    type="button"
                    className="cliente-more-button"
                    onClick={() =>
                      setMenuAberto(
                        menuAberto === cliente.id
                          ? null
                          : cliente.id
                      )
                    }
                    disabled={processandoId === cliente.id}
                    title="Mais ações"
                  >
                    <MoreVertical />
                  </button>

                  {menuAberto === cliente.id && (
                    <div className="cliente-actions-menu">
                      <button
                        type="button"
                        onClick={() => alterarStatus(cliente)}
                        disabled={processandoId === cliente.id}
                      >
                        <CircleSlash />

                        {cliente.ativo
                          ? "Inativar"
                          : "Ativar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => excluirCliente(cliente)}
                        disabled={processandoId === cliente.id}
                      >
                        <Trash2 />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {formularioAberto && (
        <div className="cliente-form">
          <div className="cliente-form-header">
            <div>
              <p className="font-tabular cliente-form-eyebrow">
                CLIENTE
              </p>

              <h2>
                {editandoId
                  ? "Editar cliente"
                  : "Novo cliente"}
              </h2>
            </div>

            <button
              type="button"
              className="cliente-close-button"
              onClick={() => {
                limparFormulario();
                setFormularioAberto(false);
              }}
              aria-label="Fechar"
              disabled={processandoId !== null}
            >
              <X />
            </button>
          </div>

          <div className="cliente-form-fields">
            <div className="cliente-field">
              <label htmlFor="nome-cliente">
                Nome
              </label>

              <input
                id="nome-cliente"
                type="text"
                placeholder="Nome do cliente"
                value={nome}
                onChange={(e) =>
                  setNome(e.target.value)
                }
              />
            </div>

            <div className="cliente-field">
              <label htmlFor="telefone-cliente">
                Telefone
              </label>

              <input
                id="telefone-cliente"
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

            {erro && (
              <p className="cliente-form-erro">
                {erro}
              </p>
            )}
          </div>

          <div className="cliente-form-actions">
            <button
              type="button"
              className="cliente-cancel-button"
              onClick={() => {
                limparFormulario();
                setFormularioAberto(false);
              }}
              disabled={processandoId !== null}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="cliente-save-button"
              onClick={salvarCliente}
              disabled={processandoId !== null}
            >
              {processandoId
                ? "Salvando..."
                : editandoId
                ? "Salvar alterações"
                : "Salvar cliente"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientesPage;
