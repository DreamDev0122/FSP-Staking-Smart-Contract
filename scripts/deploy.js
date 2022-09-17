// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const { BigNumber } = require("ethers");

async function main() {
  const FSPStaking = await hre.ethers.getContractFactory("FSPFactory");
  const FSPStakingContract = await FSPStaking.deploy();

  await FSPStakingContract.deployed();

  console.log(`address: ${FSPStakingContract.address}`);

  const BalloonToken = await hre.ethers.getContractFactory("BalloonToken");
  const BalloonTokenContract = await BalloonToken.deploy();

  await BalloonTokenContract.deployed();

  console.log(`address: ${BalloonTokenContract.address}`);

  const ReflectionToken = await hre.ethers.getContractFactory(
    "ReflectionToken"
  );
  const ReflectionTokenContract = await ReflectionToken.deploy(100000000000);

  await ReflectionTokenContract.deployed();

  console.log(`address: ${ReflectionTokenContract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
