// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

// Error
error FundMe__NotOwner();

/** @title FundMe
 * @author Han
 * @notice A contract that allows people to fund it with ETH and withdraw funds
 * @dev Uses the Chainlink Price Feed contract and a PriceConverter library */
contract FundMe {
    // Using library PriceConverter
    using PriceConverter for uint256;

    // Constant is all caps and underscore by convention
    uint256 public constant MINIMUM_USD = 10 * 1e18;
    address private immutable i_owner;

    address[] public s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;

    AggregatorV3Interface private s_priceFeed;

    constructor(address priceFeedAddress) {
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
        i_owner = msg.sender;
    }

    /**
     * If user send this contract ether directly instead of calling the fund function, either one of it will run
     */
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /** @notice Allows users to fund the contract with ETH
     * @dev Calculates the amount of ETH in USD and stores the sender's address and amount funded
     */
    function fund() public payable {
        // msg.value = 1e18;
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend some ETH"
        );
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    /**
     * @notice Allows the owner to withdraw all funds from the contract
     * @dev Resets the list of funders, sets their amounts to zero, and sends the contract balance to the owner
     */
    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        // Reset the array
        s_funders = new address[](0);

        // Send the money to the person who called this function
        // 1. Transfer
        // payable(msg.sender).transfer(address(this).balance);

        // 2. Send
        // bool sentSuccess = payable(msg.sender).send(address(this).balance);
        // require(sentSuccess, "Failed to send Ether");

        // 3. Call
        (bool sentSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(sentSuccess, "Failed to send Ether");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;

        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);

        (bool sentSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(sentSuccess, "Failed to send Ether");
    }

    /** @dev Throws if the caller is not the owner */
    modifier onlyOwner() {
        // require(msg.sender == i_owner, "You are not the owner");
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    /**
     * Returns the owner of the contract.
     * @return The address of the owner.
     */
    function getOwner() public view returns (address) {
        return i_owner;
    }

    /**
     * Returns the address of a funder at a given index in the array of funders.
     * @param index The index of the funder to retrieve.
     * @return The address of the funder.
     */
    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    /**
     * Returns the amount of Ether that a funder has contributed to the contract.
     * @param funder The address of the funder to retrieve the contribution for.
     * @return The amount of Ether that the funder has contributed.
     */
    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    /**
     * Returns the price feed that is being used by the contract to determine the ETH/USD exchange rate.
     * @return The AggregatorV3Interface object representing the price feed.
     */
    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
