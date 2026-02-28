# Agents Playground - BNB Chain

AI Trading Agents competing on prediction markets, fully on-chain on BNB Chain.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Dashboard                        │
│              (HTML/JS, connects via REST API)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 Orchestrator (Node.js)                        │
│  ┌──────────────┐ ┌───────────────┐ ┌────────────────────┐  │
│  │ Market        │ │ Agent 1:      │ │ Agent 2:           │  │
│  │ Simulator     │ │ NaiveArb      │ │ MeanRevert         │  │
│  │ (synthetic    │ │               │ │                    │  │
│  │  price feed)  │ │ Agent 3:      │ │ REST API Server    │  │
│  │               │ │ Momentum      │ │ (Express.js)       │  │
│  └──────────────┘ └───────────────┘ └────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ ethers.js (Web3)
┌──────────────────────▼──────────────────────────────────────┐
│              BNB Chain (Local / Testnet)                      │
│  ┌────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │ AgentRegistry  │ │ MarketRegistry  │ │ AgentVault    │  │
│  │ (ERC-8004)     │ │ (AMM markets)   │ │ (escrow)      │  │
│  └────────────────┘ └─────────────────┘ └───────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │            TradeExecutionProxy                         │  │
│  │  (validates trades, enforces risk limits, AMM swaps)   │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Smart Contracts

| Contract | Purpose |
|----------|---------|
| **AgentRegistry** | Registers AI agents with on-chain identity, risk limits, and strategy card URIs |
| **MarketRegistry** | Creates prediction markets with constant-product AMM pricing |
| **AgentVault** | Escrow contract for user deposits; agents never hold funds directly |
| **TradeExecutionProxy** | Validates and executes trades through the AMM, enforcing risk limits |

## AI Agents

| Agent | Strategy | Behavior |
|-------|----------|----------|
| **NaiveArbAgent** | Signal-vs-Market Arbitrage | Compares noisy true probability signal to market price; trades on >7% divergence |
| **MeanRevertAgent** | EMA Signal + Adaptive Sizing | Maintains EMA of signal; trades with size proportional to divergence magnitude |
| **MomentumAgent** | Trend Following | Follows consistent directional trends in signal; has cooldown to prevent overtrading |

## Quick Start

### Prerequisites
- Node.js v18+
- npm

### 1. Install dependencies
```bash
npm install
```

### 2. Compile contracts
```bash
npm run compile
```

### 3. Start local blockchain
```bash
npm run node
```

### 4. Deploy contracts (in a new terminal)
```bash
npm run deploy
```

### 5. Start the orchestrator + API server
```bash
npm start
```

### 6. Trigger the simulation
```bash
curl -X POST http://localhost:3000/api/simulation/start
```

### 7. Open the dashboard
Open `frontend/index.html` in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + status |
| POST | `/api/simulation/start` | Start a simulation run |
| GET | `/api/simulation/status` | Current tick, running state |
| GET | `/api/agents` | List all agents with summaries |
| GET | `/api/trades` | All executed trades with tx hashes |
| GET | `/api/ticks` | Full tick-by-tick data |
| GET | `/api/ticks/latest` | Latest tick snapshot |
| GET | `/api/leaderboard` | Agent leaderboard |
| GET | `/api/contracts` | Deployed contract addresses |

## Deploy to BNB Testnet

1. Get test BNB from https://testnet.bnbchain.org/faucet
2. Set your private key in `.env` (`DEPLOYER_PRIVATE_KEY`)
3. Run:
```bash
npm run deploy:testnet
```

## Project Structure
```
├── contracts/              # Solidity smart contracts
│   ├── AgentRegistry.sol
│   ├── MarketRegistry.sol
│   ├── AgentVault.sol
│   └── TradeExecutionProxy.sol
├── backend/
│   ├── orchestrator.js     # Main entry point, API server
│   ├── marketSimulator.js  # Synthetic market data generator
│   ├── contractHelper.js   # Shared Web3 utilities
│   └── agents/
│       ├── BaseAgent.js    # Abstract agent base class
│       ├── NaiveArbAgent.js
│       ├── MeanRevertAgent.js
│       └── MomentumAgent.js
├── frontend/
│   └── index.html          # Dashboard UI
├── scripts/
│   └── deploy.js           # Hardhat deployment script
├── hardhat.config.js
└── .env                    # Environment variables
```

## Key Design Decisions

- **Hybrid Architecture**: Critical logic (fund custody, agent registration, trade validation) on-chain; AI decision-making off-chain
- **Constant-Product AMM**: Markets use x*y=k formula for pricing, similar to Uniswap
- **NonceManager**: Handles sequential transaction ordering for multiple agents
- **Signal-Based Agents**: Agents receive noisy estimates of true probability, simulating real-world information asymmetry

## Built With
- Solidity 0.8.20 + OpenZeppelin
- Hardhat 2
- ethers.js v6
- Express.js
- BNB Smart Chain
