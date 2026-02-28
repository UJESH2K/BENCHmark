# ⚡ Quick Start Checklist

## 🎯 Right Now (Verify Everything Works)

### ✅ Check Services Running
```
Terminal 1: Hardhat Node (8545)
- Look for: "Started HTTP and WebSocket JSON-RPC server"

Terminal 2: Orchestrator (3000)  
- Look for: "🌐 API Server running on http://localhost:3000"

Terminal 3: Frontend Vite (5174)
- Look for: "➜  Local:   http://localhost:5174/"
```

### ✅ Test in Browser (30 seconds)
1. Open: **http://localhost:5174**
2. See: Landing page with "AgentsHub" logo
3. Click: "Start Trading" button
4. See: Dashboard with sidebar

### ✅ Go to Playground (10 seconds)
1. Click: Sidebar → **Playground** (⚡ icon)
2. See: Simulation Control panel
3. See: Empty charts (waiting for data)

### ✅ Start Simulation (2-3 minutes)
1. Click: **"Start"** button in blue
2. Watch: Tick counter increment (0 → 1 → 2...)
3. See: Markets populate
4. See: Trades appear in history
5. Wait: Until "Simulation complete" message

### ✅ Review Results (1 minute)
1. Check: Final tick shows 30/30
2. Read: Agent Performance leaderboard
3. Review: Trade History with all executed trades
4. Notice: Market Charts converging

---

## 📱 Key URLs

| Service | URL | Purpose |
|---------|-----|---------|
| App | http://localhost:5174 | Main frontend |
| API | http://localhost:3000 | Backend endpoints |
| Markets | http://localhost:3000/api/markets | Get market data |
| Trades | http://localhost:3000/api/trades | Get trades |
| Status | http://localhost:3000/api/simulation/status | Get status |

---

## 🎮 Three Core Interactions

### 1. Start Simulation
```
Click "Start" button → Initializes everything
Takes ~30 seconds to setup on-chain
Then ticks begin (5 seconds each)
```

### 2. Monitor in Real-Time
```
Watch all 4 dashboard sections update live:
- Simulation Monitor (progress)
- Market Charts (probabilities)
- Trade History (executions)  
- Agent Performance (rankings)
```

### 3. View Final Results
```
After 30 ticks complete:
- Review total trades executed
- Check agent leaderboard
- Analyze market convergence
- See performance statistics
```

---

## 🔴 If Something Breaks

| Problem | Solution | Time |
|---------|----------|------|
| Blank screen | Ctrl+Shift+Del, clear cache, refresh | 30s |
| API errors | Restart orchestrator: `node backend/orchestrator.js` | 1m |
| Port errors | `netstat -ano`, `taskkill /PID <X> /F` | 2m |
| No styling | Check frontend console (F12), verify Vite running | 1m |

---

## 📊 What to Show (Demo Script)

**Total Time: 5 minutes**

```
00:00 - 00:30 | Show landing page, explain project
00:30 - 00:45 | Click "Start Trading", show dashboard
00:45 - 01:00 | Navigate to Playground
01:00 - 01:20 | Explain the 4 visualization sections
01:20 - 01:30 | Click "Start" to begin simulation
01:30 - 03:30 | [Simulation running - ~2.5 minutes]
              | Talk about what's happening:
              | - "3 AI agents are trading"
              | - "Markets evolving based on activity"
              | - "Prices converging to true probability"
03:30 - 04:30 | Simulation completes
              | Review results:
              | - Total trades
              | - Agent rankings
              | - Market convergence
04:30 - 05:00 | Q&A, discuss next steps
```

---

## 🎯 The Three Agents (Quick Explanation)

```
🔷 NaiveArb (Gold)
   "Looks for price differences"
   Strategy: Buy underpriced, sell overpriced

🟢 MeanRevert (Green)  
   "Bets against extremes"
   Strategy: When price too high/low, trade opposite

🔷 Momentum (Blue)
   "Follows the trend"
   Strategy: Buy when trending up, sell when down
```

---

## 💡 Key Visualization Elements

**Market Chart:**
- Yellow line = Market price (what agents trade at)
- Blue line = True probability (ground truth)
- Spread = Arbitrage opportunity

**Trade History:**
- Green arrows = BUY YES (bullish)
- Red arrows = BUY NO (bearish)
- Stacked = High agent activity

**Agent Performance:**
- Bar height = Trade volume
- Color = Agent ranking (1st/2nd/3rd)
- Numbers = Exact trade counts

**Simulation Monitor:**
- Green dot = Running
- Progress bar = Overall progress
- Counter = Current tick/total ticks

---

## 🚀 Next Steps After Demo

1. **Collect Data**
   - Export `/api/ticks` data
   - Analyze agent behavior
   - Study market patterns

2. **Build Models**
   - Use Python + scikit-learn
   - Predict market movements
   - Train new agent

3. **Test New Agent**
   - Code new strategy in `agents/`
   - Add to orchestrator list
   - Run A/B test vs current agents

4. **Deploy Live**
   - Switch to testnet
   - Deploy contracts
   - Connect real wallet

---

## ⏰ Timing Expectations

| Action | Time |
|--------|------|
| Page load | 2 seconds |
| Click "Start Trading" | 1 second |
| Navigate to Playground | 0.5 seconds |
| Simulation setup | 30 seconds |
| Simulation runtime (30 ticks) | 150-160 seconds |
| **Total** | **~3-4 minutes** |

---

## 📞 Support Commands

```bash
# Check if port is available
netstat -ano | findstr :3000

# Kill process using port
taskkill /PID <process_id> /F

# Restart frontend
cd frontend && npm run dev

# Restart orchestrator  
cd .. && node backend/orchestrator.js

# Check API health
curl http://localhost:3000/api/simulation/status
```

---

## ✨ Wow Moments to Highlight

1. **"Tradable AI"** - Agents making autonomous decisions
2. **"Real Smart Contracts"** - Actual blockchain execution
3. **"Live Visualization"** - Charts updating in real-time
4. **"Market Convergence"** - Prices finding equilibrium
5. **"Agent Competition"** - Multiple strategies competing
6. **"Scalable"** - Works with any number of agents/markets

---

**You're all set! Open http://localhost:5174 and click "Start Trading"**

*Questions during presentation? The code is commented and console logs everything.*
