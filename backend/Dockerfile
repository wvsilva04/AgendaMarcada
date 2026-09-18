FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY AgendaMarcada.sln ./
COPY src/AgendaMarcada.API/AgendaMarcada.API.csproj src/AgendaMarcada.API/
COPY src/AgendaMarcada.Application/AgendaMarcada.Application.csproj src/AgendaMarcada.Application/
COPY src/AgendaMarcada.Domain/AgendaMarcada.Domain.csproj src/AgendaMarcada.Domain/
COPY src/AgendaMarcada.Infrastructure/AgendaMarcada.Infrastructure.csproj src/AgendaMarcada.Infrastructure/

RUN dotnet restore AgendaMarcada.sln

COPY src/ src/

RUN dotnet publish src/AgendaMarcada.API/AgendaMarcada.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "AgendaMarcada.API.dll"]