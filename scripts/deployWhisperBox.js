const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying WhisperBox contract...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy WhisperBox
  console.log("\n📦 Deploying WhisperBox...");
  const WhisperBox = await hre.ethers.getContractFactory("WhisperBox");
  const whisperBox = await WhisperBox.deploy();
  
  await whisperBox.waitForDeployment();
  const whisperBoxAddress = await whisperBox.getAddress();
  
  console.log("✅ WhisperBox deployed to:", whisperBoxAddress);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: whisperBoxAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  const deploymentPath = path.join(__dirname, "..", "deployment-whisperbox.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentPath);

  // Save to deployments folder
  const deploymentsDir = path.join(__dirname, "..", "deployments", hre.network.name);
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save contract ABI and address
  const artifact = await hre.artifacts.readArtifact("WhisperBox");
  const deploymentData = {
    address: whisperBoxAddress,
    abi: artifact.abi,
    ...deploymentInfo,
  };

  const deploymentFilePath = path.join(deploymentsDir, "WhisperBox.json");
  fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentData, null, 2));
  console.log("💾 Contract data saved to:", deploymentFilePath);

  // Copy ABI to frontend
  const frontendAbiDir = path.join(__dirname, "..", "frontend", "src", "abi");
  if (!fs.existsSync(frontendAbiDir)) {
    fs.mkdirSync(frontendAbiDir, { recursive: true });
  }

  const frontendAbiPath = path.join(frontendAbiDir, "WhisperBox.json");
  fs.writeFileSync(frontendAbiPath, JSON.stringify(artifact.abi, null, 2));
  console.log("💾 ABI copied to frontend:", frontendAbiPath);

  console.log("\n✨ Deployment complete!");
  console.log("\n📋 Summary:");
  console.log("   Contract:", whisperBoxAddress);
  console.log("   Network:", hre.network.name);
  console.log("   Deployer:", deployer.address);
  
  console.log("\n🔗 Next steps:");
  console.log("   1. Update frontend/.env with contract address");
  console.log("   2. Verify contract on Etherscan (optional)");
  console.log("   3. Create your profile and start receiving messages!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
