import {
  bundlrStorage,
  BundlrStorageDriver,
  keypairIdentity,
  Metaplex,
  Nft,
} from "@metaplex-foundation/js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  useWallet,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import styles from "./App.module.css";
import Button from "./components/Button/button";
import Image from "./components/Image/image";
import ImageGrid from "./components/ImageGrid/imageGrid";
import LoadingSpinner from "./components/LoadingSpinner/loadingSpinner";
import secret from "./devnet.json";
import { getImageUrl, getVariation } from "./services/images.services";
require("@solana/wallet-adapter-react-ui/styles.css");

// set up connection
const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);
const wallets = [new PhantomWalletAdapter()];
const WALLET = Keypair.fromSecretKey(new Uint8Array(secret));

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

const COLLECTIONADDRESS = "3giiZPDeHYLwLzXbRrJpixF6k61zALoSvR5gRjFq4UP9";

function App() {
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [walletPub, setWalletPub] = useState<PublicKey | null>(null);
  //TODO create interface
  const [selectedNFT, setSelectedNFT] = useState<{ nft: any; url: string }>();
  const [collectionNFTs, setCollectionNFTs] = useState<Nft[]>([]);

  useEffect(() => {
    if ((wallet as any).connected) {
      setWalletPub(wallet.publicKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  useEffect(() => {
    //Is this correct to use async fn inside of useEffect?
    const triggerFindNfts = async () => {
      if (walletPub) {
        await findNfts();
      }
    };
    triggerFindNfts();
  }, [walletPub]);

  const findNfts = async () => {
    if (!walletPub) {
      return;
    }

    const allNfts = await metaplex.nfts().findAllByOwner({ owner: walletPub });
    const collectionNfts: any = allNfts.filter(
      (nft) => nft.collection?.address.toString() === COLLECTIONADDRESS
    );

    //TODO handle what to do if no collection nft found
    if (collectionNfts.length > 0) {
      setCollectionNFTs(collectionNfts);
      const url = await getImageUrl(collectionNfts[0]);
      setSelectedNFT({ nft: collectionNfts[0], url });
    }
  };

  // This functionality should be placed in the backend
  // Pass mintAddress to backend, only receive confirmation
  // fetch nft again after confirmation with `findByMint({mintAdress})`
  const handleGetVariationClick = async () => {
    if (!selectedNFT?.url) {
      return;
    }

    setIsLoading(true);

    // get image url from backend
    const newImageFile = await getVariation(selectedNFT.url);
    console.log(newImageFile, "newImageFile");

    // get type=NftWithToken from the selectedNft
    const mintAddress = new PublicKey(selectedNFT?.nft.mintAddress.toString());
    const nftWithToken = await metaplex.nfts().findByMint({ mintAddress });

    // TEST: Try to upload image this way
    // const imageUri = await metaplex.storage().upload(newImageFile);

    setIsLoading(false);

    try {
      // TODO FAILING HERE BECAUSE of the image: newImageFile
      console.log("Trying to upload the Metadata");

      const { uri } = await metaplex.nfts().uploadMetadata({
        ...selectedNFT.nft.json,
        name: "Test",
        description: "My Updated Metadata Description",
        image: newImageFile,
      });

      console.log("Metadata uploaded. Trying to update NFT");

      const updatedNft = await metaplex.nfts().update({
        nftOrSft: nftWithToken,
        uri,
      });

      console.log("Nft updated.", updatedNft);
    } catch (err) {
      console.log(err, "failed bro");
    }
  };

  const handleSelectedClick = (nft: any, url: string) => {
    setSelectedNFT({ nft, url });
  };

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
        <div className={styles.wrapper}>
          <div className={styles.collectionWrapper}>
            <ImageGrid
              nfts={collectionNFTs}
              selectedImage={selectedNFT?.nft}
              selectImage={(nft, url) => handleSelectedClick(nft, url)}
            />
          </div>
          <div className={styles.container}>
            {isLoading || !selectedNFT ? (
              <LoadingSpinner />
            ) : (
              <>
                <Image source={selectedNFT?.url || ""} alt="" />
                <div>{selectedNFT?.nft?.name || "not available"}</div>
              </>
            )}
            <Button type="rectangle" onButtonClick={handleGetVariationClick}>
              Reimagine
            </Button>
          </div>
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
