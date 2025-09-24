// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DMC is ERC20, Ownable {
    address[] private whitelistedAddresses;

    constructor(address initialOwner)
        ERC20("DeviceMark Credit Points", "DMC")
        Ownable(initialOwner)
    {}

    function transfer(address /* to */, uint256 /* amount */) public virtual override returns (bool) {
        revert("Transfers are not allowed");
    }

    function transferFrom(address /* from */, address /* to */, uint256 /* amount */) public virtual override returns (bool) {
        revert("Transfers are not allowed");
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public {
        _burn(from, amount);
    }
}
