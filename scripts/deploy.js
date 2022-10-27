// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

// async function main() {
//   [deployer] = await ethers.getSigners();
//   const FSPStaking = await hre.ethers.getContractFactory("FSPFactory");

//   // const FSPStakingContract = await FSPStaking.attach(
//   //   "0xE4e7521e0d3fc0cd57738B0280F2f79C146aE627"
//   // );

//   const FSPStakingContract = await FSPStaking.deploy();

//   await FSPStakingContract.deployed();

//   await FSPStakingContract.setPlatformOwner(deployer.address);

//   console.log(`address: ${FSPStakingContract.address}`);

//   // const BalloonToken = await hre.ethers.getContractFactory("BalloonToken");
//   // const BalloonTokenContract = await BalloonToken.deploy();

//   // await BalloonTokenContract.deployed();

//   // console.log(`address: ${BalloonTokenContract.address}`);

//   // const ReflectionToken = await hre.ethers.getContractFactory(
//   //   "ReflectionToken"
//   // );
//   // const ReflectionTokenContract = await ReflectionToken.deploy(100000000000);

//   // await ReflectionTokenContract.deployed();

//   // console.log(`address: ${ReflectionTokenContract.address}`);

//   // const price = await FSPStakingContract.poolCreateFee();

//   // await FSPStakingContract.estimateGas.deployPool(
//   //   "0x8712B7772AB2C8A441d46C686d7bD1586D3Fec76",
//   //   "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee",
//   //   BigNumber.from("1000000000000000000"),
//   //   10,
//   //   0,
//   //   10000000,
//   //   "1",
//   //   "1",
//   //   {
//   //     value: price,
//   //   }
//   // );
// }

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
async function main() {
  [deployer] = await ethers.getSigners();
  const FSPStaking = await hre.ethers.getContractFactory("FSPFactory");

  console.log("FSPFactory Contract is deploying...");

  const V1Address = "0x0CfF1ad6373B17dabc2fA5B3CFa1479F14500B01"

  // const FSPStakingContract = await hre.upgrades.deployProxy(
  //   FSPStaking,
  //   [
  //     [
  //       hre.ethers.utils.parseEther("0.04"),
  //       hre.ethers.utils.parseEther("0.03"),
  //       hre.ethers.utils.parseEther("0.02"),
  //       hre.ethers.utils.parseEther("0.01"),
  //     ],
  //     [
  //       hre.ethers.utils.parseEther("0.0075"),
  //       hre.ethers.utils.parseEther("0.012"),
  //     ],
  //     hre.ethers.utils.parseEther("0.001"),
  //     [
  //       hre.ethers.utils.parseEther("0.001"),
  //       hre.ethers.utils.parseEther("0.002"),
  //     ],
  //     [
  //       hre.ethers.utils.parseEther("0.04"),
  //       hre.ethers.utils.parseEther("0.04"),
  //     ],
  //     [
  //       hre.ethers.utils.parseEther("0.008"),
  //       hre.ethers.utils.parseEther("0.012"),
  //     ],
  //     [100000, 49310, 24650, 8291],
  //   ],
  //   { initializer: "initialize" }
  // );

  // await FSPStakingContract.deployed();


  const FSPFactoryV2 = await ethers.getContractFactory('FSPFactory');
  console.log('Upgrading Box...');
  await upgrades.upgradeProxy(V1Address, FSPFactoryV2);
  console.log('Box upgraded');

  // const FSPStakingContract = await FSPStaking.deploy();

  // await FSPStakingContract.deployed();

  // console.log(`address: ${FSPStakingContract.address}`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
