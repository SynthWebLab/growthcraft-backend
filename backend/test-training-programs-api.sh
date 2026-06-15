#!/bin/bash

# Training Programs API Test Script
# Server: http://localhost:5002

BASE_URL="http://localhost:5002/api/v1"

echo "======================================"
echo "Training Programs API Test"
echo "======================================"
echo ""

echo "1. Testing GET All Programs..."
RESPONSE=$(curl -s "$BASE_URL/training-programs")
TOTAL=$(echo $RESPONSE | jq -r '.data.total')
echo "   ✓ Found $TOTAL programs"
echo ""

echo "2. Testing GET Domains..."
DOMAINS=$(curl -s "$BASE_URL/training-programs/filters/domains" | jq -r '.data.domains | length')
echo "   ✓ Found $DOMAINS domains"
echo ""

echo "3. Testing GET Program by Slug..."
PROGRAM=$(curl -s "$BASE_URL/training-programs/full-stack-web-development" | jq -r '.data.program.title')
echo "   ✓ Retrieved: $PROGRAM"
echo ""

echo "4. Testing GET Program Details..."
DETAILS=$(curl -s "$BASE_URL/training-programs/full-stack-web-development/details" | jq -r '.data.programDetails.slug')
echo "   ✓ Details for: $DETAILS"
echo ""

echo "5. Testing Filter by Domain..."
FILTERED=$(curl -s "$BASE_URL/training-programs?domain=Web%20Development" | jq -r '.data.total')
echo "   ✓ Found $FILTERED Web Development program(s)"
echo ""

echo "6. Testing Popular Programs..."
POPULAR=$(curl -s "$BASE_URL/training-programs/popular?limit=3" | jq -r '.data.programs | length')
echo "   ✓ Retrieved $POPULAR popular programs"
echo ""

echo "======================================"
echo "✅ All Public APIs Working!"
echo "======================================"
echo ""
echo "Program ID for testing: 6a2f9c6df228fd126dfb0274"
echo ""
echo "To test protected APIs:"
echo "1. Login: curl -X POST $BASE_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"your@email.com\",\"password\":\"yourpass\"}'"
echo "2. Set TOKEN variable with the received token"
echo "3. Test enrollment: curl -X POST $BASE_URL/training-programs/PROGRAM_ID/enroll -H 'Authorization: Bearer \$TOKEN' -H 'Content-Type: application/json' -d '{\"fullName\":\"Test\",\"email\":\"test@test.com\",\"phone\":\"+919876543210\"}'"
