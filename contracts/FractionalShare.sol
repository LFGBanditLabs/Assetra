// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title FractionalShare
 * @dev ERC-20 contract for fractional ownership of real-world assets
 * @notice Implements transfer restrictions, compliance hooks, and revenue distribution
 */
contract FractionalShare is
    Initializable,
    ERC20Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    // Associated asset NFT token ID
    uint256 public assetTokenId;

    // KYC Registry contract
    address public kycRegistry;

    // Transfer restrictions
    bool public transfersEnabled;
    mapping(address => bool) public isWhitelisted;
    mapping(address => bool) public isBlacklisted;

    // Revenue distribution
    uint256 public totalRevenue;
    uint256 public lastDistributionTimestamp;
    mapping(address => uint256) public revenuePerShare;
    mapping(address => uint256) public claimedRevenue;

    event SharesMinted(address indexed to, uint256 amount, uint256 assetTokenId);
    event SharesBurned(address indexed from, uint256 amount);
    event RevenueDistributed(uint256 amount, uint256 timestamp);
    event RevenueClaimed(address indexed shareholder, uint256 amount);
    event WhitelistUpdated(address indexed account, bool status);
    event BlacklistUpdated(address indexed account, bool status);
    event TransfersToggled(bool enabled);
    event KYCRegistryUpdated(address indexed newRegistry);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        string memory symbol,
        uint256 _assetTokenId,
        address _kycRegistry
    ) public initializer {
        __ERC20_init(name, symbol);
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);

        assetTokenId = _assetTokenId;
        kycRegistry = _kycRegistry;
        transfersEnabled = false;
        lastDistributionTimestamp = block.timestamp;
    }

    /**
     * @dev Mint fractional shares for an asset
     * @param to Address to receive shares
     * @param amount Number of shares to mint
     */
    function mintShares(address to, uint256 amount)
        public
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        require(amount > 0, "FractionalShare: Amount must be positive");
        require(isKYCVerified(to), "FractionalShare: Recipient not KYC verified");

        _mint(to, amount);
        emit SharesMinted(to, amount, assetTokenId);
    }

    /**
     * @dev Burn fractional shares
     * @param from Address to burn from
     * @param amount Number of shares to burn
     */
    function burnShares(address from, uint256 amount)
        public
        onlyRole(MINTER_ROLE)
    {
        require(amount > 0, "FractionalShare: Amount must be positive");
        _burn(from, amount);
        emit SharesBurned(from, amount);
    }

    /**
     * @dev Distribute revenue to all shareholders
     */
    function distributeRevenue() public payable nonReentrant {
        require(msg.value > 0, "FractionalShare: No revenue to distribute");
        require(totalSupply() > 0, "FractionalShare: No shares issued");

        totalRevenue += msg.value;
        uint256 revenuePerToken = msg.value / totalSupply();

        // Store revenue per share for claiming
        lastDistributionTimestamp = block.timestamp;

        emit RevenueDistributed(msg.value, block.timestamp);
    }

    /**
     * @dev Claim revenue as a shareholder
     */
    function claimRevenue() public nonReentrant whenNotPaused {
        uint256 balance = balanceOf(msg.sender);
        require(balance > 0, "FractionalShare: No shares held");

        uint256 unclaimed = getUnclaimedRevenue(msg.sender);
        require(unclaimed > 0, "FractionalShare: No revenue to claim");

        claimedRevenue[msg.sender] += unclaimed;

        (bool success, ) = payable(msg.sender).call{value: unclaimed}("");
        require(success, "FractionalShare: Transfer failed");

        emit RevenueClaimed(msg.sender, unclaimed);
    }

    /**
     * @dev Get unclaimed revenue for an address
     * @param account Address to check
     */
    function getUnclaimedRevenue(address account) public view returns (uint256) {
        uint256 balance = balanceOf(account);
        if (balance == 0 || totalSupply() == 0) return 0;

        uint256 totalEarned = (totalRevenue * balance) / totalSupply();
        uint256 claimed = claimedRevenue[account];

        return totalEarned > claimed ? totalEarned - claimed : 0;
    }

    /**
     * @dev Update whitelist status
     * @param account Address to update
     * @param status Whitelist status
     */
    function updateWhitelist(address account, bool status)
        public
        onlyRole(COMPLIANCE_ROLE)
    {
        isWhitelisted[account] = status;
        emit WhitelistUpdated(account, status);
    }

    /**
     * @dev Update blacklist status
     * @param account Address to update
     * @param status Blacklist status
     */
    function updateBlacklist(address account, bool status)
        public
        onlyRole(COMPLIANCE_ROLE)
    {
        isBlacklisted[account] = status;
        emit BlacklistUpdated(account, status);
    }

    /**
     * @dev Enable or disable transfers
     * @param enabled Transfer enabled status
     */
    function setTransfersEnabled(bool enabled)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        transfersEnabled = enabled;
        emit TransfersToggled(enabled);
    }

    /**
     * @dev Update KYC Registry contract
     * @param newRegistry New KYC registry address
     */
    function setKYCRegistry(address newRegistry)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(newRegistry != address(0), "FractionalShare: Invalid address");
        kycRegistry = newRegistry;
        emit KYCRegistryUpdated(newRegistry);
    }

    /**
     * @dev Check if address is KYC verified
     * @param account Address to check
     */
    function isKYCVerified(address account) public view returns (bool) {
        if (kycRegistry == address(0)) return true;

        // Call KYC Registry to check verification status
        (bool success, bytes memory data) = kycRegistry.staticcall(
            abi.encodeWithSignature("isVerified(address)", account)
        );

        if (!success) return false;
        return abi.decode(data, (bool));
    }

    /**
     * @dev Pause contract (emergency)
     */
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}

    /**
     * @dev Hook that is called before any transfer of tokens
     * Implements compliance checks and transfer restrictions
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        // Minting and burning are always allowed (subject to role checks)
        if (from == address(0) || to == address(0)) {
            return;
        }

        // Check if transfers are enabled
        require(transfersEnabled, "FractionalShare: Transfers disabled");

        // Check blacklist
        require(!isBlacklisted[from], "FractionalShare: Sender blacklisted");
        require(!isBlacklisted[to], "FractionalShare: Recipient blacklisted");

        // Check KYC verification
        require(isKYCVerified(from), "FractionalShare: Sender not KYC verified");
        require(isKYCVerified(to), "FractionalShare: Recipient not KYC verified");

        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @dev Allow contract to receive ETH for revenue distribution
     */
    receive() external payable {
        if (msg.value > 0) {
            distributeRevenue();
        }
    }
}
