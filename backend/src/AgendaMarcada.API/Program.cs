using AgendaMarcada.Infrastructure.Persistencia;
using Microsoft.EntityFrameworkCore;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AgendaMarcadaDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "https://agenda-marcada.vercel.app",
                "https://agendamarcada.com.br",
                "https://www.agendamarcada.com.br"
                        )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddScoped<AgendaMarcada.Application.Servicos.SenhaServico>();
builder.Services.AddScoped<AgendaMarcada.Application.Servicos.TokenServico>();

builder.Services.AddValidatorsFromAssemblyContaining<AgendaMarcada.Application.Validadores.CriarEmpresaValidador>();
builder.Services.AddValidatorsFromAssemblyContaining<AgendaMarcada.Application.Validadores.CriarUsuarioValidador>();
builder.Services.AddValidatorsFromAssemblyContaining<AgendaMarcada.Application.Validadores.CadastrarValidador>();
builder.Services.AddValidatorsFromAssemblyContaining<AgendaMarcada.Application.Validadores.LoginValidador>();

var jwtChave = builder.Configuration["Jwt:Chave"]!;

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtChave)),

            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Emissor"],

            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audiencia"],

            ValidateLifetime = true
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Digite o token JWT. Exemplo: Bearer {seu_token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Executa as migrations automaticamente no banco de produção
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AgendaMarcadaDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

