import React from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Raffle } from "../constants/Raffle";
import { ethers } from "ethers";
import { BaseError } from "viem";

const EnterRaffle = () => {
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const enterRaffle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const abi = Raffle.abi;
    await writeContract({
      address: `0x${Raffle.address}`,
      abi,
      functionName: "enterRaffle",
      value: ethers.parseEther("0.01"),
    });
  };
  return (
    <div>
      <button className="RaffleBtn" onClick={enterRaffle} disabled={isPending}>
        Enter Raffle
      </button>
    </div>
  );
};

export default EnterRaffle;
