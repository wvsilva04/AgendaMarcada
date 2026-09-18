namespace AgendaMarcada.Application.DTOs;

public class CadastrarDto
{
    public string NomeNegocio { get; set; } = string.Empty;

    public string NomeResponsavel { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Telefone { get; set; } = string.Empty;

    public string Senha { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;
}