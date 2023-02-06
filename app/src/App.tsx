import {
  FindNftsByOwnerOutput,
  JsonMetadata,
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
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import assert from "assert";
import { useEffect, useState } from "react";
import styles from "./App.module.css";
import Button from "./components/Button/button";
import Image from "./components/Image/image";
import ImageGrid from "./components/ImageGrid/imageGrid";
import LoadingSpinner from "./components/LoadingSpinner/loadingSpinner";
import { getImageUrl, requestVariationAndMetadataUpdate } from "./services/images.services";
require("@solana/wallet-adapter-react-ui/styles.css");

// ========================================================================================================
const COLLECTIONADDRESS = "7bXLxXTJetDZsdTo5v8zijAP2BKGL6Rnrj7BGBQucmXi";
const REFRESH_STATE_ON_PAGE_RELOAD = true;
const NETWORK_TYPE = WalletAdapterNetwork.Devnet;


// ========================================================================================================

type MetaDataOrNft = (Metadata<JsonMetadata<string>> | Nft | Sft);
interface NftWithUrl {
  nft: MetaDataOrNft,
  url: string,
}

// phantom wallet adapter
const wallets = [new PhantomWalletAdapter()];

// set up connection to chain
const endpoint = clusterApiUrl(NETWORK_TYPE);
const connection = new Connection(endpoint, "confirmed");
const metaplex = new Metaplex(connection);


function App() {
  const wallet = useWallet();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [walletPub, setWalletPub] = useState<PublicKey | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NftWithUrl | null>();
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
  const fetchCollectionAndSetSelected = () => {
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

        let _selectedNft;
        if (!selectedNFT) {
          _selectedNft = collectionNfts[0];
        } else {
          _selectedNft = nfts.find((nft) => nft.address.toString() == selectedNFT.nft.address.toString());
        }
        if (!_selectedNft) return;
        const url = await getImageUrl(_selectedNft as Nft);
        console.log(url, "url")
        setSelectedNFT({ nft: _selectedNft, url });
      }
    };
    setNftsAndSelected();
  }

  // Reload on page refresh // TODO this is mainly for development, not sure if we need this in PROD
  if (REFRESH_STATE_ON_PAGE_RELOAD) {
    useEffect(fetchCollectionAndSetSelected, []);
  }
  // Reload once the wallet is connected (or disconnected, but we exit early in that case)
  useEffect(fetchCollectionAndSetSelected, [walletPub]);


  // This functionality should be placed in the backend
  // Pass mintAddress to backend, only receive confirmation
  // fetch nft again after confirmation with `findByMint({mintAdress})`
  const handleGetVariationClick = async () => {
    if (!selectedNFT?.url) return;

    setIsLoading(true);

    const mintAddress = new PublicKey((selectedNFT?.nft as Metadata).mintAddress.toString());

    // TODO move this into a service again
    const success = await requestVariationAndMetadataUpdate(mintAddress);

    setIsLoading(false);

    if (!success) return; // TODO maybe show a small error snackbar?

    // TODO not sure if we need this
    fetchCollectionAndSetSelected();
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
