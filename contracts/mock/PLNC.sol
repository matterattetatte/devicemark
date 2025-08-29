// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PLNC
 * @dev A very basic mock stablecoin contract.
 * This contract demonstrates a simple ERC-20 token with
 * owner-controlled minting and burning capabilities.
 *
 * IMPORTANT: This is a **MOCK** stablecoin for demonstration purposes only.
 * It LACKS the complex mechanisms (e.g., collateralization, oracles,
 * governance, real-world pegging logic) required for a functional, secure,
 * and truly stable stablecoin in a production environment.
 */
contract PLNC is ERC20, Ownable {

    /**
     * @dev Constructor that sets the token name and symbol.
     * @param initialOwner The address that will own the contract and have
     * permission to mint and burn tokens.
     */
    constructor(address initialOwner)
        ERC20("PLNC Stablecoin", "PLNC")
        Ownable(initialOwner)
    {}

    /**
     * @dev Mints new tokens and assigns them to an account.
     * Only the contract owner can call this function.
     * In a real stablecoin, this would be tied to the mechanism
     * that issues new tokens when collateral is deposited or
     * when the peg needs to be adjusted upwards.
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burns tokens from an account.
     * Only the contract owner can call this function.
     * In a real stablecoin, this would be tied to the mechanism
     * that burns tokens when collateral is redeemed or
     * when the peg needs to be adjusted downwards.
     * @param from The address from which tokens will be burned.
     * @param amount The amount of tokens to burn.
     */
    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }
}