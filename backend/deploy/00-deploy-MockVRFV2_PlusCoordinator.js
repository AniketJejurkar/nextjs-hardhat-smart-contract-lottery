const { getNamedAccounts, deployments, network } = require("hardhat")

const BASE_FEE = "100000000000000000"
const GAS_PRICE_LINK = "1000000000"
const WEIPERUNITLINK = "4233194546901895"
module.exports = async ({ getNamedAccounts, deployments }) => {
    const chainId = network.config.chainId
    if (chainId != 31337) return
    const { log, deploy } = deployments
    const { deployer } = await getNamedAccounts()
    log("Local network detected...")
    log("deploying MockVRFV2_PlusCoordinator contract...")
    const args = [BASE_FEE, GAS_PRICE_LINK, WEIPERUNITLINK]
    const mockVRFCoordinatorContract = await deploy("VRFCoordinatorV2_5Mock", {
        from: deployer,
        log: false,
        args: args,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`MockVRFV2_PlusCoordinator deployed at address ${mockVRFCoordinatorContract.address}`)
}

module.exports.tags = ["vrfmock", "all"]
