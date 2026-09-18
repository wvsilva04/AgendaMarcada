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

RUN dotnet tool install --global dotnet-ef --version 8.0.8
ENV PATH="$PATH:/root/.dotnet/tools"

RUN dotnet ef database update \
    --project src/AgendaMarcada.Infrastructure/AgendaMarcada.Infrastructure.csproj \
    --startup-project src/AgendaMarcada.API/AgendaMarcada.API.csproj

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "AgendaMarcada.API.dll"]