// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ChainlinkPriceOracle.sol";
import "./AssetVerificationOracle.sol";

/**
 * @title OracleAggregator
 * @dev Aggregates data from multiple oracle sources with weighted averages
 */
contract OracleAggregator is Ownable {
    // Oracle source types
    enum OracleType { Chainlink, Custom, External }
    
    // Oracle source information
    struct OracleSource {
        address oracleAddress;
        OracleType oracleType;
        uint256 weight; // Weight for weighted average (0-100)
        bool isActive;
        string description;
    }
    
    // Asset information
    struct AssetInfo {
        address[] oracleSources; // Active oracles for this asset
        uint256 lastUpdated;
        int256 lastPrice;
        uint256 lastVerificationId;
    }
    
    // State variables
    mapping(address => OracleSource) public oracles;
    mapping(string => AssetInfo) public assets;
    mapping(string => address[]) private _assetOracles;
    
    // Events
    event OracleAdded(address indexed oracle, OracleType oracleType, uint256 weight, string description);
    event OracleUpdated(address indexed oracle, uint256 weight, bool isActive, string description);
    event OracleRemoved(address indexed oracle);
    event AssetAdded(string indexed assetId, address[] oracles);
    event PriceUpdated(string indexed assetId, int256 price, uint256 timestamp);
    event VerificationUpdated(string indexed assetId, uint256 verificationId, uint256 timestamp);
    
    // Constants
    uint256 public constant MAX_ORACLES = 10;
    uint256 public constant MAX_WEIGHT = 100;
    
    // External oracle interfaces
    ChainlinkPriceOracle public chainlinkOracle;
    AssetVerificationOracle public verificationOracle;
    
    constructor(address _chainlinkOracle, address _verificationOracle) {
        require(_chainlinkOracle != address(0), "Invalid Chainlink oracle address");
        require(_verificationOracle != address(0), "Invalid verification oracle address");
        
        chainlinkOracle = ChainlinkPriceOracle(_chainlinkOracle);
        verificationOracle = AssetVerificationOracle(_verificationOracle);
    }
    
    /**
     * @notice Add a new oracle source
     * @param oracle Address of the oracle contract
     * @param oracleType Type of the oracle
     * @param weight Weight for this oracle's data (0-100)
     * @param description Description of the oracle
     */
    function addOracle(
        address oracle,
        OracleType oracleType,
        uint256 weight,
        string calldata description
    ) external onlyOwner {
        require(oracle != address(0), "Invalid oracle address");
        require(!oracles[oracle].isActive, "Oracle already exists");
        require(weight > 0 && weight <= MAX_WEIGHT, "Invalid weight");
        
        oracles[oracle] = OracleSource({
            oracleAddress: oracle,
            oracleType: oracleType,
            weight: weight,
            isActive: true,
            description: description
        });
        
        emit OracleAdded(oracle, oracleType, weight, description);
    }
    
    /**
     * @notice Update an existing oracle
     * @param oracle Address of the oracle to update
     * @param weight New weight (0-100)
     * @param isActive Whether the oracle is active
     * @param description New description
     */
    function updateOracle(
        address oracle,
        uint256 weight,
        bool isActive,
        string calldata description
    ) external onlyOwner {
        require(oracles[oracle].oracleAddress != address(0), "Oracle does not exist");
        require(weight > 0 && weight <= MAX_WEIGHT, "Invalid weight");
        
        oracles[oracle].weight = weight;
        oracles[oracle].isActive = isActive;
        oracles[oracle].description = description;
        
        emit OracleUpdated(oracle, weight, isActive, description);
    }
    
    /**
     * @notice Remove an oracle
     * @param oracle Address of the oracle to remove
     */
    function removeOracle(address oracle) external onlyOwner {
        require(oracles[oracle].oracleAddress != address(0), "Oracle does not exist");
        
        delete oracles[oracle];
        emit OracleRemoved(oracle);
    }
    
    /**
     * @notice Add an asset to track with specific oracles
     * @param assetId Unique identifier for the asset
     * @param oracleAddresses Array of oracle addresses to use for this asset
     */
    function addAsset(
        string calldata assetId,
        address[] calldata oracleAddresses
    ) external onlyOwner {
        require(bytes(assetId).length > 0, "Invalid asset ID");
        require(oracleAddresses.length > 0, "At least one oracle required");
        require(oracleAddresses.length <= MAX_ORACLES, "Too many oracles");
        
        // Verify all oracles exist and are active
        for (uint256 i = 0; i < oracleAddresses.length; i++) {
            require(
                oracles[oracleAddresses[i]].isActive,
                "One or more oracles are not active"
            );
        }
        
        // Initialize asset info
        assets[assetId] = AssetInfo({
            oracleSources: oracleAddresses,
            lastUpdated: 0,
            lastPrice: 0,
            lastVerificationId: 0
        });
        
        _assetOracles[assetId] = oracleAddresses;
        
        emit AssetAdded(assetId, oracleAddresses);
    }
    
    /**
     * @notice Get the latest price for an asset
     * @param assetId ID of the asset
     * @return price The aggregated price
     * @return timestamp When the price was last updated
     */
    function getLatestPrice(
        string calldata assetId
    ) external view returns (int256 price, uint256 timestamp) {
        AssetInfo storage asset = assets[assetId];
        require(asset.oracleSources.length > 0, "Asset not found");
        
        // If we have a recent price, return it
        if (block.timestamp - asset.lastUpdated <= 1 hours) {
            return (asset.lastPrice, asset.lastUpdated);
        }
        
        // Otherwise, calculate the weighted average from oracles
        int256 totalWeightedPrice = 0;
        uint256 totalWeight = 0;
        uint256 latestTimestamp = 0;
        
        for (uint256 i = 0; i < asset.oracleSources.length; i++) {
            OracleSource storage source = oracles[asset.oracleSources[i]];
            if (!source.isActive) continue;
            
            if (source.oracleType == OracleType.Chainlink) {
                // Get price from Chainlink oracle
                (int256 price, uint256 timestamp) = ChainlinkPriceOracle(source.oracleAddress)
                    .getLatestPrice(assetId);
                
                if (timestamp > latestTimestamp) {
                    latestTimestamp = timestamp;
                }
                
                // Add to weighted average
                totalWeightedPrice += price * int256(source.weight);
                totalWeight += source.weight;
            }
            // Add support for other oracle types here
        }
        
        require(totalWeight > 0, "No active oracles");
        
        return (totalWeightedPrice / int256(totalWeight), latestTimestamp);
    }
    
    /**
     * @notice Update the price for an asset from all oracles
     * @param assetId ID of the asset to update
     */
    function updateAssetPrice(string calldata assetId) external {
        AssetInfo storage asset = assets[assetId];
        require(asset.oracleSources.length > 0, "Asset not found");
        
        int256 totalWeightedPrice = 0;
        uint256 totalWeight = 0;
        uint256 latestTimestamp = 0;
        
        // Update prices from all oracles
        for (uint256 i = 0; i < asset.oracleSources.length; i++) {
            OracleSource storage source = oracles[asset.oracleSources[i]];
            if (!source.isActive) continue;
            
            if (source.oracleType == OracleType.Chainlink) {
                // Update price in Chainlink oracle
                ChainlinkPriceOracle(source.oracleAddress).updatePrice(assetId);
                
                // Get the updated price
                (int256 price, uint256 timestamp) = ChainlinkPriceOracle(source.oracleAddress)
                    .getLatestPrice(assetId);
                
                if (timestamp > latestTimestamp) {
                    latestTimestamp = timestamp;
                }
                
                // Add to weighted average
                totalWeightedPrice += price * int256(source.weight);
                totalWeight += source.weight;
            }
            // Add support for other oracle types here
        }
        
        require(totalWeight > 0, "No active oracles");
        
        // Update asset info
        asset.lastPrice = totalWeightedPrice / int256(totalWeight);
        asset.lastUpdated = latestTimestamp;
        
        emit PriceUpdated(assetId, asset.lastPrice, latestTimestamp);
    }
    
    /**
     * @notice Get the latest verification status for an asset
     * @param assetId ID of the asset
     * @return verificationId The latest verification ID
     * @return status The verification status (0 = Pending, 1 = Approved, 2 = Rejected, 3 = Disputed)
     */
    function getVerificationStatus(
        string calldata assetId
    ) external view returns (uint256 verificationId, uint8 status) {
        AssetInfo storage asset = assets[assetId];
        require(asset.oracleSources.length > 0, "Asset not found");
        
        // Get the latest verification from the verification oracle
        uint256[] memory verifications = verificationOracle.getAssetVerifications(assetId);
        if (verifications.length == 0) {
            return (0, 0); // No verifications yet
        }
        
        uint256 latestVerificationId = verifications[verifications.length - 1];
        (
            , , , , ,
            AssetVerificationOracle.VerificationStatus statusCode,
            ,
        ) = verificationOracle.getVerificationRequest(latestVerificationId);
        
        return (latestVerificationId, uint8(statusCode));
    }
    
    /**
     * @notice Get oracles for an asset
     * @param assetId ID of the asset
     * @return Array of oracle addresses
     */
    function getAssetOracles(
        string calldata assetId
    ) external view returns (address[] memory) {
        return _assetOracles[assetId];
    }
    
    /**
     * @notice Emergency function to withdraw any ETH sent to the contract
     * @param to Address to send the ETH to
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address payable to,
        uint256 amount
    ) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    // Receive function to accept ETH
    receive() external payable {}
}
