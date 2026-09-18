namespace AgendaMarcada.Domain.Entidades;

public class Usuario
{
    public Guid Id { get; set; }

    public Guid EmpresaId { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string SenhaHash { get; set; } = string.Empty;

    public string Perfil { get; set; } = "Administrador";

    public string Status { get; set; } = "Ativo";

    public DateTime DataCadastro { get; set; }

    public DateTime? DataAtualizacao { get; set; }

    public Empresa? Empresa { get; set; }
}