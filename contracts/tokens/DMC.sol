// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DMC is ERC20, Ownable {
    address[] private whitelistedAddresses;

    event AddressWhitelisted(address indexed account, bool added);

    constructor(address initialOwner)
        ERC20("DeviceMark Credit Points", "DMC")
        Ownable(initialOwner)
    {}

    /**
     * @dev Adds multiple addresses to the whitelist array
     * Only the contract owner can call this function
     * @param accounts Array of addresses to whitelist
     */
    function setWhitelist(address[] calldata accounts) public onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            require(accounts[i] != address(0), "Invalid address");
            // Check if address is already whitelisted to avoid duplicates
            if (!isWhitelisted(accounts[i])) {
                whitelistedAddresses.push(accounts[i]);
                emit AddressWhitelisted(accounts[i], true);
            }
        }
    }

    /**
     * @dev Removes an address from the whitelist array
     * Only the contract owner can call this function
     * @param account The address to unwhitelist
     */
    function unwhitelist(address account) public onlyOwner {
        require(account != address(0), "Invalid address");
        uint256 index = findAddressIndex(account);
        require(index < whitelistedAddresses.length, "Address not whitelisted");
        
        // Move last element to the index of the address to remove
        whitelistedAddresses[index] = whitelistedAddresses[whitelistedAddresses.length - 1];
        whitelistedAddresses.pop();
        emit AddressWhitelisted(account, false);
    }

    /**
     * @dev Checks if an address is in the whitelist array
     * @param account The address to check
     * @return bool True if whitelisted, false otherwise
     */
    function isWhitelisted(address account) public view returns (bool) {
        return findAddressIndex(account) < whitelistedAddresses.length;
    }

    /**
     * @dev Helper function to find the index of an address in the whitelist array
     * @param account The address to find
     * @return uint256 Index of the address, or length of array if not found
     */
    function findAddressIndex(address account) private view returns (uint256) {
        for (uint256 i = 0; i < whitelistedAddresses.length; i++) {
            if (whitelistedAddresses[i] == account) {
                return i;
            }
        }
        return whitelistedAddresses.length;
    }

    /**
     * @dev Returns the list of all whitelisted addresses
     * @return address[] Array of whitelisted addresses
     */
    function getWhitelistedAddresses() public view returns (address[] memory) {
        return whitelistedAddresses;
    }

    /**
     * @dev Overrides the ERC20 transfer function to enforce whitelist
     * @param to The recipient address
     * @param amount The amount to transfer
     * @return bool Success status
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        require(isWhitelisted(to) || msg.sender == owner(), "Recipient not whitelisted");
        return super.transfer(to, amount);
    }

    /**
     * @dev Overrides the ERC20 transferFrom function to enforce whitelist
     * @param from The sender address
     * @param to The recipient address
     * @param amount The amount to transfer
     * @return bool Success status
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        require(isWhitelisted(to) || msg.sender == owner(), "Recipient not whitelisted");
        return super.transferFrom(from, to, amount);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }
}