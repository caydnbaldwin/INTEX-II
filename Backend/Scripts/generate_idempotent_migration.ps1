param(
    [string]$ProjectPath = "C:\INTEX-II\Backend\Backend.csproj",
    [string]$StartupProjectPath = "C:\INTEX-II\Backend\Backend.csproj",
    [string]$OutputDirectory = "C:\INTEX-II\Backend\Scripts\artifacts"
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputPath = Join-Path $OutputDirectory "$timestamp-idempotent-migrations.sql"

if (-not (Test-Path $OutputDirectory)) {
    New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}

dotnet ef migrations script `
    --idempotent `
    --project $ProjectPath `
    --startup-project $StartupProjectPath `
    --output $outputPath

Write-Host "Generated migration artifact: $outputPath"
