# ============================================================
#  MaritimeOS - Yedekten geri yükleme (Windows / PowerShell)
#
#  Bir yedeği (maritime.sql) AYRI/YENİ bir veritabanına yükler.
#  Canlı 'maritime' veritabanına DOKUNMAZ; önce kopyayı doğrularsın.
#
#  Kullanım:
#    # En son yedeği 'maritime_restore' adlı yeni DB'ye yükle:
#    powershell -ExecutionPolicy Bypass -File scripts\windows\geri-yukle.ps1
#
#    # Belirli bir yedek klasörü + hedef DB adı:
#    powershell -ExecutionPolicy Bypass -File scripts\windows\geri-yukle.ps1 `
#       -BackupDir "C:\maritime\backups\2026-08-18_0200" -TargetDb "maritime_test"
# ============================================================

param(
  [string]$BackupDir = "",
  [string]$TargetDb = "maritime_restore"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$EnvFile = Join-Path $Root ".env.local"

if (-not (Test-Path $EnvFile)) { Write-Error ".env.local yok: $EnvFile"; exit 1 }

# DATABASE_URL oku
$DatabaseUrl = $null
foreach ($line in Get-Content $EnvFile) {
  $t = $line.Trim()
  if ($t -eq "" -or $t.StartsWith("#")) { continue }
  $eq = $t.IndexOf("="); if ($eq -lt 0) { continue }
  if ($t.Substring(0, $eq).Trim() -eq "DATABASE_URL") {
    $DatabaseUrl = $t.Substring($eq + 1).Trim().Trim('"').Trim("'")
  }
}
if (-not $DatabaseUrl) { Write-Error "DATABASE_URL okunamadi"; exit 1 }

# En son yedek klasoru (verilmediyse)
if ($BackupDir -eq "") {
  $BackupRoot = Join-Path $Root "backups"
  if (-not (Test-Path $BackupRoot)) { Write-Error "backups klasoru yok"; exit 1 }
  $latest = Get-ChildItem $BackupRoot -Directory | Sort-Object Name -Descending | Select-Object -First 1
  if (-not $latest) { Write-Error "Hic yedek bulunamadi" ; exit 1 }
  $BackupDir = $latest.FullName
}
$DbFile = Join-Path $BackupDir "maritime.sql"
if (-not (Test-Path $DbFile)) { Write-Error "Yedek dosyasi yok: $DbFile"; exit 1 }

# Baglanti bilgileri (.NET Uri ile)
$uri = [System.Uri]$DatabaseUrl
$dbUser = $uri.UserInfo.Split(':')[0]
$dbPass = if ($uri.UserInfo.Contains(':')) { $uri.UserInfo.Split(':')[1] } else { "" }
$dbHost = $uri.Host
$dbPort = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
$env:PGPASSWORD = $dbPass

# psql / createdb / dropdb bul
$PgRoot = "C:\Program Files\PostgreSQL"
$ver = Get-ChildItem $PgRoot -Directory | Sort-Object Name -Descending | Select-Object -First 1
$Bin = Join-Path $ver.FullName "bin"
$psql = Join-Path $Bin "psql.exe"
$createdb = Join-Path $Bin "createdb.exe"
$dropdb = Join-Path $Bin "dropdb.exe"

Write-Host "Yedek     : $DbFile"
Write-Host "Hedef DB  : $TargetDb  (canli 'maritime' DEGISMEZ)"
$confirm = Read-Host "Devam edilsin mi? Varsa '$TargetDb' silinip yeniden olusturulacak (E/H)"
if ($confirm -ne "E" -and $confirm -ne "e") { Write-Host "Iptal edildi."; exit 0 }

Write-Host "== Hedef veritabani hazirlaniyor =="
& $dropdb -U $dbUser -h $dbHost -p $dbPort --if-exists $TargetDb 2>$null
& $createdb -U $dbUser -h $dbHost -p $dbPort $TargetDb
if ($LASTEXITCODE -ne 0) { Write-Error "createdb basarisiz"; exit 1 }

Write-Host "== Yedek yukleniyor =="
& $psql -U $dbUser -h $dbHost -p $dbPort -d $TargetDb -f $DbFile
if ($LASTEXITCODE -ne 0) { Write-Error "psql yukleme basarisiz"; exit 1 }

Write-Host ""
Write-Host "GERI YUKLEME TAMAMLANDI -> veritabani: $TargetDb"
Write-Host ""
Write-Host "Bu kopyayi incelemek icin .env.local'de DATABASE_URL'in sonundaki"
Write-Host "'/maritime' yerine '/$TargetDb' yazip uygulamayi yeniden baslatabilirsin."
Write-Host "uploads dosyalari icin: $BackupDir\uploads klasorunu var\uploads'a kopyala."
