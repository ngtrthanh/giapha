@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
echo.
echo  Chuyen du lieu CUC BO len Cloudflare D1 (ghi de du lieu tren mang).
echo  Can co .env da dien CF_API_TOKEN va CF_ACCOUNT_ID.
echo.
if not exist ".env" ( echo [LOI] Chua co .env & pause & exit /b 1 )
set /p x=Go YES roi Enter de tiep tuc: 
if /i not "%x%"=="YES" ( echo Da huy. & pause & exit /b 0 )
call npx wrangler d1 export giapha-db --local --config wrangler.local.toml --output "_dong-bo.sql"
call npx wrangler d1 execute giapha-db --file=_dong-bo.sql --remote
del "_dong-bo.sql" >nul 2>&1
echo  Xong.
pause
