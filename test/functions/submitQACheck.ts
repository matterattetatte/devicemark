import { join } from 'path';
import { expect } from "chai"
import path from 'path';
import AdmZip from 'adm-zip';

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
  let deployer, devicesQA, deviceNFT, dmc, qaFactory, transaction;
  beforeEach(async () => {
    ;[{ deployer, devicesQA, dmc, deviceNFT, qaFactory }] = [global as any]

    const profile = {
      name: "QualityCorp",
      certificationNumber: "QA12345",
    };

    transaction = await devicesQA.connect(deployer).registerQAFactory(qaFactory.address, profile.name, profile.certificationNumber);

    global.dmc.mint(qaFactory.address, 10)
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
  const faultCodes = ["FC001", "FC002"];
  const date = "2025-08-20";

  // Call submitQACheck on the devicesQA contract
  transaction = await devicesQA.connect(qaFactory).submitQACheck(nftId, passed, faultCodes, date, cidStr);
  await transaction.wait();
  
  const downloadedData = await getFileByCid(cidStr)
  
  const dmcBalance = await dmc.balanceOf(qaFactory.address);
  

  expect(dmcBalance).to.equal(9);
 
  expect(downloadedData).to.equal(zipData.toString())
  await expect(transaction).to.emit(deviceNFT, "HistoryAdded")
  });
  it("should submit multiple sequential QA checks and verify NFT history", async () => {
    const nftId = 1; // example NFT id
    const qaChecks = [
      { 
        passed: true, 
        faultCodes: ["FC001", "FC002"],
        date: "2025-08-20",
        ipfsCID: "bafybeih"
      },
      { 
        passed: true, 
        faultCodes: ["FC003"],
        date: "2025-08-21",
        ipfsCID: "bafybeih2"
      },
      { 
        passed: false, 
        faultCodes: ["FC004", "FC005"],
        date: "2025-08-22",
        ipfsCID: "bafybeih5"
      },
    ];

    // Submit multiple QA checks sequentially
    for (const check of qaChecks) {
      transaction = await devicesQA.connect(qaFactory).submitQACheck(nftId, check.passed, check.faultCodes, check.date, check.ipfsCID);
      await transaction.wait();

      // Verify HistoryAdded event
      await expect(transaction).to.emit(deviceNFT, "HistoryAdded");
    }

    // Get the NFT and its history
    const nftHistory = await deviceNFT.getHistory(nftId);
    const nftOwner = await deviceNFT.ownerOf(nftId);
    const dmcBalance = await dmc.balanceOf(qaFactory.address);

    expect(dmcBalance).to.equal(10 - qaChecks.length);

    // Verify the history length matches the number of QA checks
    expect(nftHistory.length).to.equal(qaChecks.length);
    expect(nftOwner).to.equal(qaFactory.address);

    // Verify each history entry
    qaChecks.forEach((check, index) => {
      expect(nftHistory[index].passed).to.equal(check.passed);
      expect(nftHistory[index].faultCodes).to.deep.equal(check.faultCodes);
      expect(nftHistory[index].date).to.equal(check.date);
      expect(nftHistory[index].ipfsCID).to.equal(check.ipfsCID);
    });
  });
});