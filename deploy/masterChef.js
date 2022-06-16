const BigNumber = require('bignumber.js');
const hre = require('hardhat');

module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
  const {deploy} = deployments;
  const {deployer} = await ethers.getNamedSigners();

  const { KIKIToken } = await getNamedAccounts();
  await deploy('SyrupBar', {
    from: deployer.address,
    args: [KIKIToken],
    log: true,
  });
  
  const syrupBar = await ethers.getContract("SyrupBar")
  //perBlock on ethmain
  let perBlock = new BigNumber('2383614000000000').toFixed(0);
  if (hre.network.tags.staging) {
    //perBlock on bscmain
    perBlock = new BigNumber('479459250000000').toFixed(0);
  }
  console.log("perBlock===> ", perBlock);
  await deploy('MasterChef', {
    from: deployer.address,
    args: [KIKIToken, syrupBar.address, perBlock, 14977655],
    log: true,
  });

  const masterChef = await ethers.getContract("MasterChef");
  tx = await syrupBar.connect(deployer).transferOwnership(masterChef.address);
  tx = await tx.wait();
  console.log("transfer syrupBar contract owner to: ", masterChef.address);

  let newMasterChefOwner = "0xab1dcF03ce47Cf5cc0cB1AdB06b772373d2A4E59";
  if (hre.network.tags.staging) {
    newMasterChefOwner = deployer.address;
  }
  tx = await masterChef.connect(deployer).transferOwnership(newMasterChefOwner);
  tx = await tx.wait();
  console.log("transfer masterChef contract owner to: ", newMasterChefOwner);

};

module.exports.tags = ['MasterChef'];
module.exports.dependencies = [];