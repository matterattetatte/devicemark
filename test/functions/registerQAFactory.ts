import { expect } from "chai"
import { ethers } from "hardhat"
import { tokens } from "./ClothesQA"

describe("registerQAFactory", () => {
  let deployer, clothesQA, qaFactory, transaction;
  beforeEach(() => {
    ;[{ deployer, clothesQA, qaFactory }]  = [global as any]
  })

  it("gets empty QA factory profile", async () => {
    const profile = await clothesQA.getFactory(qaFactory.address);

    expect(profile.name).to.equal("");
    expect(profile.certificationNumber).to.equal("");
  });

  it("should create a QA factory profile and then fetch its data", async () => {
    const profile = {
      name: "QualityCorp",
      certificationNumber: "QA12345",
    };

    transaction = await clothesQA.connect(deployer).registerQAFactory(qaFactory.address, profile.name, profile.certificationNumber);
    await transaction.wait();

    const allFactories = await clothesQA.getQAFactoriesList();
    expect(allFactories.length).to.equal(1);
    expect(allFactories[0]).to.equal(qaFactory.address);

    const factoryProfile = await clothesQA.getFactory(qaFactory.address);
    expect(factoryProfile.name).to.equal(profile.name);
    expect(factoryProfile.certificationNumber).to.equal(profile.certificationNumber);
  });
});