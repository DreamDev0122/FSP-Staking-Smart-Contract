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

    await BalloonTokenContract.transfer(user1.address, 10000000000);

    ReflectionToken = await ethers.getContractFactory("ReflectionToken");
    ReflectionTokenContract = await ReflectionToken.deploy(10000000000000);
    await ReflectionTokenContract.deployed();

    RematicToken = await ethers.getContractFactory("Rematic");
    RematicTokenContract = await RematicToken.deploy();
    await RematicTokenContract.deployed();
    await RematicTokenContract.initialize(user1.address, user2.address);
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
          false
        )
      ).to.be.revertedWith("Pool Price is not correct.");
    });

    it("deployPool: Should fail if staked token and reflection token contract address are same", async () => {
      const poolCreateFee = await FSPStakingContract.getCreationFee(0);
      const rewardSupply = 100000000;

      await expect(
        FSPStakingContract.deployPool(
          BalloonTokenContract.address, // stakedToken
          BalloonTokenContract.address, // reflection Token
          rewardSupply, // Reward Supply
          20, // APY
          0, // lock time
          100000, // limit amount per user
          false,
          { value: poolCreateFee }
        )
      ).to.be.revertedWith("Tokens must be be different");
    });

    it("deployPool: Should fail if lock time type is not correct", async () => {
      const poolCreateFee = await FSPStakingContract.getCreationFee(3);
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
          false,

          { value: poolCreateFee }
        )
      ).to.be.revertedWith("Lock Time Type is not correct");
    });

    it("deployPool: Should work successfully if user pay the correct amount of pool price and send reward token amount to main contract", async () => {
      const poolCreateFee = await FSPStakingContract.getCreationFee(0);
      const rewardSupply = 100000000;

      await FSPStakingContract.deployPool(
        BalloonTokenContract.address, // stakedToken
        ReflectionTokenContract.address, // reflection Token
        rewardSupply, // Reward Supply
        20, // APY
        0, // lock time
        100000, // limit amount per user
        false,

        { value: poolCreateFee }
      );
    });

    it("updateReflectionFees: should fail if caller is not owner", async () => {
      await expect(
        FSPStakingContract.connect(user1).updateReflectionFees(0, 0, 0, 0, 0)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("updateReflectionFees: should work correctly by owner", async () => {
      const depositFee = 10,
        earlyWithdrawFee = 20,
        canceledWithdrawFee = 30,
        rewardFee = 40,
        reflectionFee = 50;
      await FSPStakingContract.updateReflectionFees(
        depositFee,
        earlyWithdrawFee,
        canceledWithdrawFee,
        rewardFee,
        reflectionFee
      );
      const expectDepositFee = await FSPStakingContract.getDepositFee(true);
      const expectEarlyFee = await FSPStakingContract.getEarlyWithdrawFee(true);
      const expectCanceledWithdrawFee =
        await FSPStakingContract.getCanceledWithdrawFee(true);
      const expectRewardClaimFee = await FSPStakingContract.getRewardClaimFee(
        true
      );
      const expectReflectionFee = await FSPStakingContract.getReflectionFee();
      expect(depositFee).to.be.equal(expectDepositFee);
      expect(earlyWithdrawFee).to.be.equal(expectEarlyFee);
      expect(canceledWithdrawFee).to.be.equal(expectCanceledWithdrawFee);
      expect(rewardFee).to.be.equal(expectRewardClaimFee);
      expect(reflectionFee).to.be.equal(expectReflectionFee);
    });

    it("updateNonReflectionFees: should work correctly by owner", async () => {
      const depositFee = 10,
        earlyWithdrawFee = 20,
        canceledWithdrawFee = 30,
        rewardFee = 40;
      await FSPStakingContract.updateNonReflectionFees(
        depositFee,
        earlyWithdrawFee,
        canceledWithdrawFee,
        rewardFee
      );
      const expectDepositFee = await FSPStakingContract.getDepositFee(false);
      const expectEarlyFee = await FSPStakingContract.getEarlyWithdrawFee(
        false
      );
      const expectCanceledWithdrawFee =
        await FSPStakingContract.getCanceledWithdrawFee(false);
      const expectRewardClaimFee = await FSPStakingContract.getRewardClaimFee(
        false
      );
      expect(depositFee).to.be.equal(expectDepositFee);
      expect(earlyWithdrawFee).to.be.equal(expectEarlyFee);
      expect(canceledWithdrawFee).to.be.equal(expectCanceledWithdrawFee);
      expect(rewardFee).to.be.equal(expectRewardClaimFee);
    });

    it("setPlatformOwner: should fail if caller is not owner", async () => {
      await expect(
        FSPStakingContract.connect(user1).setPlatformOwner(user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("setPlatformOwner: should work correctly by owner", async () => {
      await FSPStakingContract.setPlatformOwner(user1.address);
      const expected = await FSPStakingContract.isPlatformOwner(user1.address);
      expect(expected).to.be.equal(true);
    });
  });

  describe("FSPPool", function () {
    let StakingPool, StakingPoolContract;
    beforeEach(async () => {
      const poolCreateFee = await FSPStakingContract.getCreationFee(0);

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
        10000000, // limit amount per user
        false,
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

    it("should fail if pool owner didn't transfer reward token to pool", async () => {
      await expect(
        StakingPoolContract.connect(user1).deposit(100)
      ).to.be.revertedWith("Pool owner didn't send the reward tokens");
    });

    it("rewardTokenTransfer: should fail if caller is not pool owner", async () => {
      await expect(
        StakingPoolContract.connect(user1).rewardTokenTransfer()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("rewardTokenTransfer: should work by owner", async () => {
      await BalloonTokenContract.approve(
        StakingPoolContract.address,
        100000000
      );
      await StakingPoolContract.rewardTokenTransfer();
      const expected = await BalloonTokenContract.balanceOf(
        StakingPoolContract.address
      );
      const isRewardTokenTransfered =
        await StakingPoolContract.isRewardTokenTransfered();
      expect(expected).to.be.equal(100000000);
      expect(isRewardTokenTransfered).to.be.equal(true);
    });

    it("deposit: should fail if payment is not enough", async () => {
      await BalloonTokenContract.approve(
        StakingPoolContract.address,
        100000000
      );
      await StakingPoolContract.rewardTokenTransfer();
      const depositFee = await StakingPoolContract.getDepositFee(true);
      await expect(
        StakingPoolContract.deposit(1000, { value: depositFee - 1 })
      ).to.be.revertedWith("deposit fee is not enough");
    });

    it("deposit: should work deposit function correctly", async () => {
      await BalloonTokenContract.approve(
        StakingPoolContract.address,
        110000000
      );
      await StakingPoolContract.rewardTokenTransfer();
      const depositFee = await StakingPoolContract.getDepositFee(true);
      await expect(StakingPoolContract.deposit(10000000, { value: depositFee }))
        .to.be.not.reverted;
    });

    it("claimReward: should fail if payment is not enough", async () => {
      await BalloonTokenContract.approve(
        StakingPoolContract.address,
        110000000
      );
      await StakingPoolContract.rewardTokenTransfer();
      const depositFee = await StakingPoolContract.getDepositFee(true);
      await StakingPoolContract.deposit(10000000, { value: depositFee });
      await expect(StakingPoolContract.claimReward()).to.be.revertedWith(
        "claim fee is not enough"
      );
    });

    it("claimReward: should work claimReward function correctly", async () => {
      await BalloonTokenContract.approve(
        StakingPoolContract.address,
        100000000
      );
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000000
      );
      await StakingPoolContract.rewardTokenTransfer();
      const depositFee = await StakingPoolContract.getDepositFee(true);
      const rewardClaimFee = await StakingPoolContract.getRewardClaimFee(true);
      await StakingPoolContract.connect(user1).deposit(10000000, {
        value: depositFee,
      });
      await increaseTime(60 * 60 * 24 * 10);
      const pendingReward1 = await StakingPoolContract.pendingReward(
        user1.address
      );
      const expectedPendingReward = Math.floor((10000000 * 0.2 * 10) / 365);
      expect(Number(pendingReward1)).to.be.equal(expectedPendingReward);
      const initialUser1Balance1 = await BalloonTokenContract.balanceOf(
        user1.address
      );
      await StakingPoolContract.connect(user1).claimReward({
        value: rewardClaimFee,
      });
      const expectedUser1Balance1 = await BalloonTokenContract.balanceOf(
        user1.address
      );
      expect(expectedUser1Balance1).to.be.equal(
        initialUser1Balance1.add(BigNumber.from(expectedPendingReward))
      );
      await increaseTime(60 * 60 * 24 * 10);
      const pendingReward2 = await StakingPoolContract.pendingReward(
        user1.address
      );
      expect(Number(pendingReward2)).to.be.most(expectedPendingReward + 1);
      expect(Number(pendingReward2)).to.be.least(expectedPendingReward - 1);
      await StakingPoolContract.connect(user1).claimReward({
        value: rewardClaimFee,
      });
      const pendingReward5 = await StakingPoolContract.pendingReward(
        user1.address
      );
      console.log("pendngReward5:", pendingReward5.toString());
      const expectedUser1Balance2 = await BalloonTokenContract.balanceOf(
        user1.address
      );
      expect(expectedUser1Balance2).to.be.most(
        expectedUser1Balance1.add(BigNumber.from(expectedPendingReward).add(1))
      );
      expect(expectedUser1Balance2).to.be.least(
        expectedUser1Balance1.add(BigNumber.from(expectedPendingReward).sub(1))
      );
      await increaseTime(60 * 60 * 24 * 10);
      const initialUser1Balance3 = await BalloonTokenContract.balanceOf(
        user1.address
      );
      const earlyWithdrawFee = await StakingPoolContract.getEarlyWithdrawFee(
        true
      );
      await StakingPoolContract.connect(user1).withdraw({
        value: earlyWithdrawFee,
      });
      const pendingReward3 = await StakingPoolContract.pendingReward(
        user1.address
      );
      expect(Number(pendingReward3)).to.be.equal(expectedPendingReward);
      await StakingPoolContract.connect(user1).claimReward({
        value: rewardClaimFee,
      });
      const expectedUser1Balance3 = await BalloonTokenContract.balanceOf(
        user1.address
      );
      expect(expectedUser1Balance3).to.be.equal(
        initialUser1Balance3.add(
          BigNumber.from(String(10000000 + expectedPendingReward))
        )
      );
      await BalloonTokenContract.connect(user1).approve(
        StakingPoolContract.address,
        10000000
      );
      await StakingPoolContract.connect(user1).deposit(10000000, {
        value: depositFee,
      });
      await increaseTime(60 * 60 * 24 * 30);
      await StakingPoolContract.connect(user1).claimReward({
        value: rewardClaimFee,
      });
      await increaseTime(60 * 60 * 24 * 365);
      const expectedPendingReward1 = Math.floor(
        (10000000 * 0.2 * (365 - 60)) / 365
      );
      const pendingReward4 = await StakingPoolContract.pendingReward(
        user1.address
      );
      expect(Number(pendingReward4)).to.be.equal(expectedPendingReward1);
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
