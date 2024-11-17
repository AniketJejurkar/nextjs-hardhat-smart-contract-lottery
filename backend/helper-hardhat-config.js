const { ethers } = require("hardhat")
const networkConfiguration = {
    11155111: {
        name: "Sepolia",
        vrfCoordinatorAddress: "0x9ddfaca8183c41ad55329bdeed9f6a8d53168b1b",
        subscriptionId:
            "42013903199471122103254172120383712035271799959730276041441459433747841728177",
        gasLane: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        callBackGasLimit: "50000",
        requestConfirmations: "3",
        entranceFee: ethers.parseEther("0.01"),
        interval: "300",
    },
    31337: {
        name: "localnetwork",
        subscriptionId: "420",
        gasLane: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        callBackGasLimit: "50000",
        requestConfirmations: "3",
        entranceFee: ethers.parseEther("0.01"),
        interval: "300",
    },
}

const developmentChains = ["localchain", "hardhat"]

module.exports = {
    developmentChains,
    networkConfiguration,
}
