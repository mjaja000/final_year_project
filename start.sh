#!/bin/bash

echo "Starting Parking Management System..."
echo ""

echo "Starting PostgreSQL..."
sudo systemctl start postgresql
echo ""

echo "Checking and installing dependencies..."
npm install

echo ""
echo "Starting the server..."
npm start
