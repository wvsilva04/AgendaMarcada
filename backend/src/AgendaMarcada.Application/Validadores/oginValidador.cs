using AgendaMarcada.Application.DTOs;
using FluentValidation;

namespace AgendaMarcada.Application.Validadores;

public class LoginValidador : AbstractValidator<LoginDto>
{
    public LoginValidador()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .WithMessage("Informe um e-mail válido.");

        RuleFor(x => x.Senha)
            .NotEmpty()
            .WithMessage("A senha é obrigatória.");
    }
}