@echo off
cd /d "C:\Users\USER\hologramsql-main"
start /B npm run dev
timeout /t 5 /nobreak >nul
start /B npm run electron
exit
