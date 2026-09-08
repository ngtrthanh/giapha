@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
echo.
echo  CANH BAO: lenh nay XOA SACH du lieu cuc bo roi nap 10 nguoi mau (3 doi).
echo  Chi dung de xem thu giao dien.
echo.
set /p x=Go YES roi Enter de tiep tuc: 
if /i not "%x%"=="YES" ( echo Da huy. & pause & exit /b 0 )
call npx wrangler d1 execute giapha-db --file=mau.sql --local --config wrangler.local.toml
echo.
echo  Xong. Neu server dang chay, bam Ctrl+C roi chay lai chay-local.bat.
pause
