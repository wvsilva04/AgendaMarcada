using Microsoft.AspNetCore.Identity;

namespace AgendaMarcada.Application.Servicos;

public class SenhaServico
{
    private readonly PasswordHasher<object> _passwordHasher = new();

    public string GerarHash(string senha)
    {
        return _passwordHasher.HashPassword(null!, senha);
    }

    public bool VerificarSenha(string senha, string hash)
    {
        var resultado = _passwordHasher.VerifyHashedPassword(
            null!,
            hash,
            senha);

        return resultado == PasswordVerificationResult.Success ||
               resultado == PasswordVerificationResult.SuccessRehashNeeded;
    }
}