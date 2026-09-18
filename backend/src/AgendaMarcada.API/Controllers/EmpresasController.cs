using AgendaMarcada.Infrastructure.Persistencia;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AgendaMarcada.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmpresasController : ControllerBase
{
    private readonly AgendaMarcadaDbContext _context;

    public EmpresasController(AgendaMarcadaDbContext context)
    {
        _context = context;
    }

    [HttpGet("publica/{slug}")]
    public async Task<IActionResult> BuscarPublica(string slug)
    {
        var empresa = await _context.Empresas
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.Slug.ToLower() == slug.ToLower() &&
                x.Status == "Ativa");

        if (empresa == null)
        {
            return NotFound(new
            {
                mensagem = "Empresa não encontrada."
            });
        }

        return Ok(new
        {
            id = empresa.Id,
            nomeNegocio = empresa.NomeNegocio,
            slug = empresa.Slug,
            logoUrl = empresa.LogoUrl,
            descricao = empresa.Descricao
        });
    }

    [Authorize]
    [HttpPut]
    public async Task<IActionResult> Atualizar()
    {
        var empresaIdClaim =
            User.FindFirst("EmpresaId")?.Value;

        if (!Guid.TryParse(empresaIdClaim, out var empresaId))
        {
            return Unauthorized(new
            {
                mensagem = "Token inválido."
            });
        }

        var empresa = await _context.Empresas
            .FirstOrDefaultAsync(x => x.Id == empresaId);

        if (empresa == null)
        {
            return NotFound(new
            {
                mensagem = "Empresa não encontrada."
            });
        }

        var dados = await Request.ReadFromJsonAsync<DadosEmpresaDto>();

        if (dados == null)
        {
            return BadRequest(new
            {
                mensagem = "Dados inválidos."
            });
        }

        if (string.IsNullOrWhiteSpace(dados.NomeNegocio))
        {
            return BadRequest(new
            {
                mensagem = "Informe o nome do negócio."
            });
        }

        if (string.IsNullOrWhiteSpace(dados.NomeResponsavel))
        {
            return BadRequest(new
            {
                mensagem = "Informe o nome do responsável."
            });
        }

        if (string.IsNullOrWhiteSpace(dados.Email))
        {
            return BadRequest(new
            {
                mensagem = "Informe o e-mail."
            });
        }

        if (string.IsNullOrWhiteSpace(dados.Telefone))
        {
            return BadRequest(new
            {
                mensagem = "Informe o telefone."
            });
        }

        empresa.NomeNegocio =
            dados.NomeNegocio.Trim();

        empresa.NomeResponsavel =
            dados.NomeResponsavel.Trim();

        empresa.Email =
            dados.Email.Trim().ToLower();

        empresa.Telefone =
            dados.Telefone.Trim();

        empresa.Descricao =
            string.IsNullOrWhiteSpace(dados.Descricao)
                ? null
                : dados.Descricao.Trim();

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Dados da empresa atualizados com sucesso."
        });
    }
}

public class DadosEmpresaDto
{
    public string NomeNegocio { get; set; } = "";
    public string NomeResponsavel { get; set; } = "";
    public string Email { get; set; } = "";
    public string Telefone { get; set; } = "";
    public string? Descricao { get; set; }
}

