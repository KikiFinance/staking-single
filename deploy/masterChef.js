const BigNumber = require('bignumber.js')

module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
  const {deploy} = deployments;
  const {deployer} = await ethers.getNamedSigners();

  const KIKIToken = "0x04E4b5FbC19f947E9A3D822c8Cc15e455CB362dc";
  await deploy('SyrupBar', {
    from: deployer.address,
    args: [KIKIToken],
    log: true,
  });
  
  const syrupBar = await ethers.getContract("SyrupBar")
  let perBlock = new BigNumber('10').multipliedBy('1000000000000000000').toFixed(0); //0%
  await deploy('MasterChef', {
    from: deployer.address,
    args: [KIKIToken, syrupBar.address, perBlock, 0],
    log: true,
  });

};

module.exports.tags = ['MasterChef'];
module.exports.dependencies = [];