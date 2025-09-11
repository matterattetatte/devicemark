// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "../interfaces/INFTContract.sol";

contract DeviceNFT is ERC721 {
    uint64 private _imeiCounter; // Simple counter for token IDs

    // Struct to store history events
    struct HistoryEvent {
        uint256 timestamp;
        bool passed;
        string details;
    }

    // Mapping of imei to array of history events
    mapping(uint256 => HistoryEvent[]) public tokenHistory;

    // Event for history updates
    event HistoryAdded(uint256 indexed imei, uint256 timestamp);

    constructor() ERC721("DeviceNFT", "CNFT") {
        _imeiCounter = 1; // Start token IDs at 1
    }

    // Mint a new NFT (callable by DevicesQA)
    function mint(address to, uint64 imei) external {
        require(to != address(0), "Cannot mint to zero address");
        require(_ownerOf(imei) == address(0), "Token ID already exists");
        _mint(to, imei);

        emit HistoryAdded(imei, block.timestamp);
    }

    // Mint with auto-incrementing ID
    function mintAutoId(address to) external returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        uint64 imei = _imeiCounter;
        _mint(to, imei);
        _imeiCounter++;

        return imei;
    }

    // Add history event for a token (callable by DevicesQA)
    function addHistory(uint64 imei, bool passed, string calldata details) external {
        // should only creator be able to modify?
        require(_ownerOf(imei) != address(0), "Token does not exist");
        tokenHistory[imei].push(HistoryEvent({
            timestamp: block.timestamp,
            passed: passed,
            details: details
        }));
        emit HistoryAdded(imei, block.timestamp);
    }

    // Get history for a token
    function getHistory(uint64 imei) external view returns (HistoryEvent[] memory) {
        require(_ownerOf(imei) != address(0), "Token does not exist");
        return tokenHistory[imei];
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
