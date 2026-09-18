namespace AgendaMarcada.Domain.Entidades;

public class Agendamento
{
    public Guid Id { get; set; }

    public Guid EmpresaId { get; set; }

    public Guid ClienteId { get; set; }

    public Guid ServicoId { get; set; }

    public Guid ProfissionalId { get; set; }

    public DateTime DataHoraInicio { get; set; }

    public DateTime DataHoraFim { get; set; }

    public string Status { get; set; } = "Agendado";

    public string? Observacao { get; set; }

    public DateTime DataCadastro { get; set; }

    public DateTime? DataAtualizacao { get; set; }


    // Relacionamentos

    public Empresa Empresa { get; set; } = null!;

    public Cliente Cliente { get; set; } = null!;

    public Servico Servico { get; set; } = null!;

    public Profissional Profissional { get; set; } = null!;
}