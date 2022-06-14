require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
const networkJson = require('./utils/network.json')
const { nnemonic } = require('./utils/nnemonic.json')

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers : [{
      version: "0.6.12",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "istanbul"
      }
    }
  ]
  },
  defaultNetwork: "dev",
  networks : {
    dev: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    goerli: {
      url: networkJson.goerliUrl,
      accounts: nnemonic,
    },
    kovan: {
      url: networkJson.kovanUrl,
      accounts: nnemonic,
    },
    ropsten: {
      url: networkJson.ropstenUrl,
      accounts: nnemonic,
      timeout: 999999,
    },
    rinkeby: {
      url: networkJson.rinkebyUrl,
      accounts: nnemonic,
    },
    hecoChain: {
      url: networkJson.hecoChain,
      accounts: nnemonic,
    },
    bsct: {
      url: networkJson.bsctUrl,
      accounts: nnemonic,
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    apiKey: {
      ropsten: networkJson.scankey,
      rinkeby: networkJson.scankey,
      goerli: networkJson.scankey
    }
  }
};