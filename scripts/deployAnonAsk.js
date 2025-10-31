const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Deploying AnonAsk contract...");

  const AnonAsk = await hre.ethers.getContractFactory("AnonAsk");
  const anonAsk = await AnonAsk.deploy();

  await anonAsk.waitForDeployment();

  const address = await anonAsk.getAddress();
  console.log("AnonAsk deployed to:", address);

  // Save deployment info
  const deployment = {
    contract: "AnonAsk",
    address: address,
    network: hre.network.name,
    deployer: (await hre.ethers.getSigners())[0].address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  fs.writeFileSync(
    "deployment-anonask.json",
    JSON.stringify(deployment, null, 2)
  );

  console.log("Deployment info saved to deployment-anonask.json");

  // Save to deployments folder
  const deploymentsDir = `./deployments/${hre.network.name}`;
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const artifact = await hre.artifacts.readArtifact("AnonAsk");
  fs.writeFileSync(
    `${deploymentsDir}/AnonAsk.json`,
    JSON.stringify({
      address: address,
      abi: artifact.abi,
      ...deployment
    }, null, 2)
  );

  console.log(`Deployment saved to ${deploymentsDir}/AnonAsk.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
