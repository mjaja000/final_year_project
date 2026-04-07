@echo off
echo ===============================================
echo Starting ngrok tunnel for M-Pesa callbacks
echo ===============================================
echo.
echo This will expose your local backend (port 5000) to the internet
echo Copy the HTTPS URL that appears below and update your backend\.env file
echo.
echo Press Ctrl+C to stop ngrok when done
echo.
ngrok http 5000
