# Configura exclusivamente user-secrets; no escribe claves en archivos del proyecto.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$project = Join-Path (Split-Path $PSScriptRoot -Parent) 'SoportePatitosS.A/SoportePatitosS.A.csproj'
$raw = & dotnet user-secrets list --project $project --json 2>$null
if ($LASTEXITCODE -ne 0) { throw 'No se pudo consultar user-secrets.' }
$text = $raw -join "`n"
$start = $text.IndexOf('{')
$end = $text.LastIndexOf('}')
if ($start -lt 0 -or $end -lt $start) { throw 'Respuesta user-secrets inválida.' }
$secrets = $text.Substring($start, $end - $start + 1) | ConvertFrom-Json
if (-not $secrets.'Jwt:Secret') {
    $bytes = New-Object byte[] 64
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($bytes)
        & dotnet user-secrets set 'Jwt:Secret' ([Convert]::ToBase64String($bytes)) --project $project *> $null
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo guardar Jwt:Secret.' }
    } finally {
        $rng.Dispose()
        [Array]::Clear($bytes, 0, $bytes.Length)
    }
}
if (-not $secrets.'ConnectionStrings:DefaultConnection') {
    & dotnet user-secrets set 'ConnectionStrings:DefaultConnection' 'Server=localhost;Database=SoportePatitos_Portafolio_Demo;Integrated Security=True;TrustServerCertificate=True' --project $project *> $null
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo guardar la conexión demo.' }
}
$secrets = $null
$raw = $null
$text = $null
Write-Output 'User-secrets configurado; valores existentes conservados. No se modificó SQL.'
