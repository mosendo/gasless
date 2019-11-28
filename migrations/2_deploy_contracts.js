const config = require("../config")
const Gasless = artifacts.require("Gasless");
const Dai = artifacts.require("Dai");
const MockUniswapExchange = artifacts.require("MockUniswapExchange");

module.exports = async function(deployer, network, accounts) {

    const isDev = network === "test" || network === "develop"? true: false;

    if(isDev){
        await deployer.deploy(Dai, "DAI", "Dai Stablecoin", "1", 1)
        await deployer.deploy(MockUniswapExchange);
        await (await Dai.deployed()).mint(accounts[0], "1000000000000000000000") // 1k Dai
    }

    const MCDcontract = !isDev? config[network].Dai: Dai.address
    const UniswapExchangeContract = !isDev? config[network].UniswapDaiExchange: MockUniswapExchange.address
    const relayer = !isDev? config[network].relayer: accounts[0]

    try {
        const chainId = network === "live"? 1: network === "kovan"? 42: 5777;
        await deployer.deploy(Gasless, relayer, MCDcontract, UniswapExchangeContract, chainId);
        await Gasless.deployed()
    } catch(e) {
        console.log(e)
    }
};
