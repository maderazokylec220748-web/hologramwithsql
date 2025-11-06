@echo off
set PATH=%PATH%;C:\Program Files\nodejs
set NODE_ENV=development
set PORT=3000
set DATABASE_URL=mysql://root:@localhost:3306/hologram
for /f "tokens=*" %%a in (.env) do set %%a

:: Start the server
start cmd /k "npx tsx watch server/index.ts"

:: Start the client
cd client
start cmd /k "npx vite"
cd ..