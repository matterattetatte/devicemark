// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/IDevicesQA.sol";
import "../tokens/DeviceNFT.sol";

contract DevicesQA is IDevicesQA, Ownable {
    // State variables
    DeviceNFT public immutable deviceNFT; // Device NFT contract
    address[] public allowedFactories; // Array of allowed QA factory addresses
    mapping(address => Factory) public factories; // Mapping of factory details
    mapping(uint64 => address) public imeiSlots; // Mapping of IMEI to factory that owns the slot
    mapping(uint64 => bool) public imeiSlotActive; // Track if IMEI slot is active (NFT not burned)

    // Enhancement 1: Factory → IMEIs reverse mapping
    mapping(address => uint64[]) public factoryIMEIs; // Factory → All their allocated IMEIs

    // Enhancement 2: IMEI Metadata
    mapping(uint64 => IMEIMetadata) public imeiMetadata;

    // Enhancement 3: Device Status
    mapping(uint64 => DeviceStatus) public deviceStatus;

    // Enhancement 4: QA Contract tracking
    mapping(bytes32 => QAContract) public qaContracts;
    mapping(uint64 => bytes32) public imeiToContract; // IMEI → Contract ID
    bytes32[] public contractIds; // List of all contract IDs
    uint256 private contractNonce; // Nonce for contract hash generation

    // Enums
    enum DeviceStatus {
        UNALLOCATED,    // Not yet allocated
        ALLOCATED,      // Slot allocated but no QA submitted yet
        QA_SUBMITTED,   // QA check completed
        BURNED,         // NFT burned for correction
        TRANSFERRED     // NFT transferred to end user/retailer
    }

    // Structs
    struct Factory {
        string name;
        string certificationNumber;
        bool isRegistered;
    }

    struct IMEIMetadata {
        uint256 allocationTimestamp;    // When slot was allocated
        uint256 firstQATimestamp;       // When first QA was submitted
        uint256 lastQATimestamp;        // Last update
        uint256 qaCheckCount;           // Fixed: uint8 → uint256
        uint256 burnCount;              // Fixed: uint8 → uint256
    }

    struct QAContract {
        string contractId;              // e.g., "CONTRACT-2025-001"
        address factory;
        uint64[] imeis;                 // All IMEIs in this contract
        uint256 startDate;
        uint256 endDate;
        bool isActive;
    }

    // Modifiers
    modifier onlyAllowed() {
        if (!isFactoryAllowed(msg.sender)) revert NotAllowed();
        _;
    }

    constructor(DeviceNFT _nftContract) Ownable(msg.sender) {
        if (address(_nftContract) == address(0)) revert ZeroAddress();
        deviceNFT = _nftContract;
    }

    // Check if an address is an allowed factory
    function isFactoryAllowed(address factory) public view returns (bool) {
        return factories[factory].isRegistered;
    }

    // Register a QA factory
    function registerQAFactory(address factoryAddress, string calldata name, string calldata certificationNumber) external onlyOwner {
        if (factoryAddress == address(0)) revert ZeroAddress();  // Security fix
        if (bytes(name).length == 0 || bytes(certificationNumber).length == 0) revert InvalidInput();
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

        // Security fix: Prevent unregistration if factory has allocated IMEIs
        if (factoryIMEIs[msg.sender].length > 0) {
            revert("Cannot unregister: factory has allocated IMEIs");
        }

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
        // Check if factory owns this IMEI slot
        if (imeiSlots[deviceId] != msg.sender) revert SlotNotOwnedByFactory();

        // Check if slot is active (not burned)
        if (!imeiSlotActive[deviceId]) revert SlotNotActive();

        // Verify NFT exists and is owned by someone
        try deviceNFT.ownerOf(deviceId) returns (address owner) {
            if (owner == address(0)) revert InvalidNFT();
        } catch {
            // If NFT doesn't exist, mint a new one to this contract
            deviceNFT.mint(address(this), deviceId);
        }

        deviceNFT.addHistory(deviceId, funcTests, cosmeticGrade, date, ipfsCID);

        // Update IMEI metadata
        IMEIMetadata storage metadata = imeiMetadata[deviceId];
        if (metadata.firstQATimestamp == 0) {
            metadata.firstQATimestamp = block.timestamp;
        }
        metadata.lastQATimestamp = block.timestamp;
        metadata.qaCheckCount++;

        // Update device status
        deviceStatus[deviceId] = DeviceStatus.QA_SUBMITTED;

        // Emit events for off-chain tracking
        emit DeviceStatusChanged(deviceId, uint8(DeviceStatus.QA_SUBMITTED));
        emit MetadataUpdated(deviceId, metadata.qaCheckCount, metadata.burnCount);
    }

    // Burn NFT to allow correction - old data stays in IPFS, slot becomes available for re-mint
    function burnNFTForCorrection(uint64 deviceId) external onlyAllowed {
        // Check if factory owns this IMEI slot
        if (imeiSlots[deviceId] != msg.sender) revert SlotNotOwnedByFactory();

        // Check if NFT exists
        try deviceNFT.ownerOf(deviceId) returns (address owner) {
            if (owner == address(0)) revert InvalidNFT();

            // Burn the NFT
            deviceNFT.burn(deviceId);

            // Mark slot as inactive (available for re-mint)
            imeiSlotActive[deviceId] = false;

            // Update IMEI metadata - increment burn count
            imeiMetadata[deviceId].burnCount++;

            // Update device status
            deviceStatus[deviceId] = DeviceStatus.BURNED;

            emit NFTBurnedForCorrection(deviceId, msg.sender);
            emit DeviceStatusChanged(deviceId, uint8(DeviceStatus.BURNED));
            emit MetadataUpdated(deviceId, imeiMetadata[deviceId].qaCheckCount, imeiMetadata[deviceId].burnCount);
        } catch {
            revert InvalidNFT();
        }
    }

    // Allocate IMEI slot to a factory
    function allocateIMEISlot(address factoryAddress, uint64 imei) external onlyOwner {
        if (factoryAddress == address(0)) revert ZeroAddress();  // Security fix
        if (imei == 0) revert InvalidInput();  // Security fix: IMEI cannot be 0
        if (!factories[factoryAddress].isRegistered) revert NotRegistered();
        if (imeiSlots[imei] != address(0)) revert SlotAlreadyAllocated();

        imeiSlots[imei] = factoryAddress;
        imeiSlotActive[imei] = true;

        // Update reverse mapping
        factoryIMEIs[factoryAddress].push(imei);

        // Update IMEI metadata
        imeiMetadata[imei] = IMEIMetadata({
            allocationTimestamp: block.timestamp,
            firstQATimestamp: 0,
            lastQATimestamp: 0,
            qaCheckCount: 0,
            burnCount: 0
        });

        // Update device status
        deviceStatus[imei] = DeviceStatus.ALLOCATED;

        emit IMEISlotAllocated(imei, factoryAddress);
    }

    // Batch allocate IMEI slots to a factory
    function batchAllocateIMEISlots(address factoryAddress, uint64[] calldata imeis) external onlyOwner {
        if (factoryAddress == address(0)) revert ZeroAddress();  // Security fix
        if (!factories[factoryAddress].isRegistered) revert NotRegistered();

        for (uint256 i = 0; i < imeis.length; i++) {
            if (imeis[i] == 0) revert InvalidInput();  // Security fix: IMEI cannot be 0
            if (imeiSlots[imeis[i]] != address(0)) revert SlotAlreadyAllocated();

            imeiSlots[imeis[i]] = factoryAddress;
            imeiSlotActive[imeis[i]] = true;

            // Update reverse mapping
            factoryIMEIs[factoryAddress].push(imeis[i]);

            // Update IMEI metadata
            imeiMetadata[imeis[i]] = IMEIMetadata({
                allocationTimestamp: block.timestamp,
                firstQATimestamp: 0,
                lastQATimestamp: 0,
                qaCheckCount: 0,
                burnCount: 0
            });

            // Update device status
            deviceStatus[imeis[i]] = DeviceStatus.ALLOCATED;

            emit IMEISlotAllocated(imeis[i], factoryAddress);
        }
    }

    // Check who owns a specific IMEI slot
    function getIMEISlotOwner(uint64 imei) external view returns (address) {
        return imeiSlots[imei];
    }

    // Check if IMEI slot is active (not burned)
    function isIMEISlotActive(uint64 imei) external view returns (bool) {
        return imeiSlotActive[imei];
    }

    function getQAFactoriesList() external view returns (address[] memory) {
        return allowedFactories;
    }

    // Helper: Get factory details
    function getFactory(address factory) external view returns (string memory name, string memory certificationNumber, bool isRegistered) {
        Factory memory f = factories[factory];
        return (f.name, f.certificationNumber, f.isRegistered);
    }

    // === New Query Functions ===

    // Get all IMEIs allocated to a factory (DEPRECATED - use paginated version)
    // WARNING: This function can run out of gas for large arrays
    function getFactoryIMEIs(address factory) external view returns (uint64[] memory) {
        return factoryIMEIs[factory];
    }

    // Get paginated IMEIs for a factory (GAS-SAFE)
    function getFactoryIMEIsPaginated(
        address factory,
        uint256 offset,
        uint256 limit
    ) external view returns (uint64[] memory imeis, uint256 total) {
        uint64[] storage allIMEIs = factoryIMEIs[factory];
        total = allIMEIs.length;

        if (offset >= total) {
            return (new uint64[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 resultLength = end - offset;
        imeis = new uint64[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            imeis[i] = allIMEIs[offset + i];
        }

        return (imeis, total);
    }

    // Get factory IMEI count
    function getFactoryIMEICount(address factory) external view returns (uint256) {
        return factoryIMEIs[factory].length;
    }

    // Get IMEI metadata
    function getIMEIMetadata(uint64 imei) external view returns (IMEIMetadata memory) {
        return imeiMetadata[imei];
    }

    // Get device status
    function getDeviceStatus(uint64 imei) external view returns (DeviceStatus) {
        return deviceStatus[imei];
    }

    // Create QA contract (batch allocation with contract tracking)
    function createQAContract(
        string calldata contractId,
        address factoryAddress,
        uint64[] calldata imeis,
        uint256 startDate,
        uint256 endDate
    ) external onlyOwner returns (bytes32) {
        if (factoryAddress == address(0)) revert ZeroAddress();  // Security fix
        if (bytes(contractId).length == 0) revert InvalidInput();  // Security fix
        if (!factories[factoryAddress].isRegistered) revert NotRegistered();

        // Security fix: Use nonce instead of timestamp to prevent collision
        bytes32 contractHash = keccak256(abi.encodePacked(contractId, factoryAddress, msg.sender, contractNonce));
        contractNonce++;  // Increment nonce for next contract

        if (qaContracts[contractHash].isActive) revert InvalidInput(); // Contract already exists

        // Allocate all IMEIs in this contract
        for (uint256 i = 0; i < imeis.length; i++) {
            if (imeiSlots[imeis[i]] != address(0)) revert SlotAlreadyAllocated();

            imeiSlots[imeis[i]] = factoryAddress;
            imeiSlotActive[imeis[i]] = true;
            factoryIMEIs[factoryAddress].push(imeis[i]);

            imeiMetadata[imeis[i]] = IMEIMetadata({
                allocationTimestamp: block.timestamp,
                firstQATimestamp: 0,
                lastQATimestamp: 0,
                qaCheckCount: 0,
                burnCount: 0
            });

            deviceStatus[imeis[i]] = DeviceStatus.ALLOCATED;
            imeiToContract[imeis[i]] = contractHash;

            emit IMEISlotAllocated(imeis[i], factoryAddress);
        }

        // Create contract
        qaContracts[contractHash] = QAContract({
            contractId: contractId,
            factory: factoryAddress,
            imeis: imeis,
            startDate: startDate,
            endDate: endDate,
            isActive: true
        });

        contractIds.push(contractHash);

        emit QAContractCreated(contractHash, contractId, factoryAddress, imeis.length);

        return contractHash;
    }

    // Get QA contract details
    function getQAContract(bytes32 contractHash) external view returns (QAContract memory) {
        return qaContracts[contractHash];
    }

    // Get contract by IMEI
    function getContractByIMEI(uint64 imei) external view returns (bytes32) {
        return imeiToContract[imei];
    }

    // Get all contract IDs
    function getAllContractIds() external view returns (bytes32[] memory) {
        return contractIds;
    }

    // Get contract completion stats
    function getContractCompletionStats(bytes32 contractHash) external view returns (
        uint256 totalDevices,
        uint256 completedDevices,
        uint256 percentComplete
    ) {
        QAContract memory c = qaContracts[contractHash];
        totalDevices = c.imeis.length;
        completedDevices = 0;

        for (uint256 i = 0; i < c.imeis.length; i++) {
            if (deviceStatus[c.imeis[i]] == DeviceStatus.QA_SUBMITTED) {
                completedDevices++;
            }
        }

        percentComplete = totalDevices > 0 ? (completedDevices * 100) / totalDevices : 0;
    }

    // Deactivate a QA contract
    function deactivateQAContract(bytes32 contractHash) external onlyOwner {
        if (!qaContracts[contractHash].isActive) revert InvalidInput();
        qaContracts[contractHash].isActive = false;
    }

    // Reactivate a QA contract
    function reactivateQAContract(bytes32 contractHash) external onlyOwner {
        if (qaContracts[contractHash].isActive) revert InvalidInput();
        qaContracts[contractHash].isActive = true;
    }
}
