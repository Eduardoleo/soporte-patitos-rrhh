# Solo desarrollo local: HTTP localhost, base demo; sin archivos de credenciales.
# Con -VerifyDemoLogins pide contraseñas de forma segura; login actualiza último acceso.
param([int]$Port = 5097, [switch]$VerifyDemoLogins, [switch]$DemoCredentialsFromStdin)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http
$projectRoot = Split-Path $PSScriptRoot -Parent
$appRoot = Join-Path $projectRoot 'SoportePatitosS.A'
$localRoot = Join-Path $projectRoot '.local'
$dll = Join-Path $appRoot 'bin/Release/net10.0/SoportePatitosS.A.dll'
New-Item -ItemType Directory -Path $localRoot -Force | Out-Null
if (!(Test-Path -LiteralPath $dll)) { throw 'Compilar Release antes de ejecutar.' }
$raw = & dotnet user-secrets list --project (Join-Path $appRoot 'SoportePatitosS.A.csproj') --json 2>$null
if ($LASTEXITCODE -ne 0) { throw 'No se pudo consultar user-secrets.' }
$text = $raw -join "`n"
$start = $text.IndexOf('{')
$end = $text.LastIndexOf('}')
if ($start -lt 0 -or $end -lt $start) { throw 'Respuesta user-secrets inválida.' }
$config = $text.Substring($start, $end - $start + 1) | ConvertFrom-Json
if (!$config.'Jwt:Secret' -or !$config.'ConnectionStrings:DefaultConnection') {
    throw 'Faltan Jwt:Secret o ConnectionStrings:DefaultConnection en user-secrets.'
}
$connection = New-Object System.Data.SqlClient.SqlConnectionStringBuilder($config.'ConnectionStrings:DefaultConnection')
if ($connection.DataSource -notin @('localhost', '.', '127.0.0.1') -or
    $connection.InitialCatalog -ne 'SoportePatitos_Portafolio_Demo' -or
    !$connection.IntegratedSecurity -or $connection.UserID -or $connection.Password -or
    $connection.FailoverPartner -or $connection.AttachDBFilename) {
    throw 'La verificación requiere exclusivamente localhost y la base demo.'
}
$payrollRole = 'Analista de N' + [char]0x00F3 + 'mina'
$credentials = @()
if ($DemoCredentialsFromStdin) {
    if (!$VerifyDemoLogins) { throw 'La entrada de prueba requiere VerifyDemoLogins.' }
    try {
        # Only for a locally generated integration fixture; never write or print this input.
        $inputCredentials = [Console]::In.ReadToEnd() | ConvertFrom-Json
        foreach ($item in $inputCredentials) {
            $password = ConvertTo-SecureString -String $item.password -AsPlainText -Force
            $credentials += [pscustomobject]@{ username = $item.username; password = $password; role = $item.role }
        }
        $inputCredentials = $null
    } catch { throw 'Entrada de credenciales de prueba invalida; valores omitidos.' }
} elseif ($VerifyDemoLogins) {
    foreach ($role in @('Administrador', 'Empleado', $payrollRole)) {
        $username = Read-Host "Usuario ficticio demo para $role"
        $password = Read-Host "Contraseña demo para $role" -AsSecureString
        $credentials += [pscustomobject]@{ username = $username; password = $password; role = $role }
    }
}
$savedEnvironment = @{}
foreach ($key in @('ASPNETCORE_ENVIRONMENT','ASPNETCORE_URLS','ConnectionStrings__DefaultConnection','Jwt__Secret','ASPNETCORE_HOSTINGSTARTUPASSEMBLIES')) {
    $savedEnvironment[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
}
$client = New-Object System.Net.Http.HttpClient
$client.Timeout = [TimeSpan]::FromSeconds(15)
$results = New-Object System.Collections.Generic.List[object]
$server = $null
function Request([string]$Method, [string]$Path, $Body = $null, [string]$Token = '') {
    $request = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::new($Method), "http://localhost:$Port$Path")
    if ($Token) { $request.Headers.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Bearer', $Token) }
    if ($null -ne $Body -and $Method -notin @('GET','HEAD')) { $request.Content = New-Object System.Net.Http.StringContent(($Body | ConvertTo-Json -Depth 8), [Text.Encoding]::UTF8, 'application/json') }
    $sw = [Diagnostics.Stopwatch]::StartNew()
    try {
        $response = $client.SendAsync($request).GetAwaiter().GetResult()
        try { return @{ Status = [int]$response.StatusCode; Body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult(); Ms = $sw.Elapsed.TotalMilliseconds } }
        finally { $response.Dispose() }
    } finally { $request.Dispose() }
}
function Check([string]$Name, $Response, [int]$Expected) {
    $results.Add([pscustomobject]@{ Check=$Name; Status=$Response.Status; Expected=$Expected; Passed=($Response.Status -eq $Expected); Ms=[Math]::Round($Response.Ms,2) })
    if ($Response.Status -ne $Expected) { throw "Falló $Name : HTTP $($Response.Status), esperado $Expected. Revisar logs locales." }
}
try {
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    $env:ASPNETCORE_URLS = "http://localhost:$Port"
    $env:ConnectionStrings__DefaultConnection = $config.'ConnectionStrings:DefaultConnection'
    $env:Jwt__Secret = $config.'Jwt:Secret'
    $env:ASPNETCORE_HOSTINGSTARTUPASSEMBLIES = ''
    $server = Start-Process -FilePath 'dotnet' -ArgumentList @('"' + $dll + '"') -WorkingDirectory $appRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $localRoot 'api.stdout.log') -RedirectStandardError (Join-Path $localRoot 'api.stderr.log')
    $ready = $false
    for ($i=0; $i -lt 40; $i++) {
        if ($server.HasExited) { throw 'La API terminó antes de iniciar.' }
        try { $live = Request 'GET' '/health/live'; if ($live.Status -eq 200) { $ready=$true; break } } catch { }
        Start-Sleep -Milliseconds 250
    }
    if (!$ready) { throw 'La API no inició dentro del plazo.' }
    Check 'Proceso API' $live 200
    Check 'SQL y columnas del modelo' (Request 'GET' '/health/ready') 200
    $swaggerResponse = Request 'GET' '/swagger/v1/swagger.json'
    Check 'OpenAPI' $swaggerResponse 200
    $swagger = $swaggerResponse.Body | ConvertFrom-Json
    foreach ($path in $swagger.paths.PSObject.Properties) {
        foreach ($method in $path.Value.PSObject.Properties) {
            if ($method.Name -notin @('get','post','put','delete','patch')) { continue }
            if ($path.Name -eq '/api/Usuarios/Login') { continue }
            $url = [regex]::Replace($path.Name, '\{[^}]+\}', '-999999')
            Check "Anónimo $($method.Name) $($path.Name)" (Request $method.Name.ToUpperInvariant() $url @{}) 401
        }
    }
    if ($VerifyDemoLogins) {
    $sessions = @{}
    foreach ($account in $credentials) {
        $response = Request 'POST' '/api/Usuarios/Login' @{ nombreUsuario=$account.username; password=([Net.NetworkCredential]::new('', $account.password).Password) }
        Check "Login demo $($account.role)" $response 200
        $sessions[$account.role] = $response.Body | ConvertFrom-Json
    }
    $admin = $sessions['Administrador'].token
    $employee = $sessions['Empleado'].token
    $payroll = $sessions[$payrollRole].token
    Check 'Empleado no lista usuarios' (Request 'GET' '/api/Usuarios/ObtenerTodos' $null $employee) 403
    Check 'Empleado no lista planillas' (Request 'GET' '/api/Planillas/ObtenerTodos' $null $employee) 403
    Check 'Empleado no cambia clave ajena' (Request 'PUT' '/api/Usuarios/CambiarPassword/-999999' @{ nuevaPassword='No-aplicar-123!' } $employee) 403
    Check 'Admin lista usuarios' (Request 'GET' '/api/Usuarios/ObtenerTodos' $null $admin) 200
    $users = Request 'GET' '/api/Usuarios/ObtenerTodos' $null $admin
    if ($users.Body -match '(?i)password_hash') { throw 'Se expuso un hash en la respuesta.' }
    Check 'Nómina lista planillas' (Request 'GET' '/api/Planillas/ObtenerTodos' $null $payroll) 200
    Check 'Token válido' (Request 'POST' '/api/Usuarios/ValidateToken' @{} $employee) 200
    Check 'Token inválido' (Request 'POST' '/api/Usuarios/ValidateToken' @{} 'token-invalido') 401
    foreach ($path in @('/api/Empleados/ObtenerTodos','/api/Departamentos/ObtenerTodos','/api/Horarios/ObtenerTodos','/api/Perfiles/ObtenerTodos','/api/Empleados/TiposAusencia','/api/Asistencia/ObtenerTodos')) {
        Check "Lectura demo $path" (Request 'GET' $path $null $admin) 200
    }
    $id = $sessions['Administrador'].empleadoId
    $date = Get-Date -Format 'yyyy-MM-dd'
    Check 'Reporte de asistencia demo' (Request 'GET' "/api/Asistencia/ReporteGestion?fecha=$date&empleadoSolicitanteId=$id" $null $admin) 200
    Check 'Reporte no acepta suplantar solicitante' (Request 'GET' "/api/Asistencia/ReporteGestion?fecha=$date&empleadoSolicitanteId=$id" $null $employee) 403
    Check 'Empleado no crea empleados' (Request 'POST' '/api/Empleados/CrearEmpleado' @{} $employee) 403
    Check 'Empleado no elimina empleados' (Request 'DELETE' '/api/Empleados/EliminarEmpleado/-999999' $null $employee) 403
    }
    Write-Output "$($results.Count) verificaciones HTTP correctas. No se imprimieron tokens ni contraseñas."
} finally {
    [IO.File]::WriteAllText((Join-Path $localRoot 'api-results.json'), ($results | ConvertTo-Json -Depth 5), [Text.UTF8Encoding]::new($false))
    if ($server -and !$server.HasExited) { Stop-Process -Id $server.Id }
    $client.Dispose()
    foreach ($account in $credentials) { $account.password.Dispose() }
    $config = $null
    $raw = $null
    $text = $null
    foreach ($entry in $savedEnvironment.GetEnumerator()) { [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'Process') }
}
