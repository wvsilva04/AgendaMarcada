namespace AgendaMarcada.Domain.Entidades;

public class HorarioTrabalho
{
    public Guid Id { get; set; }

    public Guid ProfissionalId { get; set; }

    public int DiaSemana { get; set; }

    public TimeSpan HoraInicio { get; set; }

    public TimeSpan HoraFim { get; set; }

    public bool Ativo { get; set; } = true;

    public Profissional Profissional { get; set; } = null!;
}