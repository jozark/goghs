import { useState, useEffect } from "react";
import styles from "./App.module.css";
import Button from "./components/Button/button";
import Image from "./components/Image/image";
import LoadingSpinner from "./components/LoadingSpinner/loadingSpinner";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
} from "@metaplex-foundation/js";
import {
  Keypair,
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, web3, Idl } from "@project-serum/anchor";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  useWallet,
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from "@solana/wallet-adapter-base";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
require("@solana/wallet-adapter-react-ui/styles.css");

const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);
const wallets = [new PhantomWalletAdapter()];
const { SystemProgram } = web3;

function App() {
  const wallet = useWallet();
  const [imageurl, setImageurl] = useState(
    "https://media.discordapp.net/attachments/913148795632631838/1071435446627864607/DT1502_cropped2.png"
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ((wallet as any).connected) {
      console.log("here");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  const handleGibNfts = async () => {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    const keypair = Keypair.generate();

    const metaplex = new Metaplex(connection);
    metaplex.use(keypairIdentity(keypair));

    const owner = new PublicKey("DRwtApBCN8Ei8eS4LNgZXFmmrwY7B7abFMjpGT7Nuoux");
    // const allNFTs = await metaplex.nfts().findAllByOwner(owner as any);
    const list = await connection.getTokenLargestAccounts(owner);
    console.log(list, "list");

    // console.log(allNFTs);
    console.log(metaplex, "wallet");
  };

  const handleButtonClick = async () => {
    setIsLoading(true);
    const response = await fetch("http://localhost:3001/api/getImage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageurl,
      }),
    });

    const data = await response.json();
    console.log(data);
    setImageurl(data.image_url);
    setIsLoading(false);
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <a className={styles.logo} href="http://localhost:3000/">
          Goghs
        </a>
        <WalletMultiButton />
      </header>

      <div className={styles.container}>
        {isLoading ? <LoadingSpinner /> : <Image source={imageurl} alt="" />}
        <Button type="rectangle" onButtonClick={handleButtonClick}>
          Reimagine
        </Button>
        <Button type="rectangle" onButtonClick={handleGibNfts}>
          gib nfts
        </Button>
      </div>
    </div>
  );
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);

export default AppWithProvider;
