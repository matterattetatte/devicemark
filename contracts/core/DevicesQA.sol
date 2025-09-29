// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/IDevicesQA.sol";
import "../tokens/DeviceNFT.sol";
import "../tokens/DMC.sol";

contract DevicesQA is IDevicesQA, Ownable {
    // State variables
    DMC public immutable dmcToken; // DMC token contract
    DeviceNFT public immutable deviceNFT; // DMC token contract
    address[] public allowedFactories; // Array of allowed QA factory addresses
    mapping(address => Factory) public factories; // Mapping of factory details

    // Structs
    struct Factory {
        string name;
        string certificationNumber;
        bool isRegistered;
    }

    // Modifiers
    modifier onlyAllowed() {
        if (!isFactoryAllowed(msg.sender)) revert NotAllowed();
        _;
    }

    constructor(DMC _dmcToken, DeviceNFT _nftContract) Ownable(msg.sender) {
        if (address(_dmcToken) == address(0) || address(_nftContract) == address(0)) revert ZeroAddress();
        dmcToken = _dmcToken;
        deviceNFT = _nftContract;
    }

    // Check if an address is an allowed factory
    function isFactoryAllowed(address factory) public view returns (bool) {
        return factories[factory].isRegistered;
    }

    // Register a QA factory
    function registerQAFactory(address factoryAddress, string calldata name, string calldata certificationNumber) external onlyOwner {
        if (bytes(name).length == 0 || bytes(certificationNumber).length == 0) revert InvalidInput(); // Fixed validation
        if (factories[factoryAddress].isRegistered) revert AlreadyRegistered();

        // Register factory
        factories[factoryAddress] = Factory({
            name: name,
            certificationNumber: certificationNumber,
            isRegistered: true
        });
        allowedFactories.push(factoryAddress);

        emit FactoryRegistered(factoryAddress, name, certificationNumber);
    }

    // Unregister a QA factory
    function unRegisterQAFactory() external override {
        if (!factories[msg.sender].isRegistered) revert NotRegistered();

        // Remove from mapping and array
        delete factories[msg.sender];
        for (uint256 i = 0; i < allowedFactories.length; i++) {
            if (allowedFactories[i] == msg.sender) {
                allowedFactories[i] = allowedFactories[allowedFactories.length - 1];
                allowedFactories.pop();
                break;
            }
        }

        emit FactoryUnregistered(msg.sender);
    }

    function submitQACheck(
        uint64 deviceId,
        string memory funcTests,
        int8 cosmeticGrade,
        string memory date,
        string memory ipfsCID
    ) external onlyAllowed {
        require(dmcToken.balanceOf(msg.sender) >= 1e18, "Not enough DMC tokens to burn");

        dmcToken.burn(msg.sender, 1e18); // burns 1 token if decimals is 18

        // Verify NFT exists and is owned by someone
        try deviceNFT.ownerOf(deviceId) returns (address owner) {
            if (owner == address(0)) revert InvalidNFT();
        } catch {
            // If NFT doesn't exist, mint a new one to the factory (assumed workflow)
            deviceNFT.mint(address(this), deviceId);
        }

        deviceNFT.addHistory(deviceId, funcTests, cosmeticGrade, date, ipfsCID);
    }

    function getQAFactoriesList() external view returns (address[] memory) {
        return allowedFactories;
    }

    // Helper: Get factory details
    function getFactory(address factory) external view returns (string memory name, string memory certificationNumber, bool isRegistered) {
        Factory memory f = factories[factory];
        return (f.name, f.certificationNumber, f.isRegistered);
    }
}
