#!/bin/bash

# Document Management System - Setup Script

echo "=========================================="
echo "Document Management System - Setup"
echo "=========================================="
echo ""

# Backend setup
echo "Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "Creating backend .env file..."
    cp .env.example .env
    echo "✓ Backend .env file created"
else
    echo "✓ Backend .env file already exists"
fi

echo "Installing backend dependencies..."
npm install
echo "✓ Backend dependencies installed"

cd ..

# Frontend setup
echo ""
echo "Setting up frontend..."
cd frontend

if [ ! -f ".env" ]; then
    echo "Creating frontend .env file..."
    cp .env.example .env
    echo "✓ Frontend .env file created"
else
    echo "✓ Frontend .env file already exists"
fi

echo "Installing frontend dependencies..."
npm install
echo "✓ Frontend dependencies installed"

cd ..

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "To start the backend server:"
echo "  cd backend && npm run dev"
echo ""
echo "To start the frontend:"
echo "  cd frontend && npm start"
echo ""
echo "Backend will run on: http://localhost:5000"
echo "Frontend will run on: http://localhost:3000"
echo ""
