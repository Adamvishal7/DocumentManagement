@echo off
REM Document Management System - Setup Script for Windows

echo ==========================================
echo Document Management System - Setup
echo ==========================================
echo.

REM Backend setup
echo Setting up backend...
cd backend

if not exist ".env" (
    echo Creating backend .env file...
    copy .env.example .env
    echo [32m✓ Backend .env file created[0m
) else (
    echo [32m✓ Backend .env file already exists[0m
)

echo Installing backend dependencies...
call npm install
echo [32m✓ Backend dependencies installed[0m

cd ..

REM Frontend setup
echo.
echo Setting up frontend...
cd frontend

if not exist ".env" (
    echo Creating frontend .env file...
    copy .env.example .env
    echo [32m✓ Frontend .env file created[0m
) else (
    echo [32m✓ Frontend .env file already exists[0m
)

echo Installing frontend dependencies...
call npm install
echo [32m✓ Frontend dependencies installed[0m

cd ..

echo.
echo ==========================================
echo Setup complete!
echo ==========================================
echo.
echo To start the backend server:
echo   cd backend ^&^& npm run dev
echo.
echo To start the frontend:
echo   cd frontend ^&^& npm start
echo.
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.
pause
