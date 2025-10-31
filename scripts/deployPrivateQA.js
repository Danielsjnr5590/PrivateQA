const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying PrivateQA contract...");

  const PrivateQA = await hre.ethers.getContractFactory("PrivateQA");
  const privateQA = await PrivateQA.deploy();

  await privateQA.waitForDeployment();

  const address = await privateQA.getAddress();
  console.log("✅ PrivateQA deployed to:", address);

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    contractName: "PrivateQA",
    address: address,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    deployer: (await hre.ethers.getSigners())[0].address
  };

  fs.writeFileSync(
    'deployment-privateqa.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("📝 Deployment info saved to deployment-privateqa.json");
  console.log("\n🔧 Update your .env file with:");
  console.log(`VITE_PRIVATEQA_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
