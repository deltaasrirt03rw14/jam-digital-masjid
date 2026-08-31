#!/bin/bash
echo "Setting up Jam Digital Masjid Foundation..."
echo "Installing backend dependencies..."
cd backend && npm install && cd ..
echo "Installing admin dependencies..."
cd admin && npm install && cd ..
echo "Copying environment files..."
cp backend/.env.example backend/.env
cp admin/.env.example admin/.env
echo "Setup complete!"
