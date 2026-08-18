# ============================================================
#  MaritimeOS - Yedekleme betiği (Windows / PowerShell)
#
#  Veritabanını (tüm kayıtlar/raporlar) ve yüklenen dosyaları
#  tarihli bir klasöre yedekler. 30 günden eski yedekleri siler.
#
#  Elle:      powershell -ExecutionPolicy Bypass -File scripts\windows\yedekle.ps1
#  Otomatik:  Görev Zamanlayıcı ile günlük çalıştırın (aşağıya bkz.)
# ============================================================

$ErrorActionPreference = "Stop"

# Proje kökü = bu betiğin iki üst klasörü
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$EnvFile = Join-Path $Root ".env.local"

if (-not (Test-Path $EnvFile)) {
  Write-Error ".env.local bulunamadi: $EnvFile"
  exit 1
}

# .env.local'den DATABASE_URL ve UPLOAD_DIR oku
$DatabaseUrl = $null
$UploadDir = $null
foreach ($line in Get-Content $EnvFile) {
  $t = $line.Trim()
  if ($t -eq "" -or $t.StartsWith("#")) { continue }
  $eq = $t.IndexOf("=")
  if ($eq -lt 0) { continue }
  $key = $t.Substring(0, $eq).Trim()
  $val = $t.Substring($eq + 1).Trim().Trim('"').Trim("'")
  if ($key -eq "DATABASE_URL") { $DatabaseUrl = $val }
  if ($key -eq "UPLOAD_DIR") { $UploadDir = $val }
}

if (-not $DatabaseUrl) { Write-Error "DATABASE_URL okunamadi (.env.local)"; exit 1 }
if (-not $UploadDir) { $UploadDir = Join-Path $Root "var\uploads" }

# pg_dump'i bul (PostgreSQL kurulumundaki en yeni surum)
$PgRoot = "C:\Program Files\PostgreSQL"
$PgDump = $null
if (Test-Path $PgRoot) {
  $ver = Get-ChildItem $PgRoot -Directory | Sort-Object Name -Descending | Select-Object -First 1
  if ($ver) { $PgDump = Join-Path $ver.FullName "bin\pg_dump.exe" }
}
if (-not $PgDump -or -not (Test-Path $PgDump)) {
  Write-Error "pg_dump bulunamadi ($PgRoot altinda). PostgreSQL kurulu mu?"
  exit 1
}

# Tarihli yedek klasoru
$Stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$BackupRoot = Join-Path $Root "backups"
$Dest = Join-Path $BackupRoot $Stamp
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

Write-Host "== Veritabani yedekleniyor =="
$DbFile = Join-Path $Dest "maritime.sql"
& $PgDump $DatabaseUrl --no-owner --no-privileges -f $DbFile
if ($LASTEXITCODE -ne 0) { Write-Error "pg_dump basarisiz"; exit 1 }
Write-Host "   -> $DbFile"

Write-Host "== Yuklenen dosyalar yedekleniyor =="
if (Test-Path $UploadDir) {
  $UpDest = Join-Path $Dest "uploads"
  Copy-Item -Path $UploadDir -Destination $UpDest -Recurse -Force
  Write-Host "   -> $UpDest"
} else {
  Write-Host "   (yuklenen dosya klasoru yok, atlandi)"
}

# 30 gunden eski yedekleri sil
Write-Host "== Eski yedekler temizleniyor (30 gun+) =="
if (Test-Path $BackupRoot) {
  Get-ChildItem $BackupRoot -Directory |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
    ForEach-Object { Remove-Item $_.FullName -Recurse -Force; Write-Host "   silindi: $($_.Name)" }
}

Write-Host ""
Write-Host "YEDEK TAMAMLANDI -> $Dest"
