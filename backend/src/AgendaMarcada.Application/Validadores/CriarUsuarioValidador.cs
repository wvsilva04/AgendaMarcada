using AgendaMarcada.Application.DTOs;
using FluentValidation;

namespace AgendaMarcada.Application.Validadores;

public class CriarUsuarioValidador : AbstractValidator<CriarUsuarioDto>
{
    public CriarUsuarioValidador()
    {
        RuleFor(x => x.EmpresaId)
            .NotEmpty()
            .WithMessage("A empresa é obrigatória.");

        RuleFor(x => x.Nome)
            .NotEmpty()
            .WithMessage("O nome é obrigatório.");

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .WithMessage("Informe um e-mail válido.");

        RuleFor(x => x.Senha)
            .NotEmpty()
            .MinimumLength(6)
            .WithMessage("A senha deve ter pelo menos 6 caracteres.");
    }
}