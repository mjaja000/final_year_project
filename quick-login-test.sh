#!/bin/bash

echo "🧪 MatatuConnect Admin Login Test"
echo "=================================="
echo ""

# Check if server is running
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✓ Server is running on port 5000"
    echo ""
    echo "📤 Testing login..."
    
    response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@matatuconnect.test","password":"Admin@Matatu2024!"}')
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "Status: $http_code"
    echo "Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    
    if [ "$http_code" = "200" ]; then
        echo ""
        echo "✅ LOGIN SUCCESSFUL!"
    else
        echo ""
        echo "❌ LOGIN FAILED"
        echo ""
        echo "🔍 Possible issues:"
        echo "  - Check if password was entered correctly"
        echo "  - Verify email format in the request"
        echo "  - Check server logs for errors"
    fi
else
    echo "❌ Server is NOT running on port 5000"
    echo ""
    echo "🚀 Start the server first:"
    echo "  cd /home/generalli/Desktop/files/final\ year\ project/final_year_project"
    echo "  npm start"
    echo ""
    echo "Then run this script again:"
    echo "  bash quick-login-test.sh"
fi
