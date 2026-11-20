"""Verificación de arranque solo para desarrollo local y sin escrituras SQL.

La aplicación carga la clave JWT desde user-secrets, que nunca se imprime.
Este script no firma tokens; las solicitudes HTTP solo hablan con localhost.
"""

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


def build_application(app):
    result = subprocess.run(
        ["dotnet", "build", str(app / "SoportePatitosS.A.csproj"),
         "-c", "Release", "--verbosity", "quiet"],
        capture_output=True,
    )
    if result.returncode:
        raise SystemExit("Build failed; inspect locally without secrets.")


def wait_until_ready(process):
    for _ in range(60):
        if process.poll() is not None:
            break
        try:
            with urllib.request.urlopen(
                BASE_URL + "/health/ready", timeout=1
            ) as response:
                if response.status == 200:
                    return
        except (urllib.error.URLError, TimeoutError):
            pass
        time.sleep(0.25)
    raise SystemExit("Startup/readiness failed; no secret output.")


def main():
    app = Path(__file__).resolve().parents[1] / "SoportePatitosS.A"
    build_application(app)
    environment = os.environ.copy()
    environment.pop("Jwt__Secret", None)
    environment["ASPNETCORE_ENVIRONMENT"] = "Development"
    environment["ASPNETCORE_HOSTINGSTARTUPASSEMBLIES"] = ""
    environment["ConnectionStrings__DefaultConnection"] = CONNECTION
    with tempfile.TemporaryFile() as logs:
        process = subprocess.Popen(
            ["dotnet", str(app / "bin/Release/net10.0/SoportePatitosS.A.dll"),
             "--urls", BASE_URL],
            cwd=app, env=environment, stdout=logs, stderr=logs,
        )
        try:
            wait_until_ready(process)
            print("PASS: startup with Jwt:Secret from user-secrets "
                  "(no JWT override), legacy local JSON ignored, demo DB ready")
        finally:
            if process.poll() is None:
                process.terminate()
                process.wait(timeout=10)


if __name__ == "__main__":
    main()
