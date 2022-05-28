//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BridgeWrapper is Ownable {
        mapping(address => bool) public isWhitelisted;
        mapping(address => bool) public isPegged;
        mapping(address => bool) public isMinted;
        mapping(string => address) public whitelistedTokenAddress;
        mapping(address => string) public whitelistedTokenName;
        mapping(address => uint256) bridgeFee;
        bool public isBlocked;
        uint256 bridgeFeePercent = 5;
        string[] public whitelistedTokenNames;
        uint256 index = 1;
        mapping(string => uint256) public mapWhiltelistTokenNames;

        event DEPOSIT(
            uint256 tamount,
            address sender,
            string txhash,
            address tokenAddress,
            string tokenName
        );
        event WITHDRAW(uint256 amount, address sender, address tokenAddress);

        constructor() {}
}
