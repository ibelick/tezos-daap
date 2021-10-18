import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useEffect, useState } from "react";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { ContractAbstraction, TezosToolkit, Wallet } from "@taquito/taquito";
import { NetworkType } from "@airgap/beacon-sdk";
import BigNumber from "bignumber.js";

const RPC_URL = "https://florencenet.api.tez.ie";
const CONTRACT_ADDRESS = "KT19s3jHpUUPH3KfMcN1ShX7hzyCTkdnm2Cu";
const Tezos = new TezosToolkit(RPC_URL);

type Comments = {
  address: string;
  date: string;
  text: string;
};

const Home: NextPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [contract, setContract] =
    useState<ContractAbstraction<Wallet> | null>(null);
  const [comments, setComments] = useState<Comments[] | null>(null);
  const [wallet, setWallet] = useState<BeaconWallet | null>(null);
  const [userBalance, setUserBalance] = useState<BigNumber | null>(null);

  useEffect(() => {
    const loadWallet = async () => {
      const options = { name: "TezosDApp" };
      const wallet = new BeaconWallet(options);
      Tezos.setWalletProvider(wallet);
      setWallet(wallet);
      const activeAccount = await wallet.client.getActiveAccount();

      if (activeAccount) {
        const userAddress = await wallet.getPKH();
        await setup(userAddress);
      }
    };

    loadWallet();
  }, []);

  const fetchComments = async (contract: ContractAbstraction<Wallet>) => {
    try {
      const comments: Comments[] = await contract.storage();
      setComments(comments);
    } catch (error) {
      console.log(error);
    }
  };

  const setup = async (userAddress: string): Promise<void> => {
    setIsLoading(true);
    setUserAddress(userAddress);
    const balance = await Tezos.tz.getBalance(userAddress);
    setUserBalance(balance);
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    setContract(contract);
    fetchComments(contract);
    setIsLoading(false);
  };

  const updateMessage = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const connectWallet = async () => {
    if (!wallet) {
      return;
    }

    setIsLoading(true);
    try {
      await wallet.requestPermissions({
        network: {
          type: NetworkType.FLORENCENET,
          rpcUrl: RPC_URL,
        },
      });
      const userAddress = await wallet.getPKH();
      await setup(userAddress);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendData = async () => {
    if (!wallet || !contract) {
      return;
    }

    setIsLoading(true);
    try {
      const operation = await contract.methods.default(message).send();
      const opResult = await operation.confirmation();

      if (opResult.completed) {
        fetchComments(contract);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.app}>
        <div className={styles.mainContainer}>
          <div className={styles.header}>Tezos dapp 🌐</div>
          {userBalance ? (
            <div className={styles.userBalance}>
              Your balance:{" "}
              {Tezos.format("mutez", "tz", userBalance).toString()} tez
            </div>
          ) : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendData();
            }}
            className={styles.form}
          >
            <label htmlFor="message" className={styles.labelMessage}>
              Tell something (be kind ✨):
            </label>
            <textarea
              id="message"
              name="message"
              required
              className={styles.inputMessage}
              placeholder="WTF is web3?"
              value={message}
              onChange={updateMessage}
            />
            {userAddress ? (
              <button type="submit" className={styles.btnGrad}>
                send message
              </button>
            ) : (
              <button
                type="button"
                className={styles.btnGrad}
                onClick={connectWallet}
              >
                Connect Wallet
              </button>
            )}
          </form>
          {isLoading ? "Loading..." : null}
          <div>
            {comments?.map((comment) => {
              return (
                <div key={comment.date} className={styles.cardMessage}>
                  <div className={styles.address}>
                    Address: {comment.address}
                  </div>
                  <div className={styles.time}>
                    Time: {comment.date.toString()}
                  </div>
                  <div className={styles.message}>Message: {comment.text}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;