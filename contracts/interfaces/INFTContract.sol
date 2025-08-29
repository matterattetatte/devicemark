// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IClothingNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function mint(address to, uint256 tokenId) external;
}