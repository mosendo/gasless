pragma solidity 0.5.11;

contract MockUniswapExchange {
    function tokenToEthTransferInput(uint256, uint256, uint256, address) external pure returns (uint256) { return 0; }
}