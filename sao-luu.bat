@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
if not exist "backup" mkdir backup
for /f %%d in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmm"') do set D=%%d
set F=backup\giapha-%D%.sql
echo Dang xuat du lieu cuc bo ra %F% ...
call npx wrangler d1 export giapha-db --local --config wrangler.local.toml --output "%F%"
echo.
if exist "%F%" ( echo  Da luu: %F% ) else ( echo  [LOI] Xuat that bai. )
echo  Anh/tai lieu nam trong .wrangler\state — copy ca thu muc do de sao luu day du.
pause
