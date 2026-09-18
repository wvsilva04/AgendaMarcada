import { useState } from "react";
import "./LoginPage.css";
import api from "../services/api";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      const resposta = await api.post("/Auth/login", {
        email,
        senha,
      });

      localStorage.setItem("token", resposta.data.token);
      window.location.href = "/";

    } catch (error: any) {
      setErro(
        error.response?.data?.mensagem ||
        "E-mail ou senha inválidos."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="pagina-login">
      <div className="login-card">
        <p className="login-eyebrow">ACESSO</p>

        <h1 className="login-logo">
          AgendaMarcada 
        </h1>

        <form
          className="login-form"
          onSubmit={handleLogin}
        >
          <div className="campo">
            <label htmlFor="email">E-mail</label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="campo">
            <label htmlFor="senha">Senha</label>

            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
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
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="cadastro-link">
          Ainda não tem conta?{" "}
          <a href="/registrar">Cadastre sua empresa</a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;