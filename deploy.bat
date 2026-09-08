@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1

set "PSC=powershell -NoProfile -Command"

echo.
%PSC% "Write-Host '== Gia Pha - Cloudflare Deploy ==' -ForegroundColor Cyan"

if not exist ".env" (
  %PSC% "Write-Host '[FATAL] Khong tim thay .env' -ForegroundColor Red" & exit /b 1
)
for /f "usebackq delims=" %%L in (`%PSC% "Get-Content '.env' | Where-Object { $_ -match '^[A-Z_0-9]+=.+' -and $_ -notmatch '^\s*#' } | ForEach-Object { $_.Trim() }"`) do set "%%L"

if "%CF_API_TOKEN%"=="" ( %PSC% "Write-Host 'FATAL: thieu CF_API_TOKEN' -ForegroundColor Red" & exit /b 1 )
if "%CF_ACCOUNT_ID%"=="" ( %PSC% "Write-Host 'FATAL: thieu CF_ACCOUNT_ID' -ForegroundColor Red" & exit /b 1 )
if "%ADMIN_KEY%"=="" ( %PSC% "Write-Host 'FATAL: thieu ADMIN_KEY' -ForegroundColor Red" & exit /b 1 )

if "%WORKER_NAME%"==""   set WORKER_NAME=giapha-api
if "%PAGES_PROJECT%"=="" set PAGES_PROJECT=giapha
if "%D1_DB_NAME%"==""    set D1_DB_NAME=giapha-db
if "%R2_BUCKET%"==""     set R2_BUCKET=giapha-media

set CLOUDFLARE_API_TOKEN=%CF_API_TOKEN%
set CLOUDFLARE_ACCOUNT_ID=%CF_ACCOUNT_ID%

%PSC% "Write-Host '[1/8] Kiem tra Node...' -ForegroundColor Yellow"
node --version >nul 2>&1 || ( %PSC% "Write-Host 'Can cai Node.js' -ForegroundColor Red" & exit /b 1 )

%PSC% "Write-Host '[2/8] Khoi tao D1 + R2...' -ForegroundColor Yellow"
npx --yes wrangler@latest d1 list --json > "%TEMP%\d1list.json" 2>nul
node -e "const fs=require('fs');try{const l=JSON.parse(fs.readFileSync('%TEMP%\\d1list.json','utf8'));const db=l.find(d=>d.name==='%D1_DB_NAME%');process.stdout.write(db?(db.uuid||db.id||''):'');}catch(e){process.stdout.write('');}" > "%TEMP%\d1id.txt"
set /p D1_ID=<"%TEMP%\d1id.txt"

if "!D1_ID!"=="" (
  npx --yes wrangler@latest d1 create "%D1_DB_NAME%" --json > "%TEMP%\d1create.json" 2>nul
  node -e "const fs=require('fs');try{const r=JSON.parse(fs.readFileSync('%TEMP%\\d1create.json','utf8'));process.stdout.write(r.uuid||r.id||'');}catch(e){process.stdout.write('');}" > "%TEMP%\d1id.txt"
  set /p D1_ID=<"%TEMP%\d1id.txt"
  if "!D1_ID!"=="" ( %PSC% "Write-Host 'Khong lay duoc D1 ID' -ForegroundColor Red" & exit /b 1 )
)
npx --yes wrangler@latest r2 bucket create "%R2_BUCKET%" >nul 2>&1

%PSC% "Write-Host '[3/8] Sinh wrangler.toml...' -ForegroundColor Yellow"
if not exist "wrangler.toml.tpl" ( %PSC% "Write-Host 'Thieu wrangler.toml.tpl' -ForegroundColor Red" & exit /b 1 )
%PSC% "(Get-Content 'wrangler.toml.tpl') -replace '__WORKER_NAME__','%WORKER_NAME%' -replace '__D1_DB_NAME__','%D1_DB_NAME%' -replace '__D1_ID__','!D1_ID!' -replace '__R2_BUCKET__','%R2_BUCKET%' | Set-Content 'wrangler.toml'"

%PSC% "Write-Host '[4/8] Nap schema...' -ForegroundColor Yellow"
npx --yes wrangler@latest d1 execute "%D1_DB_NAME%" --file=schema.sql --remote --yes
for /f "usebackq delims=" %%S in (`powershell -NoProfile -Command "Get-Content 'migrations.sql' -Encoding UTF8 | Where-Object { $_ -match '^\s*(ALTER|UPDATE|CREATE|INSERT)' }"`) do npx --yes wrangler@latest d1 execute "%D1_DB_NAME%" --remote --yes --command "%%S" >nul 2>&1

%PSC% "Write-Host '[5/8] Dat secret...' -ForegroundColor Yellow"
echo %ADMIN_KEY%| npx --yes wrangler@latest secret put ADMIN_KEY --name "%WORKER_NAME%"

%PSC% "Write-Host '[6/8] Deploy Worker...' -ForegroundColor Yellow"
npx --yes wrangler@latest deploy --name "%WORKER_NAME%"

%PSC% "Write-Host '[7/8] Deploy Pages...' -ForegroundColor Yellow"
npx --yes wrangler@latest pages deploy public/ --project-name "%PAGES_PROJECT%" --branch main
set PAGES_URL=https://%PAGES_PROJECT%.pages.dev

%PSC% "Write-Host '[8/8] Cau hinh domain...' -ForegroundColor Yellow"
set FINAL_URL=%PAGES_URL%
if not "%DOMAIN%"=="" (
  if not "%CF_ZONE_ID%"=="" (
    %PSC% "$h=@{'Authorization'='Bearer %CF_API_TOKEN%';'Content-Type'='application/json'}; Invoke-RestMethod -Uri 'https://api.cloudflare.com/client/v4/accounts/%CF_ACCOUNT_ID%/pages/projects/%PAGES_PROJECT%/domains' -Method POST -Headers $h -Body '{\"name\":\"%DOMAIN%\"}' -ErrorAction SilentlyContinue | Out-Null"
    %PSC% "$h=@{'Authorization'='Bearer %CF_API_TOKEN%';'Content-Type'='application/json'}; Invoke-RestMethod -Uri 'https://api.cloudflare.com/client/v4/zones/%CF_ZONE_ID%/workers/routes' -Method POST -Headers $h -Body '{\"pattern\":\"%DOMAIN%/api/*\",\"script\":\"%WORKER_NAME%\"}' -ErrorAction SilentlyContinue | Out-Null"
    set FINAL_URL=https://%DOMAIN%
  )
)

if not "%GH_TOKEN%"=="" (
  if not "%GH_REPO%"=="" (
    %PSC% "Invoke-RestMethod -Uri 'https://api.github.com/user/repos' -Method POST -Headers @{'Authorization'='token %GH_TOKEN%';'Content-Type'='application/json'} -Body '{\"name\":\"%GH_REPO%\",\"private\":true}' -ErrorAction SilentlyContinue | Out-Null"
    if not exist ".git" git init -q
    git add -A >nul 2>&1
    git diff --cached --quiet >nul 2>&1 || git commit -q -m "deploy"
    git remote remove origin >nul 2>&1
    git remote add origin https://%GH_TOKEN%@github.com/%GH_USER%/%GH_REPO%.git
    git branch -M main >nul 2>&1 & git push -qf origin main >nul 2>&1
  )
)

echo.
%PSC% "Write-Host '== DEPLOY OK ==' -ForegroundColor Green"
%PSC% "Write-Host ('  Site   : %FINAL_URL%')"
%PSC% "Write-Host ('  Admin  : %FINAL_URL%/admin.html')"
%PSC% "Write-Host ('  Ma admin: %ADMIN_KEY%') -ForegroundColor Yellow"
echo.
pause
endlocal
