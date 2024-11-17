// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

//imports
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "hardhat/console.sol";
//errors
error Raffle__NotSufficientEntryAmount();
error Raffle__TransferFailed();
error Raffle__NotOpen();

/**
 * @author Aniket Jejurkar
 * @notice This is a raffle contract
 * @dev This contract uses latest version of VRF Coordinator and Chainlink keepers */

contract Raffle is AutomationCompatibleInterface, VRFConsumerBaseV2Plus {
    //Type Declaration
    enum RaffleState {
        OPEN,
        CALCULATING,
        CLOSED
    }
    //State Variables
    address payable[] private s_players;
    uint256 private immutable i_entranceFee;
    uint256 private s_lastTimeStamp;
    uint256 private s_interval;
    uint256 private s_subId;
    RaffleState private s_raffleState = RaffleState.OPEN;
    address private immutable i_vrfCoordinatorAddress;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private immutable i_requestConfirmations;
    uint32 private constant NUM_WORDS = 1;
    address payable private s_recentWinner;

    //Events
    event WinnerPicked(address indexed player);
    event RaffleEnter(address indexed player);
    event RequestRaffleWinner(uint256 indexed requestId);

    //Functions
    /*constructor*/
    constructor(
        address _vrfCoordinatorV2PlusAddress,
        uint256 _subId,
        bytes32 _gasLane, // keyHash
        uint256 _interval,
        uint256 _entranceFee,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations
    ) VRFConsumerBaseV2Plus(_vrfCoordinatorV2PlusAddress) {
        s_lastTimeStamp = block.timestamp;
        s_interval = _interval;
        s_subId = _subId;
        i_vrfCoordinatorAddress = _vrfCoordinatorV2PlusAddress;
        i_entranceFee = _entranceFee;
        i_callbackGasLimit = _callbackGasLimit;
        i_gasLane = _gasLane;
        i_requestConfirmations = _requestConfirmations;
    }

    /*external*/
    function enterRaffle() external payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__NotSufficientEntryAmount();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle__NotOpen();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    function checkUpkeep(
        bytes calldata /*checkData*/
    ) external view returns (bool upkeepNeeded, bytes memory /*performData*/) {
        bool isTimePassed = (block.timestamp - s_lastTimeStamp) > s_interval;
        bool hasPlayers = s_players.length > 0;
        bool isRaffleOpen = s_raffleState == RaffleState.OPEN;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = isTimePassed && hasPlayers && isRaffleOpen && hasBalance;
    }

    function performUpkeep(bytes calldata /*performData*/) external {
        s_raffleState = RaffleState.CALCULATING;
        //request random number
        uint256 reqId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: i_gasLane,
                subId: s_subId,
                requestConfirmations: i_requestConfirmations,
                callbackGasLimit: i_callbackGasLimit,
                numWords: NUM_WORDS,
                // Set nativePayment to true to pay for VRF requests with Sepolia ETH instead of LINK
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );

        emit RequestRaffleWinner(reqId);
    }

    /*external view*/

    function getPlayer(uint256 index) external view returns (address) {
        return s_players[index];
    }

    function getRaffleState() external view returns (RaffleState) {
        return s_raffleState;
    }

    function getSubscriptionId() external view returns (uint256) {
        return s_subId;
    }

    function getRecentWinner() external view returns (address) {
        return s_recentWinner;
    }

    function getLastTimeStamp() external view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getInterval() external view returns (uint256) {
        return s_interval;
    }

    function getEntranceFee() external view returns (uint256) {
        return i_entranceFee;
    }

    function getRequestConfirmations() external view returns (uint16) {
        return i_requestConfirmations;
    }

    function getCallBackGasLimit() external view returns (uint32) {
        return i_callbackGasLimit;
    }

    function getNumberOfPlayers() external view returns (uint256){
        return s_players.length;
    }
    /* external pure */
    function getNumberOfWords() external pure returns (uint32) {
        return NUM_WORDS;
    }

    function getKeyHash() external view returns (bytes32) {
        return i_gasLane;
    }

    
    /*internal*/
    function fulfillRandomWords(
        uint256 /*requestId*/,
        uint256[] calldata randomWords
    ) internal override {
        uint256 winnerIndex = randomWords[0] % (s_players.length);
        s_recentWinner = s_players[winnerIndex];
        s_lastTimeStamp = block.timestamp;
        s_players = new address payable[](0);
        s_raffleState = RaffleState.CLOSED;
        (bool success, ) = s_recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle__TransferFailed();
        }
        console.log("Event inside contract fired");
        emit WinnerPicked(s_recentWinner);
    }
}
