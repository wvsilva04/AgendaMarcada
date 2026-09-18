using AgendaMarcada.Domain.Entidades;
using AgendaMarcada.Infrastructure.Persistencia;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgendaMarcada.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfissionaisController : ControllerBase
{
    private readonly AgendaMarcadaDbContext _context;

    public ProfissionaisController(AgendaMarcadaDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> Criar(
        [FromBody] CriarProfissionalRequest dados)
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

        if (string.IsNullOrWhiteSpace(dados.Nome))
        {
            return BadRequest(new
            {
                mensagem = "Informe o nome do profissional."
            });
        }

        if (dados.ServicoIds == null ||
            dados.ServicoIds.Count == 0)
        {
            return BadRequest(new
            {
                mensagem = "Selecione pelo menos um serviço."
            });
        }

        var servicos = await _context.Servicos
            .Where(x =>
                x.EmpresaId == empresaId &&
                x.Ativo &&
                dados.ServicoIds.Contains(x.Id))
            .ToListAsync();

        if (servicos.Count != dados.ServicoIds.Count)
        {
            return BadRequest(new
            {
                mensagem = "Um ou mais serviços são inválidos."
            });
        }

        var profissional = new Profissional
        {
            Id = Guid.NewGuid(),
            EmpresaId = empresaId,
            Nome = dados.Nome.Trim(),
            Telefone = dados.Telefone,
            Email = dados.Email,
            Ativo = true,
            DataCadastro = DateTime.UtcNow
        };

        _context.Profissionais.Add(profissional);

        foreach (var servico in servicos)
        {
            _context.ProfissionalServicos.Add(
                new ProfissionalServico
                {
                    ProfissionalId = profissional.Id,
                    ServicoId = servico.Id
                });
        }

        await _context.SaveChangesAsync();

        return Ok(profissional);
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

        var profissionais = await _context.Profissionais
            .Where(x => x.EmpresaId == empresaId)
            .OrderBy(x => x.Nome)
            .Select(x => new
            {
                x.Id,
                x.Nome,
                x.Telefone,
                x.Email,
                x.Ativo,

                Servicos = _context.ProfissionalServicos
                    .Where(ps =>
                        ps.ProfissionalId == x.Id)
                    .Select(ps => new
                    {
                        ps.Servico.Id,
                        ps.Servico.Nome,
                        ps.Servico.DuracaoMinutos,
                        ps.Servico.Preco,
                        ps.Servico.Ativo
                    })
                    .OrderBy(s => s.Nome)
                    .ToList(),

                Horarios = _context.HorariosTrabalho
                    .Where(h =>
                        h.ProfissionalId == x.Id &&
                        h.Ativo)
                    .OrderBy(h => h.DiaSemana)
                    .ThenBy(h => h.HoraInicio)
                    .Select(h => new
                    {
                        h.Id,
                        h.DiaSemana,
                        h.HoraInicio,
                        h.HoraFim,
                        h.Ativo
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(profissionais);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Editar(
        Guid id,
        [FromBody] EditarProfissionalRequest dados)
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

        if (string.IsNullOrWhiteSpace(dados.Nome))
        {
            return BadRequest(new
            {
                mensagem = "Informe o nome do profissional."
            });
        }

        if (dados.ServicoIds == null ||
            dados.ServicoIds.Count == 0)
        {
            return BadRequest(new
            {
                mensagem = "Selecione pelo menos um serviço."
            });
        }

        var profissional = await _context.Profissionais
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.EmpresaId == empresaId);

        if (profissional == null)
        {
            return NotFound(new
            {
                mensagem = "Profissional não encontrado."
            });
        }

        var servicos = await _context.Servicos
            .Where(x =>
                x.EmpresaId == empresaId &&
                x.Ativo &&
                dados.ServicoIds.Contains(x.Id))
            .ToListAsync();

        if (servicos.Count != dados.ServicoIds.Count)
        {
            return BadRequest(new
            {
                mensagem = "Um ou mais serviços são inválidos."
            });
        }

        profissional.Nome = dados.Nome.Trim();
        profissional.Telefone = dados.Telefone;
        profissional.Email = dados.Email;
        profissional.DataAtualizacao = DateTime.UtcNow;

        var servicosAtuais =
            await _context.ProfissionalServicos
                .Where(x =>
                    x.ProfissionalId == id)
                .ToListAsync();

        _context.ProfissionalServicos
            .RemoveRange(servicosAtuais);

        foreach (var servico in servicos)
        {
            _context.ProfissionalServicos.Add(
                new ProfissionalServico
                {
                    ProfissionalId = profissional.Id,
                    ServicoId = servico.Id
                });
        }

        await _context.SaveChangesAsync();

        return Ok(profissional);
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

        var profissional = await _context.Profissionais
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.EmpresaId == empresaId);

        if (profissional == null)
        {
            return NotFound(new
            {
                mensagem = "Profissional não encontrado."
            });
        }

        profissional.Ativo = !profissional.Ativo;
        profissional.DataAtualizacao = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(profissional);
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

        var profissional = await _context.Profissionais
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.EmpresaId == empresaId);

        if (profissional == null)
        {
            return NotFound(new
            {
                mensagem = "Profissional não encontrado."
            });
        }

        _context.Profissionais.Remove(profissional);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Profissional excluído com sucesso."
        });
    }

    [AllowAnonymous]
    [HttpGet("publicos/{slug}/{servicoId}")]
    public async Task<IActionResult> ListarPublicos(
        string slug,
        Guid servicoId)
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

        var servicoExiste = await _context.Servicos
            .AsNoTracking()
            .AnyAsync(x =>
                x.Id == servicoId &&
                x.EmpresaId == empresa.Id &&
                x.Ativo);

        if (!servicoExiste)
        {
            return NotFound(new
            {
                mensagem = "Serviço não encontrado."
            });
        }

        var profissionais = await _context.ProfissionalServicos
            .AsNoTracking()
            .Where(x =>
                x.ServicoId == servicoId &&
                x.Profissional.EmpresaId == empresa.Id &&
                x.Profissional.Ativo)
            .OrderBy(x => x.Profissional.Nome)
            .Select(x => new
            {
                id = x.Profissional.Id,
                nome = x.Profissional.Nome
            })
            .ToListAsync();

        return Ok(profissionais);
    }
}

public class CriarProfissionalRequest
{
    public string Nome { get; set; } = string.Empty;

    public string? Telefone { get; set; }

    public string? Email { get; set; }

    public List<Guid> ServicoIds { get; set; } = new();
}

public class EditarProfissionalRequest
{
    public string Nome { get; set; } = string.Empty;

    public string? Telefone { get; set; }

    public string? Email { get; set; }

    public List<Guid> ServicoIds { get; set; } = new();
}

