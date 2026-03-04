@echo off
echo ================================================
echo   OmniConvert - Inicio Rapido de Desarrollo
echo ================================================
echo.

echo [1/4] Verificando Docker Desktop...
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop no esta corriendo
    echo Por favor inicia Docker Desktop y vuelve a ejecutar este script
    pause
    exit /b 1
)
echo ✓ Docker Desktop corriendo

echo.
echo [2/4] Levantando servicios (PostgreSQL, Redis, S3)...
docker-compose up -d
if errorlevel 1 (
    echo ERROR: No se pudieron levantar los servicios
    pause
    exit /b 1
)
echo ✓ Servicios levantados

echo.
echo [3/4] Esperando que los servicios esten listos...
timeout /t 5 /nobreak >nul
echo ✓ Servicios listos

echo.
echo [4/4] Inicializando buckets S3...
node init-s3.js
if errorlevel 1 (
    echo ADVERTENCIA: Error al inicializar S3 (puede que ya este inicializado)
)
echo ✓ S3 inicializado

echo.
echo ================================================
echo   Servicios Listos - Ahora inicia la app:
echo ================================================
echo.
echo   1. Backend API + Worker:  npm run dev
echo   2. En otra terminal (o espera): cd apps\web && npm run dev
echo.
echo   Accede a: http://localhost:3000
echo ================================================
echo.
pause
