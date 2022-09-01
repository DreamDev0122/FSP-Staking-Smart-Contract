const { expect, assert, waffle } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("FSPStaking", function () {
  let FSPStaking, FSPStakingContract, FSPStakingContract1;

  beforeEach(async function () {
    [
      deployer,
      controller,
      badActor,
      stakedToken,
      reflectionToken,
      user1,
      user2,
      ...user
    ] = await ethers.getSigners();

    FSPStaking = await ethers.getContractFactory("SmartChefFactory");
    FSPStakingContract = await FSPStaking.deploy();
    await FSPStakingContract.deployed();
  });

  describe("Test Suite", function () {
    it("Should set the right owner", async function () {
      const poolPrice = await FSPStakingContract.poolPrice();

      FSPStakingContract.on("NewSmartChefContract", (address) => {
        console.log(address);
      });

      const tx = await FSPStakingContract.deployPool(
        stakedToken.address, // stakedToken
        reflectionToken.address, // reflection Token
        1000000, // Reward Supply
        20, // APY
        10000, // lock time
        100000, // limit amount per user
        "RFTX", // staked token symbol
        "BUSD", // reflection token symbol
        controller.address, // admin address
        { value: poolPrice }
      );

      const receipt = await tx.wait();
      const data = receipt.events.filter((x) => {
        return x.event == "NewSmartChefContract";
      });

      const FSPStaking = await ethers.getContractFactory(
        "SmartChefInitializable"
      );

      const FSPStakingContract1 = await FSPStaking.attach(
        data[0].args.smartChef
      );

      const limitAmountPerUser = await FSPStakingContract1.limitAmountPerUser();
      console.log(limitAmountPerUser);
    });
  });
});
