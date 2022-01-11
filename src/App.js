import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

const contractAddress = "0x9016C5305A1518Fc28FB4a1F559a372896263f4e";
const contractABI = abi.abi;

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [waves, setWaves] = useState(0);
  const [loading, setLoading] = useState(false);

  const countWaves = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const wavePortalContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    let count = await wavePortalContract.getTotalWaves();
    setWaves(count);
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      }

      /*
       * Check if we're authorized to access the user's wallet
       */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);

        await countWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      await countWaves();
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    setLoading(true);
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        await wavePortalContract.wave();
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        alert("Get MetaMask!");
        console.log("Ethereum object doesn't exist!");
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    //eslint-disable-next-line
  }, []);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        {currentAccount && (
          <div className="totalWaves">
            Waves: <strong>{`${waves}`}</strong>
          </div>
        )}
        <div className="header">
          {" "}
          <span role="img" aria-label="Wave emoji">
            👋
          </span>{" "}
          Hey there!
        </div>

        <div className="bio">
          I am Oyediran Seun and I am learning web3 dev? Connect your Ethereum
          wallet and wave at me!
        </div>

        {currentAccount && (
          <button disabled={loading} className="waveButton" onClick={wave}>
            {loading ? "Loading..." : "Wave at Me"}
          </button>
        )}

        {!currentAccount && (
          <button className="waveButton connect" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
}
