const hre = require('hardhat');
const BigNumber = require('bignumber.js')

async function main() {

  const { KIKIToken } = await hre.getNamedAccounts();
  const KiKiSeedToken = await hre.ethers.getContract("KiKiSeedToken") 
  const arguments = [
    KIKIToken,
  ];

  await hre.run("verify:verify", {
  address: KiKiSeedToken.address,
  constructorArguments: arguments,
});
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

