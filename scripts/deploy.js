const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // 1. Deploy AgentRegistry
  console.log("\n--- Deploying AgentRegistry ---");
  const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddr = await agentRegistry.getAddress();
  console.log("AgentRegistry deployed to:", agentRegistryAddr);

  // 2. Deploy MarketRegistry
  console.log("\n--- Deploying MarketRegistry ---");
  const MarketRegistry = await hre.ethers.getContractFactory("MarketRegistry");
  const marketRegistry = await MarketRegistry.deploy();
  await marketRegistry.waitForDeployment();
  const marketRegistryAddr = await marketRegistry.getAddress();
  console.log("MarketRegistry deployed to:", marketRegistryAddr);

  // 3. Deploy AgentVault
  console.log("\n--- Deploying AgentVault ---");
  const AgentVault = await hre.ethers.getContractFactory("AgentVault");
  const agentVault = await AgentVault.deploy();
  await agentVault.waitForDeployment();
  const agentVaultAddr = await agentVault.getAddress();
  console.log("AgentVault deployed to:", agentVaultAddr);

  // 4. Deploy TradeExecutionProxy
  console.log("\n--- Deploying TradeExecutionProxy ---");
  const TradeExecutionProxy = await hre.ethers.getContractFactory("TradeExecutionProxy");
  const tradeProxy = await TradeExecutionProxy.deploy(agentRegistryAddr, marketRegistryAddr, agentVaultAddr);
  await tradeProxy.waitForDeployment();
  const tradeProxyAddr = await tradeProxy.getAddress();
  console.log("TradeExecutionProxy deployed to:", tradeProxyAddr);

  // 5. Configure: set the trade proxy on the vault
  console.log("\n--- Configuring AgentVault to trust TradeExecutionProxy ---");
  const tx = await agentVault.setTradeProxy(tradeProxyAddr);
  await tx.wait();
  console.log("AgentVault.tradeProxy set to:", tradeProxyAddr);

  // 6. Save addresses to a JSON file for backend/frontend use
  const addresses = {
    network: hre.network.name,
    deployer: deployer.address,
    AgentRegistry: agentRegistryAddr,
    MarketRegistry: marketRegistryAddr,
    AgentVault: agentVaultAddr,
    TradeExecutionProxy: tradeProxyAddr,
    deployedAt: new Date().toISOString(),
  };

  const outPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log("\nAddresses saved to:", outPath);
  console.log(JSON.stringify(addresses, null, 2));

  // 7. Update .env file with addresses
  const envPath = path.join(__dirname, "..", ".env");
  let envContent = fs.readFileSync(envPath, "utf8");
  envContent = envContent.replace(/AGENT_REGISTRY_ADDRESS=.*/, `AGENT_REGISTRY_ADDRESS=${agentRegistryAddr}`);
  envContent = envContent.replace(/MARKET_REGISTRY_ADDRESS=.*/, `MARKET_REGISTRY_ADDRESS=${marketRegistryAddr}`);
  envContent = envContent.replace(/AGENT_VAULT_ADDRESS=.*/, `AGENT_VAULT_ADDRESS=${agentVaultAddr}`);
  envContent = envContent.replace(/TRADE_PROXY_ADDRESS=.*/, `TRADE_PROXY_ADDRESS=${tradeProxyAddr}`);
  fs.writeFileSync(envPath, envContent);
  console.log(".env updated with contract addresses");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
