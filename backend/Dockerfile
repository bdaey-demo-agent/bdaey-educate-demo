# Use SDK image to build and publish the app
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies (layer caching)
COPY ["BdaeyEducat.API.csproj", "./"]
RUN dotnet restore "BdaeyEducat.API.csproj"

# Copy remaining source code and build
COPY . .
RUN dotnet publish "BdaeyEducat.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Install missing libraries for Npgsql
RUN apt-get update && apt-get install -y libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*

# Switch to non-root user for security
USER app

# Listen on the port assigned by the platform (e.g. Render sets PORT env var)
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Health check to verify the app is responding
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD curl --fail http://localhost:8080/health || exit 1

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "BdaeyEducat.API.dll"]
