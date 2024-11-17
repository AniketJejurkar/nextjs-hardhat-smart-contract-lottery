import { BaseError } from "viem";
import { Raffle } from "../constants/Raffle";
import { useReadContract } from "wagmi";

const RaffleState = () => {
  const abi = Raffle.abi;
  const {
    data: stateVal,
    error,
    isPending,
  } = useReadContract({
    address: `0x${Raffle.address}`,
    abi,
    functionName: "getRaffleState",
  });
  let state;
  if (!isPending) {
    if (stateVal == 0) state = "OPEN";
    else if (stateVal == 1) state = "CALCULATING";
    else state = "CLOSED";
  }
  return (
    <div>
      <div className="infoClass">
        <b>Raffle State:</b> {state}
      </div>
    </div>
  );
};

export default RaffleState;
