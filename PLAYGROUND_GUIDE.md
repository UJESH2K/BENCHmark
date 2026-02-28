# 🚀 Agents Playground - Complete Setup & Demo Guide

## Architecture Overview

Your project is now fully configured with:

### **Backend Stack (Running)**
- ✅ **Hardhat Local Node** - Blockchain at `localhost:8545`
- ✅ **Orchestrator API** - Server at `localhost:3000`
  - Live agent simulation engine
  - Market management
  - Trade execution
  - Real-time data streaming

### **Frontend Stack (Running)**
- ✅ **Vite Dev Server** - App at `localhost:5174`
- ✅ **Modern UI** - Sleek landing page with full dashboard
- ✅ **Playground Page** - Live visualization & agent monitoring

---

## 📊 What's Running Now

### Terminal 1: Hardhat Blockchain
```
npx hardhat node
→ Running on http://127.0.0.1:8545
→ 3 test accounts with 10,000 ETH each
```

### Terminal 2: Orchestrator Backend
```
node backend/orchestrator.js
→ Running on http://localhost:3000
→ API Endpoints:
   POST   /api/simulation/start
   GET    /api/simulation/status
   GET    /api/markets
   GET    /api/agents
   GET    /api/trades
   GET    /api/leaderboard
   GET    /api/ticks
```

### Terminal 3: Frontend Dev Server
```
npm run dev (from frontend/)
→ Running on http://localhost:5174
→ Hot module replacement enabled
```

---

## 🎮 How to Use the Playground

### Step 1: Open the App
Navigate to `http://localhost:5174` in your browser

### Step 2: Connect (Mock)
- Click **"Start Trading"** on landing page
- App will load the dashboard with sidebar navigation

### Step 3: Navigate to Playground
- In the **Sidebar**, click on **"Playground"** (⚡ icon)
- You'll see the complete agent simulation interface

### Step 4: Start a Simulation
1. Click the **"Start"** button in Simulation Control
2. Watch the real-time updates:
   - **Tick Progress** - Tracks your position in the 30-tick simulation
   - **Active Markets** - Shows 3 prediction markets
   - **Trading Agents** - 3 AI agents executing trades
   - **Live Charts** - Market probability evolution
   - **Trade History** - All executed trades with timestamps
   - **Agent Performance** - Rankings and statistics

---

## 📈 Visualization Components

### Market Chart
- **Implied Probability** (Gold line) - Current market price
- **True Probability** (Blue line) - Actual underlying probability
- Real-time area charts with gradient fills
- Trend indicators showing movement

### Trade History
- Live trade log with buy/sell indicators
- Agent names, market IDs, amounts
- Color-coded sides (Green=BUY YES, Red=BUY NO)
- Sorted by most recent first

### Agent Performance Leaderboard
- Individual agent statistics
- Trade count comparisons (visual bars)
- BUY YES vs BUY NO ratios
- Performance badges with color-coding

### Simulation Monitor
- Progress bar (0-30 ticks)
- Elapsed time counter
- Estimated time remaining
- Live status indicators

---

## 🤖 AI Agent Strategies

Your three agents currently deployed:

1. **NaiveArbAgent** (Gold - #f0b90b)
   - Exploits arbitrage opportunities
   - Buys when implied price < true probability
   - Simple but effective

2. **MeanRevertAgent** (Green - #26a17b)
   - Identifies probability divergence
   - Bets against extreme movements
   - Mean reversion strategy

3. **MomentumAgent** (Blue - #627eea)
   - Follows trend signals
   - High trading frequency
   - Momentum-based signals

**Optional: Train New Agents**
To add trained agents, you would:
1. Create new agent classes in `backend/agents/`
2. Implement `decide()` and `executeTrade()` methods
3. Register in orchestrator agent list
4. UI will auto-detect and display

---

## 📊 Real-Time Data Flow

```
Hardhat Node (8545)
        ↓
   Smart Contracts
        ↓
Orchestrator Backend (3000)
        ├→ MarketSimulator (evolves probabilities)
        ├→ 3 AI Agents (make decisions)
        ├→ API endpoints (serves data)
        └→ Tick Data (historical snapshots)
        ↓
Vite Frontend (5174)
        ├→ Fetch /api/markets (charts)
        ├→ Fetch /api/agents (leaderboard)
        ├→ Fetch /api/trades (trade history)
        └→ Fetch /api/ticks (historical data)
        ↓
   React Components
        └→ Animated Visualizations
```

---

## 🎯 Key Features Aligned to Your New UI

✅ **Modern Dashboard Design**
- Glass-morphism cards
- Smooth framer-motion animations
- Dark theme with gold/primary accents
- Responsive grid layouts

✅ **Real-Time Updates**
- 1-second refresh rate for live data
- Animated progress bars and charts
- Pulsing indicators for active agents
- Smooth transitions between states

✅ **Complete Simulation Visibility**
- All 3 markets displayed
- All trades tracked live
- All agent stats calculated
- Historical tick data preserved

---

## 🔧 API Response Examples

### `/api/simulation/status`
```json
{
  "status": "running",
  "currentTick": 5,
  "totalTicks": 30,
  "isRunning": true
}
```

### `/api/markets`
```json
[
  {
    "marketId": 1,
    "question": "Will BTC be above $100k by end of March 2026?",
    "trueProbability": 0.52,
    "impliedYesProb": 0.48,
    "yesPool": 234.5,
    "noPool": 267.8,
    "resolved": false,
    "totalVolume": 502.3
  }
]
```

### `/api/trades`
```json
[
  {
    "tick": 3,
    "agentName": "MomentumAgent",
    "agentId": 3,
    "marketId": 2,
    "buyYes": true,
    "amount": 15.5,
    "txHash": "0x1234..."
  }
]
```

---

## 🎓 Next Steps: Training Agents

### To create custom/trained agents:

1. **Historical Data Collection**
   - Run simulation, collect tick data via `/api/ticks`
   - Export to CSV for analysis

2. **Model Training**
   - Use Python/ML framework to train probability predictor
   - Generate decision weights

3. **Agent Implementation**
   - Create `backend/agents/CustomAgent.js`
   - Implement `decide()` with trained model
   - Add to orchestrator agent list

4. **A/B Testing**
   - Run simulations with different agent combinations
   - Compare performance via trade counts & volumes
   - Visualize results in dashboard

---

## 🐛 Troubleshooting

**"Connection refused on 3000"**
→ Restart orchestrator: `node backend/orchestrator.js`

**"No market data"**
→ Click "Start" simulation first - this initializes markets

**"Frontend shows blank"**
→ Wait for connection to backend, check /api/health

**"Trades not appearing"**
→ Check browser console for API errors, verify orchestrator is running

---

## 📝 Current Configuration

```
TOTAL_TICKS = 30              // Each simulation runs 30 ticks
TICK_INTERVAL_MS = 5000       // 5 seconds between ticks
DEPOSIT_AMOUNT_ETH = "50"     // Each agent starts with 50 BNB

MARKET_CONFIGS = 3 markets with:
  - Drift (slight bias)
  - Volatility (random fluctuations)
  - Initial probability
```

---

## 🎨 UI/UX Highlights

- **Responsive Design** - Works on desktop/tablet
- **Dark Theme** - Easy on the eyes, professional look
- **Smooth Animations** - Framer Motion transitions
- **Real-time Updates** - 1s polling from API
- **Glass Cards** - Modern semi-transparent panels
- **Color Coding** - Instant visual feedback (green=buy, red=sell)

---

## ✨ What to Show in Demo

1. **Open Playground** - Show beautiful UI
2. **Click Start** - Watch simulation begin
3. **Monitor Real-Time** - Show agents trading live
4. **View Charts** - Demonstrate market evolution
5. **Review Results** - Show final statistics

**Total Runtime**: ~2-3 minutes (30 ticks × 5 seconds)

---

**🚀 You're all set! Open http://localhost:5174 and explore the Playground!**
