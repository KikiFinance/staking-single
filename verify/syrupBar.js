const hre = require('hardhat');
const BigNumber = require('bignumber.js')

async function main() {

  const { KIKIToken } = await hre.getNamedAccounts();
  const SyrupBar = await hre.ethers.getContract("SyrupBar") 
  const arguments = [
    KIKIToken,
  ];

  await hre.run("verify:verify", {
  address: SyrupBar.address,
  constructorArguments: arguments,
});
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

