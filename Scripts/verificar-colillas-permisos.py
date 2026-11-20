"""Verificaciones solo para desarrollo local, sin escrituras en SQL.

Firma tokens sintéticos con la clave de user-secrets, que nunca se imprime.
Las solicitudes HTTP solo hablan con localhost y la base demo autorizada.
"""

import base64
import hashlib
import hmac
import json
import os
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path


BASE_URL = "http://localhost:5098"
CONNECTION = (
    "Server=localhost;Database=SoportePatitos_Portafolio_Demo;"
    "Integrated Security=True;TrustServerCertificate=True"
)


def encode_json(value):
    encoded = json.dumps(value, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(encoded).rstrip(b"=").decode()


def create_token(key, config, role, employee=17, expires_in=180):
    claims = {
        "iss": config["Jwt"]["Issuer"],
        "aud": config["Jwt"]["Audience"],
        "exp": int(time.time()) + expires_in,
        "sub": "-999999",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier":
            "-999999",
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": role,
        "EmpleadoId": str(employee),
    }
    if employee is None:
        del claims["EmpleadoId"]
    content = encode_json({"alg": "HS256", "typ": "JWT"})
    content += "." + encode_json(claims)
    signature = hmac.new(key.encode(), content.encode(), hashlib.sha256)
    encoded = base64.urlsafe_b64encode(signature.digest()).rstrip(b"=")
    return content + "." + encoded.decode()


def request_status(path, token=None, method="GET", body=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(
        BASE_URL + path, headers=headers, method=method, data=data
    )
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            return response.status
    except urllib.error.HTTPError as error:
        return error.code


def wait_until_ready(process):
    for _ in range(60):
        if process.poll() is not None:
            break
        try:
            if request_status("/health/ready") == 200:
                return
        except (urllib.error.URLError, TimeoutError):
            pass
        time.sleep(0.25)
    raise SystemExit("Demo API failed to start; no secrets printed")


def verify_permissions(key, config):
    employee = create_token(key, config, "Empleado")
    payroll = create_token(key, config, "Analista de Nómina")
    admin = create_token(key, config, "Administrador")
    missing_employee = create_token(key, config, "Empleado", employee=None)
    invalid_employee = create_token(key, config, "Empleado", employee=0)
    expired = create_token(key, config, "Empleado", expires_in=-600)
    endpoint = "/api/Colillas_Pago/"
    cases = [
        ("anonymous global", "ObtenerTodos", None, 401),
        ("anonymous personal", "ObtenerMisColillas", None, 401),
        ("employee global", "ObtenerTodos", employee, 403),
        ("foreign employee", "ObtenerPorEmpleado/18", employee, 403),
        ("own employee", "ObtenerPorEmpleado/17", employee, 200),
        ("personal token-derived", "ObtenerMisColillas", employee, 200),
        ("payroll global", "ObtenerTodos", payroll, 200),
    ]
    for name, path, token, expected in cases:
        status = request_status(endpoint + path, token)
        if status != expected:
            raise SystemExit(f"FAIL {name}: HTTP {status}")
        print("PASS HTTP SP-01:", name, status)
    planillas = "/api/Planillas/"
    resource_cases = [
        ("planillas anonymous", planillas + "ObtenerTodos", None, 401),
        ("planillas employee", planillas + "ObtenerTodos", employee, 403),
        ("planillas payroll", planillas + "ObtenerTodos", payroll, 200),
        ("planillas admin", planillas + "ObtenerTodos", admin, 200),
        ("planilla ID denied", planillas + "ObtenerPorId/1", employee, 403),
        ("colilla expired token", endpoint + "ObtenerMisColillas", expired, 401),
        ("colilla missing employee", endpoint + "ObtenerMisColillas", missing_employee, 403),
        ("colilla invalid employee", endpoint + "ObtenerMisColillas", invalid_employee, 403),
        ("colilla invalid token", endpoint + "ObtenerTodos", "token-invalido", 401),
        ("planilla anonymous create", planillas + "CrearPlanilla", None, 401),
        ("planilla employee create", planillas + "CrearPlanilla", employee, 403),
        ("planilla employee update", planillas + "ActualizarEstado/1", employee, 403),
    ]
    for name, path, token, expected in resource_cases:
        method = "POST" if "CrearPlanilla" in path else "GET"
        if "ActualizarEstado" in path:
            method = "PUT"
        status = request_status(path, token, method, {} if method != "GET" else None)
        if status != expected:
            raise SystemExit(f"FAIL {name}: HTTP {status}")
        print("PASS HTTP SP-07:", name, status)
    status = request_status(endpoint + "CrearColilla", employee, "POST", {})
    if status != 403:
        raise SystemExit("FAIL employee create policy")
    print("PASS HTTP SP-01: employee create", status)


def main():
    root = Path(__file__).resolve().parents[1]
    app = root / "SoportePatitosS.A"
    result = subprocess.run(
        ["dotnet", "user-secrets", "list", "--project",
         str(app / "SoportePatitosS.A.csproj"), "--json"],
        capture_output=True, check=True,
    )
    text = result.stdout.decode("utf-8-sig")
    secrets, _ = json.JSONDecoder().raw_decode(text[text.index("{"):])
    key = secrets["Jwt:Secret"]
    config = json.loads(
        (app / "appsettings.json").read_text(encoding="utf-8-sig")
    )
    environment = os.environ.copy()
    environment.update({
        "ASPNETCORE_ENVIRONMENT": "Development",
        "ASPNETCORE_HOSTINGSTARTUPASSEMBLIES": "",
        "ConnectionStrings__DefaultConnection": CONNECTION,
        "Jwt__Secret": key,
    })
    with tempfile.TemporaryFile() as logs:
        process = subprocess.Popen(
            ["dotnet", str(app / "bin/Release/net10.0/SoportePatitosS.A.dll"),
             "--urls", BASE_URL],
            cwd=app, env=environment, stdout=logs, stderr=logs,
        )
        try:
            wait_until_ready(process)
            verify_permissions(key, config)
        finally:
            if process.poll() is None:
                process.terminate()
                process.wait(timeout=10)


if __name__ == "__main__":
    main()
