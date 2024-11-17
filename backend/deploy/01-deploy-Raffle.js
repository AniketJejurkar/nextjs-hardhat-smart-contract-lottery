const { network, ethers } = require("hardhat")
const { developmentChains, networkConfiguration } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const FUND_TO_SUBSCRIPTION = ethers.parseEther("50")
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments
    const chainId = network.config.chainId
    let interval,
        gasLane,
        vrfCoordinatorAddress,
        subscriptionId,
        callBackGasLimit,
        entranceFee,
        requestConfirmations
    const networkConfigurationObject = networkConfiguration[chainId]
    callBackGasLimit = networkConfigurationObject.callBackGasLimit
    entranceFee = networkConfigurationObject.entranceFee
    requestConfirmations = networkConfigurationObject.requestConfirmations
    gasLane = networkConfigurationObject.gasLane
    interval = networkConfigurationObject.interval
    if (chainId != 31337) {
        vrfCoordinatorAddress = networkConfigurationObject.vrfCoordinatorAddress
        subscriptionId = networkConfigurationObject.subscriptionId
    } else {
        const mockVRFCoordinator = await ethers.getContract("VRFCoordinatorV2_5Mock")
        vrfCoordinatorAddress = await mockVRFCoordinator.getAddress()
        const transactionResponse = await mockVRFCoordinator.createSubscription()
        const transactionReceipt = await transactionResponse.wait()
        subscriptionId = transactionReceipt.logs[0].args[0]
        await mockVRFCoordinator.fundSubscription(subscriptionId, FUND_TO_SUBSCRIPTION)
    }
    const args = [
        vrfCoordinatorAddress,
        subscriptionId,
        gasLane,
        interval,
        entranceFee,
        callBackGasLimit,
        requestConfirmations,
    ]
    log("deploying Raffle contract...")
    const Rafflecontract = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: false,
        waitConfirmation: network.config.blockConfirmations,
    })
    log(`contract deployed successfully at address ${Rafflecontract.address}`)
    if (developmentChains.includes(network.name)) {
        log(`Adding Raffle consumer to subscriptionId ${subscriptionId}...`)
        const mockVRFCoordinator = await ethers.getContract("VRFCoordinatorV2_5Mock")
        await mockVRFCoordinator.addConsumer(subscriptionId, Rafflecontract.address)
        log("Raffle consumer added successfully")
    }
    if (chainId != 31337) {
        await verify(Rafflecontract.address, args)
    }
}

module.exports.tags = ["all", "raffle"]
