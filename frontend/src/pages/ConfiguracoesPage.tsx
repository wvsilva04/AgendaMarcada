import { useEffect, useState } from "react";
import api from "../services/api";
import "./ConfiguracoesPage.css";

interface Empresa {
  id: string;
  nomeNegocio: string;
  nomeResponsavel: string;
  email: string;
  telefone: string;
  slug: string;
  logoUrl: string | null;
  descricao: string | null;
}

function ConfiguracoesPage() {
  const [empresa, setEmpresa] =
    useState<Empresa | null>(null);

  const [emailLogin, setEmailLogin] =
    useState("");

  const [nomeNegocio, setNomeNegocio] =
    useState("");

  const [nomeResponsavel, setNomeResponsavel] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [telefone, setTelefone] =
    useState("");

  const [descricao, setDescricao] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  useEffect(() => {
    carregarEmpresa();
  }, []);

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

    return `(${numeros.slice(
      0,
      2
    )}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }

  async function carregarEmpresa() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await api.get("/Auth/me");

      const dados =
        resposta.data.empresa;

      const usuario =
        resposta.data.usuario;

      setEmpresa(dados);

      setEmailLogin(
        usuario?.email || ""
      );

      setNomeNegocio(
        dados.nomeNegocio || ""
      );

      setNomeResponsavel(
        dados.nomeResponsavel || ""
      );

      setEmail(
        dados.email || ""
      );

      setTelefone(
        formatarTelefone(
          dados.telefone || ""
        )
      );

      setDescricao(
        dados.descricao || ""
      );
    } catch {
      setErro(
        "Não foi possível carregar os dados da empresa."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function salvar() {
    setErro("");
    setSucesso("");

    if (!nomeNegocio.trim()) {
      setErro(
        "Informe o nome do negócio."
      );
      return;
    }

    if (!nomeResponsavel.trim()) {
      setErro(
        "Informe o nome do responsável."
      );
      return;
    }

    if (!email.trim()) {
      setErro(
        "Informe o e-mail de contato."
      );
      return;
    }

    if (!telefone.trim()) {
      setErro(
        "Informe o telefone."
      );
      return;
    }

    try {
      setSalvando(true);

      await api.put("/Empresas", {
        nomeNegocio,
        nomeResponsavel,
        email,
        telefone,
        descricao,
      });

      setSucesso(
        "Dados atualizados com sucesso."
      );
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível atualizar os dados."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="configuracoes-page">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="configuracoes-page">
        <p>
          {erro ||
            "Empresa não encontrada."}
        </p>
      </div>
    );
  }

  return (
    <div className="configuracoes-page">
      <div className="configuracoes-header">
        <div>
          <p className="font-tabular configuracoes-eyebrow">
            SISTEMA
          </p>

          <h1 className="font-display configuracoes-title">
            Configurações
          </h1>

          <p className="configuracoes-description">
            Gerencie os dados da sua empresa e o acesso ao sistema.
          </p>
        </div>
      </div>

      {erro && (
        <div className="configuracoes-erro">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="configuracoes-sucesso">
          {sucesso}
        </div>
      )}

      <div className="configuracoes-cards">

        {/* ==============================
            CARD — DADOS DA EMPRESA
            ============================== */}

        <section className="configuracoes-card">
          <div className="configuracoes-section-header">
            <h2 className="font-display">
              Dados da empresa
            </h2>

            <p>
              Informações utilizadas para identificar e apresentar sua empresa.
            </p>
          </div>

          <div className="configuracoes-field">
            <label htmlFor="nomeNegocio">
              Nome do negócio
            </label>

            <input
              id="nomeNegocio"
              type="text"
              value={nomeNegocio}
              onChange={(e) =>
                setNomeNegocio(e.target.value)
              }
            />
          </div>

          <div className="configuracoes-field">
            <label htmlFor="nomeResponsavel">
              Nome do responsável
            </label>

            <input
              id="nomeResponsavel"
              type="text"
              value={nomeResponsavel}
              onChange={(e) =>
                setNomeResponsavel(
                  e.target.value
                )
              }
            />
          </div>

          <div className="configuracoes-field">
            <label htmlFor="email">
              E-mail de contato
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />
          </div>

          <div className="configuracoes-field">
            <label htmlFor="telefone">
              Telefone
            </label>

            <input
              id="telefone"
              type="tel"
              value={telefone}
              onChange={(e) =>
                setTelefone(
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

          <div className="configuracoes-field">
            <label htmlFor="descricao">
              Descrição
            </label>

            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) =>
                setDescricao(e.target.value)
              }
              rows={4}
            />
          </div>

          <div className="configuracoes-field">
            <label htmlFor="linkPublico">
              Link público de agendamento
            </label>

            <input
              id="linkPublico"
              type="text"
              value={`${window.location.origin}/agendar/${empresa.slug}`}
              readOnly
            />
          </div>

          <div className="configuracoes-card-actions">
            <button
              type="button"
              className="configuracoes-save-button"
              onClick={salvar}
              disabled={salvando}
            >
              {salvando
                ? "Salvando..."
                : "Salvar alterações"}
            </button>
          </div>
        </section>

        {/* ==============================
            CARD — ACESSO AO SISTEMA
            ============================== */}

        <section className="configuracoes-card configuracoes-card-acesso">
          <div className="configuracoes-section-header">
            <h2 className="font-display">
              Acesso ao sistema
            </h2>

            <p>
              Informações utilizadas para acessar sua conta no AgendaMarcada.
            </p>
          </div>

          <div className="configuracoes-field">
            <label htmlFor="emailLogin">
              E-mail de login
            </label>

            <input
              id="emailLogin"
              type="email"
              value={emailLogin}
              readOnly
            />

            <span className="configuracoes-field-help">
              Este e-mail é utilizado para entrar no AgendaMarcada.
            </span>
          </div>
        </section>

      </div>
    </div>
  );
}

export default ConfiguracoesPage;

