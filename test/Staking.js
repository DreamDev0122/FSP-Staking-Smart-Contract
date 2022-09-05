const { expect, assert, waffle } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("FSPStaking", function () {
  let FSPStaking, FSPStakingContract, BalloonToken, BalloonTokenContract;

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

    BalloonToken = await ethers.getContractFactory("BalloonToken");
    BalloonTokenContract = await BalloonToken.deploy(10000000000000);
    await BalloonTokenContract.deployed();

    await BalloonTokenContract.transfer(user1.address, 10000);
  });

  describe("Factory", function () {
    it("deployPool: Should fail if payment is not correct", async function () {
      await expect(
        FSPStakingContract.deployPool(
          BalloonTokenContract.address, // stakedToken
          reflectionToken.address, // reflection Token
          1000, // Reward Supply
          20, // APY
          0, // lock time
          100000, // limit amount per user
          "RFTX", // staked token symbol
          "BUSD" // reflection token symbol
        )
      ).to.be.revertedWith("Pool Price is not correct.");
    });

    it("deployPool: Should fail if user didn't approve reward token amount into pool", async () => {
      const poolPrice = await FSPStakingContract.poolPrice();
      await expect(
        FSPStakingContract.deployPool(
          BalloonTokenContract.address, // stakedToken
          reflectionToken.address, // reflection Token
          1000000, // Reward Supply
          20, // APY
          0, // lock time
          100000, // limit amount per user
          "RFTX", // staked token symbol
          "BUSD", // reflection token symbol

          { value: poolPrice }
        )
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("deployPool: Should send reward token amount from main factory contract to pool contract", async () => {
      const poolPrice = await FSPStakingContract.poolPrice();

      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      const tx = await FSPStakingContract.deployPool(
        BalloonTokenContract.address, // stakedToken
        reflectionToken.address, // reflection Token
        rewardSupply, // Reward Supply
        20, // APY
        0, // lock time
        100000, // limit amount per user
        "RFTX", // staked token symbol
        "BUSD", // reflection token symbol

        { value: poolPrice }
      );

      const receipt = await tx.wait();
      const data = receipt.events.filter((x) => {
        return x.event == "NewSmartChefContract";
      });

      const tokenBalnceOfPool = await BalloonTokenContract.balanceOf(
        data[0].args.smartChef
      );

      await expect(tokenBalnceOfPool).to.be.equal(rewardSupply);
    });

    it("deployPool: Should fail if staked token and reflection token contract address are same", async () => {
      const poolPrice = await FSPStakingContract.poolPrice();
      const rewardSupply = 100000000;
      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );
      await expect(
        FSPStakingContract.deployPool(
          BalloonTokenContract.address, // stakedToken
          BalloonTokenContract.address, // reflection Token
          rewardSupply, // Reward Supply
          20, // APY
          0, // lock time
          100000, // limit amount per user
          "RFTX", // staked token symbol
          "BUSD", // reflection token symbol

          { value: poolPrice }
        )
      ).to.be.revertedWith("Tokens must be be different");
    });

    it("deployPool: Should fail if lock time type is not correct", async () => {
      const poolPrice = await FSPStakingContract.poolPrice();
      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      await expect(
        FSPStakingContract.deployPool(
          BalloonTokenContract.address, // stakedToken
          reflectionToken.address, // reflection Token
          rewardSupply, // Reward Supply
          20, // APY
          4, // lock time
          100000, // limit amount per user
          "RFTX", // staked token symbol
          "BUSD", // reflection token symbol

          { value: poolPrice }
        )
      ).to.be.revertedWith("Lock Time Type is not correct");
    });

    it("deployPool: Should work successfully if user pay the correct amount of pool price and send reward token amount to main contract", async () => {
      const poolPrice = await FSPStakingContract.poolPrice();
      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      await expect(
        FSPStakingContract.deployPool(
          BalloonTokenContract.address, // stakedToken
          reflectionToken.address, // reflection Token
          rewardSupply, // Reward Supply
          20, // APY
          0, // lock time
          100000, // limit amount per user
          "RFTX", // staked token symbol
          "BUSD", // reflection token symbol

          { value: poolPrice }
        )
      ).to.not.reverted;
    });

    it("withdraw: Should fail if caller is not owner", async () => {
      const poolPrice = await FSPStakingContract.poolPrice();

      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      await FSPStakingContract.deployPool(
        BalloonTokenContract.address, // stakedToken
        reflectionToken.address, // reflection Token
        rewardSupply, // Reward Supply
        20, // APY
        0, // lock time
        100000, // limit amount per user
        "RFTX", // staked token symbol
        "BUSD", // reflection token symbol

        { value: poolPrice }
      );

      await expect(
        FSPStakingContract.connect(badActor).withdraw(user1.address, 10)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("withdraw: should work successfully if caller is owner", async () => {
      const poolPrice = await FSPStakingContract.poolPrice();

      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      await FSPStakingContract.deployPool(
        BalloonTokenContract.address, // stakedToken
        reflectionToken.address, // reflection Token
        rewardSupply, // Reward Supply
        20, // APY
        0, // lock time
        100000, // limit amount per user
        "RFTX", // staked token symbol
        "BUSD", // reflection token symbol

        { value: poolPrice }
      );

      const initialBalance = await FSPStakingContract.provider.getBalance(
        user1.address
      );

      await FSPStakingContract.connect(deployer).withdraw(
        user1.address,
        poolPrice
      );

      const expectBalance = await FSPStakingContract.provider.getBalance(
        user1.address
      );

      expect(Number(initialBalance) + Number(poolPrice)).to.be.equal(
        Number(expectBalance)
      );
    });
  });

  describe("SmartChefInitializable", function () {
    let StakingPool, StakingPoolContract;
    beforeEach(async () => {
      const poolPrice = await FSPStakingContract.poolPrice();

      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      const tx = await FSPStakingContract.deployPool(
        BalloonTokenContract.address, // stakedToken
        reflectionToken.address, // reflection Token
        rewardSupply, // Reward Supply
        20, // APY
        0, // lock time
        100000, // limit amount per user
        "RFTX", // staked token symbol
        "BUSD", // reflection token symbol

        { value: poolPrice }
      );

      const receipt = await tx.wait();
      const data = receipt.events.filter((x) => {
        return x.event == "NewSmartChefContract";
      });

      StakingPool = await ethers.getContractFactory("SmartChefInitializable");

      StakingPoolContract = await StakingPool.attach(data[0].args.smartChef);
    });

    it("should be set all initial variables correctly", async () => {});

    it("deposit: should fail if deposit amount exceed limit token amount", async () => {
      const limitAmountPerUser = await StakingPoolContract.limitAmountPerUser();
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        limitAmountPerUser + 100
      );
      await expect(
        StakingPoolContract.connect(user1).deposit(limitAmountPerUser + 100)
      ).to.be.revertedWith("Deposit: Amount above limit");
    });

    it("deposit: should work correctly", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      await expect(StakingPoolContract.connect(user1).deposit(10000)).to.be.not
        .reverted;
    });

    it("withdraw: should fail if withdraw amount is higher than deposited amount", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      await StakingPoolContract.connect(user1).deposit(10000);
      await expect(
        StakingPoolContract.connect(user1).withdraw(10001)
      ).to.be.revertedWith("Amount to withdraw too high");
    });

    it("withdraw: should fail if token is in lock time", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      await StakingPoolContract.connect(user1).deposit(10000);
      await expect(
        StakingPoolContract.connect(user1).withdraw(10000)
      ).to.be.revertedWith("You should wait until lock time");
    });
  });

  describe("SmartChefInitializable: withdraw", () => {
    it("withdraw: should work successfully if all info are correct", async () => {
      let StakingPool,
        StakingPoolContract,
        APY = 10,
        locktimeType = 2;
      const poolPrice = await FSPStakingContract.poolPrice();

      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      const tx = await FSPStakingContract.deployPool(
        BalloonTokenContract.address, // stakedToken
        reflectionToken.address, // reflection Token
        rewardSupply, // Reward Supply
        APY, // APY
        locktimeType, // lock time
        100000, // limit amount per user
        "RFTX", // staked token symbol
        "BUSD", // reflection token symbol
        { value: poolPrice }
      );

      const receipt = await tx.wait();
      const data = receipt.events.filter((x) => {
        return x.event == "NewSmartChefContract";
      });

      StakingPool = await ethers.getContractFactory("SmartChefInitializable");

      StakingPoolContract = await StakingPool.attach(data[0].args.smartChef);
      const initialBalance = await BalloonTokenContract.balanceOf(
        user1.address
      );
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      await StakingPoolContract.connect(user1).deposit(10000);
      await increaseTime(60 * 60 * 24 * 365);
      await StakingPoolContract.connect(user1).withdraw(10000);
      const balance = await BalloonTokenContract.balanceOf(user1.address);
      const rewardPercent =
        locktimeType == 0
          ? 100000
          : locktimeType == 1
          ? 49310
          : locktimeType == 2
          ? 24650
          : 8291;

      let rewardAmount = (((10000 * APY) / 100) * rewardPercent) / 100000;

      expect(Number(balance)).to.be.equal(
        Math.floor(Number(initialBalance) + rewardAmount)
      );
    });
  });
});

const rpc = ({ method, params }) => {
  return network.provider.send(method, params);
};

const increaseTime = async (seconds) => {
  await rpc({ method: "evm_increaseTime", params: [seconds] });
  return rpc({ method: "evm_mine" });
};
