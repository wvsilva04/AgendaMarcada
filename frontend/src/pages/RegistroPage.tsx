import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import api from "../services/api";

function RegistroPage() {
  const navigate = useNavigate();

  const [nomeNegocio, setNomeNegocio] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [slug, setSlug] = useState("");
  const [senha, setSenha] = useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 2) {
      return numeros.length > 0 ? `(${numeros}` : "";
    }

    if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(
      2,
      7
    )}-${numeros.slice(7)}`;
  }

  function emailValido(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }

  async function handleCadastro(event: React.FormEvent) {
    event.preventDefault();

    setErro("");

    if (!emailValido(email)) {
      setErro("Digite um e-mail válido.");
      return;
    }

    const telefoneNumeros = telefone.replace(/\D/g, "");

    if (telefoneNumeros.length !== 11) {
      setErro(
        "Digite um telefone válido com DDD."
      );
      return;
    }

    setCarregando(true);

    try {
      const resposta = await api.post("/Auth/cadastrar", {
        nomeNegocio,
        nomeResponsavel,
        email: email.trim().toLowerCase(),
        telefone,
        senha,
        slug,
      });

      localStorage.setItem("token", resposta.data.token);

      window.location.href = "/";
    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível cadastrar a empresa."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="pagina-login">
      <div className="login-card">
        <p className="login-eyebrow">COMECE AGORA</p>

        <h1 className="login-logo">
          Criar empresa
        </h1>

        <form
          className="login-form"
          onSubmit={handleCadastro}
        >
          <div className="campo">
            <label htmlFor="nomeNegocio">
              Nome do negócio
            </label>

            <input
              id="nomeNegocio"
              type="text"
              placeholder="Ex.: Barbearia do João"
              value={nomeNegocio}
              onChange={(e) =>
                setNomeNegocio(e.target.value)
              }
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="nomeResponsavel">
              Seu nome
            </label>

            <input
              id="nomeResponsavel"
              type="text"
              placeholder="Seu nome"
              value={nomeResponsavel}
              onChange={(e) =>
                setNomeResponsavel(e.target.value)
              }
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="email">
              E-mail
            </label>

            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="telefone">
              Telefone
            </label>

            <input
              id="telefone"
              type="tel"
              inputMode="numeric"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) =>
                setTelefone(
                  formatarTelefone(e.target.value)
                )
              }
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="slug">
              Endereço da sua empresa
            </label>

            <input
              id="slug"
              type="text"
              placeholder="minha-barbearia"
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                )
              }
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="senha">
              Senha
            </label>

            <input
              id="senha"
              type="password"
              placeholder="Crie uma senha"
              value={senha}
              onChange={(e) =>
                setSenha(e.target.value)
              }
              required
            />
          </div>

          {erro && (
            <p className="erro-login">
              {erro}
            </p>
          )}

          <button
            type="submit"
            className="botao-entrar"
            disabled={carregando}
          >
            {carregando
              ? "Criando..."
              : "Criar minha empresa"}
          </button>
        </form>

        <p className="cadastro-link">
          Já possui uma conta?{" "}
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              navigate("/");
            }}
          >
            Voltar para o login
          </a>
        </p>
      </div>
    </div>
  );
}

export default RegistroPage;

