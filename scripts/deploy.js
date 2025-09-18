// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
import hre from "hardhat"
import { writeFileSync, readFileSync } from "fs"

const mockQAFactories = JSON.parse(readFileSync("./mock/qaFactories.json").toString())

export const tokens = (n) => ethers.parseEther(n.toString())

async function main() {
  // Setup accounts
  const [deployer, ...qaFactorySigners] = await ethers.getSigners()

  const PLNC = await hre.ethers.getContractFactory("PLNC")
  const plnc = await PLNC.deploy(deployer.address)
  await plnc.waitForDeployment()
  const plncAddress = await plnc.getAddress()

  const DeviceNFT = await ethers.getContractFactory("DeviceNFT");
  const deviceNFT = await DeviceNFT.deploy(); // Assumes deviceNFT has no constructor args; adjust if needed
  await deviceNFT.waitForDeployment();
  const deviceNFTAddress = await deviceNFT.getAddress()

  const DevicesQA = await hre.ethers.getContractFactory("DevicesQA")
  const devicesQA = await DevicesQA.deploy(plncAddress, deviceNFTAddress)
  await devicesQA.waitForDeployment()

  const address = await devicesQA.getAddress()

  console.log('Deployer:', deployer.address)
  console.log(`Deployed Clothes Contract at: ${address}\n`)
  console.log(`Check out out in the Sonic Explorer: https://testnet.sonicscan.org/address/${address}\n`)
  console.log(`Update the .env file in ../frontend with the new contract address\n`)

  console.log('Now, registering some random qaFactories...')

  for (const [index, qaFactory] of mockQAFactories.slice(0, 2).entries()) {
    const qaBalance = await deployer.provider.getBalance(qaFactory.address)
    console.log(`QA Factory ${qaFactory.address} balance before:`, ethers.formatEther(qaBalance), 'ETH')

    if (qaBalance === 0n) {
      const fundTx = await deployer.sendTransaction({
        to: qaFactory.address,
        value: ethers.parseEther('0.05'), // e.g. 0.05 ETH
      })
      await fundTx.wait()
      console.log(`  → Funded with 0.05 ETH`)
    } else {
      console.log('  → Already has balance, skipping')
    }

    const qaFactorySigner = qaFactorySigners[index];

    const transaction = await devicesQA.connect(deployer).registerQAFactory(qaFactorySigner.address, qaFactory.name, qaFactory.certificationNumber);
    await transaction.wait();
    console.log(`Registered QA Factory: ${qaFactory.name} with license ${qaFactory.certificationNumber}`);
  }

  // now, fund some stablecoins to 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 if 

  console.log('checking network', hre.network.config)
  console.log('DEPLOYER ADDRESS', deployer.address)
  // if (hre.network.config.chainId === 31337) {
    // manual user, temp
    const [userSigner] = qaFactorySigners.slice(-1)
    // const passengerBalance = await deployer.provider.getBalance(userSigner.address)
    const passengerBalance = await plnc.balanceOf(userSigner.address)

    console.log('user signre address', userSigner.address, passengerBalance)
    if (passengerBalance < tokens(10000)) {
      console.log('MINT TOKENA!')
      plnc.mint(userSigner.address, tokens(10000))
    }

    // we need to whitelist each signer

    // }

  writeFileSync('./frontend/.env', `DEVICESQA_CONTRACT_ADDRESS=${address}\nPLNC_CONTRACT_ADDRESS=${plncAddress}\nDEVICE_NFT_CONTRACT_ADDRESS=${deviceNFTAddress}`, { flag: 'w' })

  // await hre.run("verify:verify", {
  //   address: deviceNFTAddress,
  //   constructorArguments: [],
  // });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
