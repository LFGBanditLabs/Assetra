import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("Deploying Assetra Smart Contracts to Base...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // 1. Deploy KYC Registry
  console.log("\n1. Deploying KYC Registry...");
  const KYCRegistry = await ethers.getContractFactory("KYCRegistry");
  const kycRegistry = await upgrades.deployProxy(KYCRegistry, [], {
    initializer: "initialize",
    kind: "uups",
  });
  await kycRegistry.deployed();
  console.log("KYC Registry deployed to:", kycRegistry.address);

  // 2. Deploy Asset NFT
  console.log("\n2. Deploying Asset NFT...");
  const AssetNFT = await ethers.getContractFactory("AssetNFT");
  const assetNFT = await upgrades.deployProxy(AssetNFT, [], {
    initializer: "initialize",
    kind: "uups",
  });
  await assetNFT.deployed();
  console.log("Asset NFT deployed to:", assetNFT.address);

  // 3. Deploy Fractional Share (example for token ID 1)
  console.log("\n3. Deploying Fractional Share...");
  const FractionalShare = await ethers.getContractFactory("FractionalShare");
  const fractionalShare = await upgrades.deployProxy(
    FractionalShare,
    ["Assetra Fractional Share", "AFS", 1, kycRegistry.address],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );
  await fractionalShare.deployed();
  console.log("Fractional Share deployed to:", fractionalShare.address);

  // 4. Deploy Timelock for Governance
  console.log("\n4. Deploying Timelock Controller...");
  const minDelay = 3600; // 1 hour
  const proposers: string[] = [];
  const executors: string[] = [];
  const admin = deployer.address;

  const TimelockController = await ethers.getContractFactory(
    "TimelockControllerUpgradeable"
  );
  const timelock = await upgrades.deployProxy(
    TimelockController,
    [minDelay, proposers, executors, admin],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );
  await timelock.deployed();
  console.log("Timelock Controller deployed to:", timelock.address);

  // 5. Deploy Governance
  console.log("\n5. Deploying Asset Governance...");
  const votingDelay = 1; // 1 block
  const votingPeriod = 50400; // 1 week (~12s per block on Base)
  const proposalThreshold = ethers.utils.parseEther("1000"); // 1000 tokens
  const quorumPercentage = 4; // 4%

  const AssetGovernance = await ethers.getContractFactory("AssetGovernance");
  const governance = await upgrades.deployProxy(
    AssetGovernance,
    [
      fractionalShare.address,
      timelock.address,
      votingDelay,
      votingPeriod,
      proposalThreshold,
      quorumPercentage,
    ],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );
  await governance.deployed();
  console.log("Asset Governance deployed to:", governance.address);

  // Configure Timelock roles
  console.log("\n6. Configuring Timelock roles...");
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();

  await timelock.grantRole(PROPOSER_ROLE, governance.address);
  await timelock.grantRole(EXECUTOR_ROLE, ethers.constants.AddressZero); // Anyone can execute
  console.log("Timelock roles configured");

  console.log("\n=== Deployment Complete ===");
  console.log("KYC Registry:", kycRegistry.address);
  console.log("Asset NFT:", assetNFT.address);
  console.log("Fractional Share:", fractionalShare.address);
  console.log("Timelock:", timelock.address);
  console.log("Governance:", governance.address);

  // Save deployment addresses
  const fs = require("fs");
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      kycRegistry: kycRegistry.address,
      assetNFT: assetNFT.address,
      fractionalShare: fractionalShare.address,
      timelock: timelock.address,
      governance: governance.address,
    },
  };

  fs.writeFileSync(
    "./deployments.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
