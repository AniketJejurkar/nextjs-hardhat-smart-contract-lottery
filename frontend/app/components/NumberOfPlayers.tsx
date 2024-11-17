import { BaseError } from "viem";
import { Raffle } from "../constants/Raffle";
import { useReadContract } from "wagmi";

const NumberOfPlayers = () => {
  const abi = Raffle.abi;
  const {
    data: count,
    error,
    isPending,
  } = useReadContract({
    address: `0x${Raffle.address}`,
    abi,
    functionName: "getSubscriptionId",
  });
  return (
    <div>
      <div className="infoClass">
        <b>Players:</b> {10}
      </div>
    </div>
  );
};

export default NumberOfPlayers;
