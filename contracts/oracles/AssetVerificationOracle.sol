// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AssetVerificationOracle
 * @dev Contract for managing asset verifications by appraisers
 */
contract AssetVerificationOracle is AccessControl, Pausable {
    using Counters for Counters.Counter;
    
    // Roles
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Verification status
    enum VerificationStatus { Pending, Approved, Rejected, Disputed }
    
    // Verification request
    struct VerificationRequest {
        uint256 requestId;
        address requester;
        string assetId;
        string documentHash; // IPFS hash of the verification document
        uint256 timestamp;
        VerificationStatus status;
        address[] verifiers;
        mapping(address => bool) verifierApprovals;
        uint256 approvalCount;
        string rejectionReason;
        bool exists;
    }
    
    // Verifier reputation
    struct VerifierInfo {
        uint256 completedVerifications;
        uint256 successfulVerifications;
        uint256 reputationScore; // 0-1000 scale
        bool isActive;
    }
    
    // State variables
    Counters.Counter private _requestIdCounter;
    mapping(uint256 => VerificationRequest) private _verificationRequests;
    mapping(address => VerifierInfo) public verifiers;
    mapping(string => uint256[]) private _assetVerifications; // assetId => requestIds
    
    // Configuration
    uint256 public requiredApprovals = 3;
    uint256 public verificationFee = 0.01 ether;
    uint256 public disputePeriod = 7 days;
    
    // Events
    event VerificationRequested(
        uint256 indexed requestId,
        address indexed requester,
        string assetId,
        string documentHash
    );
    event VerificationApproved(
        uint256 indexed requestId,
        address indexed verifier,
        string assetId
    );
    event VerificationRejected(
        uint256 indexed requestId,
        address indexed verifier,
        string assetId,
        string reason
    );
    event VerificationDisputed(
        uint256 indexed requestId,
        address indexed disputer,
        string reason
    );
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }
    
    modifier onlyVerifier() {
        require(
            hasRole(VERIFIER_ROLE, msg.sender) || 
            hasRole(ADMIN_ROLE, msg.sender),
            "Caller is not a verifier"
        );
        _;
    }
    
    modifier onlyAdmin() {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "Caller is not an admin"
        );
        _;
    }
    
    /**
     * @notice Request asset verification
     * @param assetId Unique identifier for the asset
     * @param documentHash IPFS hash of the verification document
     */
    function requestVerification(
        string calldata assetId,
        string calldata documentHash
    ) external payable whenNotPaused {
        require(msg.value >= verificationFee, "Insufficient fee");
        require(bytes(assetId).length > 0, "Invalid asset ID");
        require(bytes(documentHash).length > 0, "Invalid document hash");
        
        _requestIdCounter.increment();
        uint256 requestId = _requestIdCounter.current();
        
        VerificationRequest storage request = _verificationRequests[requestId];
        request.requestId = requestId;
        request.requester = msg.sender;
        request.assetId = assetId;
        request.documentHash = documentHash;
        request.timestamp = block.timestamp;
        request.status = VerificationStatus.Pending;
        request.exists = true;
        
        _assetVerifications[assetId].push(requestId);
        
        emit VerificationRequested(requestId, msg.sender, assetId, documentHash);
    }
    
    /**
     * @notice Approve a verification request
     * @param requestId ID of the verification request
     */
    function approveVerification(
        uint256 requestId
    ) external onlyVerifier whenNotPaused {
        VerificationRequest storage request = _verificationRequests[requestId];
        require(request.exists, "Request does not exist");
        require(
            request.status == VerificationStatus.Pending,
            "Request is not pending"
        );
        require(
            !request.verifierApprovals[msg.sender],
            "Already approved"
        );
        
        request.verifiers.push(msg.sender);
        request.verifierApprovals[msg.sender] = true;
        request.approvalCount++;
        
        emit VerificationApproved(requestId, msg.sender, request.assetId);
        
        // Update verifier reputation
        VerifierInfo storage verifier = verifiers[msg.sender];
        verifier.completedVerifications++;
        verifier.successfulVerifications++;
        updateReputationScore(msg.sender);
        
        // Check if we have enough approvals
        if (request.approvalCount >= requiredApprovals) {
            request.status = VerificationStatus.Approved;
        }
    }
    
    /**
     * @notice Reject a verification request
     * @param requestId ID of the verification request
     * @param reason Reason for rejection
     */
    function rejectVerification(
        uint256 requestId,
        string calldata reason
    ) external onlyVerifier whenNotPaused {
        VerificationRequest storage request = _verificationRequests[requestId];
        require(request.exists, "Request does not exist");
        require(
            request.status == VerificationStatus.Pending,
            "Request is not pending"
        );
        
        request.status = VerificationStatus.Rejected;
        request.rejectionReason = reason;
        
        emit VerificationRejected(requestId, msg.sender, request.assetId, reason);
    }
    
    /**
     * @notice Dispute a verification
     * @param requestId ID of the verification request
     * @param reason Reason for dispute
     */
    function disputeVerification(
        uint256 requestId,
        string calldata reason
    ) external whenNotPaused {
        VerificationRequest storage request = _verificationRequests[requestId];
        require(request.exists, "Request does not exist");
        require(
            request.status == VerificationStatus.Approved,
            "Request is not approved"
        );
        require(
            block.timestamp <= request.timestamp + disputePeriod,
            "Dispute period expired"
        );
        
        request.status = VerificationStatus.Disputed;
        
        emit VerificationDisputed(requestId, msg.sender, reason);
    }
    
    /**
     * @notice Add a new verifier
     * @param verifier Address of the verifier to add
     */
    function addVerifier(
        address verifier
    ) external onlyAdmin {
        require(verifier != address(0), "Invalid address");
        require(!verifiers[verifier].isActive, "Verifier already exists");
        
        verifiers[verifier] = VerifierInfo({
            completedVerifications: 0,
            successfulVerifications: 0,
            reputationScore: 500, // Start with neutral reputation
            isActive: true
        });
        
        _grantRole(VERIFIER_ROLE, verifier);
        emit VerifierAdded(verifier);
    }
    
    /**
     * @notice Remove a verifier
     * @param verifier Address of the verifier to remove
     */
    function removeVerifier(
        address verifier
    ) external onlyAdmin {
        require(verifiers[verifier].isActive, "Not an active verifier");
        
        verifiers[verifier].isActive = false;
        _revokeRole(VERIFIER_ROLE, verifier);
        
        emit VerifierRemoved(verifier);
    }
    
    /**
     * @notice Update required number of approvals
     * @param count New required number of approvals
     */
    function setRequiredApprovals(
        uint256 count
    ) external onlyAdmin {
        require(count > 0, "At least one approval required");
        requiredApprovals = count;
    }
    
    /**
     * @notice Update verification fee
     * @param fee New verification fee in wei
     */
    function setVerificationFee(
        uint256 fee
    ) external onlyAdmin {
        verificationFee = fee;
    }
    
    /**
     * @notice Update dispute period
     * @param period New dispute period in seconds
     */
    function setDisputePeriod(
        uint256 period
    ) external onlyAdmin {
        disputePeriod = period;
    }
    
    /**
     * @notice Withdraw collected fees
     * @param to Address to withdraw to
     * @param amount Amount to withdraw
     */
    function withdrawFees(
        address payable to,
        uint256 amount
    ) external onlyAdmin {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @notice Pause the contract
     */
    function pause() external onlyAdmin {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyAdmin {
        _unpause();
    }
    
    /**
     * @notice Get verification request details
     * @param requestId ID of the verification request
     * @return request Details of the verification request
     */
    function getVerificationRequest(
        uint256 requestId
    ) external view returns (
        uint256,
        address,
        string memory,
        string memory,
        uint256,
        VerificationStatus,
        address[] memory,
        string memory
    ) {
        VerificationRequest storage request = _verificationRequests[requestId];
        require(request.exists, "Request does not exist");
        
        return (
            request.requestId,
            request.requester,
            request.assetId,
            request.documentHash,
            request.timestamp,
            request.status,
            request.verifiers,
            request.rejectionReason
        );
    }
    
    /**
     * @notice Get verifications for an asset
     * @param assetId ID of the asset
     * @return Array of verification request IDs
     */
    function getAssetVerifications(
        string calldata assetId
    ) external view returns (uint256[] memory) {
        return _assetVerifications[assetId];
    }
    
    /**
     * @notice Update verifier's reputation score
     * @param verifier Address of the verifier
     */
    function updateReputationScore(address verifier) internal {
        VerifierInfo storage info = verifiers[verifier];
        if (info.completedVerifications > 0) {
            // Simple reputation formula (can be customized)
            uint256 successRate = (info.successfulVerifications * 1000) / info.completedVerifications;
            info.reputationScore = (info.reputationScore * 9 + successRate) / 10; // Moving average
        }
    }
    
    // Receive function to accept ETH
    receive() external payable {}
}
