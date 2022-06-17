//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTCollectionBridgeWrapper is Ownable {
    uint256 bridgeFeePercent = 2;
    uint256 index = 1;

    bool public isBlocked;

    string[] public whitelistedCollectionNames;

    //mappings
    mapping(address => bool) public isWhitelisted;
    mapping(address => bool) public isPegged;
    mapping(address => bool) public isMinted;

    mapping(string => address) public whitelistedCollectionAddress;
    mapping(address => string) public whitelistedCollectionName;
    mapping(string => uint256) public mapWhiltelistCollectionNames;
    mapping(address => uint256) bridgeFee;

    event DEPOSIT(
        uint256 tamount,
        uint256 tokenID,
        address sender,
        address collectionAddress,
        string collectionName,
        uint256 destinationChainId
    );
    event WITHDRAW(uint256 tokenID, address sender, address tokenAddress);

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
    function makeMintedCollection(address collectionName)
        external
        onlyOwner
        returns (bool)
    {
        require(collectionName != address(0), "Cannot be address 0");
        isMinted[collectionName] = true;
        return true;
    }

    function removeMintedCollection(address collectionName)
        external
        onlyOwner
        returns (bool)
    {
        require(collectionName != address(0), "Cannot be address 0");
        isMinted[collectionName] = false;
        return true;
    }

    //Initialization of Pegged Tokens
    function makePegCollection(address collectionName)
        external
        onlyOwner
        returns (bool)
    {
        require(collectionName != address(0), "Cannot be address 0");
        isPegged[collectionName] = true;
        return true;
    }

    function removePegToken(address collectionName)
        external
        onlyOwner
        returns (bool)
    {
        require(collectionName != address(0), "Cannot be address 0");
        isPegged[collectionName] = false;
        return true;
    }

    //Whitelisting and Initializing of Tokens
    function whitelistCollection(
        address collectionAddress,
        string memory colectionName
    ) external onlyOwner returns (bool) {
        require(collectionAddress != address(0), "Cannot be address 0");
        require(
            !ifDuplicateCollectionName(colectionName),
            "Duplicate collection name"
        );
        isWhitelisted[collectionAddress] = true;
        whitelistedCollectionName[collectionAddress] = colectionName;
        whitelistedCollectionAddress[colectionName] = collectionAddress;
        whitelistedCollectionNames.push(colectionName);
        mapWhiltelistCollectionNames[colectionName] = index;
        index++;
        return true;
    }

    function ifDuplicateCollectionName(string memory colectionName)
        private
        view
        returns (bool)
    {
        bool flag = false;
        for (uint256 j = 0; j < whitelistedCollectionNames.length; j++) {
            if (
                keccak256(abi.encodePacked(whitelistedCollectionNames[j])) ==
                keccak256(abi.encodePacked(colectionName))
            ) {
                flag = true;
                break;
            }
        }
        return flag;
    }

    function removeCollectionFromWhitelist(address collectionAddress)
        external
        onlyOwner
        returns (bool)
    {
        require(collectionAddress != address(0), "Cannot be address 0");
        // IERC20(collectionAddress).transfer(receiver, bridgeFee[collectionAddress]);
        string memory collectionName = whitelistedCollectionName[
            collectionAddress
        ];
        delete whitelistedCollectionAddress[collectionName];
        delete whitelistedCollectionName[collectionAddress];
        uint256 i = mapWhiltelistCollectionNames[collectionName];
        string memory lastCollectionName = whitelistedCollectionNames[
            ((whitelistedCollectionNames.length) - 1)
        ];
        mapWhiltelistCollectionNames[lastCollectionName] = i;
        whitelistedCollectionNames[i - 1] = lastCollectionName;
        whitelistedCollectionNames.pop();
        delete mapWhiltelistCollectionNames[collectionName];
        isWhitelisted[collectionAddress] = false;
        return true;
    }

    //Core Bridge Logic
    function deposit(
        address collectionAddress,
        uint256 _amount,
        uint256 _destChainId,
        uint256 _tokenID
    ) external returns (bool) {
        //approve address(this) to transfer your tokens that you want to deposit and get your wrapped tokens
        require(collectionAddress != address(0), "Cannot be address 0");
        require(isBlocked != true, "Bridge is blocked right now");
        require(
            isWhitelisted[collectionAddress] == true,
            "This token is not Whitelisted on our platform"
        );
        require(
            _amount <= IERC20(collectionAddress).balanceOf(msg.sender),
            "Amount exceeds your balance"
        );

        uint256 tamount = _amount;
        string memory collectionName = whitelistedCollectionName[
            collectionAddress
        ];
        if (isMinted[collectionAddress] || isPegged[collectionAddress]) {
            IERC721(collectionAddress).transferFrom(
                msg.sender,
                address(this),
                _tokenID
            );
        } else {
            bridgeFee[collectionAddress] =
                bridgeFee[collectionAddress] +
                ((_amount * bridgeFeePercent) / 1000);
            tamount = _amount - ((_amount * bridgeFeePercent) / 1000);
            IERC721(collectionAddress).transferFrom(
                msg.sender,
                address(this),
                _tokenID
            );
        }
        emit DEPOSIT(
            tamount,
            _tokenID,
            msg.sender,
            collectionAddress,
            collectionName,
            _destChainId
        );
        return true;
    }

    function withdraw(
        uint256 amount,
        uint256 _tokenID,
        address collectionAddress,
        address receiver
    ) external onlyOwner returns (bool) {
        require(collectionAddress != address(0), "Cannot be address 0");
        require(receiver != address(0), "Cannot be address 0");
        require(
            isWhitelisted[collectionAddress] == true,
            "This token is not Whitelisted on our platform"
        );
        if (isMinted[collectionAddress] || isPegged[collectionAddress]) {
            IERC721(collectionAddress).transferFrom(
                address(this),
                receiver,
                _tokenID
            );
        } else {
            bridgeFee[collectionAddress] =
                bridgeFee[collectionAddress] +
                ((amount * bridgeFeePercent) / 1000);
            amount = amount - ((amount * bridgeFeePercent) / 1000);
            IERC721(collectionAddress).transferFrom(
                address(this),
                receiver,
                _tokenID
            );
        }
        emit WITHDRAW(_tokenID, receiver, collectionAddress);
        return true;
    }

    //Function to change the bridge fee percentage
    function changeBridgeFee(uint256 value) external onlyOwner returns (bool) {
        require(value != 0, "Value cannot be 0");
        bridgeFeePercent = value;
        return true;
    }

    //Function to get names of all whitelisted tokens
    function getAllWhitelistedCollectionNames()
        external
        view
        returns (string[] memory)
    {
        return whitelistedCollectionNames;
    }

    //Bridge Fee collection
    function getSingleTokenBridgeFee(address collectionAddress)
        external
        view
        onlyOwner
        returns (uint256)
    {
        return bridgeFee[collectionAddress];
    }

    function claimSingleTokenBridgeFee(
        address collectionAddress,
        address receiver
    ) external onlyOwner returns (bool) {
        require(collectionAddress != address(0), "Cannot be address 0");
        require(receiver != address(0), "Cannot be address 0");
        uint256 fee = bridgeFee[collectionAddress];
        bridgeFee[collectionAddress] = 0;
        require(
            IERC20(collectionAddress).transfer(receiver, fee),
            "There was a problem transferring your tokens"
        );
        return true;
    }

    function claimAllCollectionBridgeFee(address receiver)
        external
        onlyOwner
        returns (bool)
    {
        require(receiver != address(0), "Cannot be address 0");
        for (uint256 i = 0; i < whitelistedCollectionNames.length; i++) {
            address collectionAddress = whitelistedCollectionAddress[
                whitelistedCollectionNames[i]
            ];
            uint256 fee = bridgeFee[collectionAddress];
            bridgeFee[collectionAddress] = 0;
            require(
                IERC20(collectionAddress).transfer(receiver, fee),
                "There was a problem transferring your tokens"
            );
        }

        return true;
    }
}
