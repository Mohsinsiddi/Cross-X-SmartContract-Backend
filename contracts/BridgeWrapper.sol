//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BridgeWrapper is Ownable {

        
        uint256 bridgeFeePercent = 5;
        uint256 index = 1;

        bool public isBlocked;

        string[] public whitelistedTokenNames;
        
        //mappings
        mapping(address => bool) public isWhitelisted;
        mapping(address => bool) public isPegged;
        mapping(address => bool) public isMinted;
        mapping(string => address) public whitelistedTokenAddress;
        mapping(address => string) public whitelistedTokenName;
        mapping(string => uint256) public mapWhiltelistTokenNames;
        mapping(address => uint256) bridgeFee;
       
        event DEPOSIT(
            uint256 tamount,
            address sender,
            address tokenAddress,
            string tokenName,
            uint256 destinationChainId
        );
        event WITHDRAW(uint256 amount, address sender, address tokenAddress);

        constructor() {}

        //Functions to block or unblock the bridge
        function blockBridge() external onlyOwner returns (bool) {
            isBlocked = true;
            return true;
        }

        function unblockBridge() external onlyOwner returns (bool) {
            isBlocked = false;
            return true;
        }

        //Initialization Minted Tokens
        function makeMintedToken(address tokenAddress)
            external
            onlyOwner
            returns (bool)
        {
            require(tokenAddress != address(0), "Cannot be address 0");
            isMinted[tokenAddress] = true;
            return true;
        }

        function removeMintedToken(address tokenAddress)
            external
            onlyOwner
            returns (bool)
        {
            require(tokenAddress != address(0), "Cannot be address 0");
            isMinted[tokenAddress] = false;
            return true;
        }

        //Initialization of Pegged Tokens
        function makePegToken(address tokenAddress)
            external
            onlyOwner
            returns (bool)
        {
            require(tokenAddress != address(0), "Cannot be address 0");
            isPegged[tokenAddress] = true;
            return true;
        }

        function removePegToken(address tokenAddress)
            external
            onlyOwner
            returns (bool)
        {
            require(tokenAddress != address(0), "Cannot be address 0");
            isPegged[tokenAddress] = false;
            return true;
        }

        //Whitelisting and Initializing of Tokens
        function whitelistToken(address tokenAddress, string memory tokenName)
            external
            onlyOwner
            returns (bool)
        {
            require(tokenAddress != address(0), "Cannot be address 0");
            require(!ifDuplicateTokenName(tokenName), "Duplicate token name");
            isWhitelisted[tokenAddress] = true;
            whitelistedTokenName[tokenAddress] = tokenName;
            whitelistedTokenAddress[tokenName] = tokenAddress;
            whitelistedTokenNames.push(tokenName);
            mapWhiltelistTokenNames[tokenName] = index;
            index++;
            return true;
        }

        function ifDuplicateTokenName(string memory tokenName) private view returns (bool){
            bool flag = false;
            for (uint256 j=0; j < whitelistedTokenNames.length; j++){
                if(
                    keccak256(abi.encodePacked(whitelistedTokenNames[j])) == keccak256(abi.encodePacked(tokenName))
                ) {
                    flag = true;
                    break;
                }
            }
            return flag;
            
        } 

        function removeTokenFromWhitelist(address tokenAddress, address receiver)
            external
            onlyOwner
            returns (bool)
        {
            require(tokenAddress != address(0), "Cannot be address 0");
            IERC20(tokenAddress).transfer(receiver, bridgeFee[tokenAddress]);
            string memory tokenName = whitelistedTokenName[tokenAddress];
            delete whitelistedTokenAddress[tokenName];
            delete whitelistedTokenName[tokenAddress];
            uint256 i = mapWhiltelistTokenNames[tokenName];
            string memory lastTokenName = whitelistedTokenNames[((whitelistedTokenNames.length) - 1)];
            mapWhiltelistTokenNames[lastTokenName]=i;
            whitelistedTokenNames[i-1] = lastTokenName;
            whitelistedTokenNames.pop();
            delete mapWhiltelistTokenNames[tokenName];
            isWhitelisted[tokenAddress] = false;
            return true;
        }

        //Core Bridge Logic
        function deposit(
            address tokenAddress,
            uint256 _amount,
            uint _destChainId
        ) external returns (bool) {
            //approve address(this) to transfer your tokens that you want to deposit and get your wrapped tokens
            require(tokenAddress != address(0), "Cannot be address 0");
            require(isBlocked != true, "Bridge is blocked right now");
            require(
                isWhitelisted[tokenAddress] == true,
                "This token is not Whitelisted on our platform"
            );
            require(
                _amount <= IERC20(tokenAddress).balanceOf(msg.sender),
                "Amount exceeds your balance"
            );

            uint256 tamount = _amount;
            string memory tokenName = whitelistedTokenName[tokenAddress];
            if (isMinted[tokenAddress] || isPegged[tokenAddress] ) {
                require(
                    IERC20(tokenAddress).transferFrom(
                        msg.sender,
                        address(this),
                        _amount
                    ),
                    "There was a problem transferring your bep tokens"
                );
            } else {
                bridgeFee[tokenAddress] =
                    bridgeFee[tokenAddress] +
                    ((_amount * bridgeFeePercent) / 1000);
                tamount = _amount - ((_amount * bridgeFeePercent) / 1000);
                require(
                    IERC20(tokenAddress).transferFrom(
                        msg.sender,
                        address(this),
                        _amount
                    ),
                    "There was a problem transferring your bep tokens"
                );
            }
            emit DEPOSIT(
                tamount,
                msg.sender,
                tokenAddress,
                tokenName,
                _destChainId
            );
            return true;
        }

        function withdraw(
            uint256 amount,
            address tokenAddress,
            address receiver
        ) external onlyOwner returns (bool) {
            require(tokenAddress != address(0), "Cannot be address 0");
            require(receiver != address(0), "Cannot be address 0");
            require(
                isWhitelisted[tokenAddress] == true,
                "This token is not Whitelisted on our platform"
            );
           if (isMinted[tokenAddress] || isPegged[tokenAddress]) {
                require(
                    IERC20(tokenAddress).transfer(receiver, amount),
                    "There was a problem transferring your tokens"
                );
            } else {
                bridgeFee[tokenAddress] =
                    bridgeFee[tokenAddress] +
                    ((amount * bridgeFeePercent) / 1000);
                amount = amount - ((amount * bridgeFeePercent) / 1000);
                require(
                    IERC20(tokenAddress).transfer(receiver, amount),
                    "There was a problem transferring your tokens"
                );
            }
            emit WITHDRAW(amount, receiver, tokenAddress);
            return true;
        }

        //Function to change the bridge fee percentage
        function changeBridgeFee(uint256 value) external onlyOwner returns (bool) {
            require(value != 0, "Value cannot be 0");
            bridgeFeePercent = value;
            return true;
        }

        //Function to get names of all whitelisted tokens
        function getAllWhitelistedTokenNames()
            external
            view
            returns (string[] memory)
        {
            return whitelistedTokenNames;
        }

        //Bridge Fee collection
        function getSingleTokenBridgeFee(address tokenAddress)
            external
            view
            onlyOwner
            returns (uint256)
        {
            return bridgeFee[tokenAddress];
        }

        function claimSingleTokenBridgeFee(address tokenAddress, address receiver)
            external
            onlyOwner
            returns (bool)
        {
            require(tokenAddress != address(0), "Cannot be address 0");
            require(receiver != address(0), "Cannot be address 0");
            uint256 fee = bridgeFee[tokenAddress];
            bridgeFee[tokenAddress] = 0;
            require(
                IERC20(tokenAddress).transfer(receiver, fee),
                "There was a problem transferring your tokens"
            );
            return true;
        }

        function claimAllTokenBridgeFee(address receiver)
            external
            onlyOwner
            returns (bool)
        {
            require(receiver != address(0), "Cannot be address 0");
            for (uint256 i = 0; i < whitelistedTokenNames.length; i++) {
                address tokenAddress = whitelistedTokenAddress[
                    whitelistedTokenNames[i]
                ];
                uint256 fee = bridgeFee[tokenAddress];
                bridgeFee[tokenAddress] = 0;
                require(
                    IERC20(tokenAddress).transfer(receiver, fee),
                    "There was a problem transferring your tokens"
                );
            }

            return true;
        }


   
}
