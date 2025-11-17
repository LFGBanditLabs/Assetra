// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title AssetNFT
 * @dev ERC-721 contract for tokenizing unique real-world assets
 * @notice This contract implements asset lifecycle management with metadata standards
 */
contract AssetNFT is
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC721EnumerableUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    uint256 private _nextTokenId;

    struct AssetMetadata {
        string ipfsHash;
        uint256 assetValue;
        uint256 createdAt;
        uint256 lastVerified;
        bool isVerified;
        address oracle;
    }

    mapping(uint256 => AssetMetadata) public assetMetadata;
    mapping(uint256 => bool) public isAssetActive;

    event AssetMinted(uint256 indexed tokenId, address indexed owner, string ipfsHash, uint256 assetValue);
    event AssetBurned(uint256 indexed tokenId, address indexed owner);
    event AssetVerified(uint256 indexed tokenId, address indexed oracle, uint256 timestamp);
    event AssetValueUpdated(uint256 indexed tokenId, uint256 oldValue, uint256 newValue);
    event AssetMetadataUpdated(uint256 indexed tokenId, string newIpfsHash);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ERC721_init("Assetra RWA", "ARWA");
        __ERC721URIStorage_init();
        __ERC721Enumerable_init();
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);

        _nextTokenId = 1;
    }

    /**
     * @dev Mint a new asset NFT
     * @param to Address to receive the NFT
     * @param ipfsHash IPFS hash containing asset metadata
     * @param assetValue Initial valuation of the asset
     */
    function mintAsset(
        address to,
        string memory ipfsHash,
        uint256 assetValue
    ) public onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(bytes(ipfsHash).length > 0, "AssetNFT: IPFS hash required");
        require(assetValue > 0, "AssetNFT: Asset value must be positive");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, ipfsHash);

        assetMetadata[tokenId] = AssetMetadata({
            ipfsHash: ipfsHash,
            assetValue: assetValue,
            createdAt: block.timestamp,
            lastVerified: 0,
            isVerified: false,
            oracle: address(0)
        });

        isAssetActive[tokenId] = true;

        emit AssetMinted(tokenId, to, ipfsHash, assetValue);
        return tokenId;
    }

    /**
     * @dev Burn an asset NFT (end of lifecycle)
     * @param tokenId The ID of the token to burn
     */
    function burnAsset(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender || hasRole(OPERATOR_ROLE, msg.sender),
            "AssetNFT: Not authorized to burn");

        address owner = ownerOf(tokenId);
        isAssetActive[tokenId] = false;
        _burn(tokenId);

        emit AssetBurned(tokenId, owner);
    }

    /**
     * @dev Verify an asset through an oracle
     * @param tokenId The ID of the asset to verify
     */
    function verifyAsset(uint256 tokenId) public onlyRole(OPERATOR_ROLE) {
        require(_exists(tokenId), "AssetNFT: Asset does not exist");

        assetMetadata[tokenId].isVerified = true;
        assetMetadata[tokenId].lastVerified = block.timestamp;
        assetMetadata[tokenId].oracle = msg.sender;

        emit AssetVerified(tokenId, msg.sender, block.timestamp);
    }

    /**
     * @dev Update asset valuation
     * @param tokenId The ID of the asset
     * @param newValue New asset value
     */
    function updateAssetValue(uint256 tokenId, uint256 newValue)
        public
        onlyRole(OPERATOR_ROLE)
    {
        require(_exists(tokenId), "AssetNFT: Asset does not exist");
        require(newValue > 0, "AssetNFT: Value must be positive");

        uint256 oldValue = assetMetadata[tokenId].assetValue;
        assetMetadata[tokenId].assetValue = newValue;

        emit AssetValueUpdated(tokenId, oldValue, newValue);
    }

    /**
     * @dev Update asset metadata IPFS hash
     * @param tokenId The ID of the asset
     * @param newIpfsHash New IPFS hash
     */
    function updateAssetMetadata(uint256 tokenId, string memory newIpfsHash)
        public
        onlyRole(OPERATOR_ROLE)
    {
        require(_exists(tokenId), "AssetNFT: Asset does not exist");
        require(bytes(newIpfsHash).length > 0, "AssetNFT: IPFS hash required");

        assetMetadata[tokenId].ipfsHash = newIpfsHash;
        _setTokenURI(tokenId, newIpfsHash);

        emit AssetMetadataUpdated(tokenId, newIpfsHash);
    }

    /**
     * @dev Get complete asset information
     * @param tokenId The ID of the asset
     */
    function getAssetInfo(uint256 tokenId)
        public
        view
        returns (AssetMetadata memory)
    {
        require(_exists(tokenId), "AssetNFT: Asset does not exist");
        return assetMetadata[tokenId];
    }

    /**
     * @dev Pause contract (emergency)
     */
    function pause() public onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() public onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // The following functions are overrides required by Solidity

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
