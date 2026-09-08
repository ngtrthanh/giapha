@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0"

set PORT=8788
if not "%~1"=="" set PORT=%~1

echo.
echo ================================================
echo   GIA PHA - chay cuc bo tren may nay
echo   Du lieu nam trong thu muc .wrangler (SQLite)
echo   Khong ket noi Cloudflare, khong can tai khoan
echo ================================================
echo.

:: 1. Node.js
where node >nul 2>&1
if errorlevel 1 (
  echo [LOI] Chua cai Node.js.
  echo       Tai ban LTS tai https://nodejs.org roi chay lai file nay.
  pause & exit /b 1
)
for /f "delims=" %%v in ('node --version') do echo [1/4] Node %%v

:: 2. Cai wrangler lan dau
if not exist "node_modules\wrangler" (
  echo [2/4] Cai wrangler lan dau, mat vai phut...
  call npm install --no-audit --no-fund
  if errorlevel 1 ( echo [LOI] npm install that bai. & pause & exit /b 1 )
) else (
  echo [2/4] Wrangler da co
)

:: 3. Ma dang nhap cuc bo
if not exist ".dev.vars" (
  echo ADMIN_KEY=local-admin-key> .dev.vars
  echo [3/4] Da tao .dev.vars - ma dang nhap: local-admin-key
) else (
  echo [3/4] Dung .dev.vars san co
)

:: 4. Nap schema (idempotent, CREATE TABLE IF NOT EXISTS)
echo [4/4] Nap schema vao D1 cuc bo...
call npx wrangler d1 execute giapha-db --file=schema.sql --local --config wrangler.local.toml >nul 2>&1
for /f "usebackq delims=" %%S in (`powershell -NoProfile -Command "Get-Content 'migrations.sql' -Encoding UTF8 | Where-Object { $_ -match '^\s*(ALTER|UPDATE|CREATE|INSERT)' }"`) do call npx wrangler d1 execute giapha-db --local --config wrangler.local.toml --command "%%S" >nul 2>&1
if errorlevel 1 ( echo [LOI] Nap schema that bai. & pause & exit /b 1 )

echo.
echo   Mo trinh duyet: http://localhost:%PORT%
echo   Ma dang nhap  : xem file .dev.vars
echo   Dung server   : bam Ctrl+C
echo.
start "" http://localhost:%PORT%
call npx wrangler dev --config wrangler.local.toml --port %PORT%

endlocal
