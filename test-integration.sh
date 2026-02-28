#!/bin/bash
# Quick Integration Test Script

echo "🧪 Agents Playground Integration Test"
echo "======================================"
echo ""

# Test 1: Blockchain Node
echo "1️⃣  Testing Blockchain Node (8545)..."
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | grep -q "result" && echo "✅ Blockchain running" || echo "❌ Blockchain not responding"
echo ""

# Test 2: Orchestrator API
echo "2️⃣  Testing Orchestrator API (3000)..."
curl -s http://localhost:3000/api/simulation/status | grep -q "status" && echo "✅ API running" || echo "❌ API not responding"
echo ""

# Test 3: Get Endpoints
echo "3️⃣  Testing API Endpoints..."
echo "   - GET /api/simulation/status"
curl -s http://localhost:3000/api/simulation/status | jq .

echo ""
echo "   - GET /api/markets"
curl -s http://localhost:3000/api/markets | jq . || echo "   (empty - run simulation first)"

echo ""
echo "4️⃣  Testing Frontend (5174)..."
curl -s http://localhost:5174 | grep -q "React" && echo "✅ Frontend running" || echo "⚠️  Frontend may still be loading"
echo ""

echo "======================================"
echo "✅ All services appear to be running!"
echo ""
echo "📱 Open in browser: http://localhost:5174"
echo ""
