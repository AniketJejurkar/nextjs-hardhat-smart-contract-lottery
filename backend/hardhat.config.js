require("@nomiclabs/hardhat-waffle")
require("hardhat-deploy")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("@nomiclabs/hardhat-etherscan")
require("dotenv").config()

const PRIVATE_KEY = process.env.PRIVATE_KEY
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const ETHERSCAN_API = process.env.ETHERSCAN_API
const COINMARKETCAP_API = process.env.COINMARKETCAP_API

module.exports = {
    solidity: {
        compilers: [{ version: "0.8.8" }, { version: "0.8.19" }],
    },
    defaultNetwork: "hardhat",
    networks: {
        sepolia: {
            chainId: 11155111,
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            blockConfirmations: 6,
        },
        localhost: {
            chainId: 31337,
            url: "http://127.0.0.1:8545/",
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API,
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "INR",
        coinmarketcap: COINMARKETCAP_API,
        L1: "ethereum",
    },
    mocha: {
        timeout: 500000,
    },
}
