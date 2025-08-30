// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/IClothesQA.sol";
import "./ClothingNFT.sol";
import "../mock/PLNC.sol";

contract ClothesQA is IClothesQA, Ownable {
    // State variables
    PLNC public immutable plncToken; // PLNC token contract
    ClothingNFT public immutable clothingNFT; // PLNC token contract
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

    constructor(PLNC _plncToken, ClothingNFT _nftContract) Ownable(msg.sender) {
        if (address(_plncToken) == address(0) || address(_nftContract) == address(0)) revert ZeroAddress();
        plncToken = _plncToken;
        clothingNFT = _nftContract;
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

    // maybe allowance?? what about pectra approval stuff?
    // Submit a QA check for an NFT
    // TODO: 1. we require 4 pln to be sent in order to process this qa thingy
    function submitQACheck(uint256 nftId, bool passed, string calldata details) external override onlyAllowed {
        // Verify NFT exists and is owned by someone
        try clothingNFT.ownerOf(nftId) returns (address owner) {
            if (owner == address(0)) revert InvalidNFT();
        } catch {
            // If NFT doesn't exist, mint a new one to the factory (assumed workflow)
            clothingNFT.mint(msg.sender, nftId);
        }

        clothingNFT.addHistory(nftId, passed, details);
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
