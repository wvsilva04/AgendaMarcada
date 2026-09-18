using AgendaMarcada.Domain.Entidades;
using AgendaMarcada.Infrastructure.Persistencia;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgendaMarcada.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClientesController : ControllerBase
{
    private readonly AgendaMarcadaDbContext _context;

    public ClientesController(AgendaMarcadaDbContext context)
    {
        _context = context;
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

        var clientes = await _context.Clientes
            .Where(x => x.EmpresaId == empresaId)
            .OrderBy(x => x.Nome)
            .Select(x => new
            {
                x.Id,
                x.Nome,
                x.Telefone,
                x.Ativo,
                x.DataCadastro,
                x.DataAtualizacao
            })
            .ToListAsync();

        return Ok(clientes);
    }

    [HttpPost]
    public async Task<IActionResult> Criar(
        [FromBody] CriarClienteRequest dados)
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
                mensagem = "Informe o nome do cliente."
            });
        }

        if (string.IsNullOrWhiteSpace(dados.Telefone))
        {
            return BadRequest(new
            {
                mensagem = "Informe o telefone do cliente."
            });
        }

        var cliente = new Cliente
        {
            Id = Guid.NewGuid(),
            EmpresaId = empresaId,
            Nome = dados.Nome.Trim(),
            Telefone = dados.Telefone.Trim(),
            Ativo = true,
            DataCadastro = DateTime.UtcNow
        };

        _context.Clientes.Add(cliente);

        await _context.SaveChangesAsync();

        return Ok(cliente);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Editar(
        Guid id,
        [FromBody] EditarClienteRequest dados)
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
                mensagem = "Informe o nome do cliente."
            });
        }

        if (string.IsNullOrWhiteSpace(dados.Telefone))
        {
            return BadRequest(new
            {
                mensagem = "Informe o telefone do cliente."
            });
        }

        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.EmpresaId == empresaId);

        if (cliente == null)
        {
            return NotFound(new
            {
                mensagem = "Cliente não encontrado."
            });
        }

        cliente.Nome = dados.Nome.Trim();
        cliente.Telefone = dados.Telefone.Trim();
        cliente.DataAtualizacao = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(cliente);
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

        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.EmpresaId == empresaId);

        if (cliente == null)
        {
            return NotFound(new
            {
                mensagem = "Cliente não encontrado."
            });
        }

        cliente.Ativo = !cliente.Ativo;
        cliente.DataAtualizacao = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(cliente);
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

        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.EmpresaId == empresaId);

        if (cliente == null)
        {
            return NotFound(new
            {
                mensagem = "Cliente não encontrado."
            });
        }

        _context.Clientes.Remove(cliente);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Cliente excluído com sucesso."
        });
    }
}

public class CriarClienteRequest
{
    public string Nome { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
}

public class EditarClienteRequest
{
    public string Nome { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
}