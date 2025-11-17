// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title KYCRegistry
 * @dev Manages KYC/AML compliance for platform users
 * @notice Tracks verification status, risk levels, and maintains audit trails
 */
contract KYCRegistry is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    enum RiskLevel {
        NONE,
        LOW,
        MEDIUM,
        HIGH,
        BLOCKED
    }

    struct KYCData {
        bool isVerified;
        RiskLevel riskLevel;
        uint256 verifiedAt;
        uint256 expiresAt;
        address verifier;
        string documentHash; // IPFS hash of verification documents
        uint256 transactionLimit;
    }

    mapping(address => KYCData) public kycData;
    mapping(address => bool) public isSanctioned;
    mapping(string => bool) public usedDocumentHashes;

    // Country code restrictions (ISO 3166-1 alpha-2)
    mapping(string => bool) public restrictedCountries;

    event UserVerified(address indexed user, address indexed verifier, uint256 expiresAt);
    event VerificationRevoked(address indexed user, address indexed revoker);
    event RiskLevelUpdated(address indexed user, RiskLevel oldLevel, RiskLevel newLevel);
    event SanctionStatusUpdated(address indexed user, bool isSanctioned);
    event TransactionLimitUpdated(address indexed user, uint256 oldLimit, uint256 newLimit);
    event CountryRestricted(string indexed countryCode, bool restricted);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    /**
     * @dev Verify a user's KYC
     * @param user Address to verify
     * @param documentHash IPFS hash of verification documents
     * @param riskLevel Assessed risk level
     * @param expiresAt Verification expiration timestamp
     * @param transactionLimit Maximum transaction value allowed
     */
    function verifyUser(
        address user,
        string memory documentHash,
        RiskLevel riskLevel,
        uint256 expiresAt,
        uint256 transactionLimit
    ) public onlyRole(VERIFIER_ROLE) whenNotPaused {
        require(user != address(0), "KYCRegistry: Invalid address");
        require(bytes(documentHash).length > 0, "KYCRegistry: Document hash required");
        require(!usedDocumentHashes[documentHash], "KYCRegistry: Document hash already used");
        require(expiresAt > block.timestamp, "KYCRegistry: Invalid expiration");
        require(!isSanctioned[user], "KYCRegistry: User is sanctioned");

        kycData[user] = KYCData({
            isVerified: true,
            riskLevel: riskLevel,
            verifiedAt: block.timestamp,
            expiresAt: expiresAt,
            verifier: msg.sender,
            documentHash: documentHash,
            transactionLimit: transactionLimit
        });

        usedDocumentHashes[documentHash] = true;

        emit UserVerified(user, msg.sender, expiresAt);
    }

    /**
     * @dev Revoke a user's KYC verification
     * @param user Address to revoke
     */
    function revokeVerification(address user)
        public
        onlyRole(VERIFIER_ROLE)
    {
        require(kycData[user].isVerified, "KYCRegistry: User not verified");

        kycData[user].isVerified = false;
        kycData[user].expiresAt = block.timestamp;

        emit VerificationRevoked(user, msg.sender);
    }

    /**
     * @dev Update user's risk level
     * @param user Address to update
     * @param newLevel New risk level
     */
    function updateRiskLevel(address user, RiskLevel newLevel)
        public
        onlyRole(VERIFIER_ROLE)
    {
        require(kycData[user].isVerified, "KYCRegistry: User not verified");

        RiskLevel oldLevel = kycData[user].riskLevel;
        kycData[user].riskLevel = newLevel;

        // Automatically revoke if blocked
        if (newLevel == RiskLevel.BLOCKED) {
            kycData[user].isVerified = false;
        }

        emit RiskLevelUpdated(user, oldLevel, newLevel);
    }

    /**
     * @dev Update sanction status
     * @param user Address to update
     * @param sanctioned Sanction status
     */
    function updateSanctionStatus(address user, bool sanctioned)
        public
        onlyRole(VERIFIER_ROLE)
    {
        isSanctioned[user] = sanctioned;

        // Revoke verification if sanctioned
        if (sanctioned && kycData[user].isVerified) {
            kycData[user].isVerified = false;
        }

        emit SanctionStatusUpdated(user, sanctioned);
    }

    /**
     * @dev Update transaction limit for a user
     * @param user Address to update
     * @param newLimit New transaction limit
     */
    function updateTransactionLimit(address user, uint256 newLimit)
        public
        onlyRole(VERIFIER_ROLE)
    {
        require(kycData[user].isVerified, "KYCRegistry: User not verified");

        uint256 oldLimit = kycData[user].transactionLimit;
        kycData[user].transactionLimit = newLimit;

        emit TransactionLimitUpdated(user, oldLimit, newLimit);
    }

    /**
     * @dev Set country restriction
     * @param countryCode ISO 3166-1 alpha-2 country code
     * @param restricted Whether country is restricted
     */
    function setCountryRestriction(string memory countryCode, bool restricted)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        restrictedCountries[countryCode] = restricted;
        emit CountryRestricted(countryCode, restricted);
    }

    /**
     * @dev Check if a user is verified
     * @param user Address to check
     */
    function isVerified(address user) public view returns (bool) {
        KYCData memory data = kycData[user];

        // Check if verified, not expired, and not sanctioned
        return
            data.isVerified &&
            data.expiresAt > block.timestamp &&
            !isSanctioned[user] &&
            data.riskLevel != RiskLevel.BLOCKED;
    }

    /**
     * @dev Check if a user can transact a specific amount
     * @param user Address to check
     * @param amount Transaction amount
     */
    function canTransact(address user, uint256 amount) public view returns (bool) {
        if (!isVerified(user)) return false;

        KYCData memory data = kycData[user];

        // Check transaction limit
        if (data.transactionLimit > 0 && amount > data.transactionLimit) {
            return false;
        }

        // Check risk level
        if (data.riskLevel == RiskLevel.HIGH && amount > 10000 ether) {
            return false;
        }

        return true;
    }

    /**
     * @dev Get complete KYC data for a user
     * @param user Address to query
     */
    function getUserKYC(address user) public view returns (KYCData memory) {
        return kycData[user];
    }

    /**
     * @dev Batch verify multiple users
     * @param users Array of addresses to verify
     * @param documentHashes Array of document hashes
     * @param riskLevels Array of risk levels
     * @param expiresAt Array of expiration timestamps
     * @param transactionLimits Array of transaction limits
     */
    function batchVerifyUsers(
        address[] memory users,
        string[] memory documentHashes,
        RiskLevel[] memory riskLevels,
        uint256[] memory expiresAt,
        uint256[] memory transactionLimits
    ) public onlyRole(VERIFIER_ROLE) whenNotPaused {
        require(
            users.length == documentHashes.length &&
            users.length == riskLevels.length &&
            users.length == expiresAt.length &&
            users.length == transactionLimits.length,
            "KYCRegistry: Array length mismatch"
        );

        for (uint256 i = 0; i < users.length; i++) {
            verifyUser(
                users[i],
                documentHashes[i],
                riskLevels[i],
                expiresAt[i],
                transactionLimits[i]
            );
        }
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
}
