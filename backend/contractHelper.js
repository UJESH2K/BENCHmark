/**
 * contractHelper.js
 * Shared utilities for loading contract ABIs and creating ethers contract instances.
 */
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const ARTIFACTS_DIR = path.join(__dirname, "..", "artifacts", "contracts");

function loadABI(contractName) {
  const abiPath = path.join(ARTIFACTS_DIR, `${contractName}.sol`, `${contractName}.json`);
  const artifact = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  return artifact.abi;
}

function loadAddresses() {
  const addrPath = path.join(__dirname, "..", "deployed-addresses.json");
  return JSON.parse(fs.readFileSync(addrPath, "utf8"));
}

// Singleton provider to share across the app
let _provider = null;
function getProvider() {
  if (!_provider) {
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    _provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return _provider;
}

// Cache signers by private key to avoid nonce conflicts
const _signers = new Map();
function getSigner(privateKey, provider) {
  if (_signers.has(privateKey)) return _signers.get(privateKey);
  if (!provider) provider = getProvider();
  const wallet = new ethers.Wallet(privateKey, provider);
  // Wrap in NonceManager to auto-manage nonces for sequential txs
  const signer = new ethers.NonceManager(wallet);
  _signers.set(privateKey, signer);
  return signer;
}

function getContract(contractName, addressKey, signerOrProvider) {
  const abi = loadABI(contractName);
  const addresses = loadAddresses();
  const address = addresses[addressKey];
  return new ethers.Contract(address, abi, signerOrProvider);
}

function getContracts(signerOrProvider) {
  return {
    agentRegistry: getContract("AgentRegistry", "AgentRegistry", signerOrProvider),
    marketRegistry: getContract("MarketRegistry", "MarketRegistry", signerOrProvider),
    agentVault: getContract("AgentVault", "AgentVault", signerOrProvider),
    tradeProxy: getContract("TradeExecutionProxy", "TradeExecutionProxy", signerOrProvider),
  };
}

module.exports = {
  loadABI,
  loadAddresses,
  getProvider,
  getSigner,
  getContract,
  getContracts,
};
