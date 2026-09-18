using AgendaMarcada.Application.DTOs;
using AgendaMarcada.Application.Servicos;
using AgendaMarcada.Infrastructure.Persistencia;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AgendaMarcada.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AgendaMarcadaDbContext _context;
    private readonly SenhaServico _senhaServico;
    private readonly TokenServico _tokenServico;

    public AuthController(
        AgendaMarcadaDbContext context,
        SenhaServico senhaServico,
        TokenServico tokenServico)
    {
        _context = context;
        _senhaServico = senhaServico;
        _tokenServico = tokenServico;
    }

    [HttpPost("cadastrar")]
    public async Task<IActionResult> Cadastrar(CadastrarDto dto)
    {
        var email = dto.Email.Trim().ToLower();

        var emailExiste = await _context.Usuarios
            .AnyAsync(x => x.Email.ToLower() == email);

        if (emailExiste)
        {
            return BadRequest(new
            {
                mensagem = "Este e-mail já está cadastrado."
            });
        }

        var slug = dto.Slug.Trim().ToLower();

        var slugExiste = await _context.Empresas
            .AnyAsync(x => x.Slug == slug);

        if (slugExiste)
        {
            return BadRequest(new
            {
                mensagem = "Este endereço do AgendaMarcada já está em uso."
            });
        }

        var empresa = new AgendaMarcada.Domain.Entidades.Empresa
        {
            Id = Guid.NewGuid(),
            NomeNegocio = dto.NomeNegocio.Trim(),
            NomeResponsavel = dto.NomeResponsavel.Trim(),
            Email = email,
            Telefone = dto.Telefone.Trim(),
            Slug = slug,
            Status = "Ativa",
            DataCadastro = DateTime.UtcNow
        };

        var usuario = new AgendaMarcada.Domain.Entidades.Usuario
        {
            Id = Guid.NewGuid(),
            EmpresaId = empresa.Id,
            Nome = dto.NomeResponsavel.Trim(),
            Email = email,
            SenhaHash = _senhaServico.GerarHash(dto.Senha),
            Perfil = "Administrador",
            Status = "Ativo",
            DataCadastro = DateTime.UtcNow
        };

        _context.Empresas.Add(empresa);
        _context.Usuarios.Add(usuario);

        await _context.SaveChangesAsync();

        var token = _tokenServico.GerarToken(
            usuario.Id,
            empresa.Id,
            usuario.Nome,
            usuario.Email, 
            usuario.Perfil);

        return Ok(new
        {
            token,
            usuario = new
            {
                usuario.Id,
                usuario.Nome,
                usuario.Email,
                usuario.Perfil
            },
            empresa = new
            {
                empresa.Id,
                empresa.NomeNegocio,
                empresa.Slug
            }
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var email = dto.Email.Trim().ToLower();

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(x => x.Email.ToLower() == email);

        if (usuario == null)
        {
            return Unauthorized(new
            {
                mensagem = "E-mail ou senha inválidos."
            });
        }

        if (usuario.Status != "Ativo")
        {
            return Unauthorized(new
            {
                mensagem = "Usuário inativo."
            });
        }

        var senhaValida = _senhaServico.VerificarSenha(
            dto.Senha,
            usuario.SenhaHash);

        if (!senhaValida)
        {
            return Unauthorized(new
            {
                mensagem = "E-mail ou senha inválidos."
            });
        }

        var empresa = await _context.Empresas
            .FirstOrDefaultAsync(x => x.Id == usuario.EmpresaId);

        if (empresa == null)
        {
            return Unauthorized(new
            {
                mensagem = "Empresa não encontrada."
            });
        }

        if (empresa.Status != "Ativa")
        {
            return Unauthorized(new
            {
                mensagem = "Esta empresa está bloqueada."
            });
        }

        var token = _tokenServico.GerarToken(
            usuario.Id,
            usuario.EmpresaId,
            usuario.Nome,
            usuario.Email, 
            usuario.Perfil);

        return Ok(new
        {
            token,
            usuario = new
            {
                usuario.Id,
                usuario.Nome,
                usuario.Email,
                usuario.Perfil
            },
            empresa = new
            {
                empresa.Id,
                empresa.NomeNegocio,
                empresa.Slug
            }
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var usuarioIdClaim =
            User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var empresaIdClaim =
            User.FindFirst("EmpresaId")?.Value;

        if (!Guid.TryParse(usuarioIdClaim, out var usuarioId) ||
            !Guid.TryParse(empresaIdClaim, out var empresaId))
        {
            return Unauthorized(new
            {
                mensagem = "Token inválido."
            });
        }

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(x =>
                x.Id == usuarioId &&
                x.EmpresaId == empresaId);

        if (usuario == null || usuario.Status != "Ativo")
        {
            return Unauthorized(new
            {
                mensagem = "Usuário não encontrado ou inativo."
            });
        }

        var empresa = await _context.Empresas
            .FirstOrDefaultAsync(x => x.Id == empresaId);

        if (empresa == null || empresa.Status != "Ativa")
        {
            return Unauthorized(new
            {
                mensagem = "Empresa não encontrada ou bloqueada."
            });
        }

        return Ok(new
        {
            usuario = new
            {
                usuario.Id,
                usuario.Nome,
                usuario.Email,
                usuario.Perfil
            },
            empresa = new
            {
                empresa.Id,
                empresa.NomeNegocio,
                empresa.NomeResponsavel,
                empresa.Email,
                empresa.Telefone,
                empresa.Slug,
                empresa.LogoUrl,
                empresa.Descricao
            }
        });
    }
}