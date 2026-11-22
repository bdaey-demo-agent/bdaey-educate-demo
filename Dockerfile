# Root Dockerfile for Railway demo deploy (mirror repo only - not part of the product repo)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src/backend
COPY backend/BdaeyEducat.API.csproj ./
RUN dotnet restore "BdaeyEducat.API.csproj"
COPY backend/ ./
RUN dotnet publish "BdaeyEducat.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
RUN apt-get update && apt-get install -y libgssapi-krb5-2 curl && rm -rf /var/lib/apt/lists/*
USER app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "BdaeyEducat.API.dll"]
