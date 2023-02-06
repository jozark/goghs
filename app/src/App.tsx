import {
  bundlrStorage,
  FindNftsByOwnerOutput,
  JsonMetadata,
  keypairIdentity,
  Metadata,
  Metaplex,
  Nft,
  Sft,
} from "@metaplex-foundation/js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  useWallet,
  WalletContextState,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import assert from "assert";
import { useEffect, useState } from "react";
import styles from "./App.module.css";
import Button from "./components/Button/button";
import Image from "./components/Image/image";
import ImageGrid from "./components/ImageGrid/imageGrid";
import LoadingSpinner from "./components/LoadingSpinner/loadingSpinner";
import secret from "./devnet.json";
import { getImageUrl, getVariation } from "./services/images.services";
require("@solana/wallet-adapter-react-ui/styles.css");

// ========================================================================================================
const COLLECTIONADDRESS = "3giiZPDeHYLwLzXbRrJpixF6k61zALoSvR5gRjFq4UP9";
const REFRESH_STATE_ON_PAGE_RELOAD = true;


// ========================================================================================================

type MetaDataOrNft = (Metadata<JsonMetadata<string>> | Nft | Sft);
interface NftWithUrl {
  nft: MetaDataOrNft,
  url: string,
}


// set up connection to chain
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


function App() {
  const wallet = useWallet();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [walletPub, setWalletPub] = useState<PublicKey | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NftWithUrl>();
  const [collectionNFTs, setCollectionNFTs] = useState<Nft[]>([]);

  // set publicKey as state as soon as client connects with phantom
  useEffect(() => {
    if ((wallet as WalletContextState).connected) {
      setWalletPub(wallet.publicKey);
    }
  }, [wallet]);

  /// Return all nfts from our collection if any.
  ///
  /// Expects [walletPub] to be present
  const getCollectionNfts = async (): Promise<Array<MetaDataOrNft>> => {
    assert(walletPub);

    const allNfts: FindNftsByOwnerOutput = await metaplex.nfts().findAllByOwner({ owner: walletPub });
    return allNfts.filter(
      (nft: MetaDataOrNft) => nft.collection?.address.toString() === COLLECTIONADDRESS
    );
  }

  /// If we have a wallet connected, get NFTs from our collection and select first
  const setCollectionAndSelected = () => {
    if (!walletPub) return;

    // note: must define async function in here, since effect itself may not be async
    // _____ are then only allowed to use data inside that function
    const setNftsAndSelected = async () => {
      const collectionNfts = await getCollectionNfts();
      // TODO handle what to do if no collection nft found
      if (collectionNfts.length > 0) {
        // cast to nfts
        const nfts = collectionNfts as Nft[];

        setCollectionNFTs(nfts);
        const url = await getImageUrl(nfts[0]);
        setSelectedNFT({ nft: collectionNfts[0], url });
      }
    };
    setNftsAndSelected();
  }

  // Reload on page refresh // TODO this is mainly for development, not sure if we need this in PROD
  if (REFRESH_STATE_ON_PAGE_RELOAD) {
    useEffect(setCollectionAndSelected, []);
  }
  // Reload once the wallet is connected (or disconnected, but we exit early in that case)
  useEffect(setCollectionAndSelected, [walletPub]);


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

    // get type=NftWithToken from the selectedNft // TODO why can we assume metadata here
    const mintAddress = new PublicKey((selectedNFT?.nft as Metadata).mintAddress.toString());
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

  const handleSelectedClick = (nftWithUrl: NftWithUrl) => {
    setSelectedNFT(nftWithUrl);
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <a className={styles.logo} href="http://localhost:3000/">
          Goghs
        </a>
        <WalletMultiButton />
      </header>
      {!(wallet).connected ? (
        <h2>Connecte dein Wallet du Hund 🐶</h2>
      ) : (
        <div className={styles.container}>
          <div className={styles.collectionNfts}>
            <ImageGrid
              nfts={collectionNFTs}
              selectedImage={selectedNFT?.nft as (Nft | undefined)}
              selectImage={(nft, url) => handleSelectedClick({ nft, url })}
            />
          </div>
          <div className={styles.selectedNft}>
            {isLoading || !selectedNFT ? (
              <LoadingSpinner />
            ) : (
              <>
                <Image source={selectedNFT?.url} alt="" />
                <div>{selectedNFT?.nft?.name}</div>
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
