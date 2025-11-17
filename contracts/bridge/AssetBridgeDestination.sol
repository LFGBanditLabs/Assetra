// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IWrappedAsset721 {
    function mintTo(address to, uint256 tokenId) external;
    function exists(uint256 tokenId) external view returns (bool);
}

/**
 * @title AssetBridgeDestination
 * @notice Receives relayer approvals for bridged ERC721s and mints wrapped tokens upon quorum
 */
contract AssetBridgeDestination is Initializable, AccessControlUpgradeable, PausableUpgradeable, UUPSUpgradeable {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // Destination chain id (for reference)
    uint256 public destinationChainId;

    // Wrapped token contract
    IWrappedAsset721 public wrapped;

    // Relayer quorum
    uint256 public requiredApprovals; // e.g., 2

    struct ApprovalState {
        uint256 count;
        mapping(address => bool) approvers;
        bool processed;
    }

    mapping(bytes32 => ApprovalState) private approvals;

    event RelayerApproved(bytes32 indexed transferId, address indexed relayer, uint256 newCount);
    event WrappedMinted(bytes32 indexed transferId, address indexed to, uint256[] tokenIds);
    event RequiredApprovalsUpdated(uint256 requiredApprovals);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 _destinationChainId, address _wrapped, uint256 _requiredApprovals) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        destinationChainId = _destinationChainId;
        wrapped = IWrappedAsset721(_wrapped);
        requiredApprovals = _requiredApprovals;
    }

    function setRequiredApprovals(uint256 _requiredApprovals) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_requiredApprovals > 0, "Bridge: zero quorum");
        requiredApprovals = _requiredApprovals;
        emit RequiredApprovalsUpdated(_requiredApprovals);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    /**
     * @notice Relayer approves a transfer. When quorum is met, wrapped tokens are minted
     * @param transferId The keccak id emitted on source chain
     * @param to Recipient address
     * @param tokenIds Token ids to mint as wrapped
     */
    function approveAndMint(
        bytes32 transferId,
        address to,
        uint256[] calldata tokenIds
    ) external whenNotPaused onlyRole(RELAYER_ROLE) {
        require(to != address(0), "Bridge: bad recipient");
        require(tokenIds.length > 0, "Bridge: empty batch");
        ApprovalState storage st = approvals[transferId];
        require(!st.processed, "Bridge: already processed");
        require(!st.approvers[msg.sender], "Bridge: already approved");

        st.approvers[msg.sender] = true;
        st.count += 1;
        emit RelayerApproved(transferId, msg.sender, st.count);

        if (st.count >= requiredApprovals) {
            // mint wrapped tokens
            for (uint256 i = 0; i < tokenIds.length; i++) {
                if (!wrapped.exists(tokenIds[i])) {
                    wrapped.mintTo(to, tokenIds[i]);
                }
            }
            st.processed = true;
            emit WrappedMinted(transferId, to, tokenIds);
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
