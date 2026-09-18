namespace AgendaMarcada.Domain.Entidades;

public class Servico
{
    public Guid Id { get; set; }

    public Guid EmpresaId { get; set; }

    public string Nome { get; set; } = string.Empty;

    public int DuracaoMinutos { get; set; }

    public decimal Preco { get; set; }

    public bool Ativo { get; set; } = true;

    public DateTime DataCadastro { get; set; }

    public DateTime? DataAtualizacao { get; set; }
}