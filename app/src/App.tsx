import {
  FindNftsByOwnerOutput,
  Metadata,
  Metaplex,
  Nft,
  NftWithToken,
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
import {
  getImageUrl,
  requestVariationAndMetadataUpdate,
} from "./services/images.services";
import { MetaDataOrNft, NftWithUrl } from "./types";
import HistoryGrid from "./components/HistoryGrid/HistoryGrid";
require("@solana/wallet-adapter-react-ui/styles.css");

// ========================================================================================================
const COLLECTIONADDRESS = "ByQ8WvACSDQpTRqULkHEJHUB3cbU6jtyHH7qPrsJdvbx";
const REFRESH_STATE_ON_PAGE_RELOAD = true;
const NETWORK_TYPE = WalletAdapterNetwork.Devnet;

// ========================================================================================================

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
  const [selectedMetadata, setSelectedMetadata] = useState<
    NftWithToken | null | undefined
  >();
  const [collectionNFTs, setCollectionNFTs] = useState<NftWithUrl[]>([]);

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

    const allNfts: FindNftsByOwnerOutput = await metaplex
      .nfts()
      .findAllByOwner({ owner: walletPub });
    return allNfts.filter(
      (nft: MetaDataOrNft) =>
        nft.collection?.address.toString() === COLLECTIONADDRESS
    );
  };

  /// If we have a wallet connected, get NFTs from our collection and select first
  const fetchCollectionAndSetSelected = async (
    nftWithUrl: NftWithUrl | null
  ) => {
    if (!walletPub) return;

    const collectionNfts = await getCollectionNfts();
    // TODO handle what to do if no collection nft found
    if (collectionNfts.length > 0) {
      // cast to nfts
      const nfts = collectionNfts as Nft[];

      // fetch images for all nfts
      const collectionNftsWithImages: { nft: Nft; url: string }[] =
        await Promise.all(
          nfts.map(async (nft) => {
            return {
              nft,
              url: await getImageUrl(nft),
            };
          })
        );
      setCollectionNFTs(collectionNftsWithImages);

      let _selectedNft;
      if (nftWithUrl) {
        _selectedNft = nftWithUrl.nft;
        setSelectedNFT(nftWithUrl);
      } else {
        if (!selectedNFT) {
          _selectedNft = collectionNfts[0];
        } else {
          _selectedNft = nfts.find(
            (nft) =>
              nft.address.toString() == selectedNFT.nft.address.toString()
          );
        }
        if (!_selectedNft) return;
        const url = await getImageUrl(_selectedNft as Nft);

        setSelectedNFT({ nft: _selectedNft, url });
      }

      const metdata = await metaplex.nfts().findByMint({
        mintAddress: new PublicKey(
          (_selectedNft as Metadata).mintAddress.toString()
        ),
      });

      setSelectedMetadata(metdata as NftWithToken);
    }
  };

  // Reload on page refresh // TODO this is mainly for development, not sure if we need this in PROD
  if (REFRESH_STATE_ON_PAGE_RELOAD) {
    useEffect(() => {
      fetchCollectionAndSetSelected(null);
    }, []);
  }
  // Reload once the wallet is connected (or disconnected, but we exit early in that case)
  useEffect(() => {
    fetchCollectionAndSetSelected(null);
  }, [walletPub]);

  // TODO refactor again, we only need the evolution for the reset param
  const handleAlterImageClick = async (endpoint: string, evolution: number) => {
    if (!selectedNFT?.url) return;

    setIsLoading(true);

    const mintAddress = new PublicKey(
      (selectedNFT?.nft as Metadata).mintAddress.toString()
    );

    const success = await requestVariationAndMetadataUpdate(
      mintAddress,
      endpoint,
      evolution
    );

    if (!success) return; // TODO maybe show a small error snackbar?

    // TODO not sure if we need this
    await fetchCollectionAndSetSelected(null);
    setIsLoading(false);
  };

  const handleSelectedClick = (nftWithUrl: NftWithUrl) => {
    fetchCollectionAndSetSelected(nftWithUrl);
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <a className={styles.logo} href="http://localhost:3000/">
          Goghs
        </a>
        <WalletMultiButton />
      </header>
      {!wallet.connected ? (
        <h2>Connecte dein Wallet du Hund 🐶</h2>
      ) : (
        <div className={styles.container}>
          <div>
            <h2 className={styles.mb1p5}>Wallet</h2>
            <div className={styles.collectionNfts}>
              <ImageGrid
                nftsWithUrl={collectionNFTs}
                selectedNft={selectedNFT?.nft as Nft | undefined}
                selectNft={(nft) => handleSelectedClick(nft)}
              />
            </div>
          </div>

          <div className={styles.selectedNft}>
            <div>
              <h2>{selectedNFT?.nft?.name}</h2>
            </div>

            {isLoading || !selectedNFT ? (
              <LoadingSpinner />
            ) : (
              <>
                <Image source={selectedNFT?.url} alt="" />
              </>
            )}

            <div className={styles.buttonsContainer}>
              <Button
                type="rectangle"
                onButtonClick={() => handleAlterImageClick("api/getImage", -1)}
              >
                Reimagine
              </Button>
            </div>
          </div>

          <div>
            <h2 className={styles.mb1p5}>History</h2>
            <div className={styles.collectionNfts}>
              <HistoryGrid
                nftWithToken={selectedMetadata as NftWithToken | undefined}
                onChooseEvolution={(i) =>
                  handleAlterImageClick("api/resetImage", i)
                }
              />
            </div>
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
