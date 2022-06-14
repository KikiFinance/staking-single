const hre = require('hardhat');
const BigNumber = require('bignumber.js')

async function main() {

  const MasterChef = await hre.ethers.getContract("MasterChef");
  const KIKIToken = "0x04E4b5FbC19f947E9A3D822c8Cc15e455CB362dc";
  const syrupBar = await hre.ethers.getContract("SyrupBar") 
  let perBlock = new BigNumber('10').multipliedBy('1000000000000000000').toFixed(0); //0%
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

