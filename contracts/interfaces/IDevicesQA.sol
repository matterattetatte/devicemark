// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDevicesQA {
    // Events
    event FactoryRegistered(address indexed factory, string name, string certificationNumber);
    event FactoryUnregistered(address indexed factory);
    event QACheckSubmitted(address indexed factory, uint256 indexed nftId, bool passed, string details);

    // Errors
    error AlreadyRegistered();
    error NotRegistered();
    error NotAllowed();
    error InvalidNFT();
    error InsufficientTokens();
    error ZeroAddress();
    error InvalidInput(); // Added missing error

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