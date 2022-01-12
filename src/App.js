import React, { Fragment, useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";
import { ToastContainer, toast } from "react-toastify";
import { Button, Card, Form } from "react-bootstrap";
import { useRef } from "react";
import { formatDate } from "./utils/utils";

const contractAddress = "0xb63D6C063bdA5F46D77a6C4154e0cb8351e3D050";
const contractABI = abi.abi;

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [allWaves, setAllWaves] = useState([]);
  const inputRef = useRef();

  const getAllWaves = async () => {
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

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          });
        });

        /*
         * Store our data in React State
         */

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
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
        getAllWaves();
        // getAllWaves();

        // await countWaves();
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
      toast.success("Wallet Connected");
      setCurrentAccount(accounts[0]);
      getAllWaves();
      // await countWaves();
    } catch (error) {
      toast.error(error?.error?.message || "Could not connect");
      console.log(error);
    }
  };

  const wave = async (message) => {
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

        await wavePortalContract.wave(message, { gasLimit: 300000 });
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        // toast.success("Message sent");
        // getAllWaves();
      } else {
        alert("Get MetaMask!");
        console.log("Ethereum object doesn't exist!");
      }
      setLoading(false);
    } catch (error) {
      toast.error(error?.error?.message || "Something went wrong");
      setLoading(false);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();

    //eslint-disable-next-line
  }, []);

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      toast.success("Message sent");
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  return (
    <Fragment>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <div className="mainContainer">
        <div className="dataContainer px-3">
          {currentAccount && (
            <div className="totalWaves">
              Waves: <strong>{allWaves.length}</strong>
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
            I am Oyediran Seun and this is my first web3 app? Connect your
            Ethereum wallet and wave at me!
          </div>

          {!currentAccount && (
            <button className="waveButton connect" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}

          {currentAccount ? (
            <div className="my-2">
              <Form
                onSubmit={(e) => {
                  e.preventDefault();

                  wave(inputRef.current.value);
                  inputRef.current.value = "";
                  // wave(e.target.)
                }}
              >
                <Form.Group className="mb-3" controlId="formBasicEmail">
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    ref={inputRef}
                    name="message"
                    type="text"
                    placeholder="Drop a message for me"
                  />
                </Form.Group>
                <div className="d-grid">
                  <Button disabled={loading} variant="primary" type="submit">
                    {loading ? "loading..." : "Wave at me"}
                  </Button>
                </div>
              </Form>
            </div>
          ) : (
            <div className="d-grid my-2">
              <Button
                disabled={loading}
                onClick={connectWallet}
                variant="danger"
              >
                Conect Wallet
              </Button>
            </div>
          )}

          <div className="mt-3">
            <h3 className="text-center">All Messages</h3>
            {allWaves.map((item, index) => (
              <Card className="my-3" key={index}>
                <Card.Header>{`${new Date(
                  item?.timestamp
                ).toLocaleTimeString()} ${formatDate(
                  new Date(item?.timestamp)
                )}`}</Card.Header>
                <Card.Body>
                  <blockquote className="mb-1">
                    <p>{item?.message}</p>
                    <footer className="blockquote-footer">
                      <cite title="Source Title">{item?.address}</cite>
                    </footer>
                  </blockquote>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Fragment>
  );
}
