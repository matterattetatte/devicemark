// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "../interfaces/INFTContract.sol";

contract DeviceNFT is ERC721 {
    // Struct to store history events
    struct HistoryEvent {
        uint256 timestamp;
        string funcTests;
        int8 cosmeticGrade;
        string date;
        string ipfsCID;
    }

    // Mapping of deviceId to array of history events
    mapping(uint256 => HistoryEvent[]) public tokenHistory;

    // Event for history updates
    event HistoryAdded(uint256 indexed deviceId, string timestamp);

    constructor() ERC721("DeviceNFT", "DNFT") {}

    // Mint a new NFT (callable by DevicesQA)
    function mint(address to, uint64 deviceId) external {
        require(to != address(0), "Cannot mint to zero address");
        require(_ownerOf(deviceId) == address(0), "Token ID already exists");
        _mint(to, deviceId);
    }

    // Add history event for a token (callable by DevicesQA)
    function addHistory(
        uint64 deviceId,
        string memory funcTests,
        int8 cosmeticGrade,
        string memory date,
        string memory ipfsCID
    ) external {
        // should only creator be able to modify?
        require(_ownerOf(deviceId) != address(0), "Token does not exist");

        tokenHistory[deviceId].push(HistoryEvent({
            timestamp: block.timestamp,
            funcTests: funcTests,
            cosmeticGrade: cosmeticGrade,
            date: date,
            ipfsCID: ipfsCID
        }));
        emit HistoryAdded(deviceId, date);
    }

    // Get history for a token
    function getHistory(uint64 deviceId) external view returns (HistoryEvent[] memory) {
        require(_ownerOf(deviceId) != address(0), "Token does not exist");
        return tokenHistory[deviceId];
    }

    // Helper function to convert address to string
    function toString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}
