import React, { Fragment, useEffect, useRef, useState } from "react";
import { Button, Form, Modal, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import abi from "../utils/VotingApp.json";
import { ethers } from "ethers";

const contractAddress = "0xE114454b09dA10955A7f4769174197c1f4f6Ded2";
const contractABI = abi.abi;

const Vote = () => {
  const [show, setShow] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const handleClose = () => setShow(false);
  const nameRef = useRef();
  const selectRef = useRef();

  const addCandidate = async (name) => {
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
        await wavePortalContract.addCandidate(name);
        setShow(false);
        setLoading(false);
      } else {
        console.log("Ethereum object doesn't exist!");
        setShow(false);
        setLoading(false);
      }
    } catch (error) {
      setShow(false);
      setLoading(false);
      console.log(error);
      toast.error(error?.error?.message || "Could not add new candidate");
    }
  };

  const castVote = async (id) => {
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
        await wavePortalContract.vote(id);
        setLoading(false);
      } else {
        setLoading(false);
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
      toast.error(error?.error?.message || "Could not add new candidate");
    }
  };

  const getAllResults = async () => {
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
        const candidatesArray = await wavePortalContract.getAllCandidates();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];

        candidatesArray.forEach((wave) => {
          wavesCleaned.push({
            id: wave.id.toNumber(),
            name: wave.name,
            votes: wave.votes.toNumber(),
          });
        });

        setResults(wavesCleaned);

        /*
         * Store our data in React State
         */
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
        getAllResults();
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

      getAllResults();
    } catch (error) {
      toast.error(error?.error?.message || "Could not connect");
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (name, id) => {
      console.log("NewCandidate", name, id);
      toast.success("New candidate added");
      setResults((prevState) => [
        ...prevState,
        {
          name,
          id: id.toNumber(),
          votes: 0,
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
      wavePortalContract.on("NewCandidate", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewCandidate", onNewWave);
      }
    };
  }, []);

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (name, id, votes) => {
      console.log("NewVote", name, id, votes);
      toast.info("New vote");
      getAllResults();
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewVote", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewVote", onNewWave);
      }
    };
  }, [results]);

  useEffect(() => {
    if (show) {
      nameRef.current.focus();
    }
  }, [show]);

  return (
    <Fragment>
      <div className="mainContainer">
        <div className="dataContainer px-3 w-100">
          {currentAccount && (
            <div className="d-flex justify-content-end w-100">
              <Button
                onClick={() => {
                  setShow(true);
                }}
                variant="primary"
              >
                Add Candidate
              </Button>
            </div>
          )}

          {!currentAccount && (
            <div>
              <div className="d-flex justify-content-end w-100">
                <Button onClick={connectWallet} variant="danger">
                  Connect wallet
                </Button>
              </div>
              <p className="text-muted mt-2">
                Account must be connected before you are allowed to vote or see
                results
              </p>
            </div>
          )}

          <div className="my-3">
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Candidate</th>
                  <th>Votes</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.name}</td>
                    <td>{item.votes}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {currentAccount && (
            <div className="my-3">
              <div>
                <Form.Select
                  ref={selectRef}
                  aria-label="Default select example"
                >
                  {results.map((item, index) => (
                    <option key={index} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="my-2">
                <Button
                  disabled={loading}
                  onClick={() => {
                    if (!selectRef.current.value) {
                      alert("Please select a candidate");
                      return;
                    }
                    setLoading(true);
                    castVote(+selectRef.current.value);
                  }}
                  variant="success"
                >
                  Vote
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add Candidate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Label htmlFor="inputPassword5">Candidate Name</Form.Label>
          <Form.Control autoFocus ref={nameRef} id="inputPassword5" />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button
            disabled={loading}
            onClick={() => {
              if (!nameRef.current.value) {
                alert("Please input the candidate name");
                return;
              }
              setLoading(true);
              addCandidate(nameRef.current.value);
            }}
            variant="primary"
          >
            Add Candidate
          </Button>
        </Modal.Footer>
      </Modal>
    </Fragment>
  );
};

export default Vote;
