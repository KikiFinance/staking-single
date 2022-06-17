const hre = require('hardhat');
const BigNumber = require('bignumber.js')

async function main() {

  const MasterChef = await hre.ethers.getContract("MasterChef");
  const { KIKIToken } = await hre.getNamedAccounts();
  const kikiSeed = await hre.ethers.getContract("KiKiSeed") 
  let perBlock = new BigNumber('2383614000000000').toFixed(0);
  let start = 14977655;
  const arguments = [
    KIKIToken,
    kikiSeed.address,
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

