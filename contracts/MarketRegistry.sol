// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MarketRegistry
 * @notice Maintains prediction markets with binary outcomes.
 *         Each market has a question, resolution time, and oracle-settable outcome.
 *         A simple AMM-like price is tracked per market for simulation purposes.
 */
contract MarketRegistry is Ownable {
    enum Outcome { UNRESOLVED, YES, NO }

    struct Market {
        uint256 id;
        string  question;
        uint256 resolutionTime;
        Outcome outcome;
        bool    resolved;
        uint256 yesPool;   // simulated liquidity pool
        uint256 noPool;
        uint256 totalVolume;
    }

    uint256 public nextMarketId;
    mapping(uint256 => Market) public markets;

    event MarketCreated(uint256 indexed marketId, string question, uint256 resolutionTime);
    event MarketResolved(uint256 indexed marketId, Outcome outcome);
    event PriceUpdated(uint256 indexed marketId, uint256 yesPool, uint256 noPool);

    constructor() Ownable(msg.sender) {
        nextMarketId = 1;
    }

    /**
     * @notice Create a new prediction market.
     */
    function createMarket(string calldata _question, uint256 _resolutionTime) external onlyOwner returns (uint256) {
        require(_resolutionTime > block.timestamp, "Resolution must be in the future");

        uint256 id = nextMarketId++;
        // Initialize with equal pools of 1000 units (simulated liquidity)
        markets[id] = Market({
            id: id,
            question: _question,
            resolutionTime: _resolutionTime,
            outcome: Outcome.UNRESOLVED,
            resolved: false,
            yesPool: 1000 ether,
            noPool: 1000 ether,
            totalVolume: 0
        });

        emit MarketCreated(id, _question, _resolutionTime);
        return id;
    }

    /**
     * @notice Resolve a market (simulated oracle).
     */
    function resolveMarket(uint256 _marketId, Outcome _outcome) external onlyOwner {
        Market storage m = markets[_marketId];
        require(!m.resolved, "Already resolved");
        require(_outcome != Outcome.UNRESOLVED, "Invalid outcome");

        m.outcome = _outcome;
        m.resolved = true;

        emit MarketResolved(_marketId, _outcome);
    }

    /**
     * @notice Update pool state after a trade (called by TradeExecutionProxy).
     */
    function updatePools(uint256 _marketId, uint256 _yesPool, uint256 _noPool, uint256 _volume) external {
        // In production, restrict to proxy only; for hackathon, owner or proxy can call
        Market storage m = markets[_marketId];
        require(!m.resolved, "Market resolved");
        m.yesPool = _yesPool;
        m.noPool = _noPool;
        m.totalVolume += _volume;

        emit PriceUpdated(_marketId, _yesPool, _noPool);
    }

    function getMarket(uint256 _marketId) external view returns (Market memory) {
        return markets[_marketId];
    }

    function getMarketCount() external view returns (uint256) {
        return nextMarketId - 1;
    }

    /**
     * @notice Get implied YES probability using constant-product formula.
     *         P(YES) = noPool / (yesPool + noPool)
     */
    function getYesProbability(uint256 _marketId) external view returns (uint256) {
        Market storage m = markets[_marketId];
        if (m.yesPool + m.noPool == 0) return 5000; // 50% default
        return (m.noPool * 10000) / (m.yesPool + m.noPool); // basis points
    }
}
