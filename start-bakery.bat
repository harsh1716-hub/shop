@echo off
echo Starting Bakery Management System...

echo Checking if frontend is built...
cd frontend
if not exist "dist" (
    echo Building frontend for production...
    call npm install
    call npm run build
) else (
    echo Frontend already built.
)
cd ..

echo Starting Backend Server...
cd backend
start cmd /k "npm start"

echo Starting Frontend Server...
cd ../frontend
start cmd /k "npm run preview"

echo Both servers are booting up. 
echo Backend will run on https://shop-h7pf.onrender.com
echo Frontend will run on http://localhost:5173
pause
