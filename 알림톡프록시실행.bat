@echo off
chcp 65001 >nul
title 알림톡 프록시
cd /d "%~dp0"
echo 알림톡 프록시를 시작합니다... (이 창을 닫으면 발송이 중단됩니다)
node aligo-alimtalk-proxy.js
if errorlevel 1 (
  echo.
  echo [문제 해결]
  echo - 'node'를 찾을 수 없다고 나오면: nodejs.org 에서 Node.js LTS를 먼저 설치하세요.
  echo - 파일을 찾을 수 없다고 나오면: 이 실행 파일을 aligo-alimtalk-proxy.js 와 같은 폴더에 두세요.
)
pause
