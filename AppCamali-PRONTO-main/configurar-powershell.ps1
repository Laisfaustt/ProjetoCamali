# Script para configurar o PowerShell para usar Node.js e npm
# Execute este script uma vez para configurar permanentemente

# Atualizar PATH na sessão atual
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Configurar política de execução para o processo atual
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

Write-Host "✅ PowerShell configurado! Node.js e npm estão prontos para uso." -ForegroundColor Green
Write-Host "Node.js versão: $(node --version)" -ForegroundColor Cyan
Write-Host "npm versão: $(npm --version)" -ForegroundColor Cyan

