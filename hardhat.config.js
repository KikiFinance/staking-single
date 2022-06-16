require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require('hardhat-deploy');
require ('hardhat-abi-exporter');
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan")

let accounts = [];
var fs = require("fs");
var read = require('read');
var util = require('util');
const keythereum = require("keythereum");
const prompt = require('prompt-sync')();
(async function () {
  try {
    const root = '.keystore';
    var pa = fs.readdirSync(root);
    for (let index = 0; index < pa.length; index++) {
      let ele = pa[index];
      let fullPath = root + '/' + ele;
      var info = fs.statSync(fullPath);
      //console.dir(ele);
      if (!info.isDirectory() && ele.endsWith(".keystore")) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const json = JSON.parse(content);
        const password = prompt('Input password for 0x' + json.address + ': ', { echo: '*' });
        //console.dir(password);
        const privatekey = keythereum.recover(password, json).toString('hex');
        //console.dir(privatekey);
        accounts.push('0x' + privatekey);
        //console.dir(keystore);
      }
    }
  } catch (ex) {
  }
  try {
    const file = '.secret';
    var info = fs.statSync(file);
    if (!info.isDirectory()) {
      const content = fs.readFileSync(file, 'utf8');
      let lines = content.split('\n');
      for (let index = 0; index < lines.length; index++) {
        let line = lines[index];
        if (line == undefined || line == '') {
          continue;
        }
        if (!line.startsWith('0x') || !line.startsWith('0x')) {
          line = '0x' + line;
        }
        accounts.push(line);
      }
    }
  } catch (ex) {
  }
})();

module.exports = {

  namedAccounts: {
    deployer: {
      default: 0,
      3: '0x49554923b9361e158Fb267B436f843a4f537D53a',
      97: '0x49554923b9361e158Fb267B436f843a4f537D53a',
      5: '0x49554923b9361e158Fb267B436f843a4f537D53a',
      56: '0x49554923b9361e158Fb267B436f843a4f537D53a',
      1: '0x11C1CaB6B01887f77B708BDdBd80db480D9B36c2',
    },
    KIKIToken: {
      default: 0,
      1: '0x82ca5FCd9eF2D6cEEb49a057bb11c3E091560979',
      5: '0x04E4b5FbC19f947E9A3D822c8Cc15e455CB362dc',
      56: '0x456469b4FCd1993A734fe7caE3bE039aB946BA9A',
    },
    signer1: {
      default: 0,
      5: '0xe44c51aF9B8D1CF2a7427469662d41A01D28566D',
      1: '0x5B854aBA65227EAE0b6e9440B02f9F7C359b2A4c',
    },
    signer2: {
      default: 1,
      5: '0xC17467954aC0f98721D541AcB86D686C854E098e',
      1: '0x7e9559bD11f56226cCC5CE3640709E7D335E77B1',
    },
    signer3: {
      default: 2,
      5: '0xD2a41045cfCCd973C966943C55552ed62064EfBA',
      1: '0x6E94D7d16148d6908cDCCD8bF693f062daCC3f76',
    },
  },
  solidity: {
    compilers: [{
      version: "0.4.24",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "constantinople"
      }
    }
      , {
      version: "0.6.12",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
      , {
      version: "0.8.0",
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
  defaultNetwork: "hardhat",
  networks: {
    ethmain: {
      url: `https://mainnet.infura.io/v3/5e5a1756169b4617bb6a47d9dbffb3be`,
      accounts: accounts,
      chainId: 1,
      gasMultiplier: 1.5,
    },
    ethtest: {
      url: `https://rinkeby.infura.io/v3/5e5a1756169b4617bb6a47d9dbffb3be`,
      accounts: accounts,
      chainId: 3,
      gasMultiplier: 1.5,
      tags: ["test"],
    },
    bscmain: {
      url: `https://bsc-dataseed1.defibit.io/`,
      accounts: accounts,
      chainId: 56,
      gasMultiplier: 1.5,
      tags: ["staging"],
    },
    bsctest: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545`,
      accounts: accounts,
      chainId: 97,
      gasMultiplier: 1.5,
      tags: ["test"],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/5e5a1756169b4617bb6a47d9dbffb3be`,
      timeout: 100000,
      accounts: accounts,
      chainId: 5,
      gasMultiplier: 1.5,
      tags: ["test"],
    },
    hardhat: {
      forking: {
        enabled: false,
        //url: `https://bsc-dataseed1.defibit.io/`
        url: `https://ropsten.infura.io/v3/5e5a1756169b4617bb6a47d9dbffb3be`,
        //url: `https://bsc-dataseed1.ninicoin.io/`,
        //url: `https://bsc-dataseed3.binance.org/`
        //url: `https://data-seed-prebsc-1-s1.binance.org:8545`
        //blockNumber: 8215578,
      },
      live: true,
      saveDeployments: true,
      tags: ["local"],
      timeout: 2000000,
    },
    dev: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      gas: "auto" || 30000000,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: "US1NI1JJCYFNHD7CI3584XW1WVU1RYW9WP",
      goerli: "US1NI1JJCYFNHD7CI3584XW1WVU1RYW9WP",
      bsc: "QRMHJUP6RQYYHBZJJ1U98RDS18VIUET4G2",
    }
  }
};