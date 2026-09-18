namespace AgendaMarcada.Domain.Entidades;

public class Empresa
{
    public Guid Id { get; set; }

    public string NomeNegocio { get; set; } = string.Empty;

    public string NomeResponsavel { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Telefone { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? LogoUrl { get; set; }

    public string? Descricao { get; set; }

    public string Status { get; set; } = "Ativa";

    public DateTime DataCadastro { get; set; }

    public DateTime? DataAtualizacao { get; set; }
}