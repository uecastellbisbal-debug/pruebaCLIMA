@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   WellnessMETER - instalacion y arranque
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo No se encuentra Node.js en este ordenador.
    echo.
    echo Instalalo desde https://nodejs.org (version LTS, boton verde),
    echo y despues vuelve a hacer doble clic en este archivo.
    echo.
    start "" "https://nodejs.org"
    pause
    exit /b 1
)

echo Node.js encontrado. Version:
node --version
echo.

if not exist "client\node_modules" (
    echo Instalando dependencias del cliente ^(solo la primera vez, puede tardar un par de minutos^)...
    pushd client
    call npm install
    if errorlevel 1 (
        echo.
        echo Algo fallo instalando el cliente. Revisa el mensaje de arriba.
        pause
        exit /b 1
    )
    popd
)

if not exist "client\dist" (
    echo Compilando la aplicacion web...
    pushd client
    call npm run build
    if errorlevel 1 (
        echo.
        echo Algo fallo compilando el cliente. Revisa el mensaje de arriba.
        pause
        exit /b 1
    )
    popd
)

if not exist "server\node_modules" (
    echo Instalando dependencias del servidor...
    pushd server
    call npm install
    if errorlevel 1 (
        echo.
        echo Algo fallo instalando el servidor. Revisa el mensaje de arriba.
        pause
        exit /b 1
    )
    popd
)

echo.
echo Arrancando el servidor en una ventana aparte...
echo ^(No cierres esa ventana mientras uses la aplicacion. Ciérrala para apagarla.^)
echo.

start "WellnessMETER - servidor (no cerrar)" cmd /k "cd /d "%~dp0server" && npm start"

echo Esperando a que arranque...
timeout /t 4 /nobreak >nul

start "" "http://localhost:4000"

echo.
echo Listo. Si el navegador no muestra nada todavia, espera unos segundos
echo y recarga la pagina (F5).
echo.
pause
