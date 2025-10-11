import "@nomicfoundation/hardhat-chai-matchers";
import axios from 'axios';
import { expect } from "chai"
import { ethers } from "hardhat"
import { create } from 'ipfs-http-client';
import { exec, execSync } from 'child_process'

export const tokens = (n: number) => ethers.parseEther(n.toString())

export const expectBalanceChange = (actualDelta: bigint, expectedDelta: bigint, options: { allowGreater?: boolean; epsilon?: bigint; allowLess?: boolean } = {}) => {
  const allowGreater = options.allowGreater ?? false;
  const allowLess = options.allowLess ?? false;
  const epsilon = options.epsilon ?? ethers.parseEther("0.001");

  if (allowGreater) {
    // e.g. passenger overpaid due to gas
    expect(actualDelta >= expectedDelta).to.be.true;
    expect(actualDelta - expectedDelta < epsilon).to.be.true;
  } else if (allowLess) {
    // e.g. pilot received funds but paid tx gas (so net increase is slightly less)
    expect(expectedDelta - actualDelta < epsilon).to.be.true;
  } else {
    expect(actualDelta).to.equal(expectedDelta);
  }
}

async function isIpfsDaemonUp(once?: boolean) {
  const ipfsApiUrl = 'http://localhost:5001/api/ping';
  const timeout = 30000; // Timeout after which to give up, in milliseconds
  const checkInterval = 1000; // Interval between checks in milliseconds
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      await axios.get(ipfsApiUrl);
      return true;
    } catch (error) {
      if (error.status === 404) return true; // hack for real ping, now if we get a 404 it means server is running

      if (once) return false;
      // If the daemon is not ready, wait for the specified interval before retrying
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }

  throw new Error('IPFS daemon did not start within the expected time.');
}

describe("DevicesQA", () => {
  let dmc

  before(async () => {
    console.log("Starting IPFS node...");

    const isRunning = await isIpfsDaemonUp(true);

    console.log('is IPFS daemon up?', isRunning)
    if (!isRunning) {
      execSync('rm -rf ~/.ipfs')
      execSync('ipfs init --profile server')
      exec('npx ipfs daemon')
    }

    await isIpfsDaemonUp()

    const pinataJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlNjkyMzY3ZC03MTc1LTQ2NTEtYTczZi05Nzg3NmI5ZDY4ZDYiLCJlbWFpbCI6Im1hdGlhcy5tYXJ0aUBtZWRpZWluc3RpdHV0ZXQuc2UiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZTY4NWI4ODUxZjU5NDMzZTllNTAiLCJzY29wZWRLZXlTZWNyZXQiOiJlOWJmMmY4MDBmMjhiNWI1MGVmMTI5YWJlMzMxNWNmMWViYWZlOTM1ZGU2YTVlOGY1MDczYzEyMDg4Yjk1OGQ5IiwiZXhwIjoxNzkxNzMyMjQzfQ.BY168ltkEMjHXv19mkyuKHNYkzNf08XV7SO6-oMdCv4'; // Get this from your Pinata dashboard

    global.ipfsClient = create({ 
      url: 'https://indigo-electoral-crocodile-500.mypinata.cloud',
      headers: {
        Authorization: `Bearer ${pinataJWT}`,
      },
     })
    // global.ipfsClient = create({ url: 'http://localhost:5001' })

    console.log("IPFS node started");
  });

  beforeEach(async () => {
    // Get signers: deployer and QA factory
    [global.deployer, global.qaFactory] = await ethers.getSigners();

    const DMC = await ethers.getContractFactory("DMC");
    global.dmc = await DMC.deploy(global.deployer); // Assumes DMC has no constructor args; adjust if needed

    const DeviceNFT = await ethers.getContractFactory("DeviceNFT");
    global.deviceNFT = await DeviceNFT.deploy(); // Assumes deviceNFT has no constructor args; adjust if needed

    const DevicesQA = await ethers.getContractFactory("DevicesQA");

    global.devicesQA = await DevicesQA.deploy(global.dmc.getAddress(), global.deviceNFT.getAddress());
    await global.devicesQA.waitForDeployment()
  });

  after(async () => {
    console.log("Stopping IPFS client...");
    await global.ipfsClient.stop();
  });

  require("./functions/registerQAFactory")
  require("./functions/submitQACheck")

})
