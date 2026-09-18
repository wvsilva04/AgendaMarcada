using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace AgendaMarcada.Application.Servicos;

public class TokenServico
{
    private readonly IConfiguration _configuration;

    public TokenServico(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GerarToken(Guid usuarioId, Guid empresaId, string nome, string email, string perfil)
    {
        var chave = _configuration["Jwt:Chave"]!;

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuarioId.ToString()),
            new Claim("EmpresaId", empresaId.ToString()),
            new Claim(JwtRegisteredClaimNames.Name, nome),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim("Perfil", perfil)
        };

        var chaveSeguranca = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(chave));

        var credenciais = new SigningCredentials(
            chaveSeguranca,
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Emissor"],
            audience: _configuration["Jwt:Audiencia"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credenciais);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}