# ✅ Agents Playground - Setup Verification

## 🟢 Status Check - All Services Running

### Backend Services
- ✅ **Hardhat Blockchain Node** 
  - Status: Running on `localhost:8545`
  - Verify: Check terminal showing "Started HTTP and WebSocket JSON-RPC server"

- ✅ **Orchestrator API Server**
  - Status: Running on `localhost:3000`
  - Verify: Terminal shows "🌐 API Server running on http://localhost:3000"
  - Endpoints Available:
    - POST `/api/simulation/start` - Starts new simulation
    - GET `/api/simulation/status` - Gets current status
    - GET `/api/markets` - Lists prediction markets
    - GET `/api/agents` - Lists trading agents
    - GET `/api/trades` - Gets all executed trades
    - GET `/api/ticks` - Gets historical tick data
    - GET `/api/leaderboard` - Gets agent leaderboard

### Frontend Services
- ✅ **Vite Dev Server**
  - Status: Running on `localhost:5174`
  - Verify: Open http://localhost:5174 in browser
  - Features: Hot module replacement, auto-reload on save

---

## 🎮 How to Test the Playground

### Test 1: Access the App
```
1. Open browser: http://localhost:5174
2. You should see a beautiful landing page with:
   - "AgentsHub" logo
   - Navigation menu
   - "Start Trading" button
3. Click "Start Trading" → Dashboard loads
```

### Test 2: Navigate to Playground
```
1. In sidebar, click "Playground" (⚡ icon)
2. You should see:
   - Simulation Control panel at top
   - Market overview grid
   - Agent Performance section
   - Trade history table
```

### Test 3: Start a Simulation
```
1. In Playground, click "Start" button
2. Observe:
   - Tick counter increments (0 → 1 → 2 ... → 30)
   - Progress bar fills up
   - Real-time status shows "Agents are executing trades live"
3. Wait for completion (~2-3 minutes for all 30 ticks)
4. Final message: "✅ Simulation complete! Review results below."
```

### Test 4: Verify Live Data
As simulation runs, you should see:

**Market Chart Updates:**
- Yellow line (Implied Probability) moves based on trades
- Blue line (True Probability) shows underlying random walk
- Both converge/diverge as agents trade

**Trade History Growing:**
- New trades appear at top of list
- Format: Agent Name, Market #, BUY YES/NO, Amount, Tick
- Color indicators: Green for BUY YES, Red for BUY NO

**Agent Stats Updating:**
- "Total Trades" counter increases
- BUY YES / BUY NO bars grow
- Performance bars show relative activity

---

## 🔍 API Endpoint Tests

### Quick Health Check
```bash
curl http://localhost:3000/api/simulation/status
```
Should return: `{"status":"idle","currentTick":0,"totalTicks":30,"isRunning":false}`

### Get Markets (before simulation)
```bash
curl http://localhost:3000/api/markets
```
Should return: `[]` (empty - markets don't exist until simulation starts)

### Get Markets (after simulation starts)
```bash
curl http://localhost:3000/api/markets
```
Should return array with 3 market objects containing:
- marketId
- question
- trueProbability
- impliedYesProb
- yesPool, noPool
- resolved status
- totalVolume

---

## 🚨 Troubleshooting

### Issue: "Connection refused" on port 3000
**Solution:**
```bash
# Kill any old process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Restart orchestrator
cd c:\Users\aadit\Downloads\bnbhack
node backend/orchestrator.js
```

### Issue: Frontend shows "Failed to resolve import"
**Solution:**
```bash
# The hot-reload should auto-fix
# If not, hard refresh browser: Ctrl+Shift+Delete → Clear cache
# Or restart frontend dev server:
cd c:\Users\aadit\Downloads\bnbhack\frontend
npm run dev
```

### Issue: "No agent data" message in Playground
**Solution:**
1. Click "Start" button to initialize simulation
2. This creates markets and agents on-chain
3. Data should populate immediately

### Issue: Markets show but no trades
**Solution:**
1. Give agents time to decide (5 seconds per tick)
2. Some ticks may have no trades (agents may pass)
3. Check browser console for API errors

---

## 📊 Expected Simulation Flow

```
Tick 1-3:   Agents learning market signals
Tick 4-10:  Active trading, high volatility
Tick 11-20: Trend formation
Tick 21-30: Final positioning & convergence

Final Result: 
- ~30-50 total trades across 3 agents
- Markets show prices converging to true probability
- Leaderboard shows agent rankings by trade frequency
```

---

## 🎯 Demo Script (for showing to others)

**Duration: 3-4 minutes**

1. **Show Landing Page** (20 seconds)
   - Demonstrate beautiful UI/UX
   - Click "Start Trading"

2. **Show Dashboard** (15 seconds)
   - Highlight portfolio summary
   - Show top agents list
   - Explain sidebar navigation

3. **Open Playground** (10 seconds)
   - Show clean layout
   - Describe visualization components

4. **Start Simulation** (with running commentary)
   - Click Start button (35 seconds of setup internally)
   - Watch Tick 1 appear
   - Explain what's happening:
     - "3 AI agents are analyzing markets"
     - "They're executing trades based on their strategies"
     - "Markets are evolving in real-time"
     - "We can see the divergence between implied and true probability"

5. **Skip Ahead** (optional - simulation takes ~2 minutes)
   - Refresh page → markets already exist
   - Markets show trades from previous run
   - Can reference /api/ticks in browser console

6. **Final Results** (30 seconds)
   - Show completed simulation
   - Review agent performance
   - Explain strategies:
     - NaiveArb: Exploits arbitrage
     - MeanRevert: Bets against extremes
     - Momentum: Follows trends

---

## 🔧 File Structure Reference

```
Your Project Root
├── backend/
│   ├── orchestrator.js          ← Main API server
│   ├── marketSimulator.js       ← Market evolution logic
│   ├── contractHelper.js        ← Blockchain interaction
│   └── agents/
│       ├── BaseAgent.js         ← Base class
│       ├── NaiveArbAgent.js     ← Arbitrage strategy
│       ├── MeanRevertAgent.js   ← Mean reversion strategy
│       └── MomentumAgent.js     ← Momentum strategy
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              ← Main routing component
│   │   ├── components/
│   │   │   ├── Playground.jsx   ← Main simulation UI
│   │   │   ├── Visualization/
│   │   │   │   ├── MarketChart.jsx
│   │   │   │   ├── TradeHistory.jsx
│   │   │   │   ├── AgentPerformance.jsx
│   │   │   │   └── SimulationMonitor.jsx
│   │   │   └── ... (other components)
│   │   └── ... (other files)
│   ├── package.json
│   └── vite.config.js
│
├── contracts/                   ← Smart contracts
├── .env                         ← Environment variables
└── PLAYGROUND_GUIDE.md          ← This guide
```

---

## 📈 Performance Expectations

- **Frontend Load Time:** < 2 seconds
- **First API Response:** < 500ms
- **Simulation Tick Time:** 5 seconds (configurable)
- **Total Simulation Duration:** ~2.5 minutes (30 ticks × 5s)
- **Browser Refresh Rate:** 1 second
- **Concurrent Trades:** 0-3 per tick (agents may pass)

---

## ✨ UI Features Implemented

✅ Glass-morphism design
✅ Real-time chart updates
✅ Smooth framer-motion animations
✅ Color-coded trade indicators
✅ Progress tracking
✅ Responsive grid layouts
✅ Dark theme with gold accents
✅ Live statistics counters
✅ Agent leaderboard with rankings
✅ Trade history with timestamps
✅ Market probability visualization

---

## 🎓 Next Steps After Demo

1. **Train Custom Agents**
   - Collect simulation data
   - Build ML models
   - Implement new strategies

2. **Add More Markets**
   - Modify MARKET_CONFIGS in orchestrator.js
   - Run longer simulations
   - Test agent interactions

3. **Deploy to Testnet**
   - Switch network in hardhat.config.js
   - Deploy contracts to BNB Testnet
   - Connect testnet RPC

4. **Build Analytics Dashboard**
   - Track historical PnL
   - Compare agent performance
   - Export trade data to CSV

---

**Everything is configured and ready to demonstrate! 🚀**

Questions? Check the console logs in browser or terminal for debug info.
