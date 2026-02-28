// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAgentRegistry {
    struct Agent {
        address owner;
        uint256 riskLimit;
        string  agentCardURI;
        uint256 totalPnL;
        int256  reputation;
        bool    active;
    }
    function agents(uint256) external view returns (address, uint256, string memory, uint256, int256, bool);
    function getAgent(uint256) external view returns (Agent memory);
    function agentIdByOwner(address) external view returns (uint256);
}

interface IMarketRegistry {
    struct Market {
        uint256 id;
        string  question;
        uint256 resolutionTime;
        uint8   outcome;
        bool    resolved;
        uint256 yesPool;
        uint256 noPool;
        uint256 totalVolume;
    }
    function getMarket(uint256) external view returns (IMarketRegistry.Market memory);
    function updatePools(uint256, uint256, uint256, uint256) external;
}

interface IAgentVault {
    function agentTotalDeposits(uint256) external view returns (uint256);
    function deductForTrade(uint256, uint256) external;
    function returnFromTrade(uint256) external payable;
}

/**
 * @title TradeExecutionProxy
 * @notice Validates and executes signed trade intents from AI agents.
 *         Uses a constant-product AMM model for the prediction market pools.
 */
contract TradeExecutionProxy is Ownable, ReentrancyGuard {
    IAgentRegistry  public agentRegistry;
    IMarketRegistry public marketRegistry;
    IAgentVault     public vault;

    bool public paused;

    // Trade record
    struct TradeRecord {
        uint256 agentId;
        uint256 marketId;
        bool    buyYes;       // true = buy YES, false = buy NO
        uint256 amount;       // BNB amount
        uint256 tokensReceived;
        uint256 timestamp;
    }

    TradeRecord[] public tradeHistory;
    mapping(uint256 => uint256[]) public agentTrades; // agentId => trade indices

    event TradeExecuted(
        uint256 indexed tradeId,
        uint256 indexed agentId,
        uint256 indexed marketId,
        bool    buyYes,
        uint256 amount,
        uint256 tokensReceived
    );
    event Paused(bool isPaused);

    constructor(address _agentRegistry, address _marketRegistry, address _vault) Ownable(msg.sender) {
        agentRegistry = IAgentRegistry(_agentRegistry);
        marketRegistry = IMarketRegistry(_marketRegistry);
        vault = IAgentVault(_vault);
    }

    modifier whenNotPaused() {
        require(!paused, "Trading paused");
        _;
    }

    function togglePause() external onlyOwner {
        paused = !paused;
        emit Paused(paused);
    }

    /**
     * @notice Execute a trade on behalf of an agent.
     *         The agent (msg.sender) must be registered and active.
     *         Trade amount is deducted from the vault and applied to the market AMM.
     * @param _marketId ID of the prediction market.
     * @param _buyYes   true to buy YES tokens, false for NO tokens.
     * @param _amount   Amount of BNB to trade.
     */
    function executeTrade(
        uint256 _marketId,
        bool _buyYes,
        uint256 _amount
    ) external whenNotPaused nonReentrant returns (uint256 tokensOut) {
        // 1. Verify agent
        uint256 agentId = agentRegistry.agentIdByOwner(msg.sender);
        require(agentId != 0, "Not a registered agent");

        IAgentRegistry.Agent memory agent = agentRegistry.getAgent(agentId);
        require(agent.active, "Agent not active");
        require(_amount <= agent.riskLimit, "Exceeds risk limit");

        // 2. Verify market
        IMarketRegistry.Market memory market = marketRegistry.getMarket(_marketId);
        require(!market.resolved, "Market already resolved");

        // 3. Check vault balance
        uint256 vaultBal = vault.agentTotalDeposits(agentId);
        require(vaultBal >= _amount, "Insufficient vault funds");

        // 4. Deduct from vault
        vault.deductForTrade(agentId, _amount);

        // 5. Compute AMM swap (constant product: x * y = k)
        uint256 yesPool = market.yesPool;
        uint256 noPool  = market.noPool;

        if (_buyYes) {
            // Agent adds _amount to noPool, receives YES tokens
            uint256 newNoPool = noPool + _amount;
            uint256 newYesPool = (yesPool * noPool) / newNoPool;
            tokensOut = yesPool - newYesPool;
            marketRegistry.updatePools(_marketId, newYesPool, newNoPool, _amount);
        } else {
            // Agent adds _amount to yesPool, receives NO tokens
            uint256 newYesPool = yesPool + _amount;
            uint256 newNoPool  = (yesPool * noPool) / newYesPool;
            tokensOut = noPool - newNoPool;
            marketRegistry.updatePools(_marketId, newYesPool, newNoPool, _amount);
        }

        // 6. Record trade
        uint256 tradeId = tradeHistory.length;
        tradeHistory.push(TradeRecord({
            agentId: agentId,
            marketId: _marketId,
            buyYes: _buyYes,
            amount: _amount,
            tokensReceived: tokensOut,
            timestamp: block.timestamp
        }));
        agentTrades[agentId].push(tradeId);

        emit TradeExecuted(tradeId, agentId, _marketId, _buyYes, _amount, tokensOut);
        return tokensOut;
    }

    function getTradeCount() external view returns (uint256) {
        return tradeHistory.length;
    }

    function getAgentTradeCount(uint256 _agentId) external view returns (uint256) {
        return agentTrades[_agentId].length;
    }

    function getTrade(uint256 _tradeId) external view returns (TradeRecord memory) {
        return tradeHistory[_tradeId];
    }
}
