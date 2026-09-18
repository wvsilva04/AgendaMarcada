using AgendaMarcada.Domain.Entidades;
using AgendaMarcada.Infrastructure.Persistencia;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgendaMarcada.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServicosController : ControllerBase
{
    private readonly AgendaMarcadaDbContext _context;

    public ServicosController(AgendaMarcadaDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> Criar(Servico servico)
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

        servico.Id = Guid.NewGuid();
        servico.EmpresaId = empresaId;
        servico.DataCadastro = DateTime.UtcNow;
        servico.Ativo = true;

        _context.Servicos.Add(servico);

        await _context.SaveChangesAsync();

        return Ok(servico);
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
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

        var servicos = await _context.Servicos
            .Where(x => x.EmpresaId == empresaId)
            .OrderBy(x => x.Nome)
            .ToListAsync();

        return Ok(servicos);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Editar(
        Guid id,
        Servico dados)
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

        var servico = await _context.Servicos
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.EmpresaId == empresaId);

        if (servico == null)
        {
            return NotFound(new
            {
                mensagem = "Serviço não encontrado."
            });
        }

        servico.Nome = dados.Nome.Trim();
        servico.DuracaoMinutos = dados.DuracaoMinutos;
        servico.Preco = dados.Preco;
        servico.DataAtualizacao = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(servico);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> AlterarStatus(
        Guid id)
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

        var servico = await _context.Servicos
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.EmpresaId == empresaId);

        if (servico == null)
        {
            return NotFound(new
            {
                mensagem = "Serviço não encontrado."
            });
        }

        servico.Ativo = !servico.Ativo;
        servico.DataAtualizacao = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(servico);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Excluir(
        Guid id)
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

        var servico = await _context.Servicos
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.EmpresaId == empresaId);

        if (servico == null)
        {
            return NotFound(new
            {
                mensagem = "Serviço não encontrado."
            });
        }

        _context.Servicos.Remove(servico);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Serviço excluído com sucesso."
        });
    }

    [AllowAnonymous]
    [HttpGet("publicos/{slug}")]
    public async Task<IActionResult> ListarPublicos(
        string slug)
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

        var servicos = await _context.Servicos
            .AsNoTracking()
            .Where(x =>
                x.EmpresaId == empresa.Id &&
                x.Ativo)
            .OrderBy(x => x.Nome)
            .Select(x => new
            {
                x.Id,
                x.Nome,
                x.DuracaoMinutos,
                x.Preco
            })
            .ToListAsync();

        return Ok(servicos);
    }
}

