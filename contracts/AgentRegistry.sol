// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentRegistry
 * @notice Stores AI agent identities and metadata on-chain.
 *         Each agent registers with an owner address, risk limit, and an off-chain Agent Card URI.
 */
contract AgentRegistry is Ownable {
    struct Agent {
        address owner;
        uint256 riskLimit;       // max position size in wei
        string  agentCardURI;    // IPFS / HTTP link to off-chain strategy card
        uint256 totalPnL;        // cumulative PnL (signed via int cast)
        int256  reputation;      // simple reputation score
        bool    active;
    }

    uint256 public nextAgentId;
    mapping(uint256 => Agent) public agents;
    mapping(address => uint256) public agentIdByOwner;

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string agentCardURI);
    event AgentUpdated(uint256 indexed agentId, string agentCardURI);
    event AgentDeactivated(uint256 indexed agentId);
    event ReputationUpdated(uint256 indexed agentId, int256 newReputation);

    constructor() Ownable(msg.sender) {
        nextAgentId = 1; // start from 1, 0 means unregistered
    }

    /**
     * @notice Register a new AI agent.
     * @param _riskLimit   Maximum trade size the agent can execute (in wei).
     * @param _agentCardURI  Off-chain URI pointing to the agent's strategy card.
     */
    function registerAgent(uint256 _riskLimit, string calldata _agentCardURI) external returns (uint256) {
        require(agentIdByOwner[msg.sender] == 0, "Agent already registered");
        require(_riskLimit > 0, "Risk limit must be > 0");

        uint256 id = nextAgentId++;
        agents[id] = Agent({
            owner: msg.sender,
            riskLimit: _riskLimit,
            agentCardURI: _agentCardURI,
            totalPnL: 0,
            reputation: 0,
            active: true
        });
        agentIdByOwner[msg.sender] = id;

        emit AgentRegistered(id, msg.sender, _agentCardURI);
        return id;
    }

    function updateAgentCard(string calldata _newURI) external {
        uint256 id = agentIdByOwner[msg.sender];
        require(id != 0, "Not registered");
        agents[id].agentCardURI = _newURI;
        emit AgentUpdated(id, _newURI);
    }

    function deactivateAgent() external {
        uint256 id = agentIdByOwner[msg.sender];
        require(id != 0, "Not registered");
        agents[id].active = false;
        emit AgentDeactivated(id);
    }

    // --- Owner-only helpers ---

    function updateReputation(uint256 _agentId, int256 _delta) external onlyOwner {
        require(agents[_agentId].active, "Agent not active");
        agents[_agentId].reputation += _delta;
        emit ReputationUpdated(_agentId, agents[_agentId].reputation);
    }

    function getAgent(uint256 _agentId) external view returns (Agent memory) {
        return agents[_agentId];
    }

    function getAgentCount() external view returns (uint256) {
        return nextAgentId - 1;
    }
}
