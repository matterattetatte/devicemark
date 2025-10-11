// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDevicesQA {
    // Events
    event FactoryRegistered(address indexed factory, string name, string certificationNumber);
    event FactoryUnregistered(address indexed factory);
    event QACheckSubmitted(address indexed factory, uint256 indexed nftId, bool passed, string details);
    event IMEISlotAllocated(uint64 indexed imei, address indexed factory);
    event NFTBurnedForCorrection(uint64 indexed imei, address indexed factory);
    event DeviceStatusChanged(uint64 indexed imei, uint8 indexed newStatus);
    event MetadataUpdated(uint64 indexed imei, uint256 qaCheckCount, uint256 burnCount);
    event QAContractCreated(bytes32 indexed contractHash, string contractId, address indexed factory, uint256 imeiCount);

    // Errors
    error AlreadyRegistered();
    error NotRegistered();
    error NotAllowed();
    error InvalidNFT();
    error ZeroAddress();
    error InvalidInput();
    error SlotNotOwnedByFactory();
    error SlotNotActive();
    error SlotAlreadyAllocated();

    function registerQAFactory(address factoryAddress, string calldata name, string calldata certificationNumber) external;
    function unRegisterQAFactory() external;
    function submitQACheck(
        uint64 deviceId,
        string calldata funcTests,
        int8 cosmeticGrade,
        string calldata date,
        string calldata ipfsCID
    ) external;
}