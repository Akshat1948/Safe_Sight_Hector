
#!/bin/bash
# SafeSight API Testing Script
echo "🔐 Logging in as manager..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"manager@safesight.local\",\"password\":\"safesight123\"}")

TOKEN=$(echo "$RESPONSE" | grep -o "\"accessToken\":\"[^\"]*" | cut -d"\"" -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  exit 1
fi
echo "✅ Login successful! Token obtained."
echo ""

echo "📋 === GET /api/incidents ==="
curl -s -X GET "http://localhost:3001/api/incidents" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

echo "🚨 === GET /api/sos ==="
curl -s -X GET "http://localhost:3001/api/sos" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

echo "🔔 === GET /api/alerts ==="
curl -s -X GET "http://localhost:3001/api/alerts" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

echo "🚗 === GET /api/transport/parking ==="
curl -s -X GET "http://localhost:3001/api/transport/parking" | python3 -m json.tool
echo ""

echo "🚌 === GET /api/transport/shuttles ==="
curl -s -X GET "http://localhost:3001/api/transport/shuttles" | python3 -m json.tool
echo ""
echo "✅ All Pod B endpoints tested!"

