import { join } from 'path';
import { expect } from "chai"
import path from 'path';
import AdmZip from 'adm-zip';

import { tokens } from "./DevicesQA"

async function getFileByCid(cid) {
  try {
    const file = await global.ipfsClient.cat(cid);
    let content = [];
    for await (const chunk of file) {
      content.push(chunk as never);
    }
    return Buffer.concat(content).toString()
  } catch (error) {
    console.error('Error retrieving file:', error);
  }
}

describe("submitQACheck", () => {
  let deployer, devicesQA, deviceNFT, qaFactory, transaction;
  beforeEach(async () => {
    ;[{ deployer, devicesQA, deviceNFT, qaFactory }] = [global as any]

    const profile = {
      name: "QualityCorp",
      certificationNumber: "QA12345",
    };

    transaction = await devicesQA.connect(deployer).registerQAFactory(qaFactory.address, profile.name, profile.certificationNumber);
    await transaction.wait();
  })

  it("submit first NFT creation with file upload", async () => {
    const folderPath = path.join(__dirname, '../mock/QAData0');
    const zip = new AdmZip();

    zip.addLocalFolder(folderPath, 'QAData0');

    const zipData = zip.toBuffer();

    const { cid } = await global.ipfsClient.add({ content: zipData });

    const cidStr = cid.toString();
    console.log(`Uploaded to IPFS with CID: ${cidStr}`);

    const nftId = 1; // example NFT id
    const passed = true; // example check result
    const details = JSON.stringify({
          testType: "color_fastness",
          result: "No fading observed",
          testDate: "2025-08-20",
          standards: "ISO 105-B02",
          ipfsCID: cidStr,
          score: 95
    })

    // Call submitQACheck on the devicesQA contract
    transaction = await devicesQA.connect(qaFactory).submitQACheck(nftId, passed, details);
    await transaction.wait();

    await expect(transaction).to.emit(deviceNFT, "HistoryAdded")

    const downloadedData = await getFileByCid(cidStr)

    expect(downloadedData).to.equal(zipData.toString())
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
      transaction = await devicesQA.connect(qaFactory).submitQACheck(nftId, check.passed, check.details);
      await transaction.wait();

      // Verify HistoryAdded event
      await expect(transaction).to.emit(deviceNFT, "HistoryAdded");
    }

    // Get the NFT and its history
    const nftHistory = await deviceNFT.getHistory(nftId);
    const nftOwner = await deviceNFT.ownerOf(nftId);

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