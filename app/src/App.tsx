import { useState, useEffect } from "react";
import styles from "./App.module.css";
import Button from "./components/Button/button";
import Image from "./components/Image/image";
import LoadingSpinner from "./components/LoadingSpinner/loadingSpinner";
import {
  Metaplex,
  keypairIdentity,
  divideAmount,
  Nft,
  Sft,
  BundlrStorageDriver,
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
import { getImageUrl, getVariation } from "./services/images.services";
import secret from "./devnet.json";
import ImageGrid from "./components/ImageGrid/imageGrid";
require("@solana/wallet-adapter-react-ui/styles.css");

const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);
const wallets = [new PhantomWalletAdapter()];
const WALLET = Keypair.fromSecretKey(new Uint8Array(secret));
console.log(WALLET, "did tarek troll me?");
// const { SystemProgram } = web3;
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const metaplex = new Metaplex(connection);
metaplex.use(keypairIdentity(WALLET));
metaplex.use(
  bundlrStorage({
    address: "https://devnet.bundlr.network",
    providerUrl: "https://api.devnet.solana.com",
    timeout: 60000,
  })
);

const CONFIG = {
  imgType: "image/png",
  imgName: "QuickPix New MetaName",
  description: "New description!",
  attributes: [
    { trait_type: "Speed", value: "Quicker" },
    { trait_type: "Type", value: "Pixelated" },
    { trait_type: "Background", value: "QuickNode Blue 2" },
  ],
};
function App() {
  const wallet = useWallet();
  const [imageurl, setImageurl] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [walletpub, setwalletpub] = useState<String>();
  const [selectedNFT, setSelectedNFT] = useState<{ nft: Nft; url: string }>();
  const [collectionNFTs, setCollectionNFTs] = useState<Nft[]>([]);

  useEffect(() => {
    if ((wallet as any).connected) {
      setwalletpub(wallet.publicKey?.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  useEffect(() => {
    const startFindNft = async () => {
      if (walletpub) {
        await findNft();
      }
    };
    startFindNft();
  }, [walletpub]);

  const findNft = async () => {
    const owner = new PublicKey(walletpub as String);
    const COLLECTIONADDRESS = "3giiZPDeHYLwLzXbRrJpixF6k61zALoSvR5gRjFq4UP9";

    const allNFTs = await metaplex.nfts().findAllByOwner({ owner });
    const collectionNFTs: any = allNFTs.filter(
      (nft) => nft.collection?.address.toString() === COLLECTIONADDRESS
    );
    setCollectionNFTs(collectionNFTs);
    //handle what to do if found
    if (collectionNFTs.length > 0) {
      const url = await getImageUrl(collectionNFTs[0]);
      setSelectedNFT({ nft: collectionNFTs[0], url });
    }
  };

  const handleButtonClick = async () => {
    setIsLoading(true);
    if (selectedNFT?.url) {
      const newImageUrl = await getVariation(selectedNFT.url);
      setSelectedNFT({ nft: selectedNFT.nft, url: newImageUrl });
      setIsLoading(false);
      const newUri = await updateMetadata(selectedNFT.url);
      if (selectedNFT) {
        updateNft(selectedNFT.nft, newUri, CONFIG.imgName);
      }
    }
  };

  const handleSelectedClick = (nft: Nft, url: string) => {
    console.log(nft, url, "event test");
    // console.log("clicked", nft);
    setSelectedNFT({ nft, url });
  };

  const updateMetadata = async (url: string) => {
    const uri = uploadMetadata(
      url,
      CONFIG.imgType,
      CONFIG.imgName,
      CONFIG.description,
      CONFIG.attributes
    );
    return uri;
  };

  async function uploadMetadata(
    imgUri: string,
    imgType: string,
    nftName: string,
    description: string,
    attributes: { trait_type: string; value: string }[]
  ) {
    console.log(`Step 2 - Uploading New MetaData`);

    const { uri } = await metaplex.nfts().uploadMetadata({
      name: nftName,
      description: description,
      image: imgUri,
      attributes: attributes,
      properties: {
        files: [
          {
            type: imgType,
            uri: imgUri,
          },
        ],
      },
    });
    return uri;
  }

  async function updateNft(
    nft: Nft | Sft,
    metadataUri: string,
    newName: string
  ) {
    await metaplex.nfts().update(
      {
        name: newName,
        nftOrSft: nft,
        uri: metadataUri,
      },
      { commitment: "finalized", confirmOptions: { skipPreflight: true } }
    );
  }
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <a className={styles.logo} href="http://localhost:3000/">
          Goghs
        </a>
        <WalletMultiButton />
      </header>
      {!(wallet as any).connected ? (
        <h2>Connecte dein Wallet du Hund 🐶</h2>
      ) : (
        <div className={styles.container}>
          {isLoading || !selectedNFT ? (
            <LoadingSpinner />
          ) : (
            <>
              <Image source={selectedNFT?.url || ""} alt="" />
              <div>{selectedNFT?.nft?.name || "not available"}</div>
            </>
          )}
          <Button type="rectangle" onButtonClick={handleButtonClick}>
            Reimagine
          </Button>
          <ImageGrid
            nfts={collectionNFTs}
            selectedImage={selectedNFT?.nft}
            selectImage={(nft, url) => handleSelectedClick(nft, url)}
          />
        </div>
      )}
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
