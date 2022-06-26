//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PeggedNFT is ERC721URIStorage, AccessControl, Ownable {
    using EnumerableSet for EnumerableSet.UintSet;

    uint256 public totalminted;
    address private signer;
    address public bridgeContract;
    address public admin;

    mapping(uint256 => bool) private mintedById;
    mapping(address => EnumerableSet.UintSet) private _holderTokens;

    modifier onlyBridge() {
        require(
            bridgeContract == _msgSender(),
            "Ownable: caller is not the owner"
        );
        _;
    }

    constructor() ERC721("LazyMINT", "LAZY") {
        admin = _msgSender();
    }

    function setBridgeContract(address _bridgeContract) external {
        require(_msgSender() == admin, "Only admin can call this function");
        bridgeContract = _bridgeContract;
    }

    function mint(
        address receiver,
        uint256 tokenId,
        string memory uri
    ) external onlyBridge {
        _mint(receiver, tokenId);
        _setTokenURI(tokenId, uri);
        _holderTokens[receiver].add(tokenId);
        totalminted++;
    }

    function burn(uint256 tokenId, address _owner) external onlyBridge {
        require(_owner == ownerOf(tokenId), "Not the right owner");
        _burn(tokenId);
        _holderTokens[_owner].remove(tokenId);
        totalminted--;
    }

    function getTotalMinted() public view returns (uint256) {
        return totalminted;
    }

    function userTokens(address owner)
        external
        view
        virtual
        returns (uint256[] memory)
    {
        require(
            owner != address(0),
            "LazyNFT: balance query for the zero address"
        );

        uint256[] memory result = new uint256[](_holderTokens[owner].length());

        for (uint256 i; i < _holderTokens[owner].length(); i++) {
            result[i] = _holderTokens[owner].at(i);
        }
        return result;
    }

    /// @notice Returns the chain id of the current blockchain.
    function getChainID() external view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControl, ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC721-transferFrom}.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        //solhint-disable-next-line max-line-length
        super.transferFrom(from, to, tokenId);
        _holderTokens[from].remove(tokenId);
        _holderTokens[to].add(tokenId);
    }
}
