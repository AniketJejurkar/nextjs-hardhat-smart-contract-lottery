const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfiguration } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

const MIN_ETH_AMT = ethers.parseEther("0.01")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", () => {
          let mockVRFCoordinator, interval, accounts, raffleContract, raffle
          beforeEach(async () => {
              await deployments.fixture(["vrfmock", "raffle"])
              mockVRFCoordinator = await ethers.getContract("VRFCoordinatorV2_5Mock")
              raffleContract = await ethers.getContract("Raffle")
              interval = await raffleContract.getInterval()
              accounts = await ethers.getSigners()
              raffle = await raffleContract.connect(accounts[1])
          })
          describe("constructor", () => {
              it("should initialize raffle correctly", async () => {
                  const raffleState = await raffleContract.getRaffleState()
                  const _interval = networkConfiguration[network.config.chainId].interval
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(_interval, interval)
              })
          })
          describe("enterRaffle", () => {
              it("should revert if not sufficient eth send", async () => {
                  await expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle__NotSufficientEntryAmount",
                  )
              })
              it("should revert if raffle state is not open", async () => {
                  await raffle.enterRaffle({ value: MIN_ETH_AMT })
                  await network.provider.send("evm_increaseTime", [ethers.toNumber(interval) + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  await raffle.performUpkeep("0x")
                  const raffleState = await raffleContract.getRaffleState()
                  assert.equal(raffleState.toString(), "1")
                  await expect(raffle.enterRaffle({ value: MIN_ETH_AMT })).to.be.revertedWith(
                      "Raffle__NotOpen",
                  )
              })
              it("emits an event when player enters raffle", async () => {
                  const transactionResponse = await raffle.enterRaffle({ value: MIN_ETH_AMT })
                  const transactionReceipt = await transactionResponse.wait()
                  const raffleEnter_Event_EmittedValue = transactionReceipt.logs[0].args[0]
                  assert.equal(raffleEnter_Event_EmittedValue, accounts[1].address)
              })
              it("records player when they enter raffle", async () => {
                  await raffle.enterRaffle({ value: MIN_ETH_AMT })
                  const latestPlayer = await raffle.getPlayer(0)
                  assert.equal(latestPlayer, accounts[1].address)
              })
          })
          describe("checkUpkeep", () => {
              it("should return false if enough balance not present", async () => {
                  await network.provider.send("evm_increaseTime", [ethers.toNumber(interval) + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.checkUpkeep("0x")
                  assert(!upkeepNeeded)
              })
              it("should return true if enough balance present", async () => {
                  await network.provider.send("evm_increaseTime", [ethers.toNumber(interval) + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  await raffle.enterRaffle({ value: MIN_ETH_AMT })
                  const { upkeepNeeded } = await raffle.checkUpkeep("0x")
                  assert(upkeepNeeded)
              })
              it("should return false if enough time has not passed", async () => {
                  await raffle.enterRaffle({ value: MIN_ETH_AMT })
                  const { upkeepNeeded } = await raffle.checkUpkeep("0x")
                  assert(!upkeepNeeded)
              })
              it("should return false if raffle state is not open", async () => {
                  await network.provider.send("evm_increaseTime", [ethers.toNumber(interval) + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  await raffle.enterRaffle({ value: MIN_ETH_AMT })
                  await raffle.performUpkeep("0x")
                  const { upkeepNeeded } = await raffle.checkUpkeep("0x")
                  assert(!upkeepNeeded)
              })
              it("should return true if enough time is passed, raffle state is open, and contract is sufficiently funded", async () => {
                  await network.provider.send("evm_increaseTime", [ethers.toNumber(interval) + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  await raffle.enterRaffle({ value: MIN_ETH_AMT })
                  const { upkeepNeeded } = await raffle.checkUpkeep("0x")
                  assert(upkeepNeeded)
              })
          })
          describe("performUpkeep", () => {
              it("should change the state of the raffle to calculating", async () => {
                  await raffle.performUpkeep("0x")
                  const raffleState = await raffle.getRaffleState()
                  assert.equal(raffleState.toString(), "1")
              })
              it("should emit request Id", async () => {
                  const transactionResponse = await raffle.performUpkeep("0x")
                  const transactionReceipt = await transactionResponse.wait()
                  const requestId = transactionReceipt.logs[1].args[0]
                  assert(ethers.toNumber(requestId) > 0)
              })
          })
          describe("fulfillRandomWords", function () {
              beforeEach(async () => {
                  await raffle.enterRaffle({ value: MIN_ETH_AMT })
                  await network.provider.send("evm_increaseTime", [ethers.toNumber(interval) + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
              })
              it("can only be called after performupkeep", async () => {
                  await expect(
                      mockVRFCoordinator.fulfillRandomWords(0, raffle.target), // reverts if not fulfilled
                  ).to.be.revertedWith("InvalidRequest")
                  await expect(
                      mockVRFCoordinator.fulfillRandomWords(1, raffle.target), // reverts if not fulfilled
                  ).to.be.revertedWith("InvalidRequest")
              })
              it("picks a winner, resets the player array, and sends eth to respective winner", async () => {
                  const startingIndex = 1
                  const additionalEntrants = 3
                  let startingBalance
                  for (let i = startingIndex; i < additionalEntrants + startingIndex; i++) {
                      const raffle = raffleContract.connect(accounts[i])
                      await raffle.enterRaffle({ value: MIN_ETH_AMT })
                  }
                  const startingTimeStamp = await raffleContract.getLastTimeStamp()
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerBalance = await ethers.provider.getBalance(
                                  accounts[0].address,
                              )
                              const endingTimeStamp = await raffle.getLastTimeStamp()
                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[2].address)
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnerBalance.toString(),
                                  startingBalance
                                      .add(
                                          raffleEntranceFee
                                              .mul(additionalEntrances)
                                              .add(raffleEntranceFee),
                                      )
                                      .toString(),
                              )
                              assert(endingTimeStamp > startingTimeStamp)

                              resolve()
                          } catch (e) {
                              reject(e)
                          }
                      })
                      try {
                          console.log("Calling performUpkeep")
                          const transactionResponse = await raffleContract.performUpkeep("0x")
                          const transactionReceipt = await transactionResponse.wait()
                          const reqId = transactionReceipt.logs[1].args[0]
                          await mockVRFCoordinator.fulfillRandomWords(reqId, raffle.target)
                      } catch (e) {
                          reject(e)
                      }
                  })
              })
          })
      })
