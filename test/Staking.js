const { expect, assert, waffle } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("FSPStaking", function () {
  let FSPStaking,
    FSPStakingContract,
    BalloonToken,
    BalloonTokenContract,
    ReflectionToken,
    ReflectionTokenContract;

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

    ReflectionToken = await ethers.getContractFactory("ReflectionToken");
    ReflectionTokenContract = await ReflectionToken.deploy(10000000000000);
    await ReflectionTokenContract.deployed();
  });

  describe("Factory", function () {
    it("deployPool: Should fail if payment is not correct", async function () {
      await expect(
        FSPStakingContract.deployPool(
          BalloonTokenContract.address, // stakedToken
          ReflectionTokenContract.address, // reflection Token
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
      const poolCreateFee = await FSPStakingContract.poolCreateFee();
      await expect(
        FSPStakingContract.deployPool(
          BalloonTokenContract.address, // stakedToken
          ReflectionTokenContract.address, // reflection Token
          1000000, // Reward Supply
          20, // APY
          0, // lock time
          100000, // limit amount per user
          "RFTX", // staked token symbol
          "BUSD", // reflection token symbol

          { value: poolCreateFee }
        )
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("deployPool: Should send reward token amount from main factory contract to pool contract", async () => {
      const poolCreateFee = await FSPStakingContract.poolCreateFee();

      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      const tx = await FSPStakingContract.deployPool(
        BalloonTokenContract.address, // stakedToken
        ReflectionTokenContract.address, // reflection Token
        rewardSupply, // Reward Supply
        20, // APY
        0, // lock time
        100000, // limit amount per user
        "RFTX", // staked token symbol
        "BUSD", // reflection token symbol

        { value: poolCreateFee }
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
      const poolCreateFee = await FSPStakingContract.poolCreateFee();
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

          { value: poolCreateFee }
        )
      ).to.be.revertedWith("Tokens must be be different");
    });

    it("deployPool: Should fail if lock time type is not correct", async () => {
      const poolCreateFee = await FSPStakingContract.poolCreateFee();
      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      await expect(
        FSPStakingContract.deployPool(
          BalloonTokenContract.address, // stakedToken
          ReflectionTokenContract.address, // reflection Token
          rewardSupply, // Reward Supply
          20, // APY
          4, // lock time
          100000, // limit amount per user
          "RFTX", // staked token symbol
          "BUSD", // reflection token symbol

          { value: poolCreateFee }
        )
      ).to.be.revertedWith("Lock Time Type is not correct");
    });

    it("deployPool: Should work successfully if user pay the correct amount of pool price and send reward token amount to main contract", async () => {
      const poolCreateFee = await FSPStakingContract.poolCreateFee();
      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      await expect(
        FSPStakingContract.deployPool(
          BalloonTokenContract.address, // stakedToken
          ReflectionTokenContract.address, // reflection Token
          rewardSupply, // Reward Supply
          20, // APY
          0, // lock time
          100000, // limit amount per user
          "RFTX", // staked token symbol
          "BUSD", // reflection token symbol

          { value: poolCreateFee }
        )
      ).to.not.reverted;
    });

    it("withdraw: Should fail if caller is not owner", async () => {
      const poolCreateFee = await FSPStakingContract.poolCreateFee();

      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      await FSPStakingContract.deployPool(
        BalloonTokenContract.address, // stakedToken
        ReflectionTokenContract.address, // reflection Token
        rewardSupply, // Reward Supply
        20, // APY
        0, // lock time
        100000, // limit amount per user
        "RFTX", // staked token symbol
        "BUSD", // reflection token symbol

        { value: poolCreateFee }
      );

      await expect(
        FSPStakingContract.connect(badActor).withdraw(user1.address, 10)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("withdraw: should work successfully if caller is owner", async () => {
      const poolCreateFee = await FSPStakingContract.poolCreateFee();

      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      await FSPStakingContract.deployPool(
        BalloonTokenContract.address, // stakedToken
        ReflectionTokenContract.address, // reflection Token
        rewardSupply, // Reward Supply
        20, // APY
        0, // lock time
        100000, // limit amount per user
        "RFTX", // staked token symbol
        "BUSD", // reflection token symbol

        { value: poolCreateFee }
      );

      const initialBalance = await FSPStakingContract.provider.getBalance(
        user1.address
      );

      await FSPStakingContract.connect(deployer).withdraw(
        user1.address,
        poolCreateFee
      );

      const expectBalance = await FSPStakingContract.provider.getBalance(
        user1.address
      );

      expect(Number(initialBalance) + Number(poolCreateFee)).to.be.equal(
        Number(expectBalance)
      );
    });
  });

  describe("SmartChefInitializable", function () {
    let StakingPool, StakingPoolContract;
    beforeEach(async () => {
      const poolCreateFee = await FSPStakingContract.poolCreateFee();

      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      const tx = await FSPStakingContract.deployPool(
        BalloonTokenContract.address, // stakedToken
        ReflectionTokenContract.address, // reflection Token
        rewardSupply, // Reward Supply
        20, // APY
        0, // lock time
        100000, // limit amount per user
        "RFTX", // staked token symbol
        "BUSD", // reflection token symbol

        { value: poolCreateFee }
      );

      const receipt = await tx.wait();
      const data = receipt.events.filter((x) => {
        return x.event == "NewSmartChefContract";
      });

      StakingPool = await ethers.getContractFactory("SmartChefInitializable");

      StakingPoolContract = await StakingPool.attach(data[0].args.smartChef);

      await ReflectionTokenContract.transfer(
        data[0].args.smartChef,
        1000000000
      );
    });

    it("should be set all initial variables correctly", async () => {});

    it("deposit: should fail if deposit amount exceed limit token amount", async () => {
      const limitAmountPerUser = await StakingPoolContract.limitAmountPerUser();
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        limitAmountPerUser + 100
      );

      const depositFee = await StakingPoolContract.getDepositFee();

      await expect(
        StakingPoolContract.connect(user1).deposit(limitAmountPerUser + 100, {
          value: depositFee,
        })
      ).to.be.revertedWith("Deposit: Amount above limit");
    });

    it("deposit: should fail if deposit fee is not enough", async () => {
      const depositFee = await StakingPoolContract.getDepositFee();

      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );

      await expect(
        StakingPoolContract.connect(user1).deposit(10000, {
          value: depositFee - 1,
        })
      ).to.be.revertedWith("deposit fee is not enough");
    });

    it("withdraw: should fail if withdraw fee is not enough", async () => {});

    it("emergencyWithdraw: should fail if emergencyWithdraw fee is not enough", async () => {});

    it("getDepositFee: should return the correct price", async () => {
      const expected = await StakingPoolContract.getDepositFee();
      const depositFee = await StakingPoolContract.depositFee();
      expect(expected).to.be.equal((depositFee * 100000) / 100000);
    });

    it("deposit: should work correctly", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );

      const depositFee = await StakingPoolContract.getDepositFee();

      await expect(
        StakingPoolContract.connect(user1).deposit(10000, { value: depositFee })
      ).to.be.not.reverted;
    });

    it("withdraw: should fail if withdraw amount is higher than deposited amount", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await expect(
        StakingPoolContract.connect(user1).withdraw(10001, {
          value: withdrawFee,
        })
      ).to.be.revertedWith("Amount to withdraw too high");
    });

    it("withdraw: should fail if token is in lock time", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();

      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await expect(
        StakingPoolContract.connect(user1).withdrawAll({
          value: withdrawFee,
        })
      ).to.be.revertedWith("You should wait until lock time");
    });

    it("stopReward: should fail if caller is not owner", async () => {
      await expect(
        StakingPoolContract.connect(user1).stopReward()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("stopReward: should work correctly by owner", async () => {
      await expect(StakingPoolContract.stopReward()).to.be.not.reverted;
    });

    it("withdrawAll: users should get some rewards when stopped reward by owner", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await increaseTime(60 * 60 * 24 * 10);
      await StakingPoolContract.stopReward();
      await increaseTime(60 * 60 * 24 * 10);
      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });
      const balance = await BalloonTokenContract.balanceOf(user1.address);
      const rewardAmount = (10000 * 0.2 * 10) / 365 + 10000;
      expect(Math.floor(Number(balance))).to.be.equal(Math.floor(rewardAmount));
    });

    it("Reflection should work", async () => {
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();

      const initialBalance = await ReflectionTokenContract.balanceOf(
        user1.address
      );

      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );

      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });

      await increaseTime(60 * 60 * 24 * 365);

      const platfromStakedBalance = await BalloonTokenContract.balanceOf(
        StakingPoolContract.address
      );

      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });
      const balance = await ReflectionTokenContract.balanceOf(user1.address);
      const platformBalance = await ReflectionTokenContract.balanceOf(
        StakingPoolContract.address
      );

      expect(String(balance)).to.be.equal(
        (
          (Number(10000) / Number(platfromStakedBalance)) *
          Number(1000000000) *
          0.99
        ).toFixed(0)
      );
    });

    it("All fees should go to Platform Owner", async () => {
      const initialBalance = await StakingPoolContract.provider.getBalance(
        FSPStakingContract.address
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();
      const emergencyWithdrawFee =
        await StakingPoolContract.getEmergencyWithdrawFee();

      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });

      const expected1 = await StakingPoolContract.provider.getBalance(
        FSPStakingContract.address
      );

      expect(Number(expected1)).to.be.equal(
        Number(initialBalance) + Number(depositFee)
      );

      await increaseTime(60 * 60 * 24 * 365);

      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });

      const expected2 = await StakingPoolContract.provider.getBalance(
        FSPStakingContract.address
      );

      expect(Number(expected2)).to.be.equal(
        Number(initialBalance) + Number(depositFee) + Number(withdrawFee)
      );

      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });

      const expected3 = await StakingPoolContract.provider.getBalance(
        FSPStakingContract.address
      );

      expect(Number(expected3)).to.be.equal(
        Number(initialBalance) +
          Number(depositFee) +
          Number(withdrawFee) +
          Number(depositFee)
      );

      await StakingPoolContract.connect(user1).emergencyWithdraw({
        value: emergencyWithdrawFee,
      });

      const expected4 = await StakingPoolContract.provider.getBalance(
        FSPStakingContract.address
      );

      expect(Number(expected4)).to.be.equal(
        Number(initialBalance) +
          Number(depositFee) +
          Number(withdrawFee) +
          Number(depositFee) +
          Number(emergencyWithdrawFee)
      );
    });

    it("Deposit several times from same address", async () => {
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();

      const initialBalance = await BalloonTokenContract.balanceOf(
        user1.address
      );

      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      await StakingPoolContract.connect(user1).deposit(1000, {
        value: depositFee,
      });

      await increaseTime(60 * 60 * 24 * 10);
      const pendingReward1 = await StakingPoolContract.pendingReward(
        user1.address
      );
      const expected1 = ((1000 * 0.2 * 10) / 365).toFixed(0);
      expect(Number(pendingReward1)).to.be.equal(Number(expected1));
      await StakingPoolContract.connect(user1).deposit(2000, {
        value: depositFee,
      });

      await increaseTime(60 * 60 * 24 * 365);

      const expected2 = Number((3000 * 0.2).toFixed(0)) + Number(expected1);
      const pendingReward2 = await StakingPoolContract.pendingReward(
        user1.address
      );
      expect(pendingReward2).to.be.equal(Number(expected2));
      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });

      const balance = await BalloonTokenContract.balanceOf(user1.address);

      expect(Number(balance)).to.be.equal(
        Number(initialBalance) + Number(expected2)
      );
    });

    it("pendingReward should work", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await increaseTime(60 * 60 * 24 * 365);
      const pendingReward = await StakingPoolContract.pendingReward(
        user1.address
      );

      // console.log("pendingReward:", pendingReward);
    });
  });

  describe("SmartChefInitializable: type 1", function () {
    let StakingPool, StakingPoolContract;
    beforeEach(async () => {
      const poolCreateFee = await FSPStakingContract.poolCreateFee();

      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      const tx = await FSPStakingContract.deployPool(
        BalloonTokenContract.address, // stakedToken
        ReflectionTokenContract.address, // reflection Token
        rewardSupply, // Reward Supply
        20, // APY
        1, // lock time
        100000, // limit amount per user
        "RFTX", // staked token symbol
        "BUSD", // reflection token symbol

        { value: poolCreateFee }
      );

      const receipt = await tx.wait();
      const data = receipt.events.filter((x) => {
        return x.event == "NewSmartChefContract";
      });

      StakingPool = await ethers.getContractFactory("SmartChefInitializable");

      StakingPoolContract = await StakingPool.attach(data[0].args.smartChef);

      await ReflectionTokenContract.transfer(
        data[0].args.smartChef,
        1000000000
      );
    });

    it("getDepositFee: should return the correct price", async () => {
      const expected = await StakingPoolContract.getDepositFee();
      const depositFee = await StakingPoolContract.depositFee();
      expect(expected).to.be.equal((depositFee * 49310) / 100000);
    });

    it("deposit: should work correctly", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );

      const depositFee = await StakingPoolContract.getDepositFee();

      await expect(
        StakingPoolContract.connect(user1).deposit(10000, { value: depositFee })
      ).to.be.not.reverted;
    });

    it("withdraw: should fail if withdraw amount is higher than deposited amount", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await expect(
        StakingPoolContract.connect(user1).withdraw(10001, {
          value: withdrawFee,
        })
      ).to.be.revertedWith("Amount to withdraw too high");
    });

    it("withdraw: should fail if token is in lock time", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();

      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await expect(
        StakingPoolContract.connect(user1).withdrawAll({
          value: withdrawFee,
        })
      ).to.be.revertedWith("You should wait until lock time");
    });

    it("withdrawAll: users should get some rewards when stopped reward by owner", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await increaseTime(60 * 60 * 24 * 10);
      await StakingPoolContract.stopReward();
      await increaseTime(60 * 60 * 24 * 10);
      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });
      const balance = await BalloonTokenContract.balanceOf(user1.address);
      const rewardAmount = (10000 * 0.2 * 0.4931 * 10) / 180 + 10000;
      expect(Math.floor(Number(balance))).to.be.equal(Math.floor(rewardAmount));
    });

    it("Reflection should work", async () => {
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();

      const initialBalance = await ReflectionTokenContract.balanceOf(
        user1.address
      );

      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );

      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });

      await increaseTime(60 * 60 * 24 * 180);

      const platfromStakedBalance = await BalloonTokenContract.balanceOf(
        StakingPoolContract.address
      );

      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });
      const balance = await ReflectionTokenContract.balanceOf(user1.address);
      const platformBalance = await ReflectionTokenContract.balanceOf(
        StakingPoolContract.address
      );

      expect(String(balance)).to.be.equal(
        (
          (Number(10000) / Number(platfromStakedBalance)) *
          Number(1000000000) *
          0.99
        ).toFixed(0)
      );
    });

    it("Deposit several times from same address", async () => {
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();

      const initialBalance = await BalloonTokenContract.balanceOf(
        user1.address
      );

      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      await StakingPoolContract.connect(user1).deposit(1000, {
        value: depositFee,
      });

      await increaseTime(60 * 60 * 24 * 10);
      const pendingReward1 = await StakingPoolContract.pendingReward(
        user1.address
      );
      const expected1 = (((1000 * 0.2 * 10) / 180) * 0.4931).toFixed(0);
      expect(Number(pendingReward1)).to.be.equal(Number(expected1));
      await StakingPoolContract.connect(user1).deposit(2000, {
        value: depositFee,
      });

      await increaseTime(60 * 60 * 24 * 180);

      const expected2 =
        Number((3000 * 0.2 * 0.4931).toFixed(0)) + Number(expected1);
      const pendingReward2 = await StakingPoolContract.pendingReward(
        user1.address
      );
      expect(pendingReward2).to.be.least(Number(expected2) - 1);
      expect(pendingReward2).to.be.most(Number(expected2) + 1);

      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });

      const balance = await BalloonTokenContract.balanceOf(user1.address);

      expect(Number(balance)).to.be.least(
        Number(initialBalance) + Number(expected2) - 1
      );

      expect(Number(balance)).to.be.most(
        Number(initialBalance) + Number(expected2) + 1
      );
    });

    it("pendingReward should work", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await increaseTime(60 * 60 * 24 * 365);
      const pendingReward = await StakingPoolContract.pendingReward(
        user1.address
      );

      expect(String(pendingReward)).to.be.equal(
        (10000 * 0.2 * 0.4931).toFixed(0)
      );
    });
  });

  describe("SmartChefInitializable: type 2", function () {
    let StakingPool, StakingPoolContract;
    beforeEach(async () => {
      const poolCreateFee = await FSPStakingContract.poolCreateFee();

      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      const tx = await FSPStakingContract.deployPool(
        BalloonTokenContract.address, // stakedToken
        ReflectionTokenContract.address, // reflection Token
        rewardSupply, // Reward Supply
        20, // APY
        2, // lock time
        100000, // limit amount per user
        "RFTX", // staked token symbol
        "BUSD", // reflection token symbol

        { value: poolCreateFee }
      );

      const receipt = await tx.wait();
      const data = receipt.events.filter((x) => {
        return x.event == "NewSmartChefContract";
      });

      StakingPool = await ethers.getContractFactory("SmartChefInitializable");

      StakingPoolContract = await StakingPool.attach(data[0].args.smartChef);

      await ReflectionTokenContract.transfer(
        data[0].args.smartChef,
        1000000000
      );
    });

    it("getDepositFee: should return the correct price", async () => {
      const expected = await StakingPoolContract.getDepositFee();
      const depositFee = await StakingPoolContract.depositFee();
      expect(expected).to.be.equal((depositFee * 24650) / 100000);
    });

    it("deposit: should work correctly", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );

      const depositFee = await StakingPoolContract.getDepositFee();

      await expect(
        StakingPoolContract.connect(user1).deposit(10000, { value: depositFee })
      ).to.be.not.reverted;
    });

    it("withdraw: should fail if withdraw amount is higher than deposited amount", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await expect(
        StakingPoolContract.connect(user1).withdraw(10001, {
          value: withdrawFee,
        })
      ).to.be.revertedWith("Amount to withdraw too high");
    });

    it("withdraw: should fail if token is in lock time", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();

      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await expect(
        StakingPoolContract.connect(user1).withdrawAll({
          value: withdrawFee,
        })
      ).to.be.revertedWith("You should wait until lock time");
    });

    it("withdrawAll: users should get some rewards when stopped reward by owner", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await increaseTime(60 * 60 * 24 * 10);
      await StakingPoolContract.stopReward();
      await increaseTime(60 * 60 * 24 * 10);
      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });
      const balance = await BalloonTokenContract.balanceOf(user1.address);
      const rewardAmount = (10000 * 0.2 * 0.2465 * 10) / 90 + 10000;
      expect(Math.floor(Number(balance))).to.be.equal(Math.floor(rewardAmount));
    });

    it("Reflection should work", async () => {
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();

      const initialBalance = await ReflectionTokenContract.balanceOf(
        user1.address
      );

      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );

      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });

      await increaseTime(60 * 60 * 24 * 365);

      const platfromStakedBalance = await BalloonTokenContract.balanceOf(
        StakingPoolContract.address
      );

      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });
      const balance = await ReflectionTokenContract.balanceOf(user1.address);
      const platformBalance = await ReflectionTokenContract.balanceOf(
        StakingPoolContract.address
      );

      expect(String(balance)).to.be.equal(
        (
          (Number(10000) / Number(platfromStakedBalance)) *
          Number(1000000000) *
          0.99
        ).toFixed(0)
      );
    });

    it("Deposit several times from same address", async () => {
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();

      const initialBalance = await BalloonTokenContract.balanceOf(
        user1.address
      );

      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      await StakingPoolContract.connect(user1).deposit(1000, {
        value: depositFee,
      });

      await increaseTime(60 * 60 * 24 * 10);
      const pendingReward1 = await StakingPoolContract.pendingReward(
        user1.address
      );
      const expected1 = (((1000 * 0.2 * 10) / 90) * 0.2465).toFixed(0);
      expect(Number(pendingReward1)).to.be.equal(Number(expected1));
      await StakingPoolContract.connect(user1).deposit(2000, {
        value: depositFee,
      });

      await increaseTime(60 * 60 * 24 * 90);

      const expected2 =
        Number((3000 * 0.2 * 0.2465).toFixed(0)) + Number(expected1);
      const pendingReward2 = await StakingPoolContract.pendingReward(
        user1.address
      );
      expect(pendingReward2).to.be.least(Number(expected2) - 1);
      expect(pendingReward2).to.be.most(Number(expected2) + 1);

      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });

      const balance = await BalloonTokenContract.balanceOf(user1.address);

      expect(Number(balance)).to.be.least(
        Number(initialBalance) + Number(expected2) - 1
      );

      expect(Number(balance)).to.be.most(
        Number(initialBalance) + Number(expected2) + 1
      );
    });

    it("pendingReward should work", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await increaseTime(60 * 60 * 24 * 90);
      const pendingReward = await StakingPoolContract.pendingReward(
        user1.address
      );

      expect(String(pendingReward)).to.be.equal(
        (10000 * 0.2 * 0.2465).toFixed(0)
      );
    });
  });

  describe("SmartChefInitializable: type 3", function () {
    let StakingPool, StakingPoolContract;
    beforeEach(async () => {
      const poolCreateFee = await FSPStakingContract.poolCreateFee();

      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      const tx = await FSPStakingContract.deployPool(
        BalloonTokenContract.address, // stakedToken
        ReflectionTokenContract.address, // reflection Token
        rewardSupply, // Reward Supply
        20, // APY
        3, // lock time
        100000, // limit amount per user
        "RFTX", // staked token symbol
        "BUSD", // reflection token symbol

        { value: poolCreateFee }
      );

      const receipt = await tx.wait();
      const data = receipt.events.filter((x) => {
        return x.event == "NewSmartChefContract";
      });

      StakingPool = await ethers.getContractFactory("SmartChefInitializable");

      StakingPoolContract = await StakingPool.attach(data[0].args.smartChef);

      await ReflectionTokenContract.transfer(
        data[0].args.smartChef,
        1000000000
      );
    });

    it("getDepositFee: should return the correct price", async () => {
      const expected = await StakingPoolContract.getDepositFee();
      const depositFee = await StakingPoolContract.depositFee();
      expect(expected).to.be.equal((depositFee * 8291) / 100000);
    });

    it("deposit: should work correctly", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );

      const depositFee = await StakingPoolContract.getDepositFee();

      await expect(
        StakingPoolContract.connect(user1).deposit(10000, { value: depositFee })
      ).to.be.not.reverted;
    });

    it("withdraw: should fail if withdraw amount is higher than deposited amount", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await expect(
        StakingPoolContract.connect(user1).withdraw(10001, {
          value: withdrawFee,
        })
      ).to.be.revertedWith("Amount to withdraw too high");
    });

    it("withdraw: should fail if token is in lock time", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();

      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await expect(
        StakingPoolContract.connect(user1).withdrawAll({
          value: withdrawFee,
        })
      ).to.be.revertedWith("You should wait until lock time");
    });

    it("withdrawAll: users should get some rewards when stopped reward by owner", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await increaseTime(60 * 60 * 24 * 10);
      await StakingPoolContract.stopReward();
      await increaseTime(60 * 60 * 24 * 10);
      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });
      const balance = await BalloonTokenContract.balanceOf(user1.address);
      const rewardAmount = (10000 * 0.2 * 0.08291 * 10) / 30 + 10000;
      expect(Math.floor(Number(balance))).to.be.equal(Math.floor(rewardAmount));
    });

    it("Reflection should work", async () => {
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();

      const initialBalance = await ReflectionTokenContract.balanceOf(
        user1.address
      );

      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );

      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });

      await increaseTime(60 * 60 * 24 * 30);

      const platfromStakedBalance = await BalloonTokenContract.balanceOf(
        StakingPoolContract.address
      );

      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });
      const balance = await ReflectionTokenContract.balanceOf(user1.address);
      const platformBalance = await ReflectionTokenContract.balanceOf(
        StakingPoolContract.address
      );

      expect(String(balance)).to.be.equal(
        (
          (Number(10000) / Number(platfromStakedBalance)) *
          Number(1000000000) *
          0.99
        ).toFixed(0)
      );
    });

    it("Deposit several times from same address", async () => {
      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();

      const initialBalance = await BalloonTokenContract.balanceOf(
        user1.address
      );

      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );

      await StakingPoolContract.connect(user1).deposit(1000, {
        value: depositFee,
      });

      await increaseTime(60 * 60 * 24 * 10);

      const pendingReward1 = await StakingPoolContract.pendingReward(
        user1.address
      );

      const expected1 = Math.floor(((1000 * 0.2 * 10) / 30) * 0.08291);
      expect(Number(pendingReward1)).to.be.equal(Number(expected1));
      await StakingPoolContract.connect(user1).deposit(2000, {
        value: depositFee,
      });

      await increaseTime(60 * 60 * 24 * 90);

      const expected2 = Math.floor(3000 * 0.2 * 0.08291) + Number(expected1);
      const pendingReward2 = await StakingPoolContract.pendingReward(
        user1.address
      );
      expect(pendingReward2).to.be.equal(Number(expected2));

      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });

      const balance = await BalloonTokenContract.balanceOf(user1.address);

      expect(Number(balance)).to.be.equal(
        Number(initialBalance) + Number(expected2)
      );
    });

    it("pendingReward should work", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await increaseTime(60 * 60 * 24 * 90);
      const pendingReward = await StakingPoolContract.pendingReward(
        user1.address
      );

      expect(Number(pendingReward)).to.be.equal(
        Math.floor(10000 * 0.2 * 0.08291)
      );
    });
  });

  describe("SmartChefInitializable: withdraw", () => {
    it("withdraw: should work successfully if all info are correct", async () => {
      let StakingPool,
        StakingPoolContract,
        APY = 10,
        locktimeType = 2;
      const poolCreateFee = await FSPStakingContract.poolCreateFee();

      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      const tx = await FSPStakingContract.deployPool(
        BalloonTokenContract.address, // stakedToken
        ReflectionTokenContract.address, // reflection Token
        rewardSupply, // Reward Supply
        APY, // APY
        locktimeType, // lock time
        100000, // limit amount per user
        "RFTX", // staked token symbol
        "BUSD", // reflection token symbol
        { value: poolCreateFee }
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

      const depositFee = await StakingPoolContract.getDepositFee();
      const withdrawFee = await StakingPoolContract.getWithdrawFee();

      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await increaseTime(60 * 60 * 24 * 365);
      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });
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

    it("emergencyWithdraw: should withdraw with no reward", async () => {
      let StakingPool,
        StakingPoolContract,
        APY = 10,
        locktimeType = 2;
      const poolCreateFee = await FSPStakingContract.poolCreateFee();

      const rewardSupply = 100000000;

      await BalloonTokenContract.approve(
        FSPStakingContract.address,
        rewardSupply
      );

      const tx = await FSPStakingContract.deployPool(
        BalloonTokenContract.address, // stakedToken
        ReflectionTokenContract.address, // reflection Token
        rewardSupply, // Reward Supply
        APY, // APY
        locktimeType, // lock time
        100000, // limit amount per user
        "RFTX", // staked token symbol
        "BUSD", // reflection token symbol
        { value: poolCreateFee }
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

      const depositFee = await StakingPoolContract.getDepositFee();
      const emergencyWithdraw =
        await StakingPoolContract.getEmergencyWithdrawFee();

      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await increaseTime(60 * 60 * 24 * 365);
      await StakingPoolContract.connect(user1).emergencyWithdraw({
        value: emergencyWithdraw,
      });
      const balance = await BalloonTokenContract.balanceOf(user1.address);

      expect(Number(balance)).to.be.equal(Math.floor(Number(initialBalance)));
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
