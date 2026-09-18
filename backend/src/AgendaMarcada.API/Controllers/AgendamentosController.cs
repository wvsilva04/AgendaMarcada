using AgendaMarcada.Domain.Entidades;
using AgendaMarcada.Infrastructure.Persistencia;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgendaMarcada.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AgendamentosController : ControllerBase
{
    private readonly AgendaMarcadaDbContext _context;

    public AgendamentosController(AgendaMarcadaDbContext context)
    {
        _context = context;
    }

    // ==============================
    // LISTAR AGENDAMENTOS
    // ==============================

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

        var agendamentos = await _context.Agendamentos
            .Where(x => x.EmpresaId == empresaId)
            .OrderBy(x => x.DataHoraInicio)
            .Select(x => new
            {
                x.Id,

                x.ClienteId,
                ClienteNome = x.Cliente.Nome,
                ClienteTelefone = x.Cliente.Telefone,

                x.ServicoId,
                ServicoNome = x.Servico.Nome,
                ServicoDuracaoMinutos = x.Servico.DuracaoMinutos,
                ServicoPreco = x.Servico.Preco,

                x.ProfissionalId,
                ProfissionalNome = x.Profissional.Nome,

                x.DataHoraInicio,
                x.DataHoraFim,
                x.Status,
                x.Observacao,
                x.DataCadastro,
                x.DataAtualizacao
            })
            .ToListAsync();

        return Ok(agendamentos);
    }

    // ==============================
    // LISTAR HORÁRIOS DISPONÍVEIS
    // ==============================

    [HttpGet("disponibilidade")]
    public async Task<IActionResult> Disponibilidade(
        [FromQuery] Guid servicoId,
        [FromQuery] Guid profissionalId,
        [FromQuery] DateTime data,
        [FromQuery] Guid? agendamentoId)
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
                x.Id == servicoId &&
                x.EmpresaId == empresaId &&
                x.Ativo);

        if (servico == null)
        {
            return BadRequest(new
            {
                mensagem = "Serviço não encontrado ou inativo."
            });
        }

        var profissional = await _context.Profissionais
            .FirstOrDefaultAsync(x =>
                x.Id == profissionalId &&
                x.EmpresaId == empresaId &&
                x.Ativo);

        if (profissional == null)
        {
            return BadRequest(new
            {
                mensagem = "Profissional não encontrado ou inativo."
            });
        }

        var atendeServico = await _context.ProfissionalServicos
            .AnyAsync(x =>
                x.ProfissionalId == profissionalId &&
                x.ServicoId == servicoId);

        if (!atendeServico)
        {
            return BadRequest(new
            {
                mensagem =
                    "O profissional não atende este serviço."
            });
        }

        var diaSemana = (int)data.DayOfWeek;

        var horariosTrabalho =
            await _context.HorariosTrabalho
                .Where(x =>
                    x.ProfissionalId == profissionalId &&
                    x.DiaSemana == diaSemana &&
                    x.Ativo)
                .OrderBy(x => x.HoraInicio)
                .ToListAsync();

        if (!horariosTrabalho.Any())
        {
            return Ok(new List<object>());
        }

        var inicioDiaLocal =
            DateTime.SpecifyKind(
                data.Date,
                DateTimeKind.Unspecified);

        var fusoBrasil =
            TimeZoneInfo.FindSystemTimeZoneById(
                OperatingSystem.IsWindows()
                    ? "E. South America Standard Time"
                    : "America/Sao_Paulo");

        var inicioDiaUtc =
            TimeZoneInfo.ConvertTimeToUtc(
                inicioDiaLocal,
                fusoBrasil);

        var fimDiaUtc =
            inicioDiaUtc.AddDays(1);

        var agendamentos =
            await _context.Agendamentos
                .Where(x =>
                    x.EmpresaId == empresaId &&
                    x.ProfissionalId == profissionalId &&
                    x.Status != "Cancelado" &&
                    x.DataHoraInicio < fimDiaUtc &&
                    x.DataHoraFim > inicioDiaUtc &&
                    (!agendamentoId.HasValue ||
                     x.Id != agendamentoId.Value))
                .OrderBy(x => x.DataHoraInicio)
                .ToListAsync();

        var horariosDisponiveis =
            new List<object>();

        var duracao =
            TimeSpan.FromMinutes(
                servico.DuracaoMinutos);

        foreach (var horarioTrabalho in horariosTrabalho)
        {
            var inicioLocal =
                DateTime.SpecifyKind(
                    data.Date.Add(
                        horarioTrabalho.HoraInicio),
                    DateTimeKind.Unspecified);

            var fimLocal =
                DateTime.SpecifyKind(
                    data.Date.Add(
                        horarioTrabalho.HoraFim),
                    DateTimeKind.Unspecified);

            var inicioUtc =
                TimeZoneInfo.ConvertTimeToUtc(
                    inicioLocal,
                    fusoBrasil);

            var fimUtc =
                TimeZoneInfo.ConvertTimeToUtc(
                    fimLocal,
                    fusoBrasil);

            var horarioAtual =
                inicioUtc;

            while (
                horarioAtual.Add(duracao)
                <= fimUtc)
            {
                var horarioFim =
                    horarioAtual.Add(duracao);

                var conflito =
                    agendamentos.Any(x =>
                        horarioAtual <
                            x.DataHoraFim &&
                        horarioFim >
                            x.DataHoraInicio);

                if (!conflito)
                {
                    horariosDisponiveis.Add(
                        new
                        {
                            dataHoraInicio =
                                horarioAtual,
                            dataHoraFim =
                                horarioFim
                        });
                }

                horarioAtual =
                    horarioFim;
            }
        }

        return Ok(horariosDisponiveis);
    }

    // ==============================
    // LISTAR HORÁRIOS DISPONÍVEIS - PÚBLICO
    // ==============================

    [AllowAnonymous]
    [HttpGet("disponibilidade-publica/{slug}")]
    public async Task<IActionResult> DisponibilidadePublica(
        string slug,
        [FromQuery] Guid servicoId,
        [FromQuery] Guid profissionalId,
        [FromQuery] DateTime data)
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

        var servico = await _context.Servicos
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.Id == servicoId &&
                x.EmpresaId == empresa.Id &&
                x.Ativo);

        if (servico == null)
        {
            return BadRequest(new
            {
                mensagem =
                    "Serviço não encontrado ou inativo."
            });
        }

        var profissional = await _context.Profissionais
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.Id == profissionalId &&
                x.EmpresaId == empresa.Id &&
                x.Ativo);

        if (profissional == null)
        {
            return BadRequest(new
            {
                mensagem =
                    "Profissional não encontrado ou inativo."
            });
        }

        var atendeServico =
            await _context.ProfissionalServicos
                .AnyAsync(x =>
                    x.ProfissionalId == profissionalId &&
                    x.ServicoId == servicoId);

        if (!atendeServico)
        {
            return BadRequest(new
            {
                mensagem =
                    "O profissional não atende este serviço."
            });
        }

        var fusoBrasil =
            TimeZoneInfo.FindSystemTimeZoneById(
                OperatingSystem.IsWindows()
                    ? "E. South America Standard Time"
                    : "America/Sao_Paulo");

        var agoraBrasil =
            TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.UtcNow,
                fusoBrasil);

        var diaSemana =
            (int)data.DayOfWeek;

        var horariosTrabalho =
            await _context.HorariosTrabalho
                .AsNoTracking()
                .Where(x =>
                    x.ProfissionalId == profissionalId &&
                    x.DiaSemana == diaSemana &&
                    x.Ativo)
                .OrderBy(x => x.HoraInicio)
                .ToListAsync();

        if (!horariosTrabalho.Any())
        {
            return Ok(new List<object>());
        }

        var inicioDiaLocal =
            DateTime.SpecifyKind(
                data.Date,
                DateTimeKind.Unspecified);

        var inicioDiaUtc =
            TimeZoneInfo.ConvertTimeToUtc(
                inicioDiaLocal,
                fusoBrasil);

        var fimDiaUtc =
            inicioDiaUtc.AddDays(1);

        var agendamentos =
            await _context.Agendamentos
                .AsNoTracking()
                .Where(x =>
                    x.EmpresaId == empresa.Id &&
                    x.ProfissionalId == profissionalId &&
                    x.Status != "Cancelado" &&
                    x.DataHoraInicio < fimDiaUtc &&
                    x.DataHoraFim > inicioDiaUtc)
                .OrderBy(x => x.DataHoraInicio)
                .ToListAsync();

        var horariosDisponiveis =
            new List<object>();

        var duracao =
            TimeSpan.FromMinutes(
                servico.DuracaoMinutos);

        var ehHoje =
            data.Date == agoraBrasil.Date;

        foreach (var horarioTrabalho in horariosTrabalho)
        {
            var inicioLocal =
                DateTime.SpecifyKind(
                    data.Date.Add(
                        horarioTrabalho.HoraInicio),
                    DateTimeKind.Unspecified);

            var fimLocal =
                DateTime.SpecifyKind(
                    data.Date.Add(
                        horarioTrabalho.HoraFim),
                    DateTimeKind.Unspecified);

            var inicioUtc =
                TimeZoneInfo.ConvertTimeToUtc(
                    inicioLocal,
                    fusoBrasil);

            var fimUtc =
                TimeZoneInfo.ConvertTimeToUtc(
                    fimLocal,
                    fusoBrasil);

            var horarioAtual =
                inicioUtc;

            while (
                horarioAtual.Add(duracao)
                <= fimUtc)
            {
                var horarioFim =
                    horarioAtual.Add(duracao);

                var horarioAtualBrasil =
                    TimeZoneInfo.ConvertTimeFromUtc(
                        horarioAtual,
                        fusoBrasil);

                var horarioJaPassou =
                    ehHoje &&
                    horarioAtualBrasil <= agoraBrasil;

                var conflito =
                    agendamentos.Any(x =>
                        horarioAtual <
                            x.DataHoraFim &&
                        horarioFim >
                            x.DataHoraInicio);

                if (!horarioJaPassou && !conflito)
                {
                    horariosDisponiveis.Add(
                        new
                        {
                            dataHoraInicio =
                                horarioAtual,
                            dataHoraFim =
                                horarioFim
                        });
                }

                horarioAtual =
                    horarioFim;
            }
        }

        return Ok(horariosDisponiveis);
    }

    // ==============================
    // CRIAR AGENDAMENTO
    // ==============================

    [HttpPost]
    public async Task<IActionResult> Criar(
        [FromBody] CriarAgendamentoRequest request)
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

        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(x =>
                x.Id == request.ClienteId &&
                x.EmpresaId == empresaId);

        if (cliente == null)
        {
            return BadRequest(new
            {
                mensagem = "Cliente não encontrado."
            });
        }

        var servico = await _context.Servicos
            .FirstOrDefaultAsync(x =>
                x.Id == request.ServicoId &&
                x.EmpresaId == empresaId &&
                x.Ativo);

        if (servico == null)
        {
            return BadRequest(new
            {
                mensagem =
                    "Serviço não encontrado ou inativo."
            });
        }

        var profissional = await _context.Profissionais
            .FirstOrDefaultAsync(x =>
                x.Id == request.ProfissionalId &&
                x.EmpresaId == empresaId &&
                x.Ativo);

        if (profissional == null)
        {
            return BadRequest(new
            {
                mensagem =
                    "Profissional não encontrado ou inativo."
            });
        }

        var atendeServico =
            await _context.ProfissionalServicos
                .AnyAsync(x =>
                    x.ProfissionalId ==
                        request.ProfissionalId &&
                    x.ServicoId ==
                        request.ServicoId);

        if (!atendeServico)
        {
            return BadRequest(new
            {
                mensagem =
                    "O profissional não atende este serviço."
            });
        }

        var dataHoraFim =
            request.DataHoraInicio.AddMinutes(
                servico.DuracaoMinutos);

        var existeConflito =
            await _context.Agendamentos
                .AnyAsync(x =>
                    x.Id != Guid.Empty &&
                    x.EmpresaId == empresaId &&
                    x.ProfissionalId ==
                        request.ProfissionalId &&
                    x.Status != "Cancelado" &&
                    request.DataHoraInicio <
                        x.DataHoraFim &&
                    dataHoraFim >
                        x.DataHoraInicio);

        if (existeConflito)
        {
            return Conflict(new
            {
                mensagem =
                    "O profissional já possui um agendamento nesse horário."
            });
        }

        var agendamento =
            new Agendamento
            {
                Id = Guid.NewGuid(),
                EmpresaId = empresaId,
                ClienteId = request.ClienteId,
                ServicoId = request.ServicoId,
                ProfissionalId =
                    request.ProfissionalId,
                DataHoraInicio =
                    request.DataHoraInicio,
                DataHoraFim =
                    dataHoraFim,
                Status = "Pendente",
                Observacao =
                    request.Observacao,
                DataCadastro =
                    DateTime.UtcNow
            };

        _context.Agendamentos.Add(
            agendamento);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(Listar),
            new
            {
                id = agendamento.Id
            },
            new
            {
                agendamento.Id,
                agendamento.DataHoraInicio,
                agendamento.DataHoraFim,
                agendamento.Status
            });
    }

    // ==============================
    // CRIAR AGENDAMENTO - PÚBLICO
    // ==============================

    [AllowAnonymous]
    [HttpPost("publico/{slug}")]
    public async Task<IActionResult> CriarPublico(
        string slug,
        [FromBody] CriarAgendamentoPublicoRequest request)
    {
        var empresa = await _context.Empresas
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

        if (string.IsNullOrWhiteSpace(request.Nome))
        {
            return BadRequest(new
            {
                mensagem = "Informe seu nome."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Telefone))
        {
            return BadRequest(new
            {
                mensagem = "Informe seu telefone."
            });
        }

        var servico = await _context.Servicos
            .FirstOrDefaultAsync(x =>
                x.Id == request.ServicoId &&
                x.EmpresaId == empresa.Id &&
                x.Ativo);

        if (servico == null)
        {
            return BadRequest(new
            {
                mensagem =
                    "Serviço não encontrado ou inativo."
            });
        }

        var profissional = await _context.Profissionais
            .FirstOrDefaultAsync(x =>
                x.Id == request.ProfissionalId &&
                x.EmpresaId == empresa.Id &&
                x.Ativo);

        if (profissional == null)
        {
            return BadRequest(new
            {
                mensagem =
                    "Profissional não encontrado ou inativo."
            });
        }

        var atendeServico =
            await _context.ProfissionalServicos
                .AnyAsync(x =>
                    x.ProfissionalId ==
                        request.ProfissionalId &&
                    x.ServicoId ==
                        request.ServicoId);

        if (!atendeServico)
        {
            return BadRequest(new
            {
                mensagem =
                    "O profissional não atende este serviço."
            });
        }

        var dataHoraFim =
            request.DataHoraInicio.AddMinutes(
                servico.DuracaoMinutos);

        var existeConflito =
            await _context.Agendamentos
                .AnyAsync(x =>
                    x.EmpresaId == empresa.Id &&
                    x.ProfissionalId ==
                        request.ProfissionalId &&
                    x.Status != "Cancelado" &&
                    request.DataHoraInicio <
                        x.DataHoraFim &&
                    dataHoraFim >
                        x.DataHoraInicio);

        if (existeConflito)
        {
            return Conflict(new
            {
                mensagem =
                    "Esse horário acabou de ser ocupado. Escolha outro horário."
            });
        }

        var nomeCliente =
            request.Nome.Trim();

        var telefoneCliente =
            request.Telefone.Trim();

        var cliente =
            await _context.Clientes
                .FirstOrDefaultAsync(x =>
                    x.EmpresaId == empresa.Id &&
                    x.Telefone == telefoneCliente);

        if (cliente == null)
        {
            cliente = new Cliente
            {
                Id = Guid.NewGuid(),
                EmpresaId = empresa.Id,
                Nome = nomeCliente,
                Telefone = telefoneCliente,
                Ativo = true,
                DataCadastro = DateTime.UtcNow
            };

            _context.Clientes.Add(cliente);
        }
        else
        {
            cliente.Nome = nomeCliente;
            cliente.Ativo = true;
            cliente.DataAtualizacao =
                DateTime.UtcNow;
        }

        var agendamento =
            new Agendamento
            {
                Id = Guid.NewGuid(),
                EmpresaId = empresa.Id,
                ClienteId = cliente.Id,
                ServicoId = request.ServicoId,
                ProfissionalId =
                    request.ProfissionalId,
                DataHoraInicio =
                    request.DataHoraInicio,
                DataHoraFim =
                    dataHoraFim,
                Status = "Pendente",
                DataCadastro =
                    DateTime.UtcNow
            };

        _context.Agendamentos.Add(
            agendamento);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem =
                "Agendamento realizado com sucesso.",

            agendamentoId =
                agendamento.Id,

            dataHoraInicio =
                agendamento.DataHoraInicio,

            dataHoraFim =
                agendamento.DataHoraFim
        });
    }

    // ==============================
    // EDITAR AGENDAMENTO
    // ==============================

    [HttpPut("{id}")]
    public async Task<IActionResult> Editar(
        Guid id,
        [FromBody] EditarAgendamentoRequest request)
    {
        var empresaIdClaim =
            User.FindFirst("EmpresaId")?.Value;

        if (!Guid.TryParse(
                empresaIdClaim,
                out var empresaId))
        {
            return Unauthorized(new
            {
                mensagem = "Token inválido."
            });
        }

        var agendamento =
            await _context.Agendamentos
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.EmpresaId == empresaId);

        if (agendamento == null)
        {
            return NotFound(new
            {
                mensagem =
                    "Agendamento não encontrado."
            });
        }

        if (agendamento.Status == "Cancelado")
        {
            return BadRequest(new
            {
                mensagem =
                    "Não é possível editar um agendamento cancelado."
            });
        }

        var cliente =
            await _context.Clientes
                .FirstOrDefaultAsync(x =>
                    x.Id == request.ClienteId &&
                    x.EmpresaId == empresaId &&
                    x.Ativo);

        if (cliente == null)
        {
            return BadRequest(new
            {
                mensagem =
                    "Cliente não encontrado ou inativo."
            });
        }

        var servico =
            await _context.Servicos
                .FirstOrDefaultAsync(x =>
                    x.Id == request.ServicoId &&
                    x.EmpresaId == empresaId &&
                    x.Ativo);

        if (servico == null)
        {
            return BadRequest(new
            {
                mensagem =
                    "Serviço não encontrado ou inativo."
            });
        }

        var profissional =
            await _context.Profissionais
                .FirstOrDefaultAsync(x =>
                    x.Id == request.ProfissionalId &&
                    x.EmpresaId == empresaId &&
                    x.Ativo);

        if (profissional == null)
        {
            return BadRequest(new
            {
                mensagem =
                    "Profissional não encontrado ou inativo."
            });
        }

        var atendeServico =
            await _context.ProfissionalServicos
                .AnyAsync(x =>
                    x.ProfissionalId ==
                        request.ProfissionalId &&
                    x.ServicoId ==
                        request.ServicoId);

        if (!atendeServico)
        {
            return BadRequest(new
            {
                mensagem =
                    "O profissional não atende este serviço."
            });
        }

        var dataHoraFim =
            request.DataHoraInicio.AddMinutes(
                servico.DuracaoMinutos);

        var existeConflito =
            await _context.Agendamentos
                .AnyAsync(x =>
                    x.Id != id &&
                    x.EmpresaId == empresaId &&
                    x.ProfissionalId ==
                        request.ProfissionalId &&
                    x.Status != "Cancelado" &&
                    request.DataHoraInicio <
                        x.DataHoraFim &&
                    dataHoraFim >
                        x.DataHoraInicio);

        if (existeConflito)
        {
            return Conflict(new
            {
                mensagem =
                    "O profissional já possui um agendamento nesse horário."
            });
        }

        agendamento.ClienteId =
            request.ClienteId;

        agendamento.ServicoId =
            request.ServicoId;

        agendamento.ProfissionalId =
            request.ProfissionalId;

        agendamento.DataHoraInicio =
            request.DataHoraInicio;

        agendamento.DataHoraFim =
            dataHoraFim;

        agendamento.Observacao =
            request.Observacao;

        agendamento.DataAtualizacao =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem =
                "Agendamento atualizado com sucesso."
        });
    }

    // ==============================
    // CANCELAR AGENDAMENTO
    // ==============================

    [HttpPut("{id}/cancelar")]
    public async Task<IActionResult> Cancelar(
        Guid id)
    {
        var empresaIdClaim =
            User.FindFirst("EmpresaId")?.Value;

        if (!Guid.TryParse(
                empresaIdClaim,
                out var empresaId))
        {
            return Unauthorized(new
            {
                mensagem = "Token inválido."
            });
        }

        var agendamento =
            await _context.Agendamentos
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.EmpresaId == empresaId);

        if (agendamento == null)
        {
            return NotFound(new
            {
                mensagem =
                    "Agendamento não encontrado."
            });
        }

        if (agendamento.Status == "Cancelado")
        {
            return BadRequest(new
            {
                mensagem =
                    "O agendamento já está cancelado."
            });
        }

        agendamento.Status =
            "Cancelado";

        agendamento.DataAtualizacao =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem =
                "Agendamento cancelado com sucesso."
        });
    }

    // ==============================
    // CONFIRMAR AGENDAMENTO
    // ==============================

    [HttpPut("{id}/confirmar")]
    public async Task<IActionResult> Confirmar(
        Guid id)
    {
        var empresaIdClaim =
            User.FindFirst("EmpresaId")?.Value;

        if (!Guid.TryParse(
                empresaIdClaim,
                out var empresaId))
        {
            return Unauthorized(new
            {
                mensagem = "Token inválido."
            });
        }

        var agendamento =
            await _context.Agendamentos
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.EmpresaId == empresaId);

        if (agendamento == null)
        {
            return NotFound(new
            {
                mensagem =
                    "Agendamento não encontrado."
            });
        }

        if (agendamento.Status != "Pendente")
        {
            return BadRequest(new
            {
                mensagem =
                    "Somente agendamentos pendentes podem ser confirmados."
            });
        }

        agendamento.Status =
            "Confirmado";

        agendamento.DataAtualizacao =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem =
                "Agendamento confirmado com sucesso."
        });
    }

    // ==============================
    // REATIVAR AGENDAMENTO
    // ==============================

    [HttpPut("{id}/ativar")]
    public async Task<IActionResult> Ativar(
        Guid id)
    {
        var empresaIdClaim =
            User.FindFirst("EmpresaId")?.Value;

        if (!Guid.TryParse(
                empresaIdClaim,
                out var empresaId))
        {
            return Unauthorized(new
            {
                mensagem = "Token inválido."
            });
        }

        var agendamento =
            await _context.Agendamentos
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.EmpresaId == empresaId);

        if (agendamento == null)
        {
            return NotFound(new
            {
                mensagem =
                    "Agendamento não encontrado."
            });
        }

        if (agendamento.Status != "Cancelado")
        {
            return BadRequest(new
            {
                mensagem =
                    "Somente agendamentos cancelados podem ser reativados."
            });
        }

        var existeConflito =
            await _context.Agendamentos
                .AnyAsync(x =>
                    x.Id != agendamento.Id &&
                    x.EmpresaId == empresaId &&
                    x.ProfissionalId ==
                        agendamento.ProfissionalId &&
                    x.Status != "Cancelado" &&
                    agendamento.DataHoraInicio <
                        x.DataHoraFim &&
                    agendamento.DataHoraFim >
                        x.DataHoraInicio);

        if (existeConflito)
        {
            return Conflict(new
            {
                mensagem =
                    "Não é possível reativar o agendamento porque o profissional já possui outro agendamento nesse horário."
            });
        }

        agendamento.Status =
            "Pendente";

        agendamento.DataAtualizacao =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem =
                "Agendamento reativado com sucesso."
        });
    }
}

// ==============================
// REQUEST - CRIAR
// ==============================

public class CriarAgendamentoRequest
{
    public Guid ClienteId { get; set; }

    public Guid ServicoId { get; set; }

    public Guid ProfissionalId { get; set; }

    public DateTime DataHoraInicio { get; set; }

    public string? Observacao { get; set; }
}

// ==============================
// REQUEST - CRIAR PÚBLICO
// ==============================

public class CriarAgendamentoPublicoRequest
{
    public Guid ServicoId { get; set; }

    public Guid ProfissionalId { get; set; }

    public DateTime DataHoraInicio { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string Telefone { get; set; } = string.Empty;
}

// ==============================
// REQUEST - EDITAR
// ==============================

public class EditarAgendamentoRequest
{
    public Guid ClienteId { get; set; }

    public Guid ServicoId { get; set; }

    public Guid ProfissionalId { get; set; }

    public DateTime DataHoraInicio { get; set; }

    public string? Observacao { get; set; }
}
