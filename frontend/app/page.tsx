"use client";
import Image from "next/image";
import styles from "./page.module.css";
import ConnectButton from "./components/ConnectButton";
import EnterRaffle from "./components/EnterRaffle";
import { useState } from "react";
import RecentWinner from "./components/RecentWinner";
import { Header } from "./components/Header";
import NumberOfPlayers from "./components/NumberOfPlayers";
import RaffleState from "./components/RaffleState";

export default function Home() {
  return (
    <>
      <Header />
      <div className="flexContainer">
        <ConnectButton />
        <EnterRaffle />
      </div>
      <RaffleState />
      <NumberOfPlayers />
      <RecentWinner />
    </>
  );
}
