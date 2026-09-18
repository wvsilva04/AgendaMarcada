using AgendaMarcada.Domain.Entidades;
using AgendaMarcada.Infrastructure.Persistencia;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgendaMarcada.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HorariosTrabalhoController : ControllerBase
{
    private readonly AgendaMarcadaDbContext _context;

    public HorariosTrabalhoController(AgendaMarcadaDbContext context)
    {
        _context = context;
    }

    [HttpGet("{profissionalId}")]
    public async Task<IActionResult> Listar(Guid profissionalId)
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
                x.Id == profissionalId &&
                x.EmpresaId == empresaId);

        if (profissional == null)
        {
            return NotFound(new
            {
                mensagem = "Profissional não encontrado."
            });
        }

        var horarios = await _context.HorariosTrabalho
            .Where(x => x.ProfissionalId == profissionalId)
            .OrderBy(x => x.DiaSemana)
            .ThenBy(x => x.HoraInicio)
            .Select(x => new
            {
                x.Id,
                x.ProfissionalId,
                x.DiaSemana,
                x.HoraInicio,
                x.HoraFim,
                x.Ativo
            })
            .ToListAsync();

        return Ok(horarios);
    }

    [HttpPost("{profissionalId}")]
    public async Task<IActionResult> Salvar(
        Guid profissionalId,
        [FromBody] SalvarHorarioRequest dados)
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
                x.Id == profissionalId &&
                x.EmpresaId == empresaId);

        if (profissional == null)
        {
            return NotFound(new
            {
                mensagem = "Profissional não encontrado."
            });
        }

        if (dados.DiaSemana < 0 || dados.DiaSemana > 6)
        {
            return BadRequest(new
            {
                mensagem = "Dia da semana inválido."
            });
        }

        if (dados.HoraInicio >= dados.HoraFim)
        {
            return BadRequest(new
            {
                mensagem = "A hora de início deve ser anterior à hora de fim."
            });
        }

        var conflito = await _context.HorariosTrabalho
            .AnyAsync(x =>
                x.ProfissionalId == profissionalId &&
                x.DiaSemana == dados.DiaSemana &&
                x.Ativo &&
                dados.HoraInicio < x.HoraFim &&
                dados.HoraFim > x.HoraInicio);

        if (conflito)
        {
            return BadRequest(new
            {
                mensagem = "Já existe um horário que entra em conflito com este período."
            });
        }

        var horario = new HorarioTrabalho
        {
            Id = Guid.NewGuid(),
            ProfissionalId = profissionalId,
            DiaSemana = dados.DiaSemana,
            HoraInicio = dados.HoraInicio,
            HoraFim = dados.HoraFim,
            Ativo = true
        };

        _context.HorariosTrabalho.Add(horario);

        await _context.SaveChangesAsync();

        return Ok(horario);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Editar(
        Guid id,
        [FromBody] SalvarHorarioRequest dados)
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

        var horario = await _context.HorariosTrabalho
            .Include(x => x.Profissional)
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.Profissional.EmpresaId == empresaId);

        if (horario == null)
        {
            return NotFound(new
            {
                mensagem = "Horário não encontrado."
            });
        }

        if (dados.DiaSemana < 0 || dados.DiaSemana > 6)
        {
            return BadRequest(new
            {
                mensagem = "Dia da semana inválido."
            });
        }

        if (dados.HoraInicio >= dados.HoraFim)
        {
            return BadRequest(new
            {
                mensagem = "A hora de início deve ser anterior à hora de fim."
            });
        }

        var conflito = await _context.HorariosTrabalho
            .AnyAsync(x =>
                x.Id != id &&
                x.ProfissionalId == horario.ProfissionalId &&
                x.DiaSemana == dados.DiaSemana &&
                x.Ativo &&
                dados.HoraInicio < x.HoraFim &&
                dados.HoraFim > x.HoraInicio);

        if (conflito)
        {
            return BadRequest(new
            {
                mensagem = "Já existe um horário que entra em conflito com este período."
            });
        }

        horario.DiaSemana = dados.DiaSemana;
        horario.HoraInicio = dados.HoraInicio;
        horario.HoraFim = dados.HoraFim;

        await _context.SaveChangesAsync();

        return Ok(horario);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> AlterarStatus(Guid id)
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

        var horario = await _context.HorariosTrabalho
            .Include(x => x.Profissional)
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.Profissional.EmpresaId == empresaId);

        if (horario == null)
        {
            return NotFound(new
            {
                mensagem = "Horário não encontrado."
            });
        }

        horario.Ativo = !horario.Ativo;

        await _context.SaveChangesAsync();

        return Ok(horario);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Excluir(Guid id)
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

        var horario = await _context.HorariosTrabalho
            .Include(x => x.Profissional)
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.Profissional.EmpresaId == empresaId);

        if (horario == null)
        {
            return NotFound(new
            {
                mensagem = "Horário não encontrado."
            });
        }

        _context.HorariosTrabalho.Remove(horario);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Horário excluído com sucesso."
        });
    }
}

public class SalvarHorarioRequest
{
    public int DiaSemana { get; set; }

    public TimeSpan HoraInicio { get; set; }

    public TimeSpan HoraFim { get; set; }
}