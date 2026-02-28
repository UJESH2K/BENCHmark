/**
 * Quick test to debug the setup issue
 */
const { ethers } = require("ethers");
const { getSigner, getContracts } = require("./backend/contractHelper");
require("dotenv").config();

async function test() {
  console.log("[Test] Starting...");
  
  try {
    console.log("[Test] Creating signer...");
    const deployer = getSigner(process.env.DEPLOYER_PRIVATE_KEY);
    const address = deployer.signer?.address || deployer.address;
    console.log("[Test] Deployer address:", address);
    
    console.log("[Test] Getting contracts...");
    const contracts = getContracts(deployer);
    console.log("[Test] Got contracts");
    
    console.log("[Test] Calling marketRegistry.createMarket...");
    const resolutionTime = Math.floor(Date.now() / 1000) + 3600;
    const tx = await contracts.marketRegistry.createMarket("Test question?", resolutionTime);
    console.log("[Test] Transaction sent:", tx.hash);
    
    console.log("[Test] Waiting for receipt...");
    const receipt = await tx.wait();
    console.log("[Test] Receipt:", {
      blockNumber: receipt.blockNumber,
      status: receipt.status,
      logsLength: receipt.logs?.length,
      gasUsed: receipt.gasUsed?.toString(),
      to: receipt.to,
      from: receipt.from
    });
    
    // Check if receipt status indicates failure
    if (receipt.status === 0) {
      console.warn("[Test] Transaction failed (status 0)");
    }
    
    if (receipt.logs && receipt.logs.length > 0) {
      console.log("[Test] First log:", {
        address: receipt.logs[0].address,
        topics: receipt.logs[0].topics?.map(t => t.slice(0, 10) + "..."),
        data: receipt.logs[0].data?.slice(0, 20) + "..."
      });
      
      try {
        const parsed = contracts.marketRegistry.interface.parseLog(receipt.logs[0]);
        console.log("[Test] Parsed first log:", parsed?.name);
      } catch (e) {
        console.log("[Test] Failed to parse first log:", e.message);
      }
    }
    
    console.log("[Test] SUCCESS");
  } catch (err) {
    console.error("[Test] ERROR:", err.message);
    console.error("[Test] Stack:", err.stack);
  }
}

test();
