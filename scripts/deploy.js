// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
import hre from "hardhat"
import { writeFileSync, readFileSync } from "fs"

const qaFactories = JSON.parse(readFileSync("./mock/qaFactories.json").toString())

export const tokens = (n) => ethers.parseEther(n.toString())

async function main() {
  // Setup accounts
  const [deployer, ...qaFactorySigners] = await ethers.getSigners()

  const DMC = await hre.ethers.getContractFactory("DMC")
  const dmc = await DMC.deploy(deployer.address)
  await dmc.waitForDeployment()
  const dmccAddress = await dmc.getAddress()

  const DeviceNFT = await ethers.getContractFactory("DeviceNFT");
  const deviceNFT = await DeviceNFT.deploy(); // Assumes deviceNFT has no constructor args; adjust if needed
  await deviceNFT.waitForDeployment();
  const deviceNFTAddress = await deviceNFT.getAddress()

  console.log('NFT contract deployed to:', deviceNFTAddress);

  const DevicesQA = await hre.ethers.getContractFactory("DevicesQA")
  const devicesQA = await DevicesQA.deploy(dmccAddress, deviceNFTAddress)
  await devicesQA.waitForDeployment()

  const address = await devicesQA.getAddress()

  console.log('Deployer:', deployer.address)
  console.log(`Deployed QA Contract at: ${address}\n`)
  console.log(`Check out in the Sonic Explorer: https://testnet.sonicscan.org/address/${address}\n`)
  console.log(`Update the .env file in ../frontend with the new contract address\n`)

  console.log('Now, registering some random qaFactories...')

  for (const [index, qaFactory] of qaFactories.slice(0, 2).entries()) {
    const qaBalance = await deployer.provider.getBalance(qaFactory.address)
    console.log(`QA Factory ${qaFactory.address} balance before:`, ethers.formatEther(qaBalance), 'ETH')

    const dmcQABalance = await dmc.balanceOf(qaFactory.address)
    console.log(`QA Factory ${qaFactory.address} DMC balance before:`, ethers.formatEther(dmcQABalance), 'DMC')

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

    if (dmcQABalance < tokens(10)) {
      const mintTx = await dmc.mint(qaFactory.address, tokens(100))
      await mintTx.wait()
      console.log(`  → Minted 100 DMC`)
    } else {
      console.log('  → Already has DMC balance, skipping')
    }

    const qaFactorySigner = qaFactorySigners[index];

    const transaction = await devicesQA.connect(deployer).registerQAFactory(qaFactory.address, qaFactory.name, qaFactory.certificationNumber);
    await transaction.wait();
    console.log(`Registered QA Factory: ${qaFactory.name} with license ${qaFactory.certificationNumber}, address: ${qaFactory.address}`);
  }

  // now, fund some stablecoins to 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 if 

  console.log('checking network', hre.network.config)
  console.log('DEPLOYER ADDRESS', deployer.address)
  const [userSigner] = qaFactorySigners.slice(-1)

  writeFileSync('./frontend/.env', `DEVICESQA_CONTRACT_ADDRESS=${address}\nDMC_CONTRACT_ADDRESS=${dmccAddress}\nDEVICE_NFT_CONTRACT_ADDRESS=${deviceNFTAddress}`, { flag: 'w' })

  if (hre.network.name !== 'hardhat' && hre.network.name !== 'localhost') {
    await hre.run("verify:verify", {
      address: deviceNFTAddress,
      constructorArguments: [],
    });
  }

  // await hre.run("verify:verify", {
  //   address: address,
  //   constructorArguments: [dmccAddress, deviceNFTAddress],
  // });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
