// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentVault
 * @notice Secure escrow for user funds delegated to AI agents.
 *         Users deposit BNB (native) into agent-specific sub-vaults.
 *         Only the authorized TradeExecutionProxy can withdraw for trades.
 */
contract AgentVault is Ownable, ReentrancyGuard {
    // agentId => user => deposited balance
    mapping(uint256 => mapping(address => uint256)) public deposits;
    // agentId => total balance in vault
    mapping(uint256 => uint256) public agentTotalDeposits;
    // proxy authorized to move funds for trades
    address public tradeProxy;

    event Deposited(uint256 indexed agentId, address indexed user, uint256 amount);
    event Withdrawn(uint256 indexed agentId, address indexed user, uint256 amount);
    event TradeDeducted(uint256 indexed agentId, uint256 amount);
    event TradeReturned(uint256 indexed agentId, uint256 amount);
    event ProxyUpdated(address newProxy);

    constructor() Ownable(msg.sender) {}

    modifier onlyProxy() {
        require(msg.sender == tradeProxy, "Only trade proxy");
        _;
    }

    function setTradeProxy(address _proxy) external onlyOwner {
        tradeProxy = _proxy;
        emit ProxyUpdated(_proxy);
    }

    /**
     * @notice Deposit BNB into an agent's vault.
     */
    function deposit(uint256 _agentId) external payable nonReentrant {
        require(msg.value > 0, "Must deposit > 0");
        deposits[_agentId][msg.sender] += msg.value;
        agentTotalDeposits[_agentId] += msg.value;
        emit Deposited(_agentId, msg.sender, msg.value);
    }

    /**
     * @notice Withdraw deposited BNB from an agent's vault.
     */
    function withdraw(uint256 _agentId, uint256 _amount) external nonReentrant {
        require(deposits[_agentId][msg.sender] >= _amount, "Insufficient balance");
        deposits[_agentId][msg.sender] -= _amount;
        agentTotalDeposits[_agentId] -= _amount;

        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(_agentId, msg.sender, _amount);
    }

    /**
     * @notice Deduct funds from an agent's total pool for a trade.
     *         Called only by the TradeExecutionProxy.
     */
    function deductForTrade(uint256 _agentId, uint256 _amount) external onlyProxy nonReentrant {
        require(agentTotalDeposits[_agentId] >= _amount, "Insufficient vault balance");
        agentTotalDeposits[_agentId] -= _amount;
        emit TradeDeducted(_agentId, _amount);
    }

    /**
     * @notice Return funds to an agent's vault after trade settlement.
     */
    function returnFromTrade(uint256 _agentId) external payable onlyProxy nonReentrant {
        agentTotalDeposits[_agentId] += msg.value;
        emit TradeReturned(_agentId, msg.value);
    }

    function getDeposit(uint256 _agentId, address _user) external view returns (uint256) {
        return deposits[_agentId][_user];
    }

    function getAgentBalance(uint256 _agentId) external view returns (uint256) {
        return agentTotalDeposits[_agentId];
    }

    receive() external payable {}
}
