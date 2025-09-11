// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IDeviceNFT {
    function ownerOf(uint64 imei) external view returns (address);
    function mint(address to, uint64 imei) external;
}