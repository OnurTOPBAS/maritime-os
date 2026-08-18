@echo off
REM ============================================================
REM  MaritimeOS - Guncelleme betigi (Windows)
REM
REM  Yeni surumu ceker, kurar, veritabanini gunceller, derler
REM  ve servisi yeniden baslatir. Proje klasorunde calistirilir.
REM
REM  Kullanim:  scripts\windows\guncelle.bat
REM ============================================================

setlocal
cd /d "%~dp0\..\.."

echo.
echo === 1/5  Son surum cekiliyor (git pull) ===
git pull
if errorlevel 1 goto :hata

echo.
echo === 2/5  Bagimliliklar kuruluyor ===
call npm install
if errorlevel 1 goto :hata

echo.
echo === 3/5  Veritabani guncelleniyor (migration) ===
call npm run migrate
if errorlevel 1 goto :hata

echo.
echo === 4/5  Uygulama derleniyor ===
call npm run build
if errorlevel 1 goto :hata

echo.
echo === 5/5  Servis yeniden baslatiliyor ===
REM Once Task Scheduler (MaritimeOS gorevi), yoksa NSSM denenir.
schtasks /Query /TN "MaritimeOS" >nul 2>&1
if not errorlevel 1 (
  echo   Task Scheduler gorevi yeniden baslatiliyor...
  schtasks /End /TN "MaritimeOS" >nul 2>&1
  timeout /t 2 >nul
  schtasks /Run /TN "MaritimeOS"
  if errorlevel 1 (
    echo   Gorev baslatilamadi. Elle: schtasks /Run /TN "MaritimeOS"
  )
  goto :son
)
REM Task Scheduler gorevi yoksa NSSM servisini dene.
nssm restart MaritimeOS
if errorlevel 1 (
  echo   Servis yeniden baslatilamadi. Elle baslatmayi deneyin:
  echo   schtasks /Run /TN "MaritimeOS"   (veya)   nssm restart MaritimeOS
  goto :son
)

echo.
echo === GUNCELLEME TAMAMLANDI ===
goto :son

:hata
echo.
echo *** HATA: Guncelleme yarida kaldi. Yukaridaki mesaji kontrol edin. ***
exit /b 1

:son
endlocal
