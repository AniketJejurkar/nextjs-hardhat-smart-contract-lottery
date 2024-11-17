import { BaseError } from "viem";
import { Raffle } from "../constants/Raffle";
import { useReadContract } from "wagmi";

const RecentWinner = () => {
  const abi = Raffle.abi;
  const {
    data: winner,
    error,
    isPending,
  } = useReadContract({
    address: `0x${Raffle.address}`,
    abi,
    functionName: "getRecentWinner",
  });
  return (
    <div>
      <div className="infoClass">
        <b>Winner: </b>
        {winner?.toString()}
      </div>
    </div>
  );
};

export default RecentWinner;
