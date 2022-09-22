const { expect, assert, waffle } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("FSPStaking", function () {
  let FSPStaking,
    FSPStakingContract,
    BalloonToken,
    BalloonTokenContract,
    ReflectionToken,
    ReflectionTokenContract,
    RematicToken,
    RematicTokenContract;

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

    FSPStaking = await ethers.getContractFactory("FSPFactory");
    FSPStakingContract = await FSPStaking.deploy();
    await FSPStakingContract.deployed();

    BalloonToken = await ethers.getContractFactory("BalloonToken");
    BalloonTokenContract = await BalloonToken.deploy();
    await BalloonTokenContract.deployed();

    await BalloonTokenContract.transfer(user1.address, 10000000);

    ReflectionToken = await ethers.getContractFactory("ReflectionToken");
    ReflectionTokenContract = await ReflectionToken.deploy(10000000000000);
    await ReflectionTokenContract.deployed();

    RematicToken = await ethers.getContractFactory("Rematic");
    RematicTokenContract = await RematicToken.deploy();
    await RematicTokenContract.deployed();
    await RematicTokenContract.initialize(user1.address, user2.address);
  });

  describe.skip("Factory", function () {
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
        return x.event == "NewFSPPool";
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
  });

  describe.skip("FSPPool", function () {
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
        return x.event == "NewFSPPool";
      });

      StakingPool = await ethers.getContractFactory("FSPPool");

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

      // const expected2 = await StakingPoolContract.provider.getBalance(
      //   FSPStakingContract.address
      // );

      // expect(Number(expected2)).to.be.equal(
      //   Number(initialBalance) + Number(depositFee) + Number(withdrawFee)
      // );

      // await BalloonTokenContract.connect(user1).approve(
      //   StakingPoolContract.address,
      //   10000
      // );
      // await StakingPoolContract.connect(user1).deposit(10000, {
      //   value: depositFee,
      // });

      // const expected3 = await StakingPoolContract.provider.getBalance(
      //   FSPStakingContract.address
      // );

      // expect(Number(expected3)).to.be.equal(
      //   Number(initialBalance) +
      //     Number(depositFee) +
      //     Number(withdrawFee) +
      //     Number(depositFee)
      // );

      // await StakingPoolContract.connect(user1).emergencyWithdraw({
      //   value: emergencyWithdrawFee,
      // });

      // const expected4 = await StakingPoolContract.provider.getBalance(
      //   FSPStakingContract.address
      // );

      // expect(Number(expected4)).to.be.equal(
      //   Number(initialBalance) +
      //     Number(depositFee) +
      //     Number(withdrawFee) +
      //     Number(depositFee) +
      //     Number(emergencyWithdrawFee)
      // );
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

      const expected2 =
        Math.floor(Number((Number((3000 * 0.2).toFixed(0)) * 355) / 365)) +
        Number(expected1);
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

  describe.skip("FSPPool: type 1", function () {
    let StakingPool, StakingPoolContract;
    const rewardSupply = 100000000;
    beforeEach(async () => {
      const poolCreateFee = await FSPStakingContract.poolCreateFee();

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
        return x.event == "NewFSPPool";
      });

      StakingPool = await ethers.getContractFactory("FSPPool");

      StakingPoolContract = await StakingPool.attach(data[0].args.smartChef);

      await ReflectionTokenContract.transfer(
        data[0].args.smartChef,
        BigNumber.from("100000000000000000000000")
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
      await increaseTime(60 * 60 * 24 * 10);
      await StakingPoolContract.stopReward();
      await increaseTime(60 * 60 * 24 * 10);
      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });
      const balance = await BalloonTokenContract.balanceOf(user1.address);
      const rewardAmount =
        (10000 * 0.2 * 0.4931 * 10) / 180 + Number(initialBalance);
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

      const userPendingReward = await StakingPoolContract.pendingReward(
        user1.address
      );

      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });

      const balance = await ReflectionTokenContract.balanceOf(user1.address);

      expect(String(balance)).to.be.equal(
        String(
          BigNumber.from("10000")
            .add(userPendingReward)
            .mul(BigNumber.from("100000000000000000000000"))
            .mul(BigNumber.from("99"))
            .div(BigNumber.from("100"))
            .div(platfromStakedBalance)
        )
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
        Math.floor((Math.floor(3000 * 0.2 * 0.4931) * 170) / 180) +
        Number(expected1);
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

    it("_getReflectionAmount: should work", async () => {
      const totalReflectionAmount = BigNumber.from("100000000000000000000000");
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await increaseTime(60 * 60 * 24 * 365);
      const totalStakedAmount = await BalloonTokenContract.balanceOf(
        StakingPoolContract.address
      );
      const reflectionAmount =
        await StakingPoolContract.pendingReflectionReward(user1.address);

      const expected = BigNumber.from("10000")
        .mul(totalReflectionAmount)
        .div(totalStakedAmount);

      expect(reflectionAmount).to.be.equal(expected);
    });

    it("emergencyWithdrawByOnwer: should work 1", async () => {
      const totalReflectionAmount = BigNumber.from("100000000000000000000000");
      const initialOwnerBalance = await ReflectionTokenContract.balanceOf(
        deployer.address
      );

      const reflectionAmountOfPool = await ReflectionTokenContract.balanceOf(
        StakingPoolContract.address
      );

      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );

      const depositFee = await StakingPoolContract.getDepositFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });

      const stakedTokenAmountOfPool = await BalloonTokenContract.balanceOf(
        StakingPoolContract.address
      );

      await increaseTime(60 * 60 * 24 * 365);

      await StakingPoolContract.emergencyWithdrawByOwner();

      const pendingReward = await StakingPoolContract.pendingReward(
        user1.address
      );

      const expected = BigNumber.from("10000")
        .add(pendingReward)
        .mul(totalReflectionAmount)
        .div(stakedTokenAmountOfPool);

      reflectionAmountOfPool;

      const expectedBalance = await ReflectionTokenContract.balanceOf(
        deployer.address
      );

      expect(expectedBalance).to.be.least(
        reflectionAmountOfPool.sub(expected).add(initialOwnerBalance).sub(1)
      );
      expect(expectedBalance).to.be.most(
        reflectionAmountOfPool.sub(expected).add(initialOwnerBalance).add(1)
      );

      const withdrawFee = await StakingPoolContract.getWithdrawFee();

      const balance1 = await ReflectionTokenContract.balanceOf(user1.address);

      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });

      const lastStakedToken = await BalloonTokenContract.balanceOf(
        StakingPoolContract.address
      );

      const lastReflectionToken = await ReflectionTokenContract.balanceOf(
        StakingPoolContract.address
      );

      expect(Number(lastStakedToken))
        .to.be.equal(Number(lastReflectionToken))
        .to.be.equal(0);
    });

    it("emergencyWithdrawByOnwer: should work 2", async () => {
      const totalReflectionAmount = BigNumber.from("100000000000000000000000");
      const initialOwnerBalance = await ReflectionTokenContract.balanceOf(
        deployer.address
      );

      const reflectionAmountOfPool = await ReflectionTokenContract.balanceOf(
        StakingPoolContract.address
      );

      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );

      const depositFee = await StakingPoolContract.getDepositFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });

      const stakedTokenAmountOfPool = await BalloonTokenContract.balanceOf(
        StakingPoolContract.address
      );

      await increaseTime(60 * 60 * 24 * 365);

      const withdrawFee = await StakingPoolContract.getWithdrawFee();

      const pendingReward = await StakingPoolContract.pendingReward(
        user1.address
      );

      await StakingPoolContract.connect(user1).withdrawAll({
        value: withdrawFee,
      });

      await StakingPoolContract.emergencyWithdrawByOwner();

      const expected = BigNumber.from("10000")
        .add(pendingReward)
        .mul(totalReflectionAmount)
        .div(stakedTokenAmountOfPool);

      const expectedBalance = await ReflectionTokenContract.balanceOf(
        deployer.address
      );

      expect(expectedBalance).to.be.least(
        reflectionAmountOfPool.sub(expected).add(initialOwnerBalance).sub(1)
      );
      expect(expectedBalance).to.be.most(
        reflectionAmountOfPool.sub(expected).add(initialOwnerBalance).add(1)
      );

      const lastStakedToken = await BalloonTokenContract.balanceOf(
        StakingPoolContract.address
      );

      const lastReflectionToken = await ReflectionTokenContract.balanceOf(
        StakingPoolContract.address
      );

      expect(Number(lastStakedToken))
        .to.be.equal(Number(lastReflectionToken))
        .to.be.equal(0);

      const maxTokens = await StakingPoolContract.getMaxStakeTokenAmount();

      console.log(maxTokens.toString());
    });

    it("emergencyWithdrawByOwner: should fail if pool is not stopped", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await increaseTime(60 * 60 * 24 * 10);

      await expect(
        StakingPoolContract.emergencyWithdrawByOwner()
      ).to.be.revertedWith("pool is not ended yet");
    });

    it("shoudl fail if deposit amount exceed the max stake amount", async () => {
      const maxTokens = await StakingPoolContract.maxTokenSupply();
      await BalloonTokenContract.approve(
        StakingPoolContract.address,
        maxTokens.add(1)
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      await expect(
        StakingPoolContract.deposit(maxTokens.add(1), {
          value: depositFee,
        })
      ).to.be.revertedWith("deposit amount exceed the max stake token amount");
    });

    it("emergencyWithdrawByOwner: should work correctly", async () => {
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000
      );
      const depositFee = await StakingPoolContract.getDepositFee();
      await StakingPoolContract.connect(user1).deposit(10000, {
        value: depositFee,
      });
      await increaseTime(60 * 60 * 24 * 90);
    });

    it.skip("pendingReward should work", async () => {
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
        Math.floor(10000 * 0.2 * 0.4931)
      );
    });

    it("stopReward: should work by by owner and admin", async () => {
      await BalloonTokenContract.approve(StakingPoolContract.address, 10000);
      const depositFee = await StakingPoolContract.getDepositFee();
      await StakingPoolContract.deposit(10000, {
        value: depositFee,
      });

      await expect(
        StakingPoolContract.connect(user1).stopReward()
      ).to.be.revertedWith("You are not Admin");

      await FSPStakingContract.addAdmin(user1.address);
      await expect(StakingPoolContract.stopReward()).to.not.reverted;
    });
  });

  describe.skip("FSPPool: type 2", function () {
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
        return x.event == "NewFSPPool";
      });

      StakingPool = await ethers.getContractFactory("FSPPool");

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

  describe.skip("FSPPool: type 3", function () {
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
        return x.event == "NewFSPPool";
      });

      StakingPool = await ethers.getContractFactory("FSPPool");

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

  describe.skip("FSPPool: withdraw", () => {
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
        return x.event == "NewFSPPool";
      });

      StakingPool = await ethers.getContractFactory("FSPPool");

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
        return x.event == "NewFSPPool";
      });

      StakingPool = await ethers.getContractFactory("FSPPool");

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

    it("deploy pool contract twice", async () => {
      let APY = 10,
        locktimeType = 2;
      const poolCreateFee = await FSPStakingContract.poolCreateFee();

      const rewardSupply = 100000000;

      await BalloonTokenContract.transfer(
        user1.address,
        BigNumber.from("100000000000000000000000")
      );

      await ReflectionTokenContract.transfer(
        user1.address,
        BigNumber.from("100000000000000000000000")
      );

      await BalloonTokenContract.connect(user1).approve(
        FSPStakingContract.address,
        rewardSupply
      );

      await ReflectionTokenContract.connect(user1).approve(
        FSPStakingContract.address,
        rewardSupply
      );

      const tx = await FSPStakingContract.connect(user1).deployPool(
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

      await tx.wait();

      await BalloonTokenContract.connect(user1).approve(
        FSPStakingContract.address,
        rewardSupply
      );

      const tx1 = await FSPStakingContract.connect(user1).deployPool(
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

      await tx1.wait();
    });

    it("UpdateFees: should work update fees function", async () => {
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
        return x.event == "NewFSPPool";
      });

      StakingPool = await ethers.getContractFactory("FSPPool");

      StakingPoolContract = await StakingPool.attach(data[0].args.smartChef);

      await FSPStakingContract.updateFees(
        ethers.utils.parseEther("1"),
        ethers.utils.parseEther("2"),
        ethers.utils.parseEther("3")
      );

      const depositFee = await StakingPoolContract.depositFee();
      const withdrawFee = await StakingPoolContract.withdrawFee();
      const emergencyWithdrawFee =
        await StakingPoolContract.emergencyWithdrawFee();

      expect(depositFee).to.be.equal(ethers.utils.parseEther("1"));
      expect(withdrawFee).to.be.equal(ethers.utils.parseEther("2"));
      expect(emergencyWithdrawFee).to.be.equal(ethers.utils.parseEther("3"));
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
