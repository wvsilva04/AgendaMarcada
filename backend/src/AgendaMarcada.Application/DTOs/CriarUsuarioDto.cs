namespace AgendaMarcada.Application.DTOs;

public class CriarUsuarioDto
{
    public Guid EmpresaId { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Senha { get; set; } = string.Empty;
}