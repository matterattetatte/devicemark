import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai"
import { ethers } from "hardhat"

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

describe("ClothesQA", () => {
  let clothesQA, plnc, clothingNFT; 

  beforeEach(async () => {
    // Get signers: deployer and QA factory
    [global.deployer, global.qaFactory] = await ethers.getSigners();

    const PLNC = await ethers.getContractFactory("PLNC");
    plnc = await PLNC.deploy(global.deployer); // Assumes PLNC has no constructor args; adjust if needed

    const ClothingNFT = await ethers.getContractFactory("ClothingNFT");
    global.clothingNFT = await ClothingNFT.deploy(); // Assumes clothingNFT has no constructor args; adjust if needed

    const ClothesQA = await ethers.getContractFactory("ClothesQA");

    global.clothesQA = await ClothesQA.deploy(plnc.getAddress(), global.clothingNFT.getAddress());
    await global.clothesQA.waitForDeployment()
  });

  require("./functions/registerQAFactory")
  require("./functions/submitQACheck")

})
