const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying EncryptedTasks contract...\n");

  // Get the contract factory
  const EncryptedTasks = await hre.ethers.getContractFactory("EncryptedTasks");

  // Deploy the contract
  console.log("📝 Deploying contract to network:", hre.network.name);
  const tasks = await EncryptedTasks.deploy();

  await tasks.waitForDeployment();
  const tasksAddress = await tasks.getAddress();

  console.log("✅ EncryptedTasks deployed to:", tasksAddress);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: tasksAddress,
    deployedAt: new Date().toISOString(),
    deployer: (await hre.ethers.getSigners())[0].address,
  };

  const deploymentPath = path.join(__dirname, "..", "deployment-tasks.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to deployment-tasks.json");

  // Update frontend .env file
  const envPath = path.join(__dirname, "..", "frontend", ".env");
  let envContent = "";
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
    // Remove old VITE_CONTRACT_ADDRESS if exists
    envContent = envContent.replace(/VITE_CONTRACT_ADDRESS=.*/g, "");
  }
  
  envContent += `\nVITE_CONTRACT_ADDRESS=${tasksAddress}\n`;
  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log("📝 Updated frontend/.env with contract address");

  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Next steps:");
  console.log("1. Verify the contract on Etherscan (optional)");
  console.log("2. Run: cd frontend && npm run dev");
  console.log("3. Start using your encrypted task manager!\n");

  // Wait for block confirmations
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("⏳ Waiting for block confirmations...");
    await tasks.deploymentTransaction().wait(5);
    console.log("✅ Contract confirmed on blockchain");

    // Verify on Etherscan if API key is available
    if (process.env.ETHERSCAN_API_KEY) {
      console.log("\n🔍 Verifying contract on Etherscan...");
      try {
        await hre.run("verify:verify", {
          address: tasksAddress,
          constructorArguments: [],
        });
        console.log("✅ Contract verified on Etherscan");
      } catch (error) {
        console.log("⚠️  Verification failed:", error.message);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
