require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@openzeppelin/hardhat-upgrades")
require("hardhat-typechain");
require("dotenv").config();

const { ALCHEMY_KEY, ACCOUNT_PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.13",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_KEY}`,
      accounts: [`0x${"51da636070256cb777e13977e07d27baba99aad1a2dd3b4aaeff1038f355bccf"}`],
    },
    mainnet: {
      chainId: 1,
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
      accounts: [`0x${ACCOUNT_PRIVATE_KEY}`],
    },
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [`0x${ACCOUNT_PRIVATE_KEY}`],
    },
    bscscan: {
      chainId: 56,
      url: `https://bsc-dataseed1.binance.org`,
      accounts: [`0x${ACCOUNT_PRIVATE_KEY}`],
    },
    localhost: {
    },
  },
  typechain: {
    outDir: "./typechain",
    target: "ethers-v5",
  },
  etherscan: {
    apiKey: "CDGSYGVF6Q67WZQHIEH57TCJH2GSIJBM3J"
  },
};
