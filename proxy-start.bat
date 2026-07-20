@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo  AlimTalk Proxy (Keep this window OPEN)
echo  Check: http://localhost:8787
echo ============================================
node aligo-alimtalk-proxy.js
echo.
echo [If you see an error above]
echo - "node is not recognized": install Node.js LTS from nodejs.org, then run this again.
echo - "Cannot find module": keep this file in the SAME folder as aligo-alimtalk-proxy.js
pause
