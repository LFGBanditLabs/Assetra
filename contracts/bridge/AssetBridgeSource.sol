// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title AssetBridgeSource
 * @notice Locks ERC721 AssetNFT tokens on the source chain and emits bridge events for off-chain relayers
 */
contract AssetBridgeSource is Initializable, AccessControlUpgradeable, PausableUpgradeable, UUPSUpgradeable {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // Rate limiting
    uint256 public windowSeconds; // e.g., 1 hour
    uint256 public maxPerWindow;  // max NFTs per address per window
    mapping(address => uint256) public windowStart;
    mapping(address => uint256) public windowCount;

    // Nonce for transfers
    uint256 public nonce;

    // Chain identifiers
    uint256 public sourceChainId;

    event BridgeInitiated(
        bytes32 indexed transferId,
        address indexed token,
        address indexed from,
        address to,
        uint256 destinationChainId,
        uint256[] tokenIds,
        uint256 nonce
    );

    event RateLimitUpdated(uint256 windowSeconds, uint256 maxPerWindow);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 _sourceChainId, uint256 _windowSeconds, uint256 _maxPerWindow) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        sourceChainId = _sourceChainId;
        windowSeconds = _windowSeconds;
        maxPerWindow = _maxPerWindow;
        nonce = 1;
    }

    function setRateLimit(uint256 _windowSeconds, uint256 _maxPerWindow) external onlyRole(DEFAULT_ADMIN_ROLE) {
        windowSeconds = _windowSeconds;
        maxPerWindow = _maxPerWindow;
        emit RateLimitUpdated(_windowSeconds, _maxPerWindow);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function _checkRateLimit(address user, uint256 amount) internal {
        uint256 start = windowStart[user];
        if (block.timestamp >= start + windowSeconds) {
            // reset window
            windowStart[user] = block.timestamp;
            windowCount[user] = 0;
        }
        require(windowCount[user] + amount <= maxPerWindow, "Bridge: rate limit");
        windowCount[user] += amount;
    }

    /**
     * @notice Lock a batch of ERC721 tokens and emit bridge event
     * @param token ERC721 token address (expected AssetNFT)
     * @param tokenIds Array of token IDs to bridge
     * @param to Recipient on destination chain
     * @param destinationChainId Target chain ID
     */
    function lockERC721Batch(
        address token,
        uint256[] calldata tokenIds,
        address to,
        uint256 destinationChainId
    ) external whenNotPaused {
        require(tokenIds.length > 0, "Bridge: empty batch");
        require(to != address(0), "Bridge: bad recipient");
        _checkRateLimit(msg.sender, tokenIds.length);

        IERC721 erc721 = IERC721(token);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            // user must approve this contract beforehand
            erc721.transferFrom(msg.sender, address(this), tokenIds[i]);
        }

        uint256 currentNonce = nonce++;
        bytes32 transferId = keccak256(
            abi.encode(
                sourceChainId,
                destinationChainId,
                token,
                msg.sender,
                to,
                tokenIds,
                currentNonce
            )
        );

        emit BridgeInitiated(transferId, token, msg.sender, to, destinationChainId, tokenIds, currentNonce);
    }

    /**
     * @notice Admin can release tokens back to owner if needed (cancel)
     */
    function releaseERC721Batch(address token, address to, uint256[] calldata tokenIds)
        external
        onlyRole(OPERATOR_ROLE)
    {
        IERC721 erc721 = IERC721(token);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            erc721.transferFrom(address(this), to, tokenIds[i]);
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
