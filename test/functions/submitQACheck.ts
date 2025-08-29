import { expect } from "chai"
import { ethers } from "hardhat"
import { tokens } from "./ClothesQA"

describe("submitQACheck", () => {
  let deployer, clothesQA, clothingNFT, qaFactory, transaction;
  beforeEach(async () => {
    ;[{ deployer, clothesQA, clothingNFT, qaFactory }] = [global as any]

    const profile = {
      name: "QualityCorp",
      certificationNumber: "QA12345",
    };

    transaction = await clothesQA.connect(deployer).registerQAFactory(qaFactory.address, profile.name, profile.certificationNumber);
    await transaction.wait();
  })

  it("submit first NFT creation", async () => {
    // Assuming deployer is authorized to call submitQACheck
    const nftId = 1; // example NFT id
    const passed = true; // example check result
    const details = "Initial quality check passed";

    // Call submitQACheck on the clothesQA contract
    transaction = await clothesQA.connect(qaFactory).submitQACheck(nftId, passed, details);
    await transaction.wait();

    // Optionally, check for emitted event or state update if applicable
    // Example if there's an event QualityChecked(uint256 nftId, bool passed, string details)
    await expect(transaction)
      .to.emit(clothesQA, "QACheckSubmitted")
      .withArgs(qaFactory.address, nftId, passed, details)
    // Example if there's an event QualityChecked(uint256 nftId, bool passed, string details)
    await expect(transaction)
      .to.emit(clothingNFT, "HistoryAdded")

      // TODO: GET THE NFT AND ITS HISTROY

      // THEN, NEW TEST WITH SEVERAL NEW EVENTS AFTER EACH OTHER
  });
  it("should submit multiple sequential QA checks and verify NFT history", async () => {
    const nftId = 1; // example NFT id
    const qaChecks = [
      { 
        passed: true, 
        details: JSON.stringify({
          testType: "color_fastness",
          result: "No fading observed",
          testDate: "2025-08-20",
          standards: "ISO 105-B02",
          score: 95
        }) 
      },
      { 
        passed: true, 
        details: JSON.stringify({
          testType: "material_durability",
          result: "High tensile strength",
          testDate: "2025-08-21",
          standards: "ASTM D5034",
          score: 92
        }) 
      },
      { 
        passed: false, 
        details: JSON.stringify({
          testType: "stitching_quality",
          result: "Inconsistent stitch length",
          testDate: "2025-08-22",
          standards: "ISO 4915",
          score: 65
        }) 
      },
    ];

    // Submit multiple QA checks sequentially
    for (const check of qaChecks) {
      transaction = await clothesQA.connect(qaFactory).submitQACheck(nftId, check.passed, check.details);
      await transaction.wait();

      // Verify QACheckSubmitted event
      await expect(transaction)
        .to.emit(clothesQA, "QACheckSubmitted")
        .withArgs(qaFactory.address, nftId, check.passed, check.details);

      // Verify HistoryAdded event
      await expect(transaction)
        .to.emit(clothingNFT, "HistoryAdded");
    }

    // Get the NFT and its history
    const nftHistory = await clothingNFT.getHistory(nftId);
    const nftOwner = await clothingNFT.ownerOf(nftId);

    // Verify the history length matches the number of QA checks
    expect(nftHistory.length).to.equal(qaChecks.length);
    expect(nftOwner).to.equal(qaFactory.address);

    // Verify each history entry
    qaChecks.forEach((check, index) => {
      expect(nftHistory[index].passed).to.equal(check.passed);
      expect(nftHistory[index].details).to.equal(check.details);
    });
  });
});