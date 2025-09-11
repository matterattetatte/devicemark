import { expect } from "chai"
import { ethers } from "hardhat"
import { tokens } from "./DevicesQA"

describe("registerQAFactory", () => {
  let deployer, DevicesQA, qaFactory, transaction;
  beforeEach(() => {
    ;[{ deployer, devicesQA, qaFactory }]  = [global as any]
  })

  it("gets empty QA factory profile", async () => {
    const profile = await devicesQA.getFactory(qaFactory.address);

    expect(profile.name).to.equal("");
    expect(profile.certificationNumber).to.equal("");
  });

  it("should create a QA factory profile and then fetch its data", async () => {
    const profile = {
      name: "QualityCorp",
      certificationNumber: "QA12345",
    };

    transaction = await devicesQA.connect(deployer).registerQAFactory(qaFactory.address, profile.name, profile.certificationNumber);
    await transaction.wait();

    const allFactories = await devicesQA.getQAFactoriesList();
    expect(allFactories.length).to.equal(1);
    expect(allFactories[0]).to.equal(qaFactory.address);

    const factoryProfile = await devicesQA.getFactory(qaFactory.address);
    expect(factoryProfile.name).to.equal(profile.name);
    expect(factoryProfile.certificationNumber).to.equal(profile.certificationNumber);
  });
});