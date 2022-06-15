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

  const { KIKIToken } = await getNamedAccounts();
  await deploy('SyrupBar', {
    from: deployer.address,
    args: [KIKIToken],
    log: true,
  });
  
  const syrupBar = await ethers.getContract("SyrupBar")
  let perBlock = new BigNumber('10').multipliedBy('1000000000000000000').toFixed(0); 
  await deploy('MasterChef', {
    from: deployer.address,
    args: [KIKIToken, syrupBar.address, perBlock, 0],
    log: true,
  });

  const masterChef = await ethers.getContract("MasterChef");
  tx = await syrupBar.connect(deployer).transferOwnership(masterChef.address);
  tx = await tx.wait();
  console.log("transfer syrupBar contract owner to: ", masterChef.address);

};

module.exports.tags = ['MasterChef'];
module.exports.dependencies = [];