const hre = require('hardhat');
const BigNumber = require('bignumber.js')

async function main() {

  const MasterChef = await hre.ethers.getContract("MasterChef");
  const { KIKIToken } = await hre.getNamedAccounts();
  const syrupBar = await hre.ethers.getContract("SyrupBar") 
  let perBlock = new BigNumber('479459250000000').toFixed(0);
  let start = 0;
  const arguments = [
    KIKIToken,
    syrupBar.address,
    perBlock,
    start,
  ];

  await hre.run("verify:verify", {
  address: MasterChef.address,
  constructorArguments: arguments,
});
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

