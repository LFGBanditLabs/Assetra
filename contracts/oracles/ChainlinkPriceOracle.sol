// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ChainlinkPriceOracle
 * @dev Oracle contract that provides price feeds from Chainlink
 */
contract ChainlinkPriceOracle is Ownable, Pausable {
    // Asset => Chainlink feed address
    mapping(string => address) public priceFeeds;
    
    // Asset => Price data
    struct PriceData {
        int256 price;
        uint256 timestamp;
        uint80 roundId;
    }
    
    mapping(string => PriceData) public latestPriceData;
    
    // Events
    event PriceFeedUpdated(string indexed asset, address feed);
    event PriceUpdated(string indexed asset, int256 price, uint256 timestamp);
    event EmergencyWithdraw(address indexed to, uint256 amount);
    
    /**
     * @notice Update or add a new price feed for an asset
     * @param asset Symbol of the asset (e.g., "ETH-USD")
     * @param feed Address of the Chainlink price feed
     */
    function setPriceFeed(string calldata asset, address feed) external onlyOwner {
        require(feed != address(0), "Invalid feed address");
        priceFeeds[asset] = feed;
        emit PriceFeedUpdated(asset, feed);
    }
    
    /**
     * @notice Get the latest price for an asset
     * @param asset Symbol of the asset
     * @return price The current price
     * @return timestamp When the price was last updated
     */
    function getLatestPrice(string calldata asset) 
        external 
        view 
        returns (int256 price, uint256 timestamp) 
    {
        PriceData memory data = latestPriceData[asset];
        return (data.price, data.timestamp);
    }
    
    /**
     * @notice Update price for an asset from Chainlink
     * @param asset Symbol of the asset to update
     */
    function updatePrice(string calldata asset) external whenNotPaused {
        address feedAddress = priceFeeds[asset];
        require(feedAddress != address(0), "Price feed not set");
        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(feedAddress);
        (
            uint80 roundId,
            int256 price,
            /* uint256 startedAt */,
            uint256 timestamp,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();
        
        // Check for stale data (older than 1 hour)
        require(
            block.timestamp - timestamp <= 1 hours,
            "Stale price data"
        );
        
        latestPriceData[asset] = PriceData(price, timestamp, roundId);
        emit PriceUpdated(asset, price, timestamp);
    }
    
    /**
     * @notice Batch update multiple assets
     * @param assets Array of asset symbols to update
     */
    function batchUpdatePrices(string[] calldata assets) external whenNotPaused {
        for (uint256 i = 0; i < assets.length; i++) {
            this.updatePrice(assets[i]);
        }
    }
    
    /**
     * @notice Pause the contract in case of emergency
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdraw function for any ETH sent to the contract
     */
    function emergencyWithdraw(address payable to) external onlyOwner {
        require(to != address(0), "Invalid address");
        uint256 balance = address(this).balance;
        (bool success, ) = to.call{value: balance}("");
        require(success, "Transfer failed");
        emit EmergencyWithdraw(to, balance);
    }
    
    // Receive function to accept ETH
    receive() external payable {}
}
