using AgendaMarcada.Application.DTOs;
using FluentValidation;

namespace AgendaMarcada.Application.Validadores;

public class CriarEmpresaValidador : AbstractValidator<CriarEmpresaDto>
{
    public CriarEmpresaValidador()
    {
        RuleFor(x => x.NomeNegocio)
            .NotEmpty()
            .WithMessage("O nome do negócio é obrigatório.");

        RuleFor(x => x.NomeResponsavel)
            .NotEmpty()
            .WithMessage("O nome do responsável é obrigatório.");

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .WithMessage("Informe um e-mail válido.");

        RuleFor(x => x.Telefone)
            .NotEmpty()
            .WithMessage("O telefone é obrigatório.");

        RuleFor(x => x.Slug)
            .NotEmpty()
            .WithMessage("O endereço do AgendaMarcada é obrigatório.");
    }
}