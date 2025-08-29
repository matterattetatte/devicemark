// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
import hre from "hardhat"
import { writeFileSync, readFileSync } from "fs"

const mockPilots = JSON.parse(readFileSync("./mock/pilots.json").toString())

export const tokens = (n) => ethers.parseEther(n.toString())

async function main() {
  // Setup accounts
  const [deployer, ...pilotSigners] = await ethers.getSigners()

  const PLNC = await hre.ethers.getContractFactory("PLNC")
  const plnc = await PLNC.deploy(deployer.address)
  await plnc.waitForDeployment()
  const plncAddress = await plnc.getAddress()

  // Deploy HeliUber
  const HeliUber = await hre.ethers.getContractFactory("HeliUber")
  const heliuber = await HeliUber.deploy(plncAddress)
  await heliuber.waitForDeployment()

  const address = await heliuber.getAddress()

  console.log(`Deployed HeliUber Contract at: ${address}\n`)
  console.log(`Check out out in the Sonic Explorer: https://testnet.soniclabs.com/address/${address}\n`)
  console.log(`Update the .env file in ../frontend with the new contract address\n`)

  console.log('Now, registering some random pilots...')

  for (const [index, pilot] of mockPilots.slice(0, 2).entries()) {
    const pilotBalance = await deployer.provider.getBalance(pilot.pilotAddress)
    console.log(`Pilot ${pilot.pilotAddress} balance before:`, ethers.formatEther(pilotBalance), 'ETH')

    if (pilotBalance === 0n) {
      const fundTx = await deployer.sendTransaction({
        to: pilot.pilotAddress,
        value: ethers.parseEther('0.05'), // e.g. 0.05 ETH
      })
      await fundTx.wait()
      console.log(`  → Funded with 0.05 ETH`)
    } else {
      console.log('  → Already has balance, skipping')
    }

    const pilotSigner = pilotSigners[index];

    // TODO: USE IPFS AND ALSO INCLUDE AN IMAGE URL
    const tx = await heliuber.connect(pilotSigner).registerPilot(pilot.name, pilot.licenseNumber, pilot.imageUrl);
    await tx.wait();
    console.log(`Registered pilot: ${pilot.name} with license ${pilot.licenseNumber}`);
  }

  // now, fund some stablecoins to 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 if 

  console.log('checking network', hre.network.config)
  console.log('DEPLOYER ADDRESS', deployer.address)
  // if (hre.network.config.chainId === 31337) {
    // manual user, temp
    const [userSigner] = pilotSigners.slice(-1)
    // const passengerBalance = await deployer.provider.getBalance(userSigner.address)
    const passengerBalance = await plnc.balanceOf(userSigner.address)

    console.log('user signre address', userSigner.address, passengerBalance)
    if (passengerBalance < tokens(10000)) {
      console.log('MINT TOKENA!')
      plnc.mint(userSigner.address, tokens(10000))
    }
  // }


  writeFileSync('./frontend/.env', `VITE_HELIUBER_CONTRACT_ADDRESS=${address}\nVITE_PLNC_CONTRACT_ADDRESS=${plncAddress}`, { flag: 'w' })

  await hre.run("verify:verify", {
    address,
    constructorArguments: [plncAddress],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
