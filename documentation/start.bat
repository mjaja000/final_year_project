@echo off
echo Starting Parking Management System...
echo.

echo Starting PostgreSQL...
net start postgresql
echo.

echo Checking and installing dependencies...
npm install

echo.
echo Starting the server...
npm start

pause
